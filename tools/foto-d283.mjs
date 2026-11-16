// D-283: correzioni grafiche piccole fuori dalla mappa (rapporto del collaudo grafico). Un giro per larghezza:
// - D-12 schieramento: «Annulla», «Aiuto», «Azzera» con la parola a schermo, la barra nei suoi pixel, niente testo tagliato
//   (rosso C283P01);
// - D-13 stato «premuto» (forzato con CDP, senza toccare): Home, «i» e «?» cambiano aspetto (rosso C283A01); pastiglie e
//   dischi sono della sessione della mappa;
// - D-09 unità finita e contatore «a riposo»: contrasto ≥ 4,5:1 (colori composti con l'opacità vera), «tutte» con la spunta (rosso C283E01), dentro l'unità e staccato dal lucchetto (C283E02), «tutte» anche al lettore (C283E03);
// - D-10 verbale (opzione A del PO dopo la revisione R2/R3): «Mappa» sotto l'icona, «indietro»/mappa/«Prossimo» sulla stessa riga sui 36 verbali, nessuna nota sopra; fiducia sotto la testata
//   (rossi C283V01, C283V02, C283V03);
// - D-15 Crediti: la versione non sta sopra le schede ed è in fondo alla pagina (rosso C283C01).
// D-07 (scheda «fallito» della città) lo guarda tools/foto-po149.mjs. D-16 (radio) è uscito dal lotto: docs/foto/d283/d16/APPUNTI.md.
// Uso a mano: node tools/foto-d283.mjs <build> <cartella-foto> [larghezze] (stampa le misure in JSON). Rossi: VALMORA_ROSSI.
import { join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { missioniDai, salvataggioTutti } from './foto-bozze.mjs';
import { partenzeAttente } from './foto-schieramenti.mjs';
import { gioca } from './foto.mjs';
import { leggiDati } from './dati-disco.mjs';
import { attenta } from '../src/logica/bot.ts';
import { creaCaso } from '../src/logica/caso.ts';
import { opzioniValide } from '../src/logica/missione.ts';
import { avanzaFino } from './foto-club.mjs';

const CHIAVE = 'vandelfalls-salvataggio', SOGLIA = 4.5;
const { missioni, v0 } = missioniDai('data'), base = salvataggioTutti(missioni, v0);
// schieramento con un'unità «a riposo» (la prima ondata dopo una risposta che costa unità, bot attento)
const conRiposo = () => partenzeAttente('data').find((x) => Object.values(x.s.riposo ?? {}).some((n) => n > 0));
// verbale di e01 superato col titolo su due righe («Contenuto a fatica»: la pagina del collaudo, 687-731 px a 360×640), fino
// all'ultimo rapporto (come salvataggioFallito di foto-c41.mjs); risposte a caso col seme, schieramento del bot attento
export const verbaleSuperato = () => { const dati = leggiDati('data'), dich = new Map(dati['stato.json'].variabili.map((d) => [d.id, d])), m = missioni[0], att = attenta(creaCaso(1), dich);
  for (let seme = 1; seme <= 500; seme++) { const caso = creaCaso(`d283:${seme}`), g = gioca(m, dich, { schiera: att.schiera, scegli: (mm, st, c) => caso.scegli(opzioniValide(c, st, mm)).id }, v0);
    if (g.esito === 'contenuto_a_fatica') return { ...base, missioni_concluse: [], episodi: {}, in_corso: g.ic, rapporto_aperto: g.ic.rapporti.at(-1).n }; }
  throw new Error('D-283: nessun seme porta e01 a «Contenuto a fatica»'); };

// R2/R3: i 36 verbali del bot attento, episodio dopo episodio con le variabili in catena, aperti all'ultimo rapporto
let verbali36 = null;
export const verbaliAttenti = () => verbali36 ??= (() => { const dati = leggiDati('data'), dich = new Map(dati['stato.json'].variabili.map((d) => [d.id, d])), out = []; let v = v0;
  for (const [i, m] of missioni.entries()) { const g = gioca(m, dich, attenta(creaCaso(1), dich), v), prima = missioni.slice(0, i).map((x) => x.id);
    out.push({ ep: m.id, sal: JSON.stringify({ ...base, variabili: v, missioni_concluse: prima, episodi: Object.fromEntries(prima.map((x) => [x, base.episodi[x]])), in_corso: g.ic, rapporto_aperto: g.ic.rapporti.at(-1).n }) });
    v = g.variabili; }
  return out; })();

// contrasto WCAG del testo dell'elemento: colori composti con le opacità degli antenati sul fondo pieno sotto
const contrasto = (p, sel) => p.evaluate((sel) => {
  const rgba = (s) => { const m = s.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 0]; return [m[0], m[1], m[2], m[3] ?? 1]; };
  const su = (a, b, al) => [0, 1, 2].map((i) => a[i] * al + b[i] * (1 - al));
  const lum = (c) => { const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const rapporto = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((u, v) => v - u); return (x + 0.05) / (y + 0.05); };
  return [...document.querySelectorAll(sel)].filter((e) => e.getClientRects().length).map((e) => {
    // catena dall'elemento alla radice: fondi pieni e, per le righe a token (repeating-linear-gradient), ogni colore delle
    // righe: si tiene il contrasto peggiore; le opacità di gruppo si compongono sul fondo che sta sotto il gruppo
    const catena = []; for (let x = e; x; x = x.parentElement) catena.push(x);
    const fondi = catena.map((x) => { const cs = getComputedStyle(x), img = cs.backgroundImage;
      return { x, c: rgba(cs.backgroundColor), righe: img.includes('repeating-linear-gradient') ? (img.match(/rgba?\([^)]*\)/g) ?? []).map(rgba) : [], op: Number(cs.opacity) }; });
    const gruppo = fondi.findLast((f) => f.op < 1), op = fondi.reduce((n, f) => n * f.op, 1);
    let fuori = [255, 255, 255]; if (gruppo) for (const f of [...fondi].reverse()) { if (f.x === gruppo.x) break; if (f.c[3] > 0) fuori = su(f.c, fuori, f.c[3]); }
    let sotti = [[255, 255, 255]];
    for (const f of [...fondi].reverse()) { // dalla radice in giù
      if (f.c[3] > 0) sotti = sotti.map((b) => su(f.c, b, f.c[3]));
      if (f.righe.length) sotti = sotti.flatMap((b) => f.righe.map((r) => su(r, b, r[3])));
    }
    const testo = rgba(getComputedStyle(e).color);
    const rapporti = sotti.map((sotto) => rapporto(su(su(testo, sotto, testo[3]), fuori, op), su(sotto, fuori, op)));
    return { testo: e.textContent.trim().slice(0, 20), rapporto: Math.round(Math.min(...rapporti) * 100) / 100, opacita: Math.round(op * 100) / 100 };
  });
}, sel);

