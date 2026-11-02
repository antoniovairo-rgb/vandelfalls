// D-187 (PO-052, PO-058): guardiano dello scorrimento verticale, dalla sonda di S-12 (coordination/sonde/s12-altezze.mjs,
// che sostituisce rev-schermate.mjs, ferma alla scelta del genere). Gioca e01 intera col piano del bot attento e misura
// a ogni scena quanto la pagina eccede lo schermo; poi confronta il massimo per schermata con SOGLIE (misurate dopo D-187).
// Crediti: possono scorrere. Chiamata: D-114 accetta lo scorrimento, la soglia è il massimo misurato (non deve crescere).
// Nel primo cambio di scena dopo una risposta si controlla anche che la versione non stia sopra le lettere delle opzioni
// (rosso C187V01).
// Rosso VALMORA_ROSSI=C187M01: la mappa non si abbassa e il guardiano diventa rosso.
// Da solo: VP=360x640,360x760 [FOTO=cartella] node tools/sonda-altezze.mjs [build]
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { existsSync, writeFileSync } from 'node:fs';
import { servi, SEME_FOTO } from './foto.mjs';
import { migra } from '../src/salvataggi/salvataggio.ts';
import { chiamateDellaPartita, semeDa } from '../src/logica/partita.ts';
// D-241: la partita e01 col seme delle foto (VALMORA_SEME_PARTITA per provarne un altro); lo schieramento si calcola sulla stessa partita
const SEME = Number(process.env.VALMORA_SEME_PARTITA ?? SEME_FOTO);
import { leggiDati } from './dati-disco.mjs';
import * as M from '../src/logica/missione.ts';
import { attenta, STRATEGIE } from '../src/logica/bot.ts';
import { creaCaso } from '../src/logica/caso.ts';
import { variabiliIniziali } from '../src/logica/condizioni.ts';
import { GAME_VERSION } from '../src/versione.ts';
import { controllaCitta } from './foto-c17.mjs';

// Massimo scorrimento per schermata (px), misurato il 19/10 dopo D-191 e D-193 con questo pilota; le schermate non
// elencate: 0 (crediti liberi). Restano la chiamata, che D-114 lascia scorrere (soglia: il massimo di prima), e la risposta a
// 360×640 e 375×667, che D-197 lascia con la mappa piena (misurata il 20/10: 116 e 104 px).
// Mai alzarle per far passare una modifica.
export const SOGLIE = {
  '360x640': { risposta: 68, chiamata: 664 }, // risposta: D-197, mappa piena come nella chiamata (scelta del PO); 116 → 68 con C44-08
  '360x760': { chiamata: 544 },
  '375x667': { risposta: 56, chiamata: 618 }, // risposta 104 → 56 con C44-08
  '412x830': { chiamata: 435 },
  // C44-08 (D-201): a 760 di altezza anche a 375 e 412 la risposta non scorre (prima 11 e 24 px); chiamata: D-114, il massimo misurato
  '375x760': { chiamata: 512 },
  '412x760': { chiamata: 473 },
};
const LIBERE = new Set(['crediti']);
// D-221: il riepilogo non scorre a nessuna altezza (prima, a 360×640: 26 px in e01, 115 px in e36 con 5 settori). Rosso C221R01.
const libera = (r) => LIBERE.has(r.nome);
// Nomi dei settori sopra i segni dell'ultima risposta: misurati e stampati, non bloccano. Con la stessa build il massimo
// cambia fra due giri (183 e 350 px² a 360×760; 506 col rosso C187S01): una soglia sarebbe instabile.
export const VP_PER_LARGHEZZA = { 360: ['360x640', '360x760'], 375: ['375x667', '375x760'], 412: ['412x830', '412x760'] };

const tutti = (dati, dich) => { const v0 = variabiliIniziali(dich.values()), ms = Object.entries(dati).filter(([k]) => k.startsWith('missioni/')).map(([, x]) => x);
  return JSON.stringify({ save_version: 2, game_version: GAME_VERSION, seme: 1, caso: 1, variabili: v0, missioni_concluse: ms.map((m) => m.id), genere: 'm', rapporto_aperto: null, in_corso: null,
    episodi: Object.fromEntries(ms.map((m) => [m.id, { migliore: { esito: m.esiti[0].id, fallita: false, stelle: 1 }, tentativi: 1, variabili_prima: v0, variabili_dopo: v0 }])) }); };
