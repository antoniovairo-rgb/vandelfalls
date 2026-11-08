// D-272 passo 2 (scelta del PO «Sì, posto vuoto»): dopo la mossa le unità rimaste nel settore di partenza restano dove erano.
// Prima saltavano fino a 133 / 110 / 98 px (e03 auto_in_sosta a 360 / 375 / 412, salti-mossa.mjs su 553c26fa): il gruppo andava a
// capo in un altro modo (3 tocchi per riga) e il ricalcolo ripartiva da zero. Ora il posto dell'unità partita resta vuoto fino alla
// chiamata dopo (Mappa.tsx, rosso C272V01) e il ricalcolo conta lo spostamento dal posto di prima (congela.ts, etichette.ts, rosso
// C272W01). Giro «salti» di po152b: prima chiamata con la mossa di ogni caso, ogni unità spostabile verso ogni settore ammesso; il
// salto di un'unità è lo spostamento del centro del suo tocco rispetto alla mappa, fra «puoi» e dopo la mossa. Soglia: un tocco.
// D-272 passo 2, vicinanza: nessuna pastiglia più lontana dal proprio disco del massimo misurato col posto vuoto (giro radio,
// 1636 pastiglie per larghezza: 95 / 93 / 93 px a 360 / 375 / 412, p95 61 / 53 / 52); i nomi stanno a 0 px per costruzione.
import { chiamateCostruite } from './sonda-altezze.mjs';

export const SOGLIA_SALTO = 44; // --tocco-min
export const VICINANZA_MAX = { 360: 95, 375: 93, 412: 93 };
export const CASI_SALTI = [['e03', 'auto_in_sosta']];

/** Nella pagina: per ogni pastiglia d'unità, quanto dista (spazio fra i riquadri) dal disco del suo settore. */
export const lontananze = (p) => p.evaluate(() => {
  const gap = (a, b) => Math.hypot(Math.max(0, a.left - b.right, b.left - a.right), Math.max(0, a.top - b.bottom, b.top - a.bottom));
  return [...document.querySelectorAll('.mappa [data-settore]')].flatMap((s) => { const d = s.querySelector('.settore-punto')?.getBoundingClientRect(); if (!d) return [];
    return [...s.querySelectorAll('.settore-unita .pastiglia')].map((e) => { const t = e.closest('[data-presenza], [data-fissa]'); return { k: t?.dataset.presenza ?? t?.dataset.fissa ?? s.dataset.settore, px: Math.round(gap(e.getBoundingClientRect(), d)) }; }); });
});

const centri = (p) => p.evaluate(() => { const m = document.querySelector('.mappa').getBoundingClientRect();
  return Object.fromEntries([...document.querySelectorAll('.mappa [data-presenza], .mappa [data-fissa]')].map((e) => { const r = e.getBoundingClientRect();
    return [e.dataset.presenza ?? e.dataset.fissa, [(r.left + r.right) / 2 - m.left, (r.top + r.bottom) / 2 - m.top]]; })); });

// D-272 (decisione del principale, 8/11): oltre a e03, altri episodi con tutte le mosse della prima chiamata con la mossa.
// Su 553c26fa (prima del passo 2), su tutti i 36 episodi, gli elementi oltre 44 px erano 252 / 264 / 99 a 360 / 375 / 412
// (massimo 176 / 176 / 132); col passo 2 sono 95 / 47 / 33 (massimo 176 / 176 / 120). Il tetto è il conteggio di oggi, perché non si
// possa peggiorare; la causa dei salti rimasti è un lotto dopo la 0.70.0 (obiettivo 44 px, tetto che scende).
// - Verde di ogni catena (CI compresa): e03 stretto; a 360 anche e05 ed e26 (EPISODI_SALTI), con un tetto per episodio
//   (elementi oltre 44 px e salto massimo, misurati su a66978a8, tools/zz-salti-tutti.mjs) e uno sul totale.
// - Catena «completa» (VALMORA_SALTI_TUTTI=1, la mette catena.mjs): tutti i 36 episodi, tetto sul totale (TETTO_SALTI, MAX_SALTI).
// Rosso: C272V01,C272W01 (il comportamento di 553c26fa).
// Decisione del principale 8/11 (CI 1373: job 375 +22 min, 412 +17 rispetto a 1366): nel verde, solo a 360, e03 più e05 ed e26
// (salti oggi a tutte e 3 le larghezze); a 375 e 412 solo e03. Tutti i 36 nella catena «completa».
export const EPISODI_SALTI = { 360: ['e05', 'e26'] };
export const TETTO_EPISODIO = { // [elementi oltre 44 px, salto massimo in px]
  360: { e03: [0, 6], e05: [4, 79], e06: [0, 22], e08: [0, 0], e10: [0, 0], e26: [6, 176], e31: [6, 88] },
  375: { e03: [0, 0], e05: [4, 79], e06: [0, 22], e08: [8, 79], e10: [0, 0], e26: [5, 176], e31: [3, 93] },
  412: { e03: [0, 0], e05: [8, 93], e06: [0, 0], e08: [0, 38], e10: [0, 0], e26: [4, 91], e31: [0, 0] },
};
export const TETTO_SALTI = { 360: 95, 375: 47, 412: 33 }, MAX_SALTI = { 360: 176, 375: 176, 412: 120 };