// D-13: aspetto di un elemento normale e con :active forzato (CDP), e se si sposta
async function premuto(p, sel) {
  const cdp = await p.context().newCDPSession(p); await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 }), { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: sel });
  if (!nodeId) { await cdp.detach(); return null; }
  const vista = () => p.evaluate((sel) => { const e = document.querySelector(sel), dentro = e.querySelector('.pastiglia') ?? e, cs = getComputedStyle(e), cd = getComputedStyle(dentro), dopo = getComputedStyle(e, '::after'), r = e.getBoundingClientRect();
    return { aspetto: [cs.transform, cs.boxShadow, cs.backgroundColor, cd.backgroundColor, dopo.backgroundColor].join('|'), x: r.left, y: r.top }; }, sel);
  // N4 (revisione): si legge a transizioni finite (anche ::after), non subito dopo il cambio di stato
  const ferma = () => p.evaluate((sel) => Promise.all(document.querySelector(sel).getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {}))), sel);
  await ferma(); const prima = await vista(); await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['active'] });
  await p.evaluate(() => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)))); await ferma();
  const sotto = await vista(); await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] }); await cdp.detach();
  return { cambia: prima.aspetto !== sotto.aspetto, sposta: Math.round(Math.hypot(sotto.x - prima.x, sotto.y - prima.y) * 10) / 10 };
}

const nuova = async (browser, w, h, rossi) => { const p = await browser.newPage({ viewport: { width: w, height: h }, hasTouch: true, reducedMotion: 'reduce' });
  await p.addInitScript(() => { globalThis.__VALMORA_SECONDO_MS = 1; });
  if (rossi.length) await p.addInitScript((xs) => { for (const x of xs) globalThis[`__NO_${x}`] = true; }, rossi); return p; };
// caratteri caricati e scena ferma (opacità 1), poi due fotogrammi: col carattere di riserva le altezze cambiano
const quieta = async (p) => { await p.evaluate(() => document.fonts.ready);
  await p.waitForFunction(() => document.querySelectorAll('.scena').length === 1 && getComputedStyle(document.querySelector('.scena')).opacity === '1', null, { timeout: 15000 }).catch(() => {});
  await p.evaluate(() => new Promise((ok) => { scrollTo(0, 0); requestAnimationFrame(() => requestAnimationFrame(ok)); })); await p.waitForTimeout(250); };

