// D-278 (lotto «misura totale», scelta del PO): il metro dei salti. Il giro «salti» confrontava «puoi» a segni spariti con il dopo
// mossa: lo spostamento alla sparizione dei segni ▲/▼ (1,8 s veri) restava fuori, e una correzione che lo spostava al tocco sembrava
// peggiore (D-272, README-salti-residui). Qui ogni pastiglia d'unità e ogni nome di settore si misura lungo tutta la risposta, sempre
// rispetto alla posizione iniziale (la risposta ferma coi segni: ultima lettura coi segni, ogni 50 ms), in quattro fasi: sparizione
// dei segni, tocco dell'unità, mossa, fino alla chiamata dopo (tasto «Avanti»; se in 6 s veri non arriva, si conta e si dichiara). Letture ogni 50 ms; per ogni
// elemento conta il massimo; il totale va fino all'«Avanti», l'arrivo della chiamata dopo (ridisposizione voluta) si conta a parte. L'unità mossa non si conta (cambia chiave). Posizioni rispetto alla mappa (a 375 la mappa intera
// sale di 2 px: e22, e08).
import { chiamateCostruite } from './sonda-altezze.mjs';

export const SOGLIA_SPOSTAMENTO = 44; // --tocco-min, come i salti
// D-278 (principale 10/11): soglie sul massimo di main 1639f163, dalla sparizione alla mossa compresa (l'arrivo della chiamata dopo
// a parte). Misura: tools/zz-spost, 36 episodi, 4 pagine, 2 prove per larghezza, identiche dalla sparizione alla mossa.
// - Verde di ogni catena (CI compresa): e21 (sparizione a 375) ed e26 (mossa, 176 px), tetto per episodio [elementi oltre 44 px, massimo].
// - Catena «completa» (VALMORA_SALTI_TUTTI=1, come il giro salti): tutti i 36, tetto sul totale. Nessuno può peggiorare.
export const EPISODI_SPOSTAMENTO = ['e21', 'e26'];
export const TETTO_EPISODIO_SPOSTAMENTO = { 360: { e21: [20, 132], e26: [30, 176] }, 375: { e21: [72, 132], e26: [31, 176] }, 412: { e21: [19, 70], e26: [8, 91] } };
export const TETTO_SPOSTAMENTO = { 360: 818, 375: 596, 412: 246 }, MAX_SPOSTAMENTO = { 360: 199, 375: 176, 412: 134 };
export const APERTURE = 5; // sotto carico i segni (1,8 s veri) possono sparire prima della prima lettura: si riapre; se non basta si conta e si dichiara
export const FASI = ['sparizione', 'tocco', 'mossa', 'dopo'];

const leggi = (p) => p.evaluate(() => {
  const m = document.querySelector('.mappa')?.getBoundingClientRect(); if (!m) return null;
  const c = (r) => [Math.round((r.left + r.right) / 2 - m.left), Math.round((r.top + r.bottom) / 2 - m.top)], e = {};
  for (const x of document.querySelectorAll('.mappa [data-presenza], .mappa [data-fissa]')) e[`unità ${x.dataset.presenza ?? x.dataset.fissa}`] = c(x.getBoundingClientRect());
  for (const s of document.querySelectorAll('.mappa [data-settore]')) { const n = s.querySelector('.settore-nome'); if (n) e[`nome ${s.dataset.settore}`] = c(n.getBoundingClientRect()); }
  return { segni: document.querySelectorAll('.mappa [data-segno]').length, alta: Math.round(m.height), e };
});