/** Giro «salti»: problemi e conto alla larghezza data. */
// episodi: se dato (i bracci, BRACCI_PO152B.episodi), solo quegli episodi; e03 stretto solo se c'è.
export async function controllaSalti(browser, url, larghezza, h, rossi, dati, insieme, pagine = 1, episodi = null) {
  const male = [], vp = `${larghezza}x${h}`, dich = new Map(dati['stato.json'].variabili.map((d) => [d.id, d])), tutte = chiamateCostruite(dati, dich);
  const conto = { vp, giro: 'salti', mosse: 0, unita: 0, max: 0, episodi: 0, oltre: 0, maxTutti: 0 };
  // una chiamata: null se il «puoi spostare» non compare; altrimenti i salti oltre soglia (righe) e il massimo
  const caso = async (ep, id, stretto) => {
    const c = tutte.find((x) => x.ep === ep && x.id === id), ch = dati[`missioni/${ep}.json`].ondate.flatMap((o) => o.chiamate ?? []).find((x) => x.id === id);
    if (!c || !ch) { if (stretto) male.push(`${vp} ${ep} ${id}: chiamata non trovata (D-272 salti)`); return null; }
    const apri = async () => { const p = await browser.newPage({ viewport: { width: larghezza, height: h }, hasTouch: true, reducedMotion: 'reduce' });
      await p.addInitScript((xs) => { globalThis.__VALMORA_SECONDO_MS = 1; for (const x of xs) globalThis[`__NO_${x}`] = true; }, rossi);
      await p.goto(url); await p.evaluate((v) => localStorage.setItem('vandelfalls-salvataggio', v), c.sal); await p.reload(); await p.getByRole('button', { name: 'Riprendi' }).click();
      if (!(await p.waitForSelector(`[data-messaggio="chiamata-${id}"]`, { timeout: 15000 }).then(() => true, () => false))) { await p.close(); return null; }
      await p.click(`[data-opzione="${ch.opzioni[0].id}"]`); await p.click('[data-conferma]').catch(() => {});
      if (!(await p.waitForSelector('.mappa [data-mossa="puoi"]', { timeout: 15000, state: 'attached' }).then(() => true, () => false))) { await p.close(); return null; }
      await p.waitForTimeout(2500); await ferma(p); return p; }; // «puoi» fermo: anche i segni ▲/▼ della risposta sono spariti (1,8 s veri)
    const p0 = await apri(); if (!p0) { if (stretto) male.push(`${vp} ${ep} ${id}: il «puoi spostare» non compare (D-272 salti)`); return null; }
    const unita = await p0.$$eval('.mappa [data-presenza]:not(:disabled)', (xs) => xs.map((x) => x.dataset.presenza)); await p0.close();
    const r = { righe: [], max: 0 };
    await insieme(unita.map((u) => async () => { for (let j = 0, n = 1; j < n; j++) { try {
      const p = await apri(); if (!p) { male.push(`${vp} ${ep} ${id} ${u}: il «puoi spostare» non compare (D-272 salti)`); break; }
      const prima = await centri(p);
      await p.locator(`.mappa [data-presenza="${u}"]`).click({ force: true }); await p.waitForTimeout(80);
      const ss = await p.$$('.mappa .settore-punto:not(:disabled)'); n = ss.length; if (!ss[j]) { await p.close(); break; }
      const a = await ss[j].evaluate((e) => e.closest('[data-settore]').dataset.settore); await ss[j].click({ force: true }); await p.waitForTimeout(2500); await ferma(p); // anche dopo che spariscono i segni ▲/▼ (1,8 s veri)
      const dopo = await centri(p); await p.close(); if (stretto) conto.mosse++;
      const da = u.split('@')[1];
      for (const [k, [x, y]] of Object.entries(prima)) { if (k === u || k.split('@')[1] !== da || !dopo[k]) continue;
        const px = Math.round(Math.hypot(dopo[k][0] - x, dopo[k][1] - y)); r.max = Math.max(r.max, px); if (stretto) { conto.unita++; conto.max = Math.max(conto.max, px); }
        if (px > SOGLIA_SALTO) r.righe.push(`${vp} ${ep} ${id} ${u} → ${a}: ${k}, rimasta nel settore di partenza, salta di ${px} px (soglia ${SOGLIA_SALTO}, D-272 salti)`); }
    } catch (e) { male.push(`${vp} ${ep} ${id} ${u}: mossa ${j + 1} non riuscita: ${String(e).split('\n')[0].slice(0, 120)} (D-272 salti)`); break; } } }), pagine); // una pagina chiusa non ferma il giro: è un problema dichiarato
    return r;
  };
  const fatti = new Map();
  for (const [ep, id] of CASI_SALTI.filter(([e]) => !episodi || episodi.includes(e))) { const r = await caso(ep, id, true); if (r) { male.push(...r.righe); fatti.set(`${ep} ${id}`, r); } }
  // tutti gli episodi: la prima delle prime 4 chiamate dove il «puoi spostare» compare (come il giro radio)
  const per = [];
  const tuttiEp = !!process.env.VALMORA_SALTI_TUTTI, eps = tuttiEp ? [...new Set(tutte.map((x) => x.ep))].sort() : episodi ? [...episodi].sort() : [...new Set([...CASI_SALTI.map(([e]) => e), ...(EPISODI_SALTI[larghezza] ?? [])])].sort();
  for (const ep of eps) {
    let r = null, quale = '';
    for (const c of tutte.filter((x) => x.ep === ep).slice(0, 4)) { quale = c.id; r = fatti.get(`${ep} ${c.id}`) ?? await caso(ep, c.id, false); if (r) break; }
    if (!r) { male.push(`${vp} ${ep}: nessuna chiamata con la mossa fra le prime 4 (D-272 salti)`); continue; }
    conto.episodi++; conto.oltre += r.righe.length; conto.maxTutti = Math.max(conto.maxTutti, r.max); per.push([`${ep} ${quale}`, r.max, r.righe.length]);
    const te = !tuttiEp && TETTO_EPISODIO[larghezza]?.[ep];
    if (te && (r.righe.length > te[0] || r.max > te[1])) male.push(`${vp} ${ep} ${quale}: salti oltre ${SOGLIA_SALTO} px ${r.righe.length} (tetto ${te[0]}), massimo ${r.max} px (tetto ${te[1]}) (D-272 salti, tetto episodio)`);
  }
  const te7 = eps.map((e) => TETTO_EPISODIO[larghezza]?.[e]).filter(Boolean), tetto = tuttiEp ? TETTO_SALTI[larghezza] : te7.length ? te7.reduce((a, [n]) => a + n, 0) : undefined, tmax = tuttiEp ? MAX_SALTI[larghezza] : te7.length ? Math.max(...te7.map(([, m]) => m)) : undefined, peggiori = per.sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, m, n]) => `${k} ${m} px (${n} oltre)`).join(', ');
  if (tetto !== undefined && !episodi && (conto.oltre > tetto || conto.maxTutti > tmax)) male.push(`${vp}: salti oltre ${SOGLIA_SALTO} px su ${conto.episodi} episodi ${conto.oltre} (tetto ${tetto}), massimo ${conto.maxTutti} px (tetto ${tmax}); peggiori ${peggiori} (D-272 salti, tetto)`);
  console.log(`salti dopo la mossa ${vp}: ${conto.mosse} mosse, ${conto.unita} unità rimaste, salto massimo ${conto.max} px (soglia ${SOGLIA_SALTO}); ${tuttiEp ? 'tutti gli episodi' : eps.join(' ')}: ${conto.episodi}, oltre ${SOGLIA_SALTO} px ${conto.oltre} (tetto ${tetto}), massimo ${conto.maxTutti} px (tetto ${tmax})`);
  if (!conto.mosse && !conto.episodi) male.push(`${vp}: nessuna mossa provata (D-272 salti)`); // i bracci senza e03 provano solo gli episodi
  return { ris: conto, male };
}

// la pagina ferma: due letture uguali a 100 ms di misura della mappa e posti delle unità, al più 3 s
async function ferma(p) { let prima = '';
  for (let i = 0; i < 30; i++) { const ora = await p.evaluate(() => `${document.querySelector('.mappa')?.getBoundingClientRect().height}|${[...document.querySelectorAll('.mappa [data-presenza]')].map((e) => { const r = e.getBoundingClientRect(); return `${Math.round(r.left)},${Math.round(r.top)}`; }).join(';')}`);
    if (ora === prima) return; prima = ora; await p.waitForTimeout(100); } }
