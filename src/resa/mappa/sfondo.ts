// Sfondo della mappa aerea al tramonto (D-067, bozza docs/stili/mappa-realistica.js): disegnato UNA
// volta su un canvas 2D che diventa una texture Pixi. Tetti, alberi, auto, viali, piazzale, stadio con
// le curve colorate, prato a strisce, fari e velo serale. Seme fisso (caso.ts): stessa città a ogni avvio.
// Lo stadio sta fra le due curve dei dati, i viali partono dai settori di tipo «strada».
// Colori: solo dai token CSS «--mappa-*» (letti a runtime), mai scritti qui; curve, folla e corteo coi
// colori del club della curva (dati, D-086), e se il club non li ha i token di prima.
import { creaCaso } from '../../logica/caso.ts';
import { spento } from '../../interruttori.ts';
import { cartelloni, notte, parcheggi, quartiere } from './notte.ts';
import { disegnaDettagli, leggiDettaglio } from './dettagli.ts';
import { neutroCorteo } from './folla.ts';
import { parcoCitta } from './parco.ts';

export interface Pt { x: number; y: number }
export interface Stadio { cx: number; cy: number; rx: number; ry: number; vuoto?: boolean }
export interface Colori { primario: string; secondario: string }
export interface Disposizione { W: number; H: number; club: { sx?: Colori; dx?: Colori; corteo?: Colori }; stadio: Stadio | null; curvaSola: (Pt & { verso: number }) | null; viali: Pt[][]; idViali: string[]; /** C31-02: viale che parte dallo stadio, il corteo cammina verso la meta */ versoMeta: boolean[]; tifosiViali: (Colori | undefined)[]; centro: Pt; stazione: Pt | null; quartieri: Pt[]; parcheggi: Pt[]; slarghi: Pt[]; dettagli: { id: string; dove: Pt }[]; notte: boolean; cartelloni: boolean }
/** Atmosfera della missione (campi facoltativi dei dati, mappa.ora e mappa.dettagli): e03 è di notte. */
export interface Atmosfera { notte?: boolean; cartelloni?: boolean; dettagli?: string[] }
export interface Animati { folla: { x: number; y: number; colore: string; fase: number }[]; viali: { id: string; punti: Pt[]; versoMeta?: boolean }[]; dettagli: string[]; coloriCorteo: [string, string]; coloriViali: Record<string, [string, string]>; origineViali: Record<string, string>; fari: Pt[]; stadio: '' | 'pieno' | 'vuoto' }

// Il minificatore CSS può scrivere i token come «#fff» o con un nome: il canvas li riporta a «#rrggbb».
let tavolozza: CanvasRenderingContext2D | null = null;
export const token = (nome: string) => {
  tavolozza ??= document.createElement('canvas').getContext('2d');
  const grezzo = getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
  if (!tavolozza) return grezzo;
  tavolozza.fillStyle = grezzo;
  return String(tavolozza.fillStyle);
};
/** Colore di un dato (club) riportato a «#rrggbb» come i token; undefined resta undefined. */
export const colore = (grezzo: string | undefined) => {
  if (!grezzo) return undefined;
  tavolozza ??= document.createElement('canvas').getContext('2d');
  if (!tavolozza) return grezzo;
  tavolozza.fillStyle = grezzo;
  return String(tavolozza.fillStyle);
};
/** Colore del token con trasparenza, come «#rrggbbaa» (i token dei colori sono «#rrggbb»). */
export const alfa = (colore: string, a: number) => colore + Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, '0');

/** Raggio esterno della curva sola (episodi di città con una curva). */
const RC_SOLA = 48;
export const lista = (base: string, n: number) => Array.from({ length: n }, (_, i) => token(`${base}-${i + 1}`));

/** Stadio vuoto accanto al piazzale (S-25): fra 8 direzioni, la misura più grande con cui gli spalti stanno quasi
 * tutti dentro la mappa (al più un quarto fuori) e lontani dai pallini degli altri settori (distanza in raggi
 * dell'ellisse); il piazzale resta fuori dagli spalti. I nomi (fondo nero) possono stare sopra gli spalti.
 * Se nessuna va bene, la meno peggio. Rosso C29P02: stadio sopra il piazzale. */