/** Giro «spostamento»: problemi e conto alla larghezza data. episodi: se dato, solo quelli. */
export async function controllaSpostamento(browser, url, larghezza, h, rossi, dati, insieme, pagine = 1, episodi = null) {
  const male = [], vp = `${larghezza}x${h}`, D = '(D-278 spostamento)', dich = new Map(dati['stato.json'].variabili.map((d) => [d.id, d])), tutte = chiamateCostruite(dati, dich);
  const conto = { vp, giro: 'spostamento', episodi: 0, mosse: 0, oltre: 0, max: 0, fasi: Object.fromEntries(FASI.map((f) => [f, { oltre: 0, max: 0 }])), riprese: 0, nonMisurate: 0, senzaChiamata: 0, per: [] };
  const tuttiEp = !!process.env.VALMORA_SALTI_TUTTI && !episodi, eps = tuttiEp ? [...new Set(tutte.map((x) => x.ep))].sort() : [...(episodi ?? EPISODI_SPOSTAMENTO)].sort();
  const apri = async (c, ch) => { const p = await browser.newPage({ viewport: { width: larghezza, height: h }, hasTouch: true, reducedMotion: 'reduce' });
    await p.addInitScript((xs) => { globalThis.__VALMORA_SECONDO_MS = 1; for (const x of xs) globalThis[`__NO_${x}`] = true; }, rossi);
    await p.goto(url); await p.evaluate((v) => localStorage.setItem('vandelfalls-salvataggio', v), c.sal); await p.reload(); await p.getByRole('button', { name: 'Riprendi' }).click();
    if (!(await p.waitForSelector(`[data-messaggio="chiamata-${c.id}"]`, { timeout: 15000 }).then(() => true, () => false))) { await p.close(); return null; }
    await p.click(`[data-opzione="${ch.opzioni[0].id}"]`); await p.click('[data-conferma]').catch(() => {});
    if (!(await p.waitForSelector('.mappa [data-mossa="puoi"]', { timeout: 15000, state: 'attached' }).then(() => true, () => false))) { await p.close(); return null; }
    return p; };
  // una mossa: massimo spostamento per elemento e fase rispetto alla posizione iniziale; 'rifai' se i segni sono già spariti
  const mossa = async (c, ch, u, j) => {
    const p = await apri(c, ch); if (!p) return null;
    try {
      let a = await leggi(p); for (let t = Date.now(); a?.segni && Date.now() - t < 10000;) { await p.waitForTimeout(50); const b = await leggi(p); if (!b?.segni) break; a = b; }
      if (!a?.segni) return 'rifai';
      const base = a.e, max = {}, maxDopo = {}; // [px, fase]; l'arrivo della chiamata dopo a parte (ridisposizione voluta, D-272 passo 2)
      const misura = (r, fase) => { if (!r) return; const m = fase === 'dopo' ? maxDopo : max; for (const [k, [x, y]] of Object.entries(r.e)) { const q = base[k]; if (!q) continue; const px = Math.round(Math.hypot(x - q[0], y - q[1]));
        if (!m[k] || px > m[k][0]) m[k] = [px, fase]; } };
      const segui = async (fase, ms, fine = async () => false) => { for (let t = Date.now(); Date.now() - t < ms;) { misura(await leggi(p), fase); if (await fine()) break; await p.waitForTimeout(50); } };
      await segui('sparizione', 1500); // i segni spariscono a 1,8 s veri dalla risposta: qui si segue fino a pagina ferma dopo
      await segui('tocco', 0); await p.locator(`.mappa [data-presenza="${u}"]`).click({ force: true }); await segui('tocco', 400);
      const ss = await p.$$('.mappa .settore-punto:not(:disabled)'); if (!ss[j]) return { n: ss.length, fuori: true };
      const sett = await ss[j].evaluate((e) => e.closest('[data-settore]').dataset.settore); await ss[j].click({ force: true });
      await segui('mossa', 2500);
      // la chiamata dopo arriva col tasto «Avanti» (stato «fatta»)
      const altra = `[data-messaggio^="chiamata-"]:not([data-messaggio="chiamata-${c.id}"])`; let arrivata = false;
      await p.getByRole('button', { name: 'Avanti', exact: true }).click({ timeout: 5000 });
      await segui('dopo', 6000, async () => (arrivata = !!(await p.$(altra))));
      if (arrivata) await segui('dopo', 600); else conto.senzaChiamata++;
      return { n: ss.length, sett, max, maxDopo };
    } finally { await p.close(); }
  };
  for (const ep of eps) {
    let fatto = false;
    for (const c of tutte.filter((x) => x.ep === ep).slice(0, 4)) {
      const ch = dati[`missioni/${ep}.json`].ondate.flatMap((o) => o.chiamate ?? []).find((x) => x.id === c.id); if (!ch) continue;
      const p0 = await apri(c, ch); if (!p0) continue;
      const unita = await p0.$$eval('.mappa [data-presenza]:not(:disabled)', (xs) => xs.map((x) => x.dataset.presenza)); await p0.close();
      const r = { ep, id: c.id, mosse: 0, oltre: 0, max: 0, fasi: Object.fromEntries(FASI.map((f) => [f, { oltre: 0, max: 0 }])), peggiore: '' };
      await insieme(unita.map((u) => async () => { for (let j = 0, n = 1; j < n; j++) { try {
        let x = 'rifai'; for (let k = 0; x === 'rifai' && k < APERTURE; k++) { x = await mossa(c, ch, u, j); if (x === 'rifai') conto.riprese++; }
        if (x === 'rifai') { conto.nonMisurate++; male.push(`${vp} ${ep} ${c.id} ${u}: non misurata, segni ▲/▼ già spariti alla prima lettura in ${APERTURE} aperture ${D}`); break; }
        if (!x || x.fuori) break; n = x.n; r.mosse++;
        for (const [k, [px, fase]] of Object.entries(x.max)) { r.max = Math.max(r.max, px); r.fasi[fase].max = Math.max(r.fasi[fase].max, px);
          if (px > SOGLIA_SPOSTAMENTO) { r.oltre++; r.fasi[fase].oltre++; if (!r.peggiore || px > Number(r.peggiore.split(' ')[0])) r.peggiore = `${px} px ${k} (${fase}, ${u} → ${x.sett})`; } }
        for (const [px] of Object.values(x.maxDopo)) { r.fasi.dopo.max = Math.max(r.fasi.dopo.max, px); if (px > SOGLIA_SPOSTAMENTO) r.fasi.dopo.oltre++; }
      } catch (e) { male.push(`${vp} ${ep} ${c.id} ${u}: mossa ${j + 1} non riuscita: ${String(e).split('\n')[0].slice(0, 120)} ${D}`); break; } } }), pagine);
      if (!r.mosse) continue;
      conto.episodi++; conto.mosse += r.mosse; conto.oltre += r.oltre; conto.max = Math.max(conto.max, r.max);
      for (const f of FASI) { conto.fasi[f].oltre += r.fasi[f].oltre; conto.fasi[f].max = Math.max(conto.fasi[f].max, r.fasi[f].max); }
      conto.per.push(r); fatto = true;
      const te = !tuttiEp && TETTO_EPISODIO_SPOSTAMENTO[larghezza]?.[ep];
      if (te && (r.oltre > te[0] || r.max > te[1])) male.push(`${vp} ${ep} ${c.id}: elementi oltre ${SOGLIA_SPOSTAMENTO} px ${r.oltre} (tetto ${te[0]}), massimo ${r.max} px (tetto ${te[1]}); peggiore ${r.peggiore} (D-278 spostamento, tetto episodio)`);
      break;
    }
    if (!fatto) male.push(`${vp} ${ep}: nessuna chiamata con la mossa fra le prime 4 ${D}`);
  }
  const tetto = tuttiEp ? TETTO_SPOSTAMENTO[larghezza] : undefined, tmax = tuttiEp ? MAX_SPOSTAMENTO[larghezza] : undefined;
  if (tetto !== undefined && (conto.oltre > tetto || conto.max > tmax)) male.push(`${vp}: spostamento su ${conto.episodi} episodi, elementi oltre ${SOGLIA_SPOSTAMENTO} px ${conto.oltre} (tetto ${tetto}), massimo ${conto.max} px (tetto ${tmax}); peggiori ${[...conto.per].sort((a, b) => b.max - a.max).slice(0, 4).map((x) => `${x.ep} ${x.peggiore}`).join('; ')} (D-278 spostamento, tetto)`);
  if (!conto.mosse) male.push(`${vp}: nessuna mossa provata ${D}`);
  const fasi = FASI.map((f) => `${f} ${conto.fasi[f].oltre}/${conto.fasi[f].max} px`).join(', ');
  console.log(`spostamento lungo la risposta ${vp}: ${conto.episodi} episodi, ${conto.mosse} mosse, elementi oltre ${SOGLIA_SPOSTAMENTO} px ${conto.oltre}, massimo ${conto.max} px (fino all'«Avanti»); per fase (oltre/massimo) ${fasi}; riaperti ${conto.riprese}, unità non misurate ${conto.nonMisurate}, senza chiamata dopo ${conto.senzaChiamata}; ${tuttiEp ? 'tutti gli episodi' : eps.join(' ')}${tetto !== undefined ? `, tetto ${tetto} / ${tmax} px` : ''}`);
  return { ris: conto, male };
}