/** Problemi (con «(D-283 …)») e misure alla larghezza data. */
export async function controllaD283(browser, url, larghezza, rossi = [], cartella = '') {
  const male = [], mis = { larghezza };
  if (cartella) mkdirSync(cartella, { recursive: true });
  const foto = async (p, nome, clip) => { if (cartella) await p.screenshot({ path: join(cartella, `${larghezza}-${nome}.png`), ...(clip ? { clip } : {}) }); };
  // R1 (revisione): vassoio e barra «Conferma» restano dove sono quando tutte le unità sono finite (stato «tutte finite»)
  const posa = (p) => p.evaluate(() => ({ vassoio: Math.round(document.querySelector('.vassoio').getBoundingClientRect().height * 10) / 10, barra: Math.round(document.querySelector('[data-barra]').getBoundingClientRect().top * 10) / 10 }));
  const tutteFinite = async (p, dove, posa0, nome) => {
    for (let k = 0; k < 80; k++) { const u = p.locator('.vassoio [data-risorsa]:not(:disabled)').first(); if (!(await u.count())) break;
      await u.click(); await p.locator('.mappa:not(.citta) [data-settore] .settore-punto').first().click({ force: true }); await p.waitForTimeout(60); }
    await quieta(p); const posa1 = await posa(p), restano = await p.locator('.vassoio [data-risorsa]:not(:disabled)').count();
    mis[`tutteFinite ${dove}`] = { prima: posa0, dopo: posa1, restano };
    if (restano) male.push(`${dove}: ${restano} unità non finite dopo il giro «tutte finite» (D-283 R1)`);
    if (Math.abs(posa1.vassoio - posa0.vassoio) > 0.5) male.push(`${dove}: con tutte le unità finite il vassoio passa da ${posa0.vassoio} a ${posa1.vassoio} px (D-283 R1)`);
    if (Math.abs(posa1.barra - posa0.barra) > 0.5) male.push(`${dove}: con tutte le unità finite la barra «Conferma» si sposta da y ${posa0.barra} a ${posa1.barra} (D-283 R1)`);
    await foto(p, `schieramento-${nome}`); await foto(p, `schieramento-${nome}-vassoio`, await p.locator('.vassoio').boundingBox()); };
  // --- schieramento (D-12, D-13, D-09), 760 di altezza come il giro degli schieramenti
  { const st = conRiposo(), p = await nuova(browser, larghezza, 760, rossi), dove = `${larghezza}x760 ${st?.m.id} ondata ${st?.n} schieramento`;
    await p.goto(url); await p.evaluate(([k, v]) => localStorage.setItem(k, v), [CHIAVE, JSON.stringify({ ...base, in_corso: st.s })]); await p.reload();
    await p.getByRole('button', { name: 'Riprendi' }).click();
    if (!(await p.waitForSelector('[data-barra]', { timeout: 15000 }).then(() => true, () => false))) male.push(`${dove}: lo schieramento non si apre (D-283)`);
    else {
      await quieta(p);
      const b = await p.evaluate(() => { const barra = document.querySelector('[data-barra]'), r = barra.getBoundingClientRect(), cs = getComputedStyle(barra);
        const ps = [...barra.querySelectorAll('button')].map((x) => ({ azione: x.dataset.azione, parola: [...x.childNodes].filter((n) => n.nodeType === 3 || n.matches?.('span')).map((n) => n.textContent.trim()).join(''), w: x.getBoundingClientRect().width, l: x.getBoundingClientRect().left, d: x.getBoundingClientRect().right, t: Math.round(x.getBoundingClientRect().top), taglio: x.scrollWidth > x.clientWidth + 1 || [...x.querySelectorAll('span')].some((s) => s.scrollWidth > s.clientWidth + 1) }));
        return { larga: Math.round(r.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)), alta: Math.round(r.height), occupa: Math.round(Math.max(...ps.map((x) => x.d)) - Math.min(...ps.map((x) => x.l))), righe: new Set(ps.map((x) => x.t)).size, ps };
      });
      mis.barra = { larga: b.larga, alta: b.alta, occupa: b.occupa, pulsanti: b.ps.map((x) => `${x.azione}:${Math.round(x.w)}«${x.parola}»`) };
      for (const a of ['annulla', 'aiuto', 'azzera']) { const x = b.ps.find((y) => y.azione === a); if (x && !x.parola) male.push(`${dove}: «${a}» con la sola icona, nessuna parola a schermo (D-283 D-12)`); }
      if (b.righe !== 1) male.push(`${dove}: al testo normale la barra va su ${b.righe} righe, deve restarne una (D-283 N1)`);
      if (b.occupa > b.larga + 0.5) male.push(`${dove}: i pulsanti della barra occupano ${b.occupa} px su ${b.larga} (D-283 D-12)`);
      for (const x of b.ps.filter((y) => y.taglio)) male.push(`${dove}: testo tagliato in «${x.azione}» (D-283 D-12)`);
      await foto(p, 'schieramento-barra', await p.locator('[data-barra]').boundingBox());
      // D-09: il contatore «a riposo» su un'unità attiva
      const riposo = await contrasto(p, '.unita:not(:disabled) [data-riposo]'); mis.riposo = riposo;
      if (!riposo.length) male.push(`${dove}: nessun contatore «a riposo» da misurare (D-283 D-09)`);
      for (const x of riposo.filter((y) => !(y.rapporto >= SOGLIA))) male.push(`${dove}: contatore a riposo «${x.testo}» a ${x.rapporto}:1, serve ${SOGLIA} (D-283 D-09)`);
      // D-13: Home, «i» e «?» (quello della barra è un .pulsante: lo era già)
      mis.premuto = {};
      for (const [nome, sel] of [['home', '[data-azione="home"]'], ['i', '.info'], ['aiuto', '[data-azione="aiuto"]']]) mis.premuto[nome] = await premuto(p, sel);
      // R1 (revisione): vassoio e barra «Conferma» prima di finire le unità; poi devono restare dove sono in ogni stato
      const posa0 = await posa(p);
      // D-09: si finisce l'unità con meno pezzi (la si mette tutta su un settore)
      const r = await p.evaluate(() => [...document.querySelectorAll('.vassoio [data-risorsa]:not(:disabled)')].map((x) => [x.dataset.risorsa, Number(x.querySelector('strong')?.textContent)]).sort((a, c) => a[1] - c[1])[0]?.[0]);
      for (let k = 0; k < 12 && r && !(await p.locator(`.vassoio [data-risorsa="${r}"]`).isDisabled()); k++) {
        await p.click(`.vassoio [data-risorsa="${r}"]`); await p.locator('.mappa:not(.citta) [data-settore] .settore-punto').first().click({ force: true }); await p.waitForTimeout(80); }
      await quieta(p);
      for (const [nome, x] of Object.entries(mis.premuto)) {
        if (!x) { male.push(`${dove}: manca ${nome} da premere (D-283 D-13)`); continue; } // anche la «i»: se l'ondata scelta non l'ha, il giro va cambiato, non saltato
        if (!x.cambia) male.push(`${dove}: ${nome} premuto senza nessun segno (D-283 D-13)`);
      }
      const finita = await contrasto(p, `.vassoio [data-risorsa="${r}"]:disabled :is(.unita-nome, strong:not(.posto))`); mis.finita = finita;
      if (!finita.length) male.push(`${dove}: nessuna unità finita da misurare (D-283 D-09)`);
      for (const x of finita.filter((y) => !(y.rapporto >= SOGLIA))) male.push(`${dove}: unità finita «${x.testo}» a ${x.rapporto}:1, serve ${SOGLIA} (D-283 D-09)`);
      if (finita.length && !(await p.locator(`.vassoio [data-risorsa="${r}"] [data-tutte]`).count())) male.push(`${dove}: l'unità finita non dice «✓ tutte» (D-283 D-09)`);
      // il contenuto di ogni unità (tranne il lucchetto delle fisse, fuori apposta) sta dentro il bordo; altezza del vassoio
      const v = await p.evaluate(() => ({ alto: Math.round(document.querySelector('.vassoio').getBoundingClientRect().height),
        fuori: [...document.querySelectorAll('.vassoio .unita')].flatMap((u) => { const b = u.getBoundingClientRect(), bordo = parseFloat(getComputedStyle(u).borderTopWidth);
          return [...u.querySelectorAll(':scope > :not(.unita-fissa)')].filter((c) => { const r = c.getBoundingClientRect(); return r.top < b.top + bordo - 0.5 || r.bottom > b.bottom - bordo + 0.5 || r.left < b.left + bordo - 0.5 || r.right > b.right - bordo + 0.5; })
            .map((c) => `${u.dataset.risorsa}: «${c.textContent.trim()}»`); }),
        // il contenuto vero di «tutte» (icona e testo, con un Range: il riquadro del badge può stare dentro e il testo uscire) sta dentro
        // il bordo dell'unità e dentro il badge, e non tocca il lucchetto (nessun pixel in comune)
        tutte: [...document.querySelectorAll('.vassoio .unita [data-tutte]')].map((t) => { const u = t.closest('.unita'), b = u.getBoundingClientRect(), bordo = parseFloat(getComputedStyle(u).borderTopWidth);
          const rg = document.createRange(); rg.selectNodeContents(t); const c = rg.getBoundingClientRect(), s = t.getBoundingClientRect(), l = u.querySelector('.unita-fissa')?.getBoundingClientRect();
          return { r: u.dataset.risorsa, taglio: Math.round(Math.max(b.left + bordo - c.left, c.right - (b.right - bordo), s.left - c.left, c.right - s.right, t.scrollWidth - t.clientWidth, 0) * 10) / 10,
            distanza: l ? Math.round(Math.max(s.left - l.right, l.left - s.right, s.top - l.bottom, l.top - s.bottom) * 10) / 10 : null,
            interno: Math.round(b.width - 2 * bordo), badge: Math.round(s.width), contenuto: Math.round(c.width), da: Math.round((s.left - b.left) * 10) / 10, fineLucchetto: l ? Math.round((l.right - b.left) * 10) / 10 : null }; }) }));
      mis.vassoio = v.alto;
      for (const x of v.fuori) male.push(`${dove}: nel vassoio esce dall'unità ${x} (D-283 D-09)`);
      mis.tutte = v.tutte;
      // WCAG 2.5.3: il nome per il lettore contiene la parola a schermo
      for (const x of await p.$$eval('.vassoio .unita:has([data-tutte])', (us) => us.map((u) => [u.dataset.risorsa, u.getAttribute('aria-label') ?? '']))) if (!x[1].includes('tutte')) male.push(`${dove}: l'unità finita ${x[0]} dice «tutte» a schermo ma «${x[1]}» al lettore (D-283 D-09)`);
      for (const x of v.tutte.filter((y) => y.taglio > 0)) male.push(`${dove}: «tutte» di ${x.r} tagliato di ${x.taglio} px (D-283 D-09)`);
      const staccato = await p.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--spazio-1'))); // distanza minima dal lucchetto
      for (const x of v.tutte.filter((y) => y.distanza !== null && !(y.distanza >= staccato))) male.push(`${dove}: «tutte» di ${x.r} a ${x.distanza} px dal lucchetto, ne servono ${staccato} (D-283 D-09)`);
      await foto(p, 'schieramento-vassoio', await p.locator('.vassoio').boundingBox());
      await foto(p, 'schieramento');
      await tutteFinite(p, dove, posa0, 'tutte');
    }
    await p.close(); }
  // --- N1 (revisione): testo al 130% (token --testo-* × 1,3, i caratteri sono in px e lo zoom non li tocca): nella barra nessun
  // pulsante esce né taglia il proprio testo (su main 0; col lotto «Conferma» usciva di 50,5 px a 360 e 35,5 a 375)
  { const st = partenzeAttente('data')[0], p = await nuova(browser, larghezza, 760, rossi), dove = `${larghezza}x760 ${st.m.id} ondata ${st.n} testo 130%`;
    await p.addInitScript(() => document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'), r = getComputedStyle(document.documentElement);
      s.textContent = `:root:root { ${['mini', 'piccolo', 'base', 'grande', 'titolo', 'numero', 'logo'].map((a) => `--testo-${a}: calc(1.3 * ${r.getPropertyValue(`--testo-${a}`).trim() || '0px'});`).join(' ')} }`; document.head.append(s); }));
    await p.goto(url); await p.evaluate(([k, v]) => localStorage.setItem(k, v), [CHIAVE, JSON.stringify({ ...base, in_corso: st.s })]); await p.reload();
    await p.getByRole('button', { name: 'Riprendi' }).click();
    if (!(await p.waitForSelector('[data-barra]', { timeout: 15000 }).then(() => true, () => false))) male.push(`${dove}: lo schieramento non si apre (D-283)`);
    else { await quieta(p);
      const r = await p.evaluate(() => { const bar = document.querySelector('[data-barra]'), br = bar.getBoundingClientRect(), cs = getComputedStyle(bar), sx = br.left + parseFloat(cs.paddingLeft), dx = br.right - parseFloat(cs.paddingRight);
        const mini = parseFloat(getComputedStyle(bar.querySelector('.parola-icona') ?? document.body).fontSize); // 12 px al 100%
        return { mini, ps: [...bar.querySelectorAll('button')].map((x) => { const q = x.getBoundingClientRect(), rg = document.createRange(); rg.selectNodeContents(x); const c = rg.getBoundingClientRect();
          return { a: x.dataset.azione, fuori: Math.round(Math.max(0, q.right - dx, sx - q.left, c.right - q.right, q.left - c.left, x.scrollWidth - x.clientWidth, c.right - dx) * 10) / 10 }; }) }; });
      mis.testo130 = r;
      if (!(r.mini > 15)) male.push(`${dove}: il testo non è ingrandito (--testo-mini ${r.mini} px): misura non valida (D-283 N1)`);
      for (const x of r.ps.filter((y) => y.fuori > 0)) male.push(`${dove}: «${x.a}» esce dalla barra o taglia il testo di ${x.fuori} px (D-283 N1)`);
      await foto(p, 'schieramento-130', await p.locator('[data-barra]').boundingBox()); }
    await p.close(); }
  // --- R1 su e01 ondata 1: nessuna unità «a riposo» né montata, quindi nessuna terza riga che tenga alto il vassoio
  { const st = partenzeAttente('data')[0], p = await nuova(browser, larghezza, 760, rossi), dove = `${larghezza}x760 ${st.m.id} ondata ${st.n} tutte finite`;
    await p.goto(url); await p.evaluate(([k, v]) => localStorage.setItem(k, v), [CHIAVE, JSON.stringify({ ...base, in_corso: st.s })]); await p.reload();
    await p.getByRole('button', { name: 'Riprendi' }).click();
    if (!(await p.waitForSelector('[data-barra]', { timeout: 15000 }).then(() => true, () => false))) male.push(`${dove}: lo schieramento non si apre (D-283)`);
    else { await quieta(p); await tutteFinite(p, dove, await posa(p), 'e01-tutte'); }
    await p.close(); }
  // --- verbale (D-10, revisione R2/R3, opzione A del PO): all'ultimo passo «indietro», mappa e «Prossimo» sulla stessa riga, il
  // pulsante della mappa dice «Mappa» sotto l'icona (intera), nessuna nota sopra i pulsanti; «Prossimo» toccabile, fiducia sotto la testata
  const fineVerbale = (p) => p.evaluate(() => { const q = (s) => document.querySelector(s)?.getBoundingClientRect();
    const pr = q('.passi-nav [data-azione="prossimo"]'), ind = q('.passi-nav [data-azione="indietro"]'), ci = q('.passi-nav [data-azione="citta"]'), n = document.querySelector('p[data-spiega="mappa"]');
    const w = document.querySelector('.passi-nav [data-azione="citta"] .parola-icona'), wr = w?.getBoundingClientRect(), f = q('.fiducia'), t = q('.testata');
    const tocco = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tocco-min'));
    return { prossimo: pr ? Math.round(Math.max(0, Math.min(innerHeight, pr.bottom) - Math.max(0, pr.top))) : null, tocco,
      scarto: pr && ind ? Math.round((ind.top - pr.top) * 10) / 10 : null, scartoMappa: pr && ci ? Math.round((ci.top - pr.top) * 10) / 10 : null,
      parola: w ? w.textContent : null, taglio: w && ci ? Math.round(Math.max(0, ci.left - wr.left, wr.right - ci.right, w.scrollWidth - w.clientWidth) * 10) / 10 : null,
      nota: !!n && n.getClientRects().length > 0 && n.closest('.verbale-fine')?.firstElementChild === n, fiduciaSotto: f && t ? f.top >= t.bottom - 0.5 : null }; });
  const controllaFine = (v, dove) => {
    if (v.prossimo === null) return; // fine senza «Prossimo» (epilogo, fallito): fuori da R2/R3
    if (v.nota) male.push(`${dove}: la nota «Mappa: rigioca…» sta sopra i pulsanti e li spinge giù (D-283 R2)`);
    if (v.scarto !== null && Math.abs(v.scarto) > 0.5) male.push(`${dove}: «indietro» a ${v.scarto} px da «Prossimo», non sulla stessa riga (D-283 R3)`);
    if (v.scartoMappa !== null && Math.abs(v.scartoMappa) > 0.5) male.push(`${dove}: il pulsante della mappa a ${v.scartoMappa} px da «Prossimo» (D-283 R3)`);
    if (v.parola !== 'Mappa') male.push(`${dove}: il pulsante della mappa non dice «Mappa» sotto l'icona (D-283 D-10)`);
    else if (v.taglio > 0) male.push(`${dove}: «Mappa» tagliata di ${v.taglio} px (D-283 D-10)`); };
  { const sal = JSON.stringify(verbaleSuperato());
    for (const h of [640, 667, 760]) { const p = await nuova(browser, larghezza, h, rossi), dove = `${larghezza}x${h} verbale e01`;
      await p.goto(url); await p.evaluate(([k, v]) => localStorage.setItem(k, v), [CHIAVE, sal]); await p.reload();
      await p.getByRole('button', { name: 'Riprendi' }).click(); await p.waitForSelector('.scena[data-scena="rapporto"]', { timeout: 30000 }).catch(() => {});
      await p.click('[data-azione="avanti"]', { timeout: 30000 }).catch(() => {});
      if (!(await p.waitForSelector('.scena[data-scena="verbale"]', { timeout: 30000 }).then(() => true, () => false))) { male.push(`${dove}: il verbale non si apre (D-283)`); await p.close(); continue; }
      await quieta(p); await foto(p, `verbale-${h}-primo`);
      await avanzaFino(p, '[data-azione="prossimo"]', () => p.waitForTimeout(150)); await quieta(p);
      const v = await fineVerbale(p); mis[`verbale${h}`] = v; controllaFine(v, dove);
      if (v.prossimo !== null && v.prossimo < Math.min(v.tocco, 44)) male.push(`${dove}: «Prossimo episodio» si vede per ${v.prossimo} px a scorrimento zero (serve ≥ ${v.tocco}, D-283 D-10)`);
      if (v.fiduciaSotto === false) male.push(`${dove}: la fiducia sta sopra la testata, altrove sotto (D-283 D-10)`);
      await foto(p, `verbale-${h}`); await p.close(); } }
  // --- R2/R3 sui 36 verbali del bot attento (variabili in catena), all'altezza del telefono piccolo di ogni larghezza
  { const h = { 360: 640, 375: 667 }[larghezza] ?? 760, coda = [...verbaliAttenti()]; let n = 0;
    await Promise.all([0, 1, 2].map(async () => { while (coda.length) { const c = coda.shift(), p = await nuova(browser, larghezza, h, rossi), dove = `${larghezza}x${h} verbale ${c.ep}`;
      try { await p.goto(url); await p.evaluate(([k, v]) => localStorage.setItem(k, v), [CHIAVE, c.sal]); await p.reload();
        await p.getByRole('button', { name: 'Riprendi' }).click(); await p.waitForSelector('.scena[data-scena="rapporto"]', { timeout: 30000 }).catch(() => {});
        await p.click('[data-azione="avanti"]', { timeout: 30000 }).catch(() => {});
        if (!(await p.waitForSelector('.scena[data-scena="verbale"]', { timeout: 30000 }).then(() => true, () => false))) { male.push(`${dove}: il verbale non si apre (D-283)`); continue; }
        await avanzaFino(p, ':is([data-azione="prossimo"], [data-azione="epilogo"])', () => p.waitForTimeout(120)); await quieta(p);
        controllaFine(await fineVerbale(p), dove); n++;
        if (cartella && ['e08', 'e24'].includes(c.ep)) await foto(p, `verbale-${c.ep}-${h}`);
      } finally { await p.close(); } } }));
    mis.verbali36 = n; if (n < 36) male.push(`${larghezza}x${h}: misurati ${n} verbali su 36 (D-283 R2)`); }
  // --- Crediti (D-15)
  for (const h of [640, 915]) { const p = await nuova(browser, larghezza, h, rossi), dove = `${larghezza}x${h} crediti`;
    await p.goto(url); await p.evaluate(() => localStorage.clear()); await p.reload();
    await p.click('[data-azione="altro"]').catch(() => {}); await p.click('[data-azione="crediti"]', { timeout: 15000 }).catch(() => {});
    if (!(await p.waitForSelector('[data-credito]', { timeout: 15000 }).then(() => true, () => false))) { male.push(`${dove}: i Crediti non si aprono (D-283)`); await p.close(); continue; }
    await quieta(p);
    const sopra = async () => p.evaluate(() => { const v = document.querySelector('[data-versione-angolo]'), r = v?.getBoundingClientRect(); if (!r || !r.width || getComputedStyle(v).visibility === 'hidden' || getComputedStyle(v).display === 'none') return [];
      // distanza fra i riquadri (0 se si toccano o si coprono): sotto --spazio-1 la versione sta sul bordo della scheda (foto 28)
      const d = (A, B) => Math.hypot(Math.max(0, A.left - B.right, B.left - A.right), Math.max(0, A.top - B.bottom, B.top - A.bottom)), min = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--spazio-1'));
      return [...document.querySelectorAll('.scena .scheda, .scena .pulsante')].map((s) => d(r, s.getBoundingClientRect())).filter((x) => x < min).map((x) => Math.round(x * 10) / 10); });
    // a più posizioni di scorrimento (un quarto di finestra alla volta): la versione è fissa, le schede passano
    const s0 = [], fine = await p.evaluate(() => document.scrollingElement.scrollHeight - innerHeight);
    for (let y = 0; ; y = Math.min(fine, y + Math.round(h / 4))) { await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(60); s0.push(...await sopra()); if (y >= fine) break; }
    const fondo = await p.evaluate(() => { const v = document.querySelector('.scena [data-versione]'); if (!v) return null; const ultimo = [...document.querySelectorAll('.scena *')].filter((e) => e.getClientRects().length).reduce((m, e) => Math.max(m, e.getBoundingClientRect().bottom), 0);
      return { testo: v.textContent, inFondo: v.getBoundingClientRect().bottom >= ultimo - 0.5 }; });
    mis[`crediti${h}`] = { sopra: s0, fondo };
    if (s0.length) male.push(`${dove}: la versione nell'angolo sta sul bordo di ${s0.length} schede o pulsanti (a ${s0.join(', ')} px, serve ≥ --spazio-1, D-283 D-15)`);
    if (!fondo?.inFondo) male.push(`${dove}: manca la versione in fondo alla pagina (D-283 D-15)`);
    await foto(p, `crediti-${h}-fondo`); await p.close(); }
  return { male, mis };
}