export function stadioVuoto(W: number, H: number, pz: Pt, altri: Pt[]): Stadio {
  if (spento('C29P02')) return { cx: pz.x, cy: pz.y, rx: Math.min(W, H) * 0.3, ry: Math.min(W, H) * 0.19, vuoto: true };
  let meglio: { s: Stadio; voto: number } | null = null;
  for (const scala of [1, 0.85, 0.7, 0.58]) {
    const rx = Math.min(W, H) * 0.3 * scala, ry = rx * 0.62;
    let qui: { s: Stadio; voto: number } | null = null;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2, ux = Math.cos(a), uy = Math.sin(a);
      const d = 1.45 / Math.hypot(ux / rx, uy / ry); // il piazzale a 1,45 raggi dal centro: fuori dagli spalti
      const s = { cx: pz.x + ux * d, cy: pz.y + uy * d, rx, ry, vuoto: true };
      const fuori = Math.max(0, (rx * 1.04 - s.cx) / rx, (s.cx + rx * 1.04 - W) / rx, (ry * 1.06 - s.cy) / ry, (s.cy + ry * 1.06 - H) / ry);
      const vicino = Math.min(9, ...altri.map((q) => Math.hypot((q.x - s.cx) / rx, (q.y - s.cy) / ry)));
      const voto = Math.min(vicino, 2.5) - fuori * 3;
      if (fuori <= 0.25 && vicino >= 1.3 && (!qui || voto > qui.voto)) qui = { s, voto };
      if (!meglio || voto + scala > meglio.voto) meglio = { s, voto: voto + scala };
    }
    if (qui) return qui.s;
  }
  return meglio!.s;
}

/** Il punto d'ingresso del viale sul bordo della mappa (12 px fuori): il bordo più vicino alla strada fra quelli verso cui
 *  la strada si allontana dalla fine del viale; spostato di 18 px dalla parte opposta alla fine, come prima. */
export function bordoLontano(s: Pt, fine: Pt, W: number, H: number): Pt {
  const dx = s.x - fine.x, dy = s.y - fine.y;
  const bordi = [
    { d: H - s.y, ok: dy >= 0, p: { x: s.x + Math.sign(dx) * 18, y: H + 12 } },
    { d: s.y, ok: dy <= 0, p: { x: s.x + Math.sign(dx) * 18, y: -12 } },
    { d: s.x, ok: dx <= 0, p: { x: -12, y: s.y + Math.sign(dy) * 18 } },
    { d: W - s.x, ok: dx >= 0, p: { x: W + 12, y: s.y + Math.sign(dy) * 18 } },
  ].filter((b) => b.ok).sort((a, b) => a.d - b.d);
  return (bordi[0] ?? { p: { x: s.x, y: H + 12 } }).p;
}