// C45-06 (D-203): rapporti costruiti col motore, aperti da salvataggio (rapporto_aperto). Sono i 7 che a 360×760 scorrevano
// (34, 32, 21, 11, 10, 7, 2 px) fra 742 rapporti di tutti gli episodi giocati da attenta, equilibrata, peggiore e casuale
// (semi 1-4), con le variabili lasciate dalla partita attenta. Rosso C203R01.
export const RAPPORTI_COSTRUITI = [['e35', 'casuale', 4, 3], ['e30', 'casuale', 1, 3], ['e35', 'casuale', 1, 3], ['e22', 'casuale', 3, 2], ['e36', 'peggiore', 1, 3], ['e36', 'casuale', 1, 3], ['e16', 'casuale', 1, 3]];
export function rapportiCostruiti(dati, dich) {
  const ms = Object.entries(dati).filter(([k]) => k.startsWith('missioni/')).map(([, x]) => x).sort((a, b) => a.episodio - b.episodio), out = [];
  let v = variabiliIniziali(dich.values());
  const gioca = (m, g, dopo) => { let s = M.iniziaMissione(m, v, dich); while (!M.missioneFinita(m, s)) { s = M.schiera(m, s, g.schiera(m, s)); for (let c = M.chiamateAperte(m, s)[0]; c; c = M.chiamateAperte(m, s)[0]) s = M.rispondi(m, s, c.id, g.scegli(m, s, c), dich); s = M.chiudiOndata(m, s, dich); dopo?.(s); } return s; };
  for (const [i, m] of ms.entries()) {
    for (const [ep, chi, seme, n] of RAPPORTI_COSTRUITI) if (ep === m.id) gioca(m, STRATEGIE[chi](creaCaso(seme), dich), (s) => { if (s.rapporti.at(-1)?.n === n && !M.missioneFinita(m, s))
      out.push({ nome: `${ep}-${chi}${seme}-o${n}`, sal: JSON.stringify({ save_version: 2, game_version: GAME_VERSION, seme: 1, caso: 1, variabili: v, missioni_concluse: ms.slice(0, i).map((x) => x.id), episodi: {}, genere: 'm', in_corso: s, rapporto_aperto: n }) }); });
    v = M.concludiMissione(m, gioca(m, attenta(creaCaso(1), dich)), dich).variabili;
  }
  return out;
}
// D-234 (C50): verbali di episodi falliti, aperti da salvataggio all'ultimo rapporto (variabili della partita attenta). Sono i
// peggiori fra 167 verbali costruiti (attenta, peggiore, casuale 1-4) a 360×640: col pulsante «Riparti dall'ondata N» 27 px
// (e18, e21) e 3 px (e12, uno dei 63 da 3 px); senza pulsante 13 px (e18 peggiore). [episodio, giocatore, seme, pulsante]. Rosso C234V01.
export const VERBALI_COSTRUITI = [['e18', 'casuale', 1, true], ['e21', 'peggiore', 1, true], ['e12', 'casuale', 2, true], ['e18', 'peggiore', 1, false]];
export function verbaliCostruiti(dati, dich) {
  const ms = Object.entries(dati).filter(([k]) => k.startsWith('missioni/')).map(([, x]) => x).sort((a, b) => a.episodio - b.episodio), out = [];
  const gioca = (m, v, g) => { let s = M.iniziaMissione(m, v, dich); while (!M.missioneFinita(m, s)) { s = M.schiera(m, s, g.schiera(m, s)); for (let c = M.chiamateAperte(m, s)[0]; c; c = M.chiamateAperte(m, s)[0]) s = M.rispondi(m, s, c.id, g.scegli(m, s, c), dich); s = M.chiudiOndata(m, s, dich); } return s; };
  let v = variabiliIniziali(dich.values());
  for (const [i, m] of ms.entries()) {
    for (const [ep, chi, seme, riparti] of VERBALI_COSTRUITI) if (ep === m.id) { const s = gioca(m, v, STRATEGIE[chi](creaCaso(seme), dich));
      out.push({ nome: `${ep}-${chi}${seme}`, riparti, sal: JSON.stringify({ save_version: 2, game_version: GAME_VERSION, seme: 1, caso: 1, variabili: v, missioni_concluse: ms.slice(0, i).map((x) => x.id), episodi: {}, genere: 'm', in_corso: s, rapporto_aperto: s.rapporti.at(-1).n }) }); }
    v = M.concludiMissione(m, gioca(m, v, attenta(creaCaso(1), dich)), dich).variabili;
  }
  return out;
}
// D-206 (C45-05): tutte le chiamate di tutti gli episodi, aperte da salvataggio sulla partita attenta (594 al 20/10, 593 dopo D-209 che toglie e02 fumogeni_ospiti; 142
// imprevisti, misura del 20/10). A 360×760 ogni imprevisto sta nella soglia della chiamata (544, D-114, non alzata) e, D-207,
// sotto il massimo e la mediana misurati con D-207 (339 e 285 px; prima 545 e 466); le normali non oltre il massimo misurato.
// Rosso C206I01. Mai alzarle per far passare una modifica.
export const CHIAMATE_NORMALI_MAX = 664, IMPREVISTI_MAX = 339, IMPREVISTI_MEDIANA = 285;
const semeCon = (m, o, id) => { for (let i = 1; ; i++) { const s = semeDa(`altezze:${m.id}:${i}`); if (chiamateDellaPartita(m, o, s).some((x) => x.id === id)) return s; } };
/** C53-02: un salvataggio per ogni opzione valida di ogni carta d'imprevisto e di ogni variante, con la chiamata aperta. */
export function risposteCostruite(dati, dich) {
  const ms = new Map(Object.entries(dati).filter(([k]) => k.startsWith('missioni/')).map(([, x]) => [x.id, x]));
  return chiamateCostruite(dati, dich).filter((c) => c.imprevisto || c.variante).flatMap((c) => {
    const m = ms.get(c.ep), s = migra(JSON.parse(c.sal)).in_corso, ch = M.chiamateAperte(m, s).find((x) => x.id === c.id);
    return ch ? M.opzioniValide(ch, s, m).map((o) => ({ ...c, op: o.id })) : [];
  });
}
export function chiamateCostruite(dati, dich) {
  const ms = Object.entries(dati).filter(([k]) => k.startsWith('missioni/')).map(([, x]) => x).sort((a, b) => a.episodio - b.episodio), out = [];
  let v = variabiliIniziali(dich.values());
  for (const [i, m] of ms.entries()) {
    // D-241: la partita classica (seme 0, porta avanti le variabili) e una partita per ogni carta del mazzo e variante non ancora vista
    const viste = new Set(), mancano = (x) => !viste.has(x.id) && (x.carta || x.variante_di);
    const semi = [0, ...m.ondate.flatMap((o) => (o.chiamate ?? []).filter((x) => x.carta || x.variante_di).map((x) => semeCon(m, o, x.id)))];
    let fine = v;
    for (const seme of semi) { const g = attenta(creaCaso(1), dich); let s = M.iniziaMissione(m, v, dich, seme);
      if (seme && !m.ondate.some((o) => chiamateDellaPartita(m, o, seme).some(mancano))) continue;
      while (!M.missioneFinita(m, s)) { s = M.schiera(m, s, g.schiera(m, s)); for (let c = M.chiamateAperte(m, s)[0]; c; c = M.chiamateAperte(m, s)[0]) {
        if (!viste.has(c.id)) { viste.add(c.id); out.push({ ep: m.id, id: c.id, imprevisto: !!c.imprevisto, variante: !!c.variante_di, sal: JSON.stringify({ save_version: 2, game_version: GAME_VERSION, seme: 1, caso: 1, variabili: v, missioni_concluse: ms.slice(0, i).map((x) => x.id), episodi: {}, genere: 'm', in_corso: s, rapporto_aperto: null }) }); }
        s = M.rispondi(m, s, c.id, g.scegli(m, s, c), dich); } s = M.chiudiOndata(m, s, dich); }
      if (!seme) fine = M.concludiMissione(m, s, dich).variabili; }
    v = fine; }
  return out;
}
// C47-02 (D-218): riepilogo dello schieramento con 5 settori e l'avviso «ti restano», aperto da salvataggio all'ondata 1
// (partita attenta fino all'episodio prima). Disposizioni della collaudatrice C-047: a 360×760 scorrevano di 19 e 11 px. Rosso
// C218R01 (con D-221 solo insieme a C221R01: il riepilogo più stretto non scorre neanche coi margini di prima).
export const RIEPILOGHI = { e36: { squadre: { curva_cinderwick: 1, curva_larkspire: 1, piazzale: 1 }, steward: { cantiere_stadio_nuovo: 1, strada_larkspire: 1 }, mediatore: { cantiere_stadio_nuovo: 1 } },
  e22: { squadre: { curva_cinderwick: 1, curva_larkspire: 1, piazzale: 1 }, steward: { strada_cinderwick: 1, piazza_municipio: 2 }, mediatore: { piazza_municipio: 1 } } };