// Bracci rossi del giro (passi-grafica.mjs, bracci-rossi-grafica, a 360): rosso → segno da trovare e quante volte almeno.
// Conteggi dalla misura del 15/11 a 360 sul codice di questo lotto, un rosso alla volta.
export const BRACCI_D283 = {
  C283P01: { segno: '(D-283 D-12)', almeno: 3 }, // annulla, aiuto, azzera con la sola icona
  C283A01: { segno: '(D-283 D-13)', almeno: 2 }, // Home e «i» senza segno («?» della barra è un .pulsante: già premuto)
  C283E01: { segno: '(D-283 D-09)', almeno: 4 }, // riposo 4,17:1, nome 1,91:1, «0» 2,48:1, niente «✓ tutte»
  C283E02: { segno: '«tutte» di ', almeno: 2 }, // transenne fissa: con la spunta tagliata di 3,2 px e a 0 px dal lucchetto
  C283E04: { segno: '(D-283 R1)', almeno: 2 }, // tutte finite senza segnaposto: vassoio 70 → 50 px e barra 20 px più su
  C283N01: { segno: '(D-283 N1)', almeno: 1 }, // 130%: «Conferma» fuori dalla barra di 50,5 px a 360
  C283E03: { segno: 'al lettore (D-283 D-09)', almeno: 3 }, // «0 libere» al lettore: squadre, mediatore, transenne
  C283V01: { segno: 'non dice «Mappa» sotto l\'icona (D-283 D-10)', almeno: 36 }, // come main: solo icona (3 verbali e01 + 35 dei 36 a 360)
  C283V03: { segno: '(D-283 R', almeno: 30 }, // nota sopra i pulsanti: «indietro» 13 px più su e nota sopra, nei verbali con «Prossimo»
  C283V02: { segno: 'la fiducia sta sopra la testata', almeno: 3 }, // 640, 667, 760
  C283C01: { segno: 'D-283 D-15)', almeno: 4 }, // 640 e 915: sul bordo delle schede e niente versione in fondo
};