/** Dove stanno stadio e viali, dalle posizioni (già in pixel) dei settori. */
export function disponi(W: number, H: number, settori: { id?: string; tipo: string; x: number; y: number; colori?: Colori; meta?: string }[], atm: Atmosfera = {}): Disposizione {
  const tutte = settori.filter((s) => s.tipo === 'curva');
  // C21-04: con tre curve (e15, e27) lo stadio è fra le due della PARTITA: il settore o la curva dei gemellati è un
  // ospite in più, non una delle due squadre. Prima: estremità dalle due curve con x minore, ellisse dalle prime due dei
  // dati, che non coincidevano (e15 senza l'arancio del Cinderwick). Rosso C50C01: come prima.
  const partita = tutte.length > 2 && !spento('C50C01') ? tutte.filter((s) => !s.id?.includes('gemellati')) : tutte;
  const curve = partita.length >= 2 ? partita : tutte;
  // Curva di sinistra e di destra; il corteo è degli ospiti (la curva «ospiti», altrimenti la prima dei dati).
  const [sx, dx] = [...(spento('C50C01') ? tutte : curve)].sort((a, b) => a.x - b.x);
  const club = { sx: sx?.colori, dx: dx?.colori, corteo: (curve.find((s) => s.id?.includes('ospiti')) ?? curve[0])?.colori };
  const centro = settori.length ? { x: settori.reduce((a, s) => a + s.x, 0) / settori.length, y: settori.reduce((a, s) => a + s.y, 0) / settori.length } : { x: W / 2, y: H / 2 };
  let stadio: Stadio | null = null;
  if (curve.length >= 2) {
    const a = curve[0]!, b = curve[1]!;
    const rx = Math.abs(b.x - a.x) / 2 * 0.98;
    stadio = { cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 - rx * 0.12, rx, ry: rx * 0.62 };
  }
  // Episodio di città senza curve ma col «Piazzale dello stadio» (e04, e17, e30; S-25, PO-080): lo stadio c'è,
  // vuoto, accanto al piazzale. Rosso C29P01: niente stadio, come prima.
  const pz = settori.find((s) => s.tipo === 'piazzale');
  if (!curve.length && pz && !spento('C29P01')) stadio = stadioVuoto(W, H, pz, settori.filter((s) => s !== pz));
  // Episodio di città con UNA sola curva (e13, e25): niente stadio, ma la curva si disegna lo stesso,
  // gradinata a ferro di cavallo coi colori del club aperta verso il centro della mappa (D-086); il settore
  // sta sulla gradinata, in fondo al ferro di cavallo, come le curve dello stadio. «curvaSola» è il centro.
  // Rosso C22K01: nessuna curva disegnata, come prima.
  const una = curve.length === 1 && !spento('C22K01') ? curve[0]! : null;
  const verso = una ? Math.sign(centro.x - una.x) || 1 : 1;
  const curvaSola = una ? { x: una.x + verso * (RC_SOLA - 11), y: una.y, verso } : null;
  const meta = stadio && !stadio.vuoto ? { x: stadio.cx, y: stadio.cy + stadio.ry * 0.9 } : centro; // i viali vanno allo stadio solo se c'è la partita
  // Se c'è una stazione (e02) i viali partono da lì: gli ospiti arrivano in treno; altrimenti dal bordo basso.
  const st = settori.find((s) => s.tipo === 'stazione');
  const stazione = st ? { x: st.x, y: st.y } : null;
  const strade = settori.filter((s) => s.tipo === 'strada');
  // C27-02: se i dati dicono dove va la strada («meta», id di un settore: municipio, stazione, stadio vuoto) il viale
  // finisce lì; senza, come prima (stadio con la partita, altrimenti il centro). Rosso C85M01: «meta» ignorata.
  const doveVa = (s: (typeof settori)[number]) => (spento('C85M01') || !s.meta ? undefined : settori.find((q) => q.id === s.meta));
  const versoMeta: boolean[] = [];
  const viali = strade.map((s) => {
    const dove = doveVa(s);
    const fine = dove ? { x: dove.x, y: dove.y } : { x: meta.x + Math.sign(s.x - meta.x) * (stadio && !stadio.vuoto ? stadio.rx * 0.32 : 0), y: meta.y };
    // C29-02 (C28-05): il viale partiva sempre dal bordo basso; per una strada in alto (e04, parcheggi) saliva verso il
    // settore allontanandosi dallo stadio, e il corteo «entra» si allontanava (62/69). Ora parte dal bordo della mappa più
    // vicino alla strada fra quelli dalla parte opposta alla fine del viale. Solo per le strade senza «meta»: con la meta
    // (e30) il viale l'ha tarato la principale coi dati, e col bordo nuovo il corteo di e30 peggiorava (49/21 contro 58/11).
    // Rosso C93V01: sempre dal bordo basso.
    // C31-02: con la meta e lo stadio disegnato (e30: «dallo stadio verso il municipio») il viale parte dal bordo dello
    // stadio dalla parte della strada, non dal bordo della mappa. Rosso C95S01: dal bordo basso, come prima.
    const daStadio = dove && stadio && !spento('C95S01') ? (() => { const a = Math.atan2((s.y - stadio.cy) / stadio.ry, (s.x - stadio.cx) / stadio.rx); return { x: stadio.cx + stadio.rx * Math.cos(a), y: stadio.cy + stadio.ry * Math.sin(a) }; })() : null;
    versoMeta.push(!stazione && !!daStadio);
    const inizio = stazione ?? daStadio ?? (spento('C93V01') || dove ? { x: s.x + Math.sign(s.x - meta.x) * 18, y: H + 12 } : bordoLontano(s, fine, W, H));
    return [inizio, { x: s.x, y: s.y }, { x: s.x + (fine.x - s.x) * 0.55, y: fine.y + (s.y - fine.y) * 0.35 }, fine];
  });
  const quartieri = settori.filter((s) => s.tipo === 'quartiere').map((s) => ({ x: s.x, y: s.y }));
  const parch = settori.filter((s) => s.id?.includes('parcheggi')).map((s) => ({ x: s.x, y: s.y }));
  // Ripiego per i tipi senza un disegno loro (piazza, porto, mercato… degli abbozzi, S-09): una piazza
  // lastricata sotto il settore, così il punto non cade sui tetti. Rosso C14M01: niente piazze.
  const disegnati = new Set(['curva', 'strada', 'stazione', 'quartiere']);
  const slarghi = spento('C14M01') ? [] : settori.filter((s) => !disegnati.has(s.tipo) && !s.id?.includes('parcheggi')).map((s) => ({ x: s.x, y: s.y }));
  // Dettagli (D-095): «id@settore» accanto al settore, spostato verso il centro perché il punto non lo copra;
  // «id» al centro della mappa. Dentro la mappa con 50 px di margine.
  const dettagli = (atm.dettagli ?? []).map(leggiDettaglio).map((x) => {
    const s = settori.find((q) => q.id === x.settore);
    const base = s ? { x: s.x, y: s.y } : centro;
    const d = Math.hypot(centro.x - base.x, centro.y - base.y) || 1, passo = s ? Math.min(40, d) : 0;
    const dove = { x: base.x + ((centro.x - base.x) / d) * passo, y: base.y + ((centro.y - base.y) / d) * passo };
    return { id: x.id, dove: { x: Math.min(W - 50, Math.max(50, dove.x)), y: Math.min(H - 50, Math.max(50, dove.y)) } };
  });
  // PO-102: il corteo di una strada ha i colori dei tifosi che ci sono davvero: il club della strada nei dati, altrimenti
  // quello della curva con lo stesso nome (strada_larkspire → curva_larkspire); se i dati non lo dicono, colori neutri,
  // mai quelli dell'altra squadra. Rosso C43C02: un colore solo per tutte le strade (la curva ospiti), come prima.
  const tifosiViali = strade.map((s) => s.colori ?? curve.find((c) => c.id === `curva_${(s.id ?? '').replace(/^[a-z]+_/, '')}`)?.colori);
  return { W, H, club, stadio, curvaSola, viali, idViali: strade.map((s) => s.id ?? ''), versoMeta, tifosiViali, centro, stazione, quartieri, parcheggi: parch, slarghi, dettagli, notte: !!atm.notte, cartelloni: !!atm.cartelloni };
}

