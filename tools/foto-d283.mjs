// D-283: correzioni grafiche piccole fuori dalla mappa (rapporto del collaudo grafico). Un giro per larghezza:
// - D-12 schieramento: «Annulla», «Aiuto», «Azzera» con la parola a schermo, la barra nei suoi pixel, niente testo tagliato
//   (rosso C283P01);
// - D-13 stato «premuto» (forzato con CDP, senza toccare): Home, «i» e «?» cambiano aspetto (rosso C283A01); pastiglie e
//   dischi sono della sessione della mappa;
// - D-09 unità finita e contatore «a riposo»: contrasto ≥ 4,5:1 (colori composti con l'opacità vera), «✓ tutte» (rosso C283E01);
// - D-10 verbale a 640/667 di altezza: la nota «Mappa: …» si vede a scorrimento zero, la fiducia sta sotto la testata
//   (rossi C283V01, C283V02);
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
  const prima = await vista(); await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['active'] });
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
  // --- schieramento (D-12, D-13, D-09), 760 di altezza come il giro degli schieramenti
  { const st = conRiposo(), p = await nuova(browser, larghezza, 760, rossi), dove = `${larghezza}x760 ${st?.m.id} ondata ${st?.n} schieramento`;
    await p.goto(url); await p.evaluate(([k, v]) => localStorage.setItem(k, v), [CHIAVE, JSON.stringify({ ...base, in_corso: st.s })]); await p.reload();
    await p.getByRole('button', { name: 'Riprendi' }).click();
    if (!(await p.waitForSelector('[data-barra]', { timeout: 15000 }).then(() => true, () => false))) male.push(`${dove}: lo schieramento non si apre (D-283)`);
    else {
      await quieta(p);
      const b = await p.evaluate(() => { const barra = document.querySelector('[data-barra]'), r = barra.getBoundingClientRect(), cs = getComputedStyle(barra);
        const ps = [...barra.querySelectorAll('button')].map((x) => ({ azione: x.dataset.azione, parola: [...x.childNodes].filter((n) => n.nodeType === 3 || n.matches?.('span')).map((n) => n.textContent.trim()).join(''), w: x.getBoundingClientRect().width, l: x.getBoundingClientRect().left, d: x.getBoundingClientRect().right, taglio: x.scrollWidth > x.clientWidth + 1 || [...x.querySelectorAll('span')].some((s) => s.scrollWidth > s.clientWidth + 1) }));
        return { larga: Math.round(r.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)), alta: Math.round(r.height), occupa: Math.round(Math.max(...ps.map((x) => x.d)) - Math.min(...ps.map((x) => x.l))), ps };
      });
      mis.barra = { larga: b.larga, alta: b.alta, occupa: b.occupa, pulsanti: b.ps.map((x) => `${x.azione}:${Math.round(x.w)}«${x.parola}»`) };
      for (const a of ['annulla', 'aiuto', 'azzera']) { const x = b.ps.find((y) => y.azione === a); if (x && !x.parola) male.push(`${dove}: «${a}» con la sola icona, nessuna parola a schermo (D-283 D-12)`); }
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
      // D-09: si finisce l'unità con meno pezzi (la si mette tutta su un settore)
      const r = await p.evaluate(() => [...document.querySelectorAll('.vassoio [data-risorsa]:not(:disabled)')].map((x) => [x.dataset.risorsa, Number(x.querySelector('strong')?.textContent)]).sort((a, c) => a[1] - c[1])[0]?.[0]);
      for (let k = 0; k < 12 && r && !(await p.locator(`.vassoio [data-risorsa="${r}"]`).isDisabled()); k++) {
        await p.click(`.vassoio [data-risorsa="${r}"]`); await p.locator('.mappa:not(.citta) [data-settore] .settore-punto').first().click({ force: true }); await p.waitForTimeout(80); }
      await quieta(p);
      for (const [nome, x] of Object.entries(mis.premuto)) {
        if (!x) { if (nome !== 'i') male.push(`${dove}: manca ${nome} da premere (D-283 D-13)`); continue; } // la «i» c'è solo nelle ondate con la riga «i»
        if (!x.cambia) male.push(`${dove}: ${nome} premuto senza nessun segno (D-283 D-13)`);
      }
      const finita = await contrasto(p, `.vassoio [data-risorsa="${r}"]:disabled :is(.unita-nome, strong)`); mis.finita = finita;
      if (!finita.length) male.push(`${dove}: nessuna unità finita da misurare (D-283 D-09)`);
      for (const x of finita.filter((y) => !(y.rapporto >= SOGLIA))) male.push(`${dove}: unità finita «${x.testo}» a ${x.rapporto}:1, serve ${SOGLIA} (D-283 D-09)`);
      if (finita.length && !(await p.locator(`.vassoio [data-risorsa="${r}"] [data-tutte]`).count())) male.push(`${dove}: l'unità finita non dice «✓ tutte» (D-283 D-09)`);
      // il contenuto di ogni unità (tranne il lucchetto delle fisse, fuori apposta) sta dentro il bordo; altezza del vassoio
      const v = await p.evaluate(() => ({ alto: Math.round(document.querySelector('.vassoio').getBoundingClientRect().height),
        fuori: [...document.querySelectorAll('.vassoio .unita')].flatMap((u) => { const b = u.getBoundingClientRect(), bordo = parseFloat(getComputedStyle(u).borderTopWidth);
          return [...u.querySelectorAll(':scope > :not(.unita-fissa)')].filter((c) => { const r = c.getBoundingClientRect(); return r.top < b.top + bordo - 0.5 || r.bottom > b.bottom - bordo + 0.5 || r.left < b.left + bordo - 0.5 || r.right > b.right - bordo + 0.5; })
            .map((c) => `${u.dataset.risorsa}: «${c.textContent.trim()}»`); }),
        sottoLucchetto: [...document.querySelectorAll('.vassoio .unita')].filter((u) => { const l = u.querySelector('.unita-fissa')?.getBoundingClientRect(), c = u.querySelector('[data-tutte]')?.getBoundingClientRect();
          return l && c && Math.min(l.right, c.right) - Math.max(l.left, c.left) > 0.5 && Math.min(l.bottom, c.bottom) - Math.max(l.top, c.top) > 0.5; }).map((u) => u.dataset.risorsa) }));
      mis.vassoio = v.alto;
      for (const x of v.fuori) male.push(`${dove}: nel vassoio esce dall'unità ${x} (D-283 D-09)`);
      for (const x of v.sottoLucchetto) male.push(`${dove}: «✓ tutte» di ${x} sotto il lucchetto (D-283 D-09)`);
      await foto(p, 'schieramento-vassoio', await p.locator('.vassoio').boundingBox());
      await foto(p, 'schieramento');
    }
    await p.close(); }
  // --- verbale (D-10): ultimo passo a 640 e 667 (dove la nota finiva sotto la barra) e alla larghezza a 760
  { const sal = JSON.stringify(verbaleSuperato());
    for (const h of [640, 667, 760]) { const p = await nuova(browser, larghezza, h, rossi), dove = `${larghezza}x${h} verbale e01`;
      await p.goto(url); await p.evaluate(([k, v]) => localStorage.setItem(k, v), [CHIAVE, sal]); await p.reload();
      await p.getByRole('button', { name: 'Riprendi' }).click(); await p.waitForSelector('.scena[data-scena="rapporto"]', { timeout: 30000 }).catch(() => {});
      await p.click('[data-azione="avanti"]', { timeout: 30000 }).catch(() => {});
      if (!(await p.waitForSelector('.scena[data-scena="verbale"]', { timeout: 30000 }).then(() => true, () => false))) { male.push(`${dove}: il verbale non si apre (D-283)`); await p.close(); continue; }
      await quieta(p); await foto(p, `verbale-${h}-primo`);
      await avanzaFino(p, '[data-azione="prossimo"]', () => p.waitForTimeout(150)); await quieta(p);
      const v = await p.evaluate(() => { const n = document.querySelector('[data-spiega="mappa"]'), r = n?.getBoundingClientRect(), f = document.querySelector('.fiducia')?.getBoundingClientRect(), t = document.querySelector('.testata')?.getBoundingClientRect();
        const vista = !!r && r.top >= 0 && r.bottom <= innerHeight && document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('[data-spiega]') === n;
        // e non sta sopra un'altra scheda o la sua ombra (piatta, in basso a destra)
        const ombra = (e) => { const m = getComputedStyle(e).boxShadow.match(/(-?[\d.]+)px (-?[\d.]+)px/); return m ? Math.max(0, Number(m[2])) : 0; };
        const sopra = !r ? [] : [...document.querySelectorAll('.passo:not([hidden]) .scheda, .passo:not([hidden]) .pulsante, .passi-nav .pulsante')].filter((e) => { const q = e.getBoundingClientRect(), b = q.bottom + ombra(e);
          return Math.min(r.right, q.right) - Math.max(r.left, q.left) > 0.5 && Math.min(r.bottom, b) - Math.max(r.top, q.top) > 0.5; }).length;
        // e la nota sopra non spinge «Prossimo episodio» fuori dalla finestra: a scorrimento zero se ne tocca almeno --tocco-min
        const pr = document.querySelector('[data-azione="prossimo"]')?.getBoundingClientRect(), tocco = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tocco-min'));
        const prossimo = pr ? Math.round(Math.max(0, Math.min(innerHeight, pr.bottom) - Math.max(0, pr.top))) : 0;
        return { nota: !!n, vista, sopra, prossimo, tocco, notaSu: r ? Math.round(r.top) : null, notaGiu: r ? Math.round(r.bottom) : null, finestra: innerHeight, pagina: document.documentElement.scrollHeight, fiduciaSotto: f && t ? f.top >= t.bottom - 0.5 : null };
      });
      mis[`verbale${h}`] = v;
      if (!v.nota) male.push(`${dove}: manca la nota «Mappa: rigioca…» (D-283 D-10)`);
      else if (!v.vista) male.push(`${dove}: a scorrimento zero la nota «Mappa: rigioca…» non si vede (${v.notaSu}-${v.notaGiu} su ${v.finestra}, D-283 D-10)`);
      if (v.sopra) male.push(`${dove}: la nota «Mappa: rigioca…» sta sopra ${v.sopra} schede o pulsanti, ombra compresa (D-283 D-10)`);
      if (v.prossimo < Math.min(v.tocco, 44)) male.push(`${dove}: «Prossimo episodio» si vede per ${v.prossimo} px a scorrimento zero (serve ≥ ${v.tocco}, D-283 D-10)`);
      if (v.fiduciaSotto === false) male.push(`${dove}: la fiducia sta sopra la testata, altrove sotto (D-283 D-10)`);
      await foto(p, `verbale-${h}`); await p.close(); } }
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
    const s1 = [];
    const fondo = await p.evaluate(() => { const v = document.querySelector('.scena [data-versione]'); if (!v) return null; const ultimo = [...document.querySelectorAll('.scena *')].filter((e) => e.getClientRects().length).reduce((m, e) => Math.max(m, e.getBoundingClientRect().bottom), 0);
      return { testo: v.textContent, inFondo: v.getBoundingClientRect().bottom >= ultimo - 0.5 }; });
    mis[`crediti${h}`] = { sopra: [...s0, ...s1], fondo };
    if (s0.length || s1.length) male.push(`${dove}: la versione nell'angolo sta sul bordo di ${s0.length + s1.length} schede o pulsanti (a ${[...s0, ...s1].join(', ')} px, serve ≥ --spazio-1, D-283 D-15)`);
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
  C283V01: { segno: 'la nota «Mappa: rigioca…» non si vede', almeno: 1 }, // 360×640, titolo su due righe
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