export function riepiloghiCostruiti(dati, dich) {
  const ms = Object.entries(dati).filter(([k]) => k.startsWith('missioni/')).map(([, x]) => x).sort((a, b) => a.episodio - b.episodio), out = [];
  let v = variabiliIniziali(dich.values());
  for (const [i, m] of ms.entries()) { const g = attenta(creaCaso(1), dich); let s = M.iniziaMissione(m, v, dich);
    if (RIEPILOGHI[m.id]) { M.schiera(m, s, RIEPILOGHI[m.id]); out.push({ ep: m.id, d: RIEPILOGHI[m.id], sal: JSON.stringify({ save_version: 2, game_version: GAME_VERSION, seme: 1, caso: 1, variabili: v, missioni_concluse: ms.slice(0, i).map((x) => x.id), episodi: {}, genere: 'm', in_corso: s, rapporto_aperto: null }) }); }
    while (!M.missioneFinita(m, s)) { s = M.schiera(m, s, g.schiera(m, s)); for (let c = M.chiamateAperte(m, s)[0]; c; c = M.chiamateAperte(m, s)[0]) s = M.rispondi(m, s, c.id, g.scegli(m, s, c), dich); s = M.chiudiOndata(m, s, dich); }
    v = M.concludiMissione(m, s, dich).variabili; }
  return out;
}
const mediana = (xs) => { const a = [...xs].sort((p, q) => p - q); return a.length ? a[a.length >> 1] : 0; };
const piano = (m, v, dich) => { const g = attenta(creaCaso(1), dich); let s = M.iniziaMissione(m, v, dich, SEME); const ond = [];
  while (!M.missioneFinita(m, s)) { const d = g.schiera(m, s); s = M.schiera(m, s, d); for (let c = M.chiamateAperte(m, s)[0]; c; c = M.chiamateAperte(m, s)[0]) s = M.rispondi(m, s, c.id, g.scegli(m, s, c), dich); ond.push({ d }); s = M.chiudiOndata(m, s, dich); }
  return ond; };
async function schiera(p, d) { for (const [r, ps] of Object.entries(d)) for (const [s, q] of Object.entries(ps)) for (let x = 0; x < q; x++) { if ((await p.getAttribute(`[data-risorsa="${r}"]`, 'aria-pressed')) !== 'true') await p.click(`[data-risorsa="${r}"]`); await p.click(`[data-settore="${s}"] .settore-punto`); } }
const lento = (p) => p.waitForFunction(() => { const s = document.querySelectorAll('.scena'); return s.length === 1 && getComputedStyle(s[0]).opacity === '1'; }, null, { timeout: 8000 }).catch(() => {});
const misura = (p) => p.evaluate(() => { const s = document.scrollingElement, sc = document.querySelector('.scena');
  return { pagina: s.scrollHeight, ecc: s.scrollHeight - innerHeight, scena: sc?.dataset.scena ?? '?', mappa: Math.round(document.querySelector('.mappa')?.getBoundingClientRect().height ?? 0), testo: sc?.innerText.length ?? 0, titolo: (sc?.querySelector('h1,h2,h3,p')?.textContent ?? '').trim().slice(0, 40),
    // S-21: il pulsante «Home» della mappa abbassata non copre punti o nomi dei settori
    casa: (() => { const h = document.querySelector('.mappa > .tasto-home')?.getBoundingClientRect(); if (!h) return 0;
      return [...document.querySelectorAll('.mappa .settore-punto, .mappa .settore-nome')].filter((e) => { const r = e.getBoundingClientRect(); return Math.max(0, Math.min(h.right, r.right) - Math.max(h.left, r.left)) * Math.max(0, Math.min(h.bottom, r.bottom) - Math.max(h.top, r.top)) > 4; }).length; })(),
    // D-187 (S-12): nomi dei settori sopra i segni dell'ultima risposta (px², il caso peggiore)
    segni: Math.round(Math.max(0, ...[...document.querySelectorAll('.mappa .settore-nome')].flatMap((n) => { const a = n.getBoundingClientRect();
      return [...document.querySelectorAll('.mappa .settore .segno-effetto')].map((g) => { const b = g.getBoundingClientRect(); return Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)); }); }))) }; });