export const bezier = (p: Pt[], t: number): Pt => {
  const u = 1 - t;
  const k = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return { x: p.reduce((a, q, i) => a + q.x * k[i]!, 0), y: p.reduce((a, q, i) => a + q.y * k[i]!, 0) };
};

/** Piazza lastricata (ripiego per i tipi di settore senza un disegno loro). */
function piazza(f: CanvasRenderingContext2D, q: Pt) {
  f.fillStyle = token('--mappa-marciapiede'); f.beginPath(); f.roundRect(q.x - 46, q.y - 36, 92, 72, 10); f.fill();
  f.fillStyle = token('--mappa-piazzale'); f.beginPath(); f.roundRect(q.x - 40, q.y - 30, 80, 60, 8); f.fill();
}

export function disegnaSfondo(f: CanvasRenderingContext2D, d: Disposizione): Animati {
  const { W, H, stadio } = d;
  const caso = creaCaso(7);
  const r = () => caso.numero();
  const scegli = <T>(xs: T[]) => xs[Math.floor(r() * xs.length)]!;
  const dentro = (x: number, y: number, k: number) => !!stadio && ((x - stadio.cx) / (stadio.rx * k)) ** 2 + ((y - stadio.cy) / (stadio.ry * k)) ** 2 < 1;

  f.fillStyle = token('--mappa-asfalto'); f.fillRect(0, 0, W, H);
  const chiaro = token('--bianco'); const scuro = token('--nero');
  for (let i = 0; i < W * H / 12; i++) { f.fillStyle = alfa(r() < 0.5 ? chiaro : scuro, r() * 0.05); f.fillRect(r() * W, r() * H, 1, 1); }

  const st = d.stazione;
  const slarghi = d.slarghi.filter((q) => stadio?.vuoto || !dentro(q.x, q.y, 1.6)); // dentro lo stadio c'è già il piazzale; quello dello stadio vuoto sta fuori
  const RQ = Math.min(W, H) * 0.2; // raggio del quartiere di case basse (e03)
  const vicino = (ps: Pt[], x: number, y: number, rx: number, ry: number) => ps.some((p) => Math.abs(x - p.x) < rx && Math.abs(y - p.y) < ry);
  const cs = d.curvaSola, RC = RC_SOLA;
  isolati(f, W, H, r, (x, y) => dentro(x, y, 1.42) || (!!cs && Math.hypot(x - cs.x, y - cs.y) < RC + 16) || (!!st && Math.abs(y - st.y) < 34 && x < st.x + 70)
    || vicino(d.quartieri, x, y, RQ + 20, RQ + 16) || vicino(d.parcheggi, x, y, 70, 50) || vicino(slarghi, x, y, 52, 42) || vicino(d.dettagli.map((q) => q.dove), x, y, 58, 46));
  for (const q of slarghi) piazza(f, q);
  const dettagli = disegnaDettagli(f, d.dettagli, r);
  if (st) stazione(f, W, st);
  for (const q of d.quartieri) quartiere(f, q, r, RQ);
  for (const q of d.parcheggi) parcheggi(f, q, r, 96, 64);
  const auto = lista('--mappa-auto', 5);
  for (let i = 0; i < 40; i++) { const x = r() * W, y = r() * H; if (dentro(x, y, 1.3)) continue; f.fillStyle = scegli(auto); f.fillRect(x, y, 6, 3); }

  // Viali verso lo stadio.
  const viale = (p: Pt[], w: number, colore: string) => {
    f.strokeStyle = colore; f.lineWidth = w; f.lineCap = 'round';
    f.beginPath(); f.moveTo(p[0]!.x, p[0]!.y); f.bezierCurveTo(p[1]!.x, p[1]!.y, p[2]!.x, p[2]!.y, p[3]!.x, p[3]!.y); f.stroke();
  };
  for (const v of d.viali) {
    viale(v, 34, alfa(scuro, 0.45)); viale(v, 30, token('--mappa-marciapiede')); viale(v, 24, token('--mappa-viale'));
    f.setLineDash([6, 8]); viale(v, 1.2, alfa(chiaro, 0.6)); f.setLineDash([]);
  }

  const folla: Animati['folla'] = []; const fari: Pt[] = [];
  if (stadio) {
    const { cx, cy, rx, ry } = stadio; const k = rx / 100; // la bozza è disegnata con rx = 100
    f.fillStyle = token('--mappa-piazzale'); f.beginPath(); f.ellipse(cx, cy + 10 * k, rx * 1.28, ry * 1.39, 0, 0, 7); f.fill();
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2, x = cx + Math.cos(a) * rx * 1.22, y = cy + 10 * k + Math.sin(a) * ry * 1.29;
      f.fillStyle = alfa(scuro, 0.35); f.beginPath(); f.arc(x + 2, y + 2, 4 * k, 0, 7); f.fill();
      f.fillStyle = token('--mappa-siepe'); f.beginPath(); f.arc(x, y, 4 * k, 0, 7); f.fill();
    }
    f.fillStyle = alfa(scuro, 0.55); f.beginPath(); f.ellipse(cx + 6 * k, cy + 8 * k, rx * 1.04, ry * 1.06, 0, 0, 7); f.fill();
    for (let i = 0; i < 14; i++) {
      const t = i / 14;
      f.beginPath(); f.ellipse(cx, cy, rx - t * 24 * k, ry - t * 15 * k, 0, 0, 7);
      f.fillStyle = token(i % 2 ? '--mappa-gradinata-1' : '--mappa-gradinata-2'); f.fill();
    }
    const curva = (a0: number, a1: number, colore: string) => {
      for (let i = 0; i < 12; i++) {
        f.beginPath(); f.ellipse(cx, cy, rx * 0.98 - i * 2 * k, ry * 0.97 - i * 1.3 * k, 0, a0, a1);
        f.strokeStyle = alfa(colore, 0.25 + 0.04 * i); f.lineWidth = 1.6 * k; f.stroke();
      }
    };
    if (!stadio.vuoto) { curva(Math.PI * 0.72, Math.PI * 1.28, colore(d.club.sx?.primario) ?? token('--mappa-curva-a')); curva(-Math.PI * 0.28, Math.PI * 0.28, colore(d.club.dx?.primario) ?? token('--mappa-curva-b')); }
    // Tifosi delle curve: tre su quattro col primario, uno col secondario (sciarpe e bandiere).
    const tifoso = (c: Colori | undefined, i: number, base: string) => (c ? colore(i % 4 ? c.primario : c.secondario)! : token(base));
    const pw = 88 * k, ph = 52 * k;
    f.save(); f.beginPath(); f.rect(cx - pw / 2, cy - ph / 2, pw, ph); f.clip();
    for (let i = 0; i < 10; i++) { f.fillStyle = token(i % 2 ? '--mappa-prato-1' : '--mappa-prato-2'); f.fillRect(cx - pw / 2 + (i * pw) / 10, cy - ph / 2, pw / 10, ph); }
    f.restore();
    f.strokeStyle = alfa(chiaro, 0.85); f.lineWidth = 0.8;
    f.strokeRect(cx - pw / 2 + 2 * k, cy - ph / 2 + 2 * k, pw - 4 * k, ph - 4 * k);
    f.beginPath(); f.moveTo(cx, cy - ph / 2 + 2 * k); f.lineTo(cx, cy + ph / 2 - 2 * k); f.stroke();
    f.beginPath(); f.arc(cx, cy, 7 * k, 0, 7); f.stroke();
    f.strokeRect(cx - pw / 2 + 2 * k, cy - 10 * k, 10 * k, 20 * k); f.strokeRect(cx + pw / 2 - 12 * k, cy - 10 * k, 10 * k, 20 * k);
    f.strokeStyle = alfa(token('--mappa-tetto-stadio'), 0.55); f.lineWidth = 6 * k; f.beginPath(); f.ellipse(cx, cy, rx * 1.01, ry * 1.01, 0, 0, 7); f.stroke();
    // Fari e loro luce (fissi: stanno nella texture).
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
      const p = { x: cx + sx * 92 * k, y: cy + sy * 56 * k }; fari.push(p);
      const g = f.createRadialGradient(p.x, p.y, 0, p.x, p.y, 80 * k);
      g.addColorStop(0, alfa(token('--mappa-faro'), 0.5)); g.addColorStop(1, alfa(token('--mappa-faro'), 0));
      f.fillStyle = g; f.beginPath(); f.arc(p.x, p.y, 80 * k, 0, 7); f.fill();
      f.fillStyle = token('--mappa-faro'); f.beginPath(); f.arc(p.x, p.y, 2.2, 0, 7); f.fill();
    }
    const tinte = lista('--mappa-folla', 3);
    for (let i = 0; i < (stadio.vuoto ? 0 : 1400); i++) { // lo stadio vuoto non ha tifosi
      const a = r() * Math.PI * 2, q = r(), c = Math.cos(a);
      folla.push({ x: cx + c * (rx - q * 22 * k), y: cy + Math.sin(a) * (ry - q * 14 * k), fase: r() * 6.28,
        colore: c < -0.55 ? tifoso(d.club.sx, i, '--mappa-folla-a') : c > 0.55 ? tifoso(d.club.dx, i, '--mappa-folla-b') : scegli(tinte) });
    }
  }
  if (cs) {
    // Ferro di cavallo: dalle 12 alle 6 passando per il lato opposto al centro (la bocca guarda il campo).
    const c = d.club.sx, tinta = colore(c?.primario) ?? token('--mappa-curva-a');
    const a0 = cs.verso > 0 ? Math.PI * 0.5 : -Math.PI * 0.5, a1 = a0 + Math.PI;
    f.fillStyle = token('--mappa-piazzale'); f.beginPath(); f.arc(cs.x, cs.y, RC + 8, 0, 7); f.fill();
    f.fillStyle = alfa(scuro, 0.55); f.beginPath(); f.arc(cs.x + 4, cs.y + 5, RC + 2, a0, a1); f.fill();
    for (let i = 0; i < 12; i++) {
      f.beginPath(); f.arc(cs.x, cs.y, RC - i * 2, a0, a1);
      f.strokeStyle = token(i % 2 ? '--mappa-gradinata-1' : '--mappa-gradinata-2'); f.lineWidth = 2.2; f.stroke();
      f.strokeStyle = alfa(tinta, 0.5 + 0.04 * i); f.stroke();
    }
    f.strokeStyle = alfa(token('--mappa-tetto-stadio'), 0.55); f.lineWidth = 5; f.beginPath(); f.arc(cs.x, cs.y, RC + 2, a0, a1); f.stroke();
    for (let i = 0; i < 300; i++) {
      const a = a0 + r() * Math.PI, q = RC - r() * 22;
      folla.push({ x: cs.x + Math.cos(a) * q, y: cs.y + Math.sin(a) * q, fase: r() * 6.28, colore: c ? colore(i % 4 ? c.primario : c.secondario)! : token('--mappa-folla-a') });
    }
  }
  // Velo serale.
  const v = f.createLinearGradient(0, 0, 0, H);
  v.addColorStop(0, alfa(token('--mappa-velo-alto'), 0.28)); v.addColorStop(1, alfa(token('--mappa-velo-basso'), 0.1));
  f.fillStyle = v; f.fillRect(0, 0, W, H);
  if (d.cartelloni && d.viali[0]) cartelloni(f, d.viali[0]);
  if (d.notte) {
    notte(f, W, H, d.viali, fari, r);
    // Di notte i dettagli (D-095) sono illuminati: ridisegnati sopra il velo, un po' smorzati.
    f.save(); f.globalAlpha = 0.6; disegnaDettagli(f, d.dettagli, r); f.restore();
  }
  const corteo = d.club.corteo;
  const neutro = neutroCorteo();
  const coppia = (c: Colori | undefined): [string, string] => (c ? [colore(c.primario)!, colore(c.secondario)!] : [token(neutro[0]), token(neutro[1])]);
  const vecchio = spento('C43C02');
  return { folla, dettagli: d.cartelloni ? ['cartelloni_stadio_nuovo', ...dettagli] : dettagli, viali: d.viali.map((punti, i) => ({ id: d.idViali[i] ?? '', punti, versoMeta: d.versoMeta[i] })), fari, stadio: stadio ? (stadio.vuoto ? 'vuoto' : 'pieno') : '',
    coloriCorteo: coppia(corteo),
    coloriViali: Object.fromEntries(d.idViali.map((id, i) => [id, coppia(vecchio ? corteo : d.tifosiViali[i])])),
    origineViali: Object.fromEntries(d.idViali.map((id, i) => [id, (vecchio ? corteo : d.tifosiViali[i])?.primario ?? 'neutro'])) };
}

