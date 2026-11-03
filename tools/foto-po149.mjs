// PO-149 (D-237, foto del PO della città a 412×915): sugli schermi alti la striscia in testa cresce verso l'alto (spazio sopra i
// due personaggi) e la mappa prende più altezza; i pulsanti delle schede della città («Avvia l'episodio», la Tripla di
// «Rigioca», «Prossimo») stanno dentro il riquadro interno della scheda, ombra compresa, con margine ≥ --spazio-1 per lato.
// A 640/667/760/915 di altezza, alla larghezza data, nessuna pagina scorre. Soglie dalla regola (token), non dal misurato.
// Rossi: VALMORA_ROSSI=C237S01 (striscia fissa e mappa di prima), VALMORA_ROSSI=C237P01 (pulsanti a filo della scheda),
// VALMORA_ROSSI=C242M01 (scheda che cresce col contenuto: la mappa salta fra gli stati, C52-01, D-243).
import { join } from 'node:path';
import { missioniDai, salvataggioTutti } from './foto-bozze.mjs';

export const ALTEZZE_PO149 = [640, 667, 760, 915];
const { missioni, v0 } = missioniDai('data'), tutto = salvataggioTutti(missioni, v0);
const fino = (id) => { const prima = missioni.slice(0, missioni.findIndex((m) => m.id === id)).map((m) => m.id);
  return JSON.stringify({ ...tutto, missioni_concluse: prima, episodi: Object.fromEntries(prima.map((x) => [x, tutto.episodi[x]])) }); };
// stato → salvataggio e tocchi: e19 da giocare (la foto del PO), Tripla «Rigioca» aperta su e18, stagione 2 chiusa con «Prossimo»
// C52-01/02 (D-242): anche nessun episodio scelto (stagione 1 con e19 da giocare), un episodio superato (e18), tutti e 36
// conclusi all'avvio e con un episodio scelto (e35): la mappa resta allo stesso posto in tutti gli stati (≤ 1 px, Tripla esclusa)
const STATI = { e19: [fino('e19'), ['[data-stagione="2"]', '[data-episodio="e19"] .settore-punto']], tripla: [fino('e19'), ['[data-stagione="2"]', '[data-episodio="e18"] .settore-punto', '[data-azione="avvia-episodio"]']],
  prossimo: [fino('e01'), ['[data-stagione="2"]']], nessuno: [fino('e19'), ['[data-stagione="1"]']], superato: [fino('e19'), ['[data-stagione="2"]', '[data-episodio="e18"] .settore-punto']],
  tutti36: [JSON.stringify(tutto), []], tutti36scelto: [JSON.stringify(tutto), ['[data-stagione="3"]', '[data-episodio="e35"] .settore-punto']] };

const misura = (p) => p.evaluate(() => {
  const r = (e) => e.getBoundingClientRect(), px = (v) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(v)) || 0;
  const sv = document.querySelector('[data-citta-striscia] svg'), mappa = document.querySelector('.mappa.citta');
  // spazio sopra i personaggi: dal bordo alto dell'immagine al punto più alto delle due persone (pelle, capelli, berretto)
  const teste = sv ? [...sv.querySelectorAll('g')].filter((g) => g.querySelector('.v-pelle, [class*="capelli"], [class*="berretto"]')).map((g) => r(g).top) : [];
  const sopra = sv && teste.length ? Math.round(Math.min(...teste) - r(sv).top) : null;
  const pulsanti = [...document.querySelectorAll('.scena .scheda .pulsante')].filter((b) => b.getClientRects().length).map((b) => {
    const s = b.parentElement.closest('.scheda'), cs = getComputedStyle(s), rs = r(s), rb = r(b);
    const om = getComputedStyle(b).boxShadow.match(/(-?[\d.]+)px (-?[\d.]+)px/), dx = om ? Number(om[1]) : 0, dy = om ? Number(om[2]) : 0;
    const dentro = { l: rs.left + parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft), t: rs.top + parseFloat(cs.borderTopWidth) + parseFloat(cs.paddingTop), d: rs.right - parseFloat(cs.borderRightWidth) - parseFloat(cs.paddingRight), b: rs.bottom - parseFloat(cs.borderBottomWidth) - parseFloat(cs.paddingBottom) };
    const tutto = { l: Math.min(rb.left, rb.left + dx), t: Math.min(rb.top, rb.top + dy), d: Math.max(rb.right, rb.right + dx), b: Math.max(rb.bottom, rb.bottom + dy) };
    return { azione: b.dataset.azione, margine: Math.round(Math.min(tutto.l - dentro.l, tutto.t - dentro.t, dentro.d - tutto.d, dentro.b - tutto.b) * 10) / 10 };
  });
  // D-243: nessun testo della scheda tagliato senza l'ellissi, e niente tagliato in basso dall'altezza fissa
  const sch = document.querySelector('.scena > .scheda'), tagli = [];
  if (sch) { if (sch.scrollHeight > sch.clientHeight + 1) tagli.push(`scheda ${sch.scrollHeight - sch.clientHeight} px sotto`);
    for (const e of sch.querySelectorAll('*')) if (e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX !== 'visible' && getComputedStyle(e).textOverflow !== 'ellipsis') tagli.push(`«${e.textContent.trim().slice(0, 30)}» tagliato senza ellissi`); }
  return { tagli, ecc: document.scrollingElement.scrollHeight - innerHeight, striscia: sv ? Math.round(r(sv).height) : 0, sopra, mappa: Math.round(mappa ? r(mappa).height : 0), pulsanti, alto: mappa ? Math.round((r(mappa).top + scrollY) * 10) / 10 : null,
    minSopra: px('--spazio-5'), minMargine: px('--spazio-1'), mappaAttesa: Math.min(px('--citta-altezza-max'), Math.max(px('--citta-altezza-min'), innerHeight - px('--citta-riserva-striscia'))) };
});