// durante il cambio di scena (D-187, rosso C187V01): la scena che esce, spostata a sinistra, passa sopra la versione e non
// sotto: al centro della versione, se una scena lo copre, in cima dev'esserci la scena (le sue lettere restano leggibili)
// Si installa nella pagina prima del tocco: campiona a ogni cambio del DOM e a ogni fotogramma finché le scene sono due, e
// segna fine quando il cambio di scena, visto, è finito (globalThis.__v187 = { max, fine }).
function campionaVersione() {
  const misura = () => { const ve = document.querySelector('[data-versione-angolo]'), v = ve?.getBoundingClientRect(); if (!v) return 0;
    const x = (v.left + v.right) / 2, y = (v.top + v.bottom) / 2;
    const coperta = [...document.querySelectorAll('.scena')].some((s) => { const r = s.getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; });
    if (!coperta || document.querySelectorAll('.scena').length < 2 && getComputedStyle(document.querySelector('.scena')).transform === 'none') return 0;
    ve.style.pointerEvents = 'auto'; // la versione non riceve tocchi: per elementFromPoint serve per un attimo
    const sopra = !!document.elementFromPoint(x, y)?.closest('[data-versione-angolo]'); ve.style.removeProperty('pointer-events'); return sopra ? 1 : 0; };
  // cambio di scena = due scene insieme, o la scena spostata (transform); finito quando, visto il movimento, tutto è fermo
  const st = globalThis.__v187 = { max: 0, fine: false, viste: false };
  const muove = () => { const sc = document.querySelectorAll('.scena'); return sc.length > 1 || [...sc].some((x) => getComputedStyle(x).transform !== 'none'); };
  const guarda = () => { if (st.fine) return; st.max = Math.max(st.max, misura());
    if (muove()) st.viste = true; else if (st.viste) { st.fine = true; mo.disconnect(); } };
  const passo = () => { guarda(); if (!st.fine) requestAnimationFrame(passo); };
  const mo = new MutationObserver(guarda);
  mo.observe(document.body, { childList: true, subtree: true });
  requestAnimationFrame(passo);
}

