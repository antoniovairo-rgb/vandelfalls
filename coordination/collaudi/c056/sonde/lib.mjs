import { chromium } from '/home/user/vandelfalls/node_modules/playwright-core/index.mjs';
import { servi } from '/home/user/vandelfalls/tools/foto.mjs';
import { leggiDati } from '/home/user/vandelfalls/tools/dati-disco.mjs';
import * as M from '/home/user/vandelfalls/src/logica/missione.ts';
import * as MO from '/home/user/vandelfalls/src/logica/mossa.ts';
import { attenta, equilibrata, peggiore, STRATEGIE } from '/home/user/vandelfalls/src/logica/bot.ts';
import { creaCaso } from '/home/user/vandelfalls/src/logica/caso.ts';
import { variabiliIniziali } from '/home/user/vandelfalls/src/logica/condizioni.ts';
import { valutaEpisodio } from '/home/user/vandelfalls/src/logica/episodi.ts';
import { GAME_VERSION } from '/home/user/vandelfalls/src/versione.ts';
import { scegliTesto } from '/home/user/vandelfalls/src/dati/testi.ts';
export { M, MO, attenta, equilibrata, peggiore, STRATEGIE, creaCaso, valutaEpisodio, GAME_VERSION };
export const CHIAVE = 'vandelfalls-salvataggio';
export const dati = leggiDati('/home/user/vandelfalls/data');
export const dich = new Map(dati['stato.json'].variabili.map((d) => [d.id, d]));
export const ms = Object.entries(dati).filter(([k]) => k.startsWith('missioni/')).map(([, x]) => x).sort((a, b) => a.episodio - b.episodio);
export const testi = Object.assign({}, ...Object.entries(dati).filter(([k]) => k.startsWith('testi/it/')).map(([, v]) => v));
export const T = (k) => scegliTesto(testi, String(k).replace(/^testi:/, ''), 'm') ?? `[[${k}]]`;
export const miss = (id) => ms.find((m) => m.id === id);
/** variabili dopo aver giocato (engine) gli episodi prima di quello d'indice i, con l'attenta */
export function variabiliPrima(i) {
  let v = variabiliIniziali(dich.values());
  for (const m of ms.slice(0, i)) { const g = attenta(creaCaso(1), dich); let s = M.iniziaMissione(m, v, dich);
    while (!M.missioneFinita(m, s)) { s = M.schiera(m, s, g.schiera(m, s)); for (let c = M.chiamateAperte(m, s)[0]; c; c = M.chiamateAperte(m, s)[0]) s = M.rispondi(m, s, c.id, g.scegli(m, s, c), dich); s = M.chiudiOndata(m, s, dich); }
    v = M.concludiMissione(m, s, dich).variabili; }
  return v;
}
export function salvataggioPrima(i, seme = 1) {
  const v = variabiliPrima(i);
  return JSON.stringify({ save_version: 4, game_version: GAME_VERSION, seme, caso: seme, variabili: v, missioni_concluse: ms.slice(0, i).map((x) => x.id), episodi: Object.fromEntries(ms.slice(0, i).map((m) => [m.id, { migliore: { esito: m.esiti[0].id, fallita: false, stelle: 1 }, tentativi: 1, variabili_prima: v, variabili_dopo: v }])), genere: 'm', in_corso: null, rapporto_aperto: null });
}
export async function avvia(vp, { init = [], rossi = [], dist = '/home/user/vandelfalls/dist' } = {}) {
  const srv = await servi(dist); const url = `http://127.0.0.1:${srv.address().port}/`;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const nuova = async (sal) => {
    const p = await browser.newPage({ viewport: { width: vp[0], height: vp[1] }, hasTouch: true, reducedMotion: 'reduce' });
    await p.addInitScript(() => { globalThis.__VALMORA_SECONDO_MS = 1; });
    if (rossi.length) await p.addInitScript((xs) => { for (const x of xs) globalThis[`__NO_${x}`] = true; }, rossi);
    p.errori = []; p.on('console', (m) => { if (m.type() === 'error') p.errori.push(m.text()); }); p.on('pageerror', (e) => p.errori.push(e.message));
    await p.goto(url);
    if (sal) { await p.evaluate(([k, v]) => localStorage.setItem(k, v), [CHIAVE, sal]); await p.reload(); }
    return p;
  };
  return { browser, srv, url, nuova, chiudi: async () => { await browser.close(); srv.close(); } };
}
export const sal = (p) => p.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null'), CHIAVE);
export const scena = (p) => p.evaluate(() => document.querySelector('.scena')?.dataset.scena ?? null);

export const quieta = (p) => p.waitForFunction(() => document.querySelectorAll('.scena').length === 1 && getComputedStyle(document.querySelector('.scena')).opacity === '1'
  && [...document.querySelectorAll('[data-messaggio]')].every((x) => getComputedStyle(x).opacity === '1') && [...document.querySelectorAll('.mappa')].every((x) => x.dataset.pronta === 'si'), null, { timeout: 8000 }).catch(() => {});
