// D-271 (PO-159): nella mossa in ondata il segno di «toccabile» è a tinta piena. Guardiano, in ogni stato della mossa:
//  - nessun tratteggio (outline o bordo dashed/dotted, anche su ::before/::after) dentro .mappa.mossa;
//  - contrasto MISURATO sui pixel della foto: per ogni unità spostabile e ogni settore d'arrivo, sui quattro lati, la fascia
//    magenta dell'anello e i colori subito dentro e subito fuori; serve ≥ 3:1 da entrambe le parti (WCAG 1.4.11);
//  - gli anelli dei settori d'arrivo non si sovrappongono fra loro.
// Rosso C271T01 (il tratteggio di prima): tratteggio trovato, anelli che non si trovano o col bordo della mappa sotto 3:1.
import { inflateSync } from 'node:zlib';

const MAGENTA = [0xe0, 0x11, 0x5f];

/** PNG RGB o RGBA a 8 bit, senza interlacciamento (le foto di Playwright): { w, h, px(x, y) → [r, g, b] }. */
export function leggiPng(buf) {
  let o = 8, w = 0, h = 0, tipo = 0; const dati = [];
  while (o < buf.length) { const n = buf.readUInt32BE(o), t = buf.toString('latin1', o + 4, o + 8), c = buf.subarray(o + 8, o + 8 + n);
    if (t === 'IHDR') { w = c.readUInt32BE(0); h = c.readUInt32BE(4); tipo = c[9]; if (c[8] !== 8 || c[12]) throw new Error('PNG non gestito'); }
    else if (t === 'IDAT') dati.push(c); else if (t === 'IEND') break; o += 12 + n; }
  const bpp = tipo === 6 ? 4 : tipo === 2 ? 3 : 0; if (!bpp) throw new Error(`PNG di tipo ${tipo} non gestito`);
  const raw = inflateSync(Buffer.concat(dati)), riga = w * bpp, out = Buffer.alloc(riga * h);
  for (let y = 0; y < h; y++) { const f = raw[y * (riga + 1)], s = raw.subarray(y * (riga + 1) + 1, (y + 1) * (riga + 1)), d = out.subarray(y * riga, (y + 1) * riga), su = y ? out.subarray((y - 1) * riga, y * riga) : null;
    for (let i = 0; i < riga; i++) { const a = i >= bpp ? d[i - bpp] : 0, b = su ? su[i] : 0, c = su && i >= bpp ? su[i - bpp] : 0;
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      d[i] = (s[i] + (f === 1 ? a : f === 2 ? b : f === 3 ? (a + b) >> 1 : f === 4 ? (pa <= pb && pa <= pc ? a : pb <= pc ? b : c) : 0)) & 255; } }
  return { w, h, px: (x, y) => { const i = y * riga + x * bpp; return [out[i], out[i + 1], out[i + 2]]; } };
}

const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
export const contrasto = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const vicino = (c, t, d = 60) => Math.hypot(c[0] - t[0], c[1] - t[1], c[2] - t[2]) < d;