// D-207: parti = quali misure; i bracci rossi girano solo la parte che deve vederli rossi (prima 40 min di bracci)
export const PARTI = ['e01', 'citta36', 'chiamate', 'rapporti', 'riepilogo', 'verbali', 'po149', 'po152a', 'c52nomi', 'po152b', 'risposte'];
// C53-02 (D-252): la risposta di ogni opzione di ogni carta d'imprevisto e di ogni variante, a queste finestre (soglie di SOGLIE)
export const RISPOSTE_VP = ['360x640', '375x667', '412x760'];
export async function giraAltezze({ build = 'dist', dirDati = 'data', vps, rossi = [], cartella = '', parti = PARTI, limiteRisposte = Infinity }) {
  const dati = leggiDati(dirDati), dich = new Map(dati['stato.json'].variabili.map((d) => [d.id, d])), e01 = dati['missioni/e01.json'];
  const srv = await servi(build), url = `http://127.0.0.1:${srv.address().port}/`;
  const percorso = process.env.VALMORA_CHROME ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
  const b = await chromium.launch({ executablePath: percorso }); const ris = [], errori = [], sopra = [], chiamate = [], risposte = [];
  try {
    for (const vp of vps) {
      const [w, h] = vp.split('x').map(Number);
      if (parti.includes('e01')) { // la partita e01 intera
      const p = await b.newPage({ viewport: { width: w, height: h }, hasTouch: true, reducedMotion: 'reduce' });
      if (rossi.length) await p.addInitScript((xs) => { for (const x of xs) globalThis[`__NO_${x}`] = true; }, rossi);
      await p.addInitScript((x) => { globalThis.__VALMORA_SECONDO_MS = 1; globalThis.__VALMORA_SEME_PARTITA = x; }, SEME); // come foto.mjs (PO-121, D-241): niente attese reali, seme di partita fisso
      p.on('pageerror', (e) => errori.push(`${vp}: ${e.message}`));
      const c = async (sel) => { if (await p.locator(sel).count()) { await p.locator(sel).first().click(); await p.waitForTimeout(120); await lento(p); return true; } return false; };
      const rileva = async (nome) => { const x = await misura(p); ris.push({ vp, nome, ...x }); if (cartella) await p.screenshot({ path: join(cartella, `${vp}-${nome}-${ris.filter((r) => r.vp === vp && r.nome === nome).length}.png`), fullPage: true }); };
      await p.goto(url); await p.evaluate(() => localStorage.clear()); await p.reload(); await lento(p); await p.waitForTimeout(400);
      await rileva('titolo');
      await p.getByRole('button', { name: 'Nuova partita' }).click(); await p.waitForTimeout(300); await lento(p);
      let pl = null, io = 0, fermi = 0, passi = 0, provata = false; const visti = new Set();
      while (passi++ < 300) {
        await lento(p); const m = await misura(p), q = m.scena, chiave = `${q}|${m.titolo}|${m.pagina}|${m.testo}`;
        if (!visti.has(chiave)) { visti.add(chiave); await rileva(q); }
        if (q === 'verbale') break;
        if (await c('[data-azione="conferma-passo"]') || await c('[data-azione="conferma-nuova"]') || await c('[data-genere="m"]') || await c('[data-azione="guida-salta"]')) continue;
        if (q === 'schieramento') { pl ??= piano(e01, JSON.parse(await p.evaluate(() => localStorage.getItem('vandelfalls-salvataggio'))).variabili, dich); await schiera(p, pl[io++].d); await rileva('schierato'); await c('[data-azione="conferma"]'); await rileva('riepilogo'); /* D-219: S-21 e scorrimento anche qui */ await c('[data-azione="conferma-davvero"]'); continue; }
        if (await c('[data-azione="continua"]')) continue;
        const opz = p.locator('[data-opzione]:not(:disabled):not([aria-disabled="true"])');
        if (await opz.count()) {
          if (!provata) { // la prima risposta: opzioni in basso, dove sta la versione, e cambio di scena osservato
            provata = true; await p.evaluate(() => { const o = document.querySelector('.opzione'); if (o) scrollTo(0, o.getBoundingClientRect().top + scrollY - innerHeight + 70); }); await p.waitForTimeout(150);
            // Strumento instabile (S-23, 22/10: cieco 1 volta in 1256 giri con 3 catene in parallelo): il campione ogni 20 ms dal
            // processo di prova, sotto carico, poteva cadere fuori dal cambio di scena. Ora campiona la pagina stessa, a ogni
            // cambio del DOM e a ogni fotogramma, e la prova attende la condizione «cambio finito», non un tempo.
            await p.evaluate(campionaVersione);
            await opz.first().click(); await c('[data-conferma]'); // PO-148: la risposta vale con «Conferma»; poi il cambio di scena
            await p.waitForFunction(() => globalThis.__v187?.fine, null, { timeout: 15000 }).catch(() => errori.push(`${vp}: il cambio di scena dopo la prima risposta non si è visto (D-187)`));
            if (await p.evaluate(() => globalThis.__v187?.max ?? 0)) sopra.push(`${vp}: nel cambio di scena la versione sta sopra la scena che esce e ne copre le lettere (D-187)`);
            await lento(p);
          } else { await c('[data-opzione]:not(:disabled):not([aria-disabled="true"])'); await c('[data-conferma]'); } // PO-148
          await p.locator('[data-azione="continua"]').first().waitFor({ timeout: 4000 }).catch(() => {}); continue;
        }
        let fatto = false; for (const a of ['passo', 'prossimo', 'avanti', 'inizia', 'rapporto', 'avvia-episodio']) if (await c(`[data-azione="${a}"]`)) { fatto = true; break; }
        if (!fatto) { await p.waitForTimeout(400); if (++fermi > 20) { errori.push(`${vp}: bloccato su ${q}`); break; } } else fermi = 0;
      }
      await p.close();
      }
      // C44-09 (D-201): città con tutti i 36 episodi conclusi («Rileggi l'epilogo» in più). Rosso C201C01. D-230 (C49-01, C49-02): a
      // ogni altezza e su ogni stagione (in stagione 3 l'episodio 36 è già scelto: la sua scheda), e prima il titolo con questo
      // salvataggio (prima misurato solo senza). Rosso C230C01.
      if (parti.includes('citta36')) {
        const q = await b.newPage({ viewport: { width: w, height: h }, hasTouch: true, reducedMotion: 'reduce' });
        if (rossi.length) await q.addInitScript((xs) => { for (const x of xs) globalThis[`__NO_${x}`] = true; }, rossi);
        await q.goto(url); await q.evaluate((x) => localStorage.setItem('vandelfalls-salvataggio', x), tutti(dati, dich)); await q.reload();
        await q.waitForSelector('main[data-schermata="titolo"]'); await q.evaluate(() => document.fonts.ready); await lento(q); await q.waitForTimeout(300);
        ris.push({ vp, nome: 'titolo con salvataggio', ...(await misura(q)) }); if (cartella) await q.screenshot({ path: join(cartella, `${vp}-titolo-salvato.png`), fullPage: true });
        await q.getByRole('button', { name: 'Riprendi' }).click(); await q.waitForSelector('.scena[data-scena="citta"]'); await lento(q); await q.waitForTimeout(300);
        const striscia = await q.evaluate(() => Math.round(document.querySelector('[data-citta-striscia]')?.getBoundingClientRect().height ?? 0)); // D-210, rosso C210C01
        ris.push({ vp, nome: 'citta36', striscia, ...(await misura(q)) }); if (cartella) await q.screenshot({ path: join(cartella, `${vp}-citta36.png`), fullPage: true });
        for (const st of [2, 3]) { await q.click(`[data-stagione="${st}"]`); await lento(q); await q.waitForTimeout(150);
          ris.push({ vp, nome: `citta36 stagione ${st}`, ...(await misura(q)) }); if (cartella) await q.screenshot({ path: join(cartella, `${vp}-citta36-s${st}.png`), fullPage: true }); }
        if (h === 760) { // le stelle (D-218) e la guida si guardano a 760, come prima
          await controllaCitta(q, (cosa, ok) => { if (!ok) errori.push(cosa); }, `${vp} città, stagione 3 con 36 episodi`); // C47-03 (D-218), rosso C218S01
          // D-210: il primo passo della guida («La città e il gioco» dalla home) ha la vignetta della home e non scorre. Rosso C210G01
          await q.click('[data-azione="home"]'); await q.waitForSelector('[data-azione="guida"]'); await q.click('[data-azione="guida"]'); await q.waitForSelector('[data-guida="1"]'); await lento(q);
          ris.push({ vp, nome: 'guida1', testataGuida: await q.locator('[data-guida-testata]').count(), ...(await misura(q)) });
        }
        await q.close();
      }
      if (vp === '360x760' && parti.includes('chiamate')) { const coda = chiamateCostruite(dati, dich); // D-206: 4 pagine insieme
        await Promise.all(Array.from({ length: 4 }, async () => { const q = await b.newPage({ viewport: { width: w, height: h }, hasTouch: true, reducedMotion: 'reduce' });
          if (rossi.length) await q.addInitScript((xs) => { for (const x of xs) globalThis[`__NO_${x}`] = true; }, rossi);
          await q.goto(url);
          while (coda.length) { const c = coda.shift(); await q.evaluate((x) => localStorage.setItem('vandelfalls-salvataggio', x), c.sal); await q.reload();
            // D-241: una chiamata che non si apre non entra nella misura (prima si misurava la pagina sbagliata e la mediana si spostava)
            await q.getByRole('button', { name: 'Riprendi' }).click(); if (!(await q.waitForSelector(`[data-messaggio="chiamata-${c.id}"]`, { timeout: 8000 }).then(() => true).catch(() => false))) { errori.push(`${vp}: chiamata ${c.ep} ${c.id} non si apre`); continue; } await lento(q);
            chiamate.push({ vp, ep: c.ep, id: c.id, imprevisto: c.imprevisto, ecc: await q.evaluate(() => document.scrollingElement.scrollHeight - innerHeight) });
            if (cartella && c.imprevisto) await q.screenshot({ path: join(cartella, `${vp}-chiamata-${c.ep}-${c.id}.png`), fullPage: true }); }
          await q.close(); })); }
      if (RISPOSTE_VP.includes(vp) && parti.includes('risposte') && !process.env.RISPOSTE_VERE) { // C53-02, veloce: una risposta vera per
        // episodio e tipo (carta o variante), poi nella stessa scena (stessi CSS, caratteri e mappa) i testi di ogni opzione al
        // posto dei suoi, e si misura. Confrontata con la misura una per una (RISPOSTE_VERE=1) su 150 risposte: stesse altezze.
        const tutte = risposteCostruite(dati, dich).slice(0, limiteRisposte), T = Object.assign({}, ...Object.entries(dati).filter(([k]) => k.startsWith('testi/it/')).map(([, v]) => v));
        const tx = (k) => (k ? T[k.replace(/^testi:/, '')] ?? null : null);
        const ms = new Map(Object.entries(dati).filter(([k]) => k.startsWith('missioni/')).map(([, x]) => [x.id, x]));
        const opz = (c) => ms.get(c.ep).ondate.flatMap((o) => o.chiamate ?? []).find((x) => x.id === c.id).opzioni.find((o) => o.id === c.op);
        // un'opzione che cambia una variabile (fiducia…) ha nella sua scena un segno che sparisce dopo ~2 s e alza la pagina di
        // 2 px (misurato su e03 laser_v/annuncio: 28 → 26): quella si misura da sola, nella sua scena vera; le altre in gruppo
        const variabili = (c) => opz(c).effetti.some((e) => 'aggiungi' in e || 'imposta' in e);
        const tipo = (c) => (variabili(c) ? `${c.ep}|${c.id}|${c.op}` : c.ep);
        const coda = [...new Set(tutte.map(tipo))].map((k) => tutte.filter((c) => tipo(c) === k));
        await Promise.all(Array.from({ length: 4 }, async () => { const q = await b.newPage({ viewport: { width: w, height: h }, hasTouch: true, reducedMotion: 'reduce' });
          if (rossi.length) await q.addInitScript((xs) => { for (const x of xs) globalThis[`__NO_${x}`] = true; }, rossi);
          await q.addInitScript(() => { globalThis.__VALMORA_SECONDO_MS = 1; }); await q.goto(url);
          while (coda.length) { const gruppo = coda.shift(), c = gruppo.find((x) => opz(x).risposta) ?? gruppo[0];
            await q.evaluate((x) => localStorage.setItem('vandelfalls-salvataggio', x), c.sal); await q.reload(); await q.getByRole('button', { name: 'Riprendi' }).click();
            const ok = await q.waitForSelector(`[data-opzione="${c.op}"]`, { timeout: 8000 }).then(() => true, () => false); await lento(q);
            if (ok) { await q.click(`[data-opzione="${c.op}"]`); await q.click('[data-conferma]'); }
            const visto = ok && await q.waitForSelector('.scena[data-scena="risposta"]', { timeout: 8000 }).then(() => true, () => false); await lento(q);
            if (!visto) { errori.push(`${vp}: risposta ${c.ep} ${c.id}/${c.op} non si apre`); continue; }
            for (const x of gruppo) { const o = opz(x);
              const ecc = await q.evaluate(([etichetta, intanto]) => { const sc = document.querySelector('.scena [data-scelta]'), it = document.querySelector('.scena .intanto');
                if (sc) sc.textContent = etichetta; if (it) { it.lastChild.textContent = intanto ?? ''; it.hidden = !intanto; }
                return document.scrollingElement.scrollHeight - innerHeight; }, [tx(o.testo), tx(o.risposta)]);
              risposte.push({ vp, ep: x.ep, id: x.id, op: x.op, ecc }); }
            if (process.env.AVANZAMENTO) console.log(`${vp} risposte: ${risposte.length}`); }
          await q.close(); })); }
      if (RISPOSTE_VP.includes(vp) && parti.includes('risposte') && process.env.RISPOSTE_VERE) { const coda = risposteCostruite(dati, dich).slice(0, limiteRisposte); // C53-02, una per una (lenta)
        await Promise.all(Array.from({ length: 4 }, async () => { const q = await b.newPage({ viewport: { width: w, height: h }, hasTouch: true, reducedMotion: 'reduce' });
          if (rossi.length) await q.addInitScript((xs) => { for (const x of xs) globalThis[`__NO_${x}`] = true; }, rossi);
          await q.addInitScript(() => { globalThis.__VALMORA_SECONDO_MS = 1; }); await q.goto(url);
          while (coda.length) { const c = coda.shift(); await q.evaluate((x) => localStorage.setItem('vandelfalls-salvataggio', x), c.sal); await q.reload();
            await q.getByRole('button', { name: 'Riprendi' }).click();
            const ok = await q.waitForSelector(`[data-opzione="${c.op}"]`, { timeout: 8000 }).then(() => true, () => false); await lento(q);
            if (ok) { await q.click(`[data-opzione="${c.op}"]`); await q.click('[data-conferma]'); }
            const visto = ok && await q.waitForSelector('.scena[data-scena="risposta"]', { timeout: 8000 }).then(() => true, () => false); await lento(q);
            if (!visto) { errori.push(`${vp}: risposta ${c.ep} ${c.id}/${c.op} non si apre`); continue; }
            risposte.push({ vp, ep: c.ep, id: c.id, op: c.op, ecc: await q.evaluate(() => document.scrollingElement.scrollHeight - innerHeight) });
            if (process.env.AVANZAMENTO && risposte.length % 50 === 0) console.log(`${vp} risposte: ${risposte.length}, ne restano ${coda.length}`); }
          await q.close(); })); }
      if (h === 760 && parti.includes('po149')) { const { controllaPo149 } = await import('./foto-po149.mjs'); // PO-149 (D-237): 640/667/760/915 a questa larghezza
        const g = await controllaPo149(b, url, w, rossi, cartella); errori.push(...g.male); }
      if (h === 760 && parti.includes('po152a')) { const { controllaPo152a } = await import('./foto-po152-a.mjs'); // PO-152 A (D-241): 640 e 760
        const g = await controllaPo152a(b, url, w, rossi, cartella, dati, dich); errori.push(...g.male); }
      if (h === 760 && parti.includes('po152b')) { const { controllaPo152b } = await import('./foto-po152-b.mjs'); // D-241 idea B: 640/667/760
        const g = await controllaPo152b(b, url, w, rossi, cartella, dati, dich); errori.push(...g.male); }
      if (h === 760 && w >= 412 && parti.includes('c52nomi')) { const { controllaNomiCitta } = await import('./foto-c52-nomi.mjs'); // C52-03: dove il nome si vede (D-123)
        const g = await controllaNomiCitta(b, url, w, rossi, cartella); errori.push(...g.male); }
      if (parti.includes('verbali')) for (const c of verbaliCostruiti(dati, dich)) { // D-234: a ogni altezza
        const q = await b.newPage({ viewport: { width: w, height: h }, hasTouch: true, reducedMotion: 'reduce' });
        if (rossi.length) await q.addInitScript((xs) => { for (const x of xs) globalThis[`__NO_${x}`] = true; }, rossi);
        await q.goto(url); await q.evaluate((x) => localStorage.setItem('vandelfalls-salvataggio', x), c.sal); await q.reload();
        await q.getByRole('button', { name: 'Riprendi' }).click(); await q.waitForSelector('.scena[data-scena="rapporto"]', { timeout: 8000 }).catch(() => {});
        await q.click('[data-azione="avanti"]').catch(() => {});
        if (!(await q.waitForSelector('.scena[data-scena="verbale"]', { timeout: 8000 }).then(() => true).catch(() => false))) { errori.push(`${vp}: verbale ${c.nome} non si apre (D-234)`); await q.close(); continue; }
        await lento(q); await q.waitForTimeout(250);
        const fallita = await q.locator('[data-fallita]').count(), riparti = await q.locator('[data-azione="riparti"]').count();
        if (!fallita || !!riparti !== c.riparti) errori.push(`${vp}: verbale ${c.nome} ${fallita ? '' : 'non fallito, '}${riparti ? 'con' : 'senza'} «Riparti», atteso ${c.riparti ? 'con' : 'senza'} (D-234)`);
        ris.push({ vp, nome: `verbale fallito ${c.nome}`, ...(await misura(q)) }); if (cartella) await q.screenshot({ path: join(cartella, `${vp}-verbale-${c.nome}.png`), fullPage: true });
        await q.close();
      }
      if (parti.includes('riepilogo')) for (const c of riepiloghiCostruiti(dati, dich)) { // C47-02 (D-218); D-221: a ogni altezza
        const q = await b.newPage({ viewport: { width: w, height: h }, hasTouch: true, reducedMotion: 'reduce' });
        if (rossi.length) await q.addInitScript((xs) => { for (const x of xs) globalThis[`__NO_${x}`] = true; }, rossi);
        await q.goto(url); await q.evaluate((x) => localStorage.setItem('vandelfalls-salvataggio', x), c.sal); await q.reload();
        await q.getByRole('button', { name: 'Riprendi' }).click(); await q.waitForSelector('.scena[data-scena="schieramento"]'); await lento(q);
        await schiera(q, c.d); await q.click('[data-azione="conferma"]'); await q.waitForSelector('[data-riepilogo]'); await lento(q); await q.waitForTimeout(200);
        const righe = await q.locator('[data-riepilogo-settore]').count(), avviso = await q.locator('[data-restano]').count();
        if (righe !== 5 || !avviso) errori.push(`${vp} riepilogo ${c.ep}: ${righe} settori e ${avviso ? '' : 'senza '}avviso, attesi 5 con l'avviso (D-218)`);
        // S-21 anche qui, bloccante (D-219: «Home» copriva il nome di curva_cinderwick in e36 a 360 e 375, 56 px²; rosso C219H01)
        ris.push({ vp, nome: `riepilogo ${c.ep}`, ...(await misura(q)) }); if (cartella) await q.screenshot({ path: join(cartella, `${vp}-riepilogo-${c.ep}.png`), fullPage: true });
        await q.close();
      }
      if (vp === '360x760' && parti.includes('rapporti')) for (const c of rapportiCostruiti(dati, dich)) { // C45-06 (D-203)
        const q = await b.newPage({ viewport: { width: w, height: h }, hasTouch: true, reducedMotion: 'reduce' });
        if (rossi.length) await q.addInitScript((xs) => { for (const x of xs) globalThis[`__NO_${x}`] = true; }, rossi);
        await q.goto(url); await q.evaluate((x) => localStorage.setItem('vandelfalls-salvataggio', x), c.sal); await q.reload();
        await q.getByRole('button', { name: 'Riprendi' }).click(); await q.waitForSelector('.scena[data-scena="rapporto"]', { timeout: 8000 }).catch(() => errori.push(`${vp}: ${c.nome} non si apre sul rapporto`)); await lento(q); await q.waitForTimeout(300);
        ris.push({ vp, nome: `rapporto ${c.nome}`, ...(await misura(q)) }); if (cartella) await q.screenshot({ path: join(cartella, `${vp}-rapporto-${c.nome}.png`), fullPage: true });
        await q.close();
      }
    }
  } finally { await b.close(); srv.close(); }
  return { ris, errori, sopra, chiamate, risposte };
}