/** Isolati con tetti, ombre, comignoli e alberi; «salta» lascia libero un posto (stadio, fiume). */
function isolati(f: CanvasRenderingContext2D, W: number, H: number, r: () => number, salta: (x: number, y: number) => boolean) {
  const scegli = <T>(xs: T[]) => xs[Math.floor(r() * xs.length)]!;
  const chiaro = token('--bianco'); const scuro = token('--nero');
  const tetti = lista('--mappa-tetto', 7); const alberi = lista('--mappa-albero', 3);
  for (let y = 6; y < H; y += 46) for (let x = 4; x < W; x += 58) {
    if (salta(x + 27, y + 20)) continue;
    f.fillStyle = token('--mappa-isolato'); f.fillRect(x, y, 54, 40);
    for (let k = 0; k < 5; k++) {
      const bw = 10 + r() * 20, bh = 10 + r() * 16, bx = x + 2 + r() * (52 - bw), by = y + 2 + r() * (38 - bh);
      f.fillStyle = alfa(scuro, 0.45); f.fillRect(bx + 3, by + 3, bw, bh);
      f.fillStyle = scegli(tetti); f.fillRect(bx, by, bw, bh);
      f.fillStyle = alfa(chiaro, 0.1); f.fillRect(bx, by, bw, 1.2);
      f.fillStyle = alfa(scuro, 0.18); f.fillRect(bx + bw / 2 - 0.5, by, 1, bh);
      if (r() < 0.5) { f.fillStyle = token('--mappa-marciapiede'); f.fillRect(bx + 2, by + 2, 3, 2); }
    }
    if (r() < 0.6) for (let k = 0; k < 4; k++) {
      const tx = x + r() * 54, ty = y + r() * 40, tr = 2.5 + r() * 3;
      f.fillStyle = alfa(scuro, 0.4); f.beginPath(); f.arc(tx + 2, ty + 2, tr, 0, 7); f.fill();
      f.fillStyle = scegli(alberi); f.beginPath(); f.arc(tx, ty, tr, 0, 7); f.fill();
    }
  }
}