/** Bersagli della mossa (unità spostabili, settori d'arrivo), tratteggi e anelli dei settori, letti nella pagina. */
const leggiPagina = (p) => p.evaluate(() => {
  const tratteggi = [];
  // anche la copia dell'istruzione sotto la mappa (D-269, quando il riquadro radio è «muto»)
  for (const e of document.querySelectorAll('.mappa.mossa, .mappa.mossa *, .istruzione-sotto, .istruzione-sotto *')) for (const ps of [null, '::before', '::after']) {
    const s = getComputedStyle(e, ps); if (ps && s.content === 'none') continue;
    if ([s.outlineStyle, s.borderTopStyle, s.borderRightStyle, s.borderBottomStyle, s.borderLeftStyle].some((x) => x === 'dashed' || x === 'dotted'))
      tratteggi.push(`${e.closest('[data-presenza]')?.dataset.presenza ?? e.closest('[data-settore]')?.dataset.settore ?? e.className}${ps ?? ''}`); }
  const box = (r) => ({ l: r.left, t: r.top, r: r.right, b: r.bottom });
  const unita = [...document.querySelectorAll('.mappa.mossa [data-presenza]:not(:disabled) .pastiglia')].map((e) => ({ id: e.closest('[data-presenza]').dataset.presenza, ...box(e.getBoundingClientRect()) }));
  const settori = [...document.querySelectorAll('.mappa.mossa .settore-punto:not(:disabled)')].map((e) => { const r = e.getBoundingClientRect(), s = getComputedStyle(e, '::after');
    const l = r.left + parseFloat(s.left), t = r.top + parseFloat(s.top), w = parseFloat(s.width), h = parseFloat(s.height);
    // quanto sporge l'anello dal punto: l'ombra esterna più larga (spread; le «inset» stanno dentro) o il contorno col suo scarto
    const fascia = Math.max(0, ...(s.boxShadow === 'none' ? [] : s.boxShadow.split(/,(?![^(]*\))/)).filter((x) => !x.includes('inset')).map((x) => parseFloat(x.match(/-?[\d.]+px/g)?.at(-1) ?? '0')));
    const contorno = s.outlineStyle === 'none' ? 0 : (parseFloat(s.outlineWidth) || 0) + (parseFloat(s.outlineOffset) || 0);
    return { id: e.closest('[data-settore]').dataset.settore, l, t, r: l + w, b: t + h, raggio: w / 2 + Math.max(fascia, contorno) }; });
  const copia = !!document.querySelector('.istruzione-sotto[data-istruzione-sotto="vera"]')?.checkVisibility();
  const m = document.querySelector('.mappa')?.getBoundingClientRect(), mappa = m ? { l: m.left, t: m.top, r: m.right, b: m.bottom } : null;
  return { mappa, copia, tratteggi: [...new Set(tratteggi)], bersagli: [...unita.map((x) => ({ ...x, tipo: 'unità' })), ...settori.map((x) => ({ ...x, tipo: 'settore' }))], settori };
});

/** Misura in uno stato: { copia (la copia sotto la mappa si vede), tratteggi, sotto (bersagli con un lato sotto 3:1, o senza anello su nessun lato), minimo (contrasto
 *  più basso), lati (visti, provati), sovrapposti, n }. Un lato coperto (da «Home», da un nome, da un'altra pastiglia) non si
 *  misura: l'anello deve vedersi almeno da un lato e ogni lato visto deve stare a ≥ 3:1. */