/** Problemi: scorrimento oltre la soglia per schermata, errori di pagina, blocchi, versione sopra le lettere. */
export function controllaAltezze({ ris, errori, sopra, chiamate = [], risposte = [] }) {
  const max = {};
  for (const r of ris) if (!libera(r)) { const k = `${r.vp}|${r.nome}`; if (!max[k] || r.ecc > max[k].ecc) max[k] = r; }
  const male = Object.values(max).filter((r) => r.ecc > (SOGLIE[r.vp]?.[r.nome] ?? 0))
    .map((r) => `${r.vp} ${r.nome}: la pagina scorre di ${r.ecc} px (soglia ${SOGLIE[r.vp]?.[r.nome] ?? 0}, mappa ${r.mappa} px; D-187)`);
  // la striscia c'è da --vignetta-finestra-min (700 px) in su: sotto, la testata (D-210), per il lettore di schermo (D-230)
  const d210 = ris.flatMap((r) => r.nome === 'citta36' && Number(r.vp.split('x')[1]) >= 700 && r.striscia < 96 ? [`${r.vp} città: manca la striscia della home in testa (${r.striscia} px, D-210)`] : r.nome === 'guida1' && !r.testataGuida ? [`${r.vp} guida: il primo passo non ha la vignetta della home (D-210)`] : []);
  const casa = ris.filter((r) => r.casa).map((r) => `${r.vp} ${r.nome}: il pulsante «Home» copre ${r.casa} fra punti e nomi dei settori (S-21, mappa ${r.mappa} px)`);
  // D-197 (opzione A): nella risposta la mappa è alta come nella chiamata prima (niente ridisegno fra le due). Rosso C197R01.
  const salti = [];
  for (const [k, r] of ris.entries()) if (r.nome === 'risposta') { const c = ris.slice(0, k).reverse().find((x) => x.vp === r.vp && x.nome === 'chiamata'); if (c && Math.abs(c.mappa - r.mappa) > 1) salti.push(`${r.vp} risposta: mappa ${r.mappa} px dopo ${c.mappa} px nella chiamata (D-197)`); }
  // D-206: chiamate costruite di tutti gli episodi
  const imp = chiamate.filter((c) => c.imprevisto), norm = chiamate.filter((c) => !c.imprevisto), lim = SOGLIE['360x760'].chiamata;
  const lunghe = [...imp.filter((c) => c.ecc > Math.min(lim, IMPREVISTI_MAX)).map((c) => `${c.vp} imprevisto ${c.ep} ${c.id}: la chiamata scorre di ${c.ecc} px (soglia ${Math.min(lim, IMPREVISTI_MAX)}, D-207)`),
    ...norm.filter((c) => c.ecc > CHIAMATE_NORMALI_MAX).map((c) => `${c.vp} chiamata ${c.ep} ${c.id}: scorre di ${c.ecc} px (massimo misurato ${CHIAMATE_NORMALI_MAX}, D-114)`)];
  if (imp.length && mediana(imp.map((c) => c.ecc)) > IMPREVISTI_MEDIANA) lunghe.push(`360x760: mediana degli imprevisti ${mediana(imp.map((c) => c.ecc))} px (soglia ${IMPREVISTI_MEDIANA}, D-207)`);
  // C53-02: le risposte delle carte d'imprevisto e delle varianti, con le soglie della risposta di e01 (0 dove non c'è soglia)
  const rl = risposte.filter((r) => r.ecc > (SOGLIE[r.vp]?.risposta ?? 0));
  const rlunghe = rl.slice(0, 8).map((r) => `${r.vp} risposta ${r.ep} ${r.id}/${r.op}: scorre di ${r.ecc} px (soglia ${SOGLIE[r.vp]?.risposta ?? 0}, C53-02)`);
  if (rl.length > 8) rlunghe.push(`… e altre ${rl.length - 8} risposte oltre soglia (C53-02)`);
  return [...male, ...d210, ...casa, ...salti.slice(0, 3), ...lunghe.slice(0, 5), ...rlunghe, ...errori, ...sopra];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const vps = (process.env.VP ?? '360x640,360x760,375x667,412x830').split(','), rossi = (process.env.VALMORA_ROSSI ?? '').split(',').filter(Boolean);
  const g = await giraAltezze({ build: process.argv[2] ?? 'dist', vps, rossi, cartella: process.env.FOTO ?? '' });
  const max = {}; for (const r of g.ris) { const k = `${r.vp} ${r.nome}`; max[k] = Math.max(max[k] ?? -1, r.ecc); }
  for (const [k, v] of Object.entries(max)) console.log(`${k}: ${v}`);
  console.log(`nomi sopra i segni, massimo: ${Math.max(0, ...g.ris.map((r) => r.segni))} px²`);
  for (const [k, xs] of [['imprevisti', g.chiamate.filter((c) => c.imprevisto)], ['normali', g.chiamate.filter((c) => !c.imprevisto)]]) if (xs.length) console.log(`chiamate ${k}: ${xs.length}, massimo ${Math.max(...xs.map((c) => c.ecc))} px, mediana ${mediana(xs.map((c) => c.ecc))} px`);
  for (const vp of RISPOSTE_VP) { const xs = g.risposte.filter((r) => r.vp === vp); if (xs.length) console.log(`risposte ${vp}: ${xs.length}, oltre soglia ${xs.filter((r) => r.ecc > (SOGLIE[vp]?.risposta ?? 0)).length}, massimo ${Math.max(...xs.map((r) => r.ecc))} px, mediana ${mediana(xs.map((r) => r.ecc))} px`); }
  if (process.env.RISPOSTE_JSON) writeFileSync(process.env.RISPOSTE_JSON, JSON.stringify(g.risposte));
  const male = controllaAltezze(g); console.log(male.length ? `ROSSO (${male.length}):\n${male.join('\n')}` : 'VERDE');
  process.exit(male.length ? 1 : 0);
}