export const stato = (p) => p.evaluate(() => {
  const r = (e) => e.getBoundingClientRect();
  const badge = [...document.querySelectorAll('.mappa [data-presenza]')], ind = document.querySelector('.mappa [data-mossa]');
  return { scena: document.querySelector('.scena')?.dataset.scena ?? null, ind: ind?.dataset.mossa ?? null, indTesto: ind?.textContent.trim() ?? null,
    attivi: badge.filter((b) => !b.disabled).map((b) => ({ id: b.dataset.presenza, premuto: b.getAttribute('aria-pressed'), nome: b.getAttribute('aria-label') ?? b.title ?? b.textContent.trim(), lato: Math.round(Math.min(r(b).width, r(b).height)) })),
    nBadge: badge.length,
    settori: [...document.querySelectorAll('.mappa [data-settore] .settore-punto')].filter((b) => !b.disabled).map((b) => ({ id: b.closest('[data-settore]').dataset.settore, nome: b.getAttribute('aria-label') ?? b.title ?? b.textContent.trim() })),
    ecc: document.scrollingElement.scrollHeight - innerHeight };
});
const PRIM = ['passo', 'avanti', 'inizia'];
/** Gioca un episodio dal punto in cui è (sala) fino al verbale. strat = {schiera(m,s), scegli(m,s,c)}; hook = {risposta:async(p,ctx), chiamata, chiusura, rapporto, verbale} */
export async function gioca(p, m, strat, hook = {}, { foto = null, max = 600 } = {}) {
  const log = [];
  for (let i = 0; i < max; i++) {
    await quieta(p); const sc = await scena(p); const s = (await sal(p))?.in_corso;
    if (sc === 'schieramento') {
      const d = strat.schiera(m, s);
      for (const [r, ps] of Object.entries(d)) for (const [set, n] of Object.entries(ps)) { if (m.mappa.risorse[r]?.fissa || !n) continue; await p.click(`[data-risorsa="${r}"]`); for (let k = 0; k < n; k++) await p.click(`[data-settore="${set}"] .settore-punto`); }
      await p.click('[data-azione="conferma"]'); await p.click('[data-azione="conferma-davvero"]'); log.push('schiera'); await p.waitForFunction(() => document.querySelector('.scena')?.dataset.scena !== 'schieramento', null, { timeout: 8000 }); continue;
    }
    if (sc === 'chiamata') {
      const mid = await p.getAttribute('[data-messaggio^="chiamata-"]', 'data-messaggio'); const cid = mid.replace('chiamata-', '');
      let ss = s, c = M.chiamateAperte(m, ss).find((x) => x.id === cid);
      for (let k = 0; !c && k < 30; k++) { await p.waitForTimeout(100); ss = (await sal(p)).in_corso; c = M.chiamateAperte(m, ss).find((x) => x.id === cid); }
      if (!c) console.log('DBG', JSON.stringify({o: ss.ondata, r: ss.risposte, sc: ss.scelte, seme: ss.seme, sala: await scena(p)})); if (!c) throw new Error(`chiamata ${cid} non fra le aperte del motore: ${M.chiamateAperte(m, ss).map((x) => x.id)}`);
      const o = strat.scegli(m, ss, c); if (hook.chiamata) await hook.chiamata(p, { m, s: ss, c, o });
      await p.click(`[data-opzione="${o}"]`); await p.click('[data-azione="conferma-risposta"]').catch(async () => p.click('[data-conferma]')); log.push(`risposta ${c.id}:${o}`); await p.waitForSelector('.scena[data-scena="risposta"]', { timeout: 8000 }); continue;
    }
    if (sc === 'risposta') { if (hook.risposta) await hook.risposta(p, { m, s }); if ((await scena(p)) !== 'risposta') continue; await p.click('[data-azione="continua"]'); await p.waitForFunction(() => document.querySelector('.scena')?.dataset.scena !== 'risposta', null, { timeout: 8000 }); continue; }
    if (sc === 'chiusura') { if (hook.chiusura) await hook.chiusura(p, { m, s }); await p.click('[data-azione="rapporto"]'); await p.waitForFunction(() => document.querySelector('.scena')?.dataset.scena !== 'chiusura', null, { timeout: 8000 }); continue; }
    if (sc === 'rapporto') { if (hook.rapporto) await hook.rapporto(p, { m, s }); if (process.env.DBG) console.log('RAPP', await p.evaluate(() => [...document.querySelectorAll('.scena [data-azione]')].map((b) => b.dataset.azione + '|' + b.textContent.trim()).join(' ; '))); const b = p.locator('.scena [data-azione="prossimo"],.scena [data-azione="continua"],.scena [data-azione="epilogo"],.scena [data-azione="avanti"]').first(); await b.click(); await p.waitForFunction(() => document.querySelector('.scena')?.dataset.scena !== 'rapporto', null, { timeout: 8000 }); continue; }
    if (sc === 'verbale') { if (hook.verbale) await hook.verbale(p, { m, s }); return log; }
    if (sc === 'epilogo' || sc === 'citta') return log;
    const b = p.locator(PRIM.map((a) => `.scena [data-azione="${a}"]`).join(',')).first();
    if (await b.count()) { await b.click(); continue; }
    await p.waitForTimeout(200);
  }
  throw new Error('troppi passi');
}