export async function misuraAnelli(p) {
  // strumento instabile (CI 1374, 375×667 e21 corteo_dal_cortile «puoi spostare»: due unità «senza anello pieno», contrasto 0,00,
  // verde al tentativo 2; non riprodotto in 9 giri locali sotto carico): le posizioni si leggevano prima della foto, e se la pagina
  // si muoveva in mezzo l'anello non era dove lo si cercava. Ora posizioni, foto e di nuovo posizioni, finché le due letture
  // coincidono (al più 5 volte, 100 ms fra una e l'altra); quante ripetizioni servono resta nel conto (riprese).
  let g = await leggiPagina(p), img = leggiPng(await p.screenshot()), riprese = 0;
  for (let dopo = await leggiPagina(p); JSON.stringify(dopo.bersagli) !== JSON.stringify(g.bersagli) && riprese < 5; dopo = await leggiPagina(p)) { riprese++; await p.waitForTimeout(100); g = await leggiPagina(p); img = leggiPng(await p.screenshot()); }
  const sotto = [], sovrapposti = [], lati = [0, 0];
  let minimo = Infinity;
  for (const x of g.bersagli) {
    // una pastiglia sul bordo della mappa è tagliata: centro della parte che si vede, e i lati fuori dalla mappa non si misurano
    const M = g.mappa ?? { l: -Infinity, t: -Infinity, r: Infinity, b: Infinity };
    // tutta fuori dalla mappa (che la ritaglia): non si vede né si tocca, non c'è anello da misurare
    if (x.r <= M.l || x.l >= M.r || x.b <= M.t || x.t >= M.b) continue; // controllo a sé in foto-po152-b (C271U01)
    const cx = Math.round((Math.max(x.l, M.l) + Math.min(x.r, M.r)) / 2), cy = Math.round((Math.max(x.t, M.t) + Math.min(x.b, M.b)) / 2);
    const dentroMappa = [x.l - 8 > M.l, x.r + 8 < M.r, x.t - 8 > M.t, x.b + 8 < M.b];
    // dal bordo verso fuori, sui quattro lati: si parte 6 px dentro il bordo; la fascia magenta è la prima che COMINCIA dopo
    // la partenza (la tensione più alta del punto, #ff1f6b, è vicina al magenta: quella fascia parte da 0 e si salta) entro
    // 10 px; i colori accanto sono il più contrastato fra i 3 pixel prima e fra i 3 dopo (salta la sfumatura dei bordi)
    const partenze = [[Math.floor(x.l) + 6, cy, -1, 0], [Math.ceil(x.r) - 7, cy, 1, 0], [cx, Math.floor(x.t) + 6, 0, -1], [cx, Math.ceil(x.b) - 7, 0, 1]];
    let peggio = Infinity, visti = 0;
    for (const [i, [x0, y0, dx, dy]] of partenze.entries()) { if (!dentroMappa[i]) continue;
      const fila = []; for (let k = 0; k < 20; k++) { const X = x0 + dx * k, Y = y0 + dy * k; fila.push(X >= 0 && Y >= 0 && X < img.w && Y < img.h ? img.px(X, Y) : null); }
      const mg = (k) => !!fila[k] && vicino(fila[k], MAGENTA);
      const a = fila.findIndex((c, k) => k >= 1 && k <= 10 && mg(k) && !mg(k - 1)); if (a < 0) continue;
      let z = a; while (z + 1 < fila.length && mg(z + 1)) z++;
      if (z - a < 1) continue; // un solo pixel magenta è la sfumatura di un anello coperto (e20 viso_scoperto: il nome «Strada da Skyfield» sopra il punto)
      const m = fila[(a + z) >> 1], dentro = [1, 2, 3].map((d) => fila[a - d]).filter(Boolean), fuori = [1, 2, 3].map((d) => fila[z + d]).filter(Boolean);
      if (!dentro.length || !fuori.length) continue;
      visti++; peggio = Math.min(peggio, Math.max(...dentro.map((c) => contrasto(m, c))), Math.max(...fuori.map((c) => contrasto(m, c))));
    }
    lati[0] += visti; lati[1] += dentroMappa.filter(Boolean).length;
    if (!visti) { sotto.push(`${x.tipo} ${x.id} senza anello pieno`); minimo = 0; continue; }
    minimo = Math.min(minimo, peggio);
    if (peggio < 3) sotto.push(`${x.tipo} ${x.id} ${peggio.toFixed(2)}:1`);
  }
  for (let i = 0; i < g.settori.length; i++) for (let j = i + 1; j < g.settori.length; j++) { const a = g.settori[i], b = g.settori[j];
    const d = Math.hypot((a.l + a.r) / 2 - (b.l + b.r) / 2, (a.t + a.b) / 2 - (b.t + b.b) / 2);
    if (d < a.raggio + b.raggio) sovrapposti.push(`${a.id}/${b.id} (${Math.round(a.raggio + b.raggio - d)} px)`); }
  return { copia: g.copia, tratteggi: g.tratteggi, sotto, minimo: g.bersagli.length ? minimo : null, lati, sovrapposti, n: g.bersagli.length, riprese };
}