/** Stazione (e02): fascio di binari che esce dal bordo sinistro, pensiline e fabbricato viaggiatori. */
function stazione(f: CanvasRenderingContext2D, W: number, st: Pt) {
  const fine = Math.min(W, st.x + 62);
  f.fillStyle = token('--mappa-viale'); f.fillRect(0, st.y - 16, fine, 32);
  for (let x = 0; x < fine; x += 5) { f.fillStyle = alfa(token('--mappa-marciapiede'), 0.35); f.fillRect(x, st.y - 15, 1.5, 30); }
  f.strokeStyle = token('--mappa-marciapiede'); f.lineWidth = 1;
  for (const dy of [-11, -6, 6, 11]) { f.beginPath(); f.moveTo(0, st.y + dy); f.lineTo(fine, st.y + dy); f.stroke(); }
  f.fillStyle = token('--mappa-tetto-4'); f.fillRect(st.x - 40, st.y - 2, 80, 4); // pensilina
  f.fillStyle = alfa(token('--nero'), 0.45); f.fillRect(st.x - 31, st.y + 19, 64, 18);
  f.fillStyle = token('--mappa-tetto-7'); f.fillRect(st.x - 34, st.y + 16, 64, 18); // fabbricato viaggiatori
  f.fillStyle = alfa(token('--bianco'), 0.15); f.fillRect(st.x - 34, st.y + 16, 64, 2);
}

