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

/** Giro «salti»: problemi e conto alla larghezza data. */
export async function controllaSalti(browser, url, larghezza, h, rossi, dati, insieme, pagine = 1) {
  const male = [], vp = `${larghezza}x${h}`, dich = new Map(dati['stato.json'].variabili.map((d) => [d.id, d])), tutte = chiamateCostruite(dati, dich);
  const conto = { vp, giro: 'salti', mosse: 0, unita: 0, max: 0 };
  for (const [ep, id] of CASI_SALTI) {
    const c = tutte.find((x) => x.ep === ep && x.id === id), ch = dati[`missioni/${ep}.json`].ondate.flatMap((o) => o.chiamate ?? []).find((x) => x.id === id);
    if (!c || !ch) { male.push(`${vp} ${ep} ${id}: chiamata non trovata (D-272 salti)`); continue; }
    const apri = async () => { const p = await browser.newPage({ viewport: { width: larghezza, height: h }, hasTouch: true, reducedMotion: 'reduce' });
      await p.addInitScript((xs) => { globalThis.__VALMORA_SECONDO_MS = 1; for (const x of xs) globalThis[`__NO_${x}`] = true; }, rossi);
      await p.goto(url); await p.evaluate((v) => localStorage.setItem('vandelfalls-salvataggio', v), c.sal); await p.reload(); await p.getByRole('button', { name: 'Riprendi' }).click();
      if (!(await p.waitForSelector(`[data-messaggio="chiamata-${id}"]`, { timeout: 15000 }).then(() => true, () => false))) { await p.close(); return null; }
      await p.click(`[data-opzione="${ch.opzioni[0].id}"]`); await p.click('[data-conferma]').catch(() => {});
      if (!(await p.waitForSelector('.mappa [data-mossa="puoi"]', { timeout: 15000, state: 'attached' }).then(() => true, () => false))) { await p.close(); return null; }
      await ferma(p); return p; };
    const p0 = await apri(); if (!p0) { male.push(`${vp} ${ep} ${id}: il «puoi spostare» non compare (D-272 salti)`); continue; }
    const unita = await p0.$$eval('.mappa [data-presenza]:not(:disabled)', (xs) => xs.map((x) => x.dataset.presenza)); await p0.close();
    await insieme(unita.map((u) => async () => { for (let j = 0, n = 1; j < n; j++) {
      const p = await apri(); if (!p) { male.push(`${vp} ${ep} ${id} ${u}: il «puoi spostare» non compare (D-272 salti)`); break; }
      const prima = await centri(p);
      await p.locator(`.mappa [data-presenza="${u}"]`).click({ force: true }); await p.waitForTimeout(80);
      const ss = await p.$$('.mappa .settore-punto:not(:disabled)'); n = ss.length; if (!ss[j]) { await p.close(); break; }
      const a = await ss[j].evaluate((e) => e.closest('[data-settore]').dataset.settore); await ss[j].click({ force: true }); await p.waitForTimeout(2500); await ferma(p); // anche dopo che spariscono i segni ▲/▼ (1,8 s veri)
      const dopo = await centri(p); await p.close(); conto.mosse++;
      const da = u.split('@')[1];
      for (const [k, [x, y]] of Object.entries(prima)) { if (k === u || k.split('@')[1] !== da || !dopo[k]) continue;
        const px = Math.round(Math.hypot(dopo[k][0] - x, dopo[k][1] - y)); conto.unita++; conto.max = Math.max(conto.max, px);
        if (px > SOGLIA_SALTO) male.push(`${vp} ${ep} ${id} ${u} → ${a}: ${k}, rimasta nel settore di partenza, salta di ${px} px (soglia ${SOGLIA_SALTO}, D-272 salti)`); }
    } }), pagine);
  }
  console.log(`salti dopo la mossa ${vp}: ${conto.mosse} mosse, ${conto.unita} unità rimaste, salto massimo ${conto.max} px (soglia ${SOGLIA_SALTO})`);
  if (!conto.mosse) male.push(`${vp}: nessuna mossa provata (D-272 salti)`);
  return { ris: conto, male };
}

// la pagina ferma: due letture uguali a 100 ms di misura della mappa e posti delle unità, al più 3 s
async function ferma(p) { let prima = '';
  for (let i = 0; i < 30; i++) { const ora = await p.evaluate(() => `${document.querySelector('.mappa')?.getBoundingClientRect().height}|${[...document.querySelectorAll('.mappa [data-presenza]')].map((e) => { const r = e.getBoundingClientRect(); return `${Math.round(r.left)},${Math.round(r.top)}`; }).join(';')}`);
    if (ora === prima) return; prima = ora; await p.waitForTimeout(100); } }