/** Giro intero su una build: problemi a ogni larghezza (un browser, una pagina alla volta). */
export async function giraD283(build = 'dist', larghezze = [360, 375, 412], rossi = [], cartella = '') {
  const { servi } = await import('./foto.mjs'), { chromium } = await import('playwright-core');
  const srv = await servi(build), url = `http://127.0.0.1:${srv.address().port}/`;
  const browser = await chromium.launch({ executablePath: process.env.VALMORA_CHROME ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined) });
  const giri = [];
  try { for (const w of larghezze) giri.push(await controllaD283(browser, url, w, rossi, cartella)); } finally { await browser.close(); srv.close(); }
  return giri;
}

/** '' se il braccio vede il suo rosso, altrimenti la riga «cieco». */
export async function braccioD283(r, build = 'dist') {
  const b = BRACCI_D283[r], male = (await giraD283(build, [360], [r])).flatMap((g) => g.male), n = male.filter((x) => x.includes(b.segno)).length;
  return n >= b.almeno ? '' : `d283/${r} è cieco: ${n} problemi «${b.segno}», ne servono ${b.almeno} (visti: ${male.join(' · ') || 'nessuno'})`;
}

if (process.argv[1]?.endsWith('foto-d283.mjs')) {
  const [build = 'dist', cartella = '', l] = process.argv.slice(2), rossi = (process.env.VALMORA_ROSSI ?? '').split(',').filter(Boolean);
  for (const g of await giraD283(build, (l ?? '360,375,412').split(',').map(Number), rossi, cartella)) console.log(JSON.stringify(g, null, 1));
}