/** Città di Vandel Falls dall'alto per la mappa degli episodi (D-061): isolati, fiume, parco, velo serale. */
export function disegnaCitta(f: CanvasRenderingContext2D, W: number, H: number) {
  const caso = creaCaso(11); const r = () => caso.numero();
  const fiume = (x: number) => H * 0.22 + Math.sin((x / W) * Math.PI * 1.6) * H * 0.08 + (x / W) * H * 0.1;
  f.fillStyle = token('--mappa-asfalto'); f.fillRect(0, 0, W, H);
  // D-265 (PO-158, «12 sul prato»): il parco nella fascia libera fra le file di episodi (parco.ts); rosso C265B01: dove stava
  const [px, p0, pw, ph] = parcoCitta();
  isolati(f, W, H, r, (x, y) => Math.abs(y - fiume(x)) < 34 || (x > W * (px - 0.02) && y > H * (p0 - 0.02) && y < H * (p0 + ph + 0.02)));
  f.fillStyle = token('--citta-parco'); f.fillRect(W * px, H * p0, W * pw, H * ph);
  f.strokeStyle = token('--citta-fiume'); f.lineWidth = Math.max(14, W / 18); f.lineCap = 'round';
  f.beginPath(); for (let x = -10; x <= W + 10; x += 6) (x === -10 ? f.moveTo(x, fiume(x)) : f.lineTo(x, fiume(x))); f.stroke();
  for (const q of [0.3, 0.7]) { f.fillStyle = token('--mappa-marciapiede'); f.fillRect(W * q - 5, fiume(W * q) - 26, 10, 52); }
  const v = f.createLinearGradient(0, 0, 0, H);
  v.addColorStop(0, alfa(token('--mappa-velo-alto'), 0.28)); v.addColorStop(1, alfa(token('--mappa-velo-basso'), 0.1));
  f.fillStyle = v; f.fillRect(0, 0, W, H);
}

/** Texture dell'alone dei settori: bianco al centro, trasparente al bordo; il colore lo dà la tinta. */
export function canvasAlone(lato: number): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = c.height = lato;
  const g = c.getContext('2d')!; const b = token('--bianco');
  const gr = g.createRadialGradient(lato / 2, lato / 2, 0, lato / 2, lato / 2, lato / 2);
  gr.addColorStop(0, alfa(b, 0.75)); gr.addColorStop(1, alfa(b, 0));
  g.fillStyle = gr; g.fillRect(0, 0, lato, lato);
  return c;
}