/** Misure e problemi alla larghezza data (tutte e quattro le altezze). */
export async function controllaPo149(browser, url, larghezza, rossi = [], cartella = '') {
  const ris = [], male = [];
  for (const h of ALTEZZE_PO149) for (const [stato, [sal, tocchi]] of Object.entries(STATI)) {
    const vp = `${larghezza}x${h}`, p = await browser.newPage({ viewport: { width: larghezza, height: h }, reducedMotion: 'reduce' });
    if (rossi.length) await p.addInitScript((xs) => { for (const x of xs) globalThis[`__NO_${x}`] = true; }, rossi);
    await p.goto(url); await p.evaluate((v) => localStorage.setItem('vandelfalls-salvataggio', v), sal); await p.reload();
    await p.getByRole('button', { name: 'Riprendi' }).click(); await p.waitForSelector('.scena[data-scena="citta"]'); await p.waitForTimeout(300);
    for (const t of tocchi) { await p.click(t, { timeout: 5000 }).catch(() => male.push(`${vp} ${stato}: non trovo ${t} (PO-149)`)); await p.waitForTimeout(250); }
    await p.waitForTimeout(300); const m = await misura(p); ris.push({ vp, stato, ...m });
    if (cartella && stato === 'e19') await p.screenshot({ path: join(cartella, `${vp}-citta-po149.png`) });
    if (m.ecc > 0 && stato !== 'tripla') male.push(`${vp} città ${stato}: la pagina scorre di ${m.ecc} px (PO-149, D-230)`); // la Tripla scorreva già prima: non è di PO-149
    for (const b of m.pulsanti) if (b.margine < m.minMargine) male.push(`${vp} città ${stato}: «${b.azione}» con l'ombra è a ${b.margine} px dal riquadro interno della scheda (serve ≥ ${m.minMargine}, PO-149)`);
    for (const x of m.tagli) male.push(`${vp} città ${stato}: ${x} (D-243)`);
    if (stato !== 'tripla' && m.striscia) { // la striscia c'è da 700 px in su (D-210); C52-02: lo spazio sopra le teste in ogni stato
      // D-243: i valori della 0.52.0 (mappa ≥ 431 a 915 e ≥ 276 a 760), oltre alla regola da token. D-265 (PO-158): lo spazio
      // sopra le teste non deve più crescere (≥ 100 a 915 era cielo vuoto): lo misura tools/foto-po158.mjs (16-32 px, petto visibile)
      const mappaMin = Math.max(m.mappaAttesa, h >= 915 ? 431 : h >= 760 ? 276 : 0);
      if (m.mappa < mappaMin - 1) male.push(`${vp} città ${stato}: mappa alta ${m.mappa} px (serve ≥ ${mappaMin}, PO-149, D-243)`);
    }
    await p.close();
  }
  // C52-01 (D-242): a ogni altezza la mappa sta allo stesso posto in tutti gli stati (la Tripla aperta scorre: esclusa)
  for (const h of ALTEZZE_PO149) { const xs = ris.filter((x) => x.vp === `${larghezza}x${h}` && x.stato !== 'tripla' && x.alto !== null), a = xs.map((x) => x.alto);
    if (xs.length && Math.max(...a) - Math.min(...a) > 1) male.push(`${larghezza}x${h} città: la mappa si sposta di ${Math.round(Math.max(...a) - Math.min(...a))} px fra gli stati (${xs.map((x) => `${x.stato} ${x.alto}`).join(', ')}; C52-01)`); }
  return { ris, male };
}
