// D-272 (passo 3): quanto saltano pastiglie e nomi dopo la mossa. Per la prima chiamata con la mossa di un episodio, per ogni
// unità spostabile e ogni settore ammesso: posizioni (rispetto alla mappa) di pastiglie e nomi nello stato «puoi» e dopo la
// mossa; il salto di un elemento è lo spostamento del suo centro. L'unità mossa non conta (cambia settore per forza).
// Misura per lo sviluppo, non è un guardiano. Uso: node tools/salti-mossa.mjs [episodio, e03] [viewport, 360x640,375x667] [rossi, es. C272P01]
import { chromium } from 'playwright-core';
import { servi } from './foto.mjs';
import { leggiDati } from './dati-disco.mjs';
import { chiamateCostruite } from './sonda-altezze.mjs';

const [ep = 'e03', vps = '360x640,375x667', rossi = ''] = process.argv.slice(2);
const dati = leggiDati('data'), dich = new Map(dati['stato.json'].variabili.map((d) => [d.id, d])), tutte = chiamateCostruite(dati, dich).filter((c) => c.ep === ep);
const srv = await servi(process.env.BUILD ?? 'dist'), url = `http://127.0.0.1:${srv.address().port}/`, b = await chromium.launch({ executablePath: process.env.VALMORA_CHROME ?? '/opt/pw-browsers/chromium' });
const posti = (p) => p.evaluate(() => { const m = document.querySelector('.mappa').getBoundingClientRect(), c = (r) => [Math.round((r.left + r.right) / 2 - m.left), Math.round((r.top + r.bottom) / 2 - m.top)];
  return Object.fromEntries([...document.querySelectorAll('.mappa [data-presenza] .pastiglia')].map((e) => [`unità ${e.closest('[data-presenza]').dataset.presenza}`, c(e.getBoundingClientRect())])
    .concat([...document.querySelectorAll('.mappa [data-settore] .settore-nome')].map((e) => [`nome ${e.closest('[data-settore]').dataset.settore}`, c(e.getBoundingClientRect())]))); });
for (const vp of vps.split(',')) {
  const [w, h] = vp.split('x').map(Number), salti = [];
  const apri = async (c, ch) => { const p = await b.newPage({ viewport: { width: w, height: h }, hasTouch: true, reducedMotion: 'reduce' });
    await p.addInitScript((xs) => { globalThis.__VALMORA_SECONDO_MS = 1; for (const x of xs) globalThis[`__NO_${x}`] = true; }, rossi.split(',').filter(Boolean));
    await p.goto(url); await p.evaluate((v) => localStorage.setItem('vandelfalls-salvataggio', v), c.sal); await p.reload(); await p.getByRole('button', { name: 'Riprendi' }).click();
    if (!(await p.waitForSelector(`[data-messaggio="chiamata-${c.id}"]`, { timeout: 15000 }).then(() => true, () => false))) { await p.close(); return null; }
    await p.click(`[data-opzione="${ch.opzioni[0].id}"]`); await p.click('[data-conferma]').catch(() => {});
    if (!(await p.waitForSelector('.mappa [data-mossa="puoi"]', { timeout: 15000, state: 'attached' }).then(() => true, () => false))) { await p.close(); return null; }
    await p.waitForTimeout(2500); return p; };
  let chiamata = null;
  for (const c of tutte.slice(0, 4)) { const ch = dati[`missioni/${ep}.json`].ondate.flatMap((o) => o.chiamate ?? []).find((x) => x.id === c.id); const p = ch && await apri(c, ch);
    if (!p) continue; const unita = await p.$$eval('.mappa [data-presenza]:not(:disabled)', (xs) => xs.map((x) => x.dataset.presenza)); await p.close(); chiamata = { c, ch, unita }; break; }
  if (!chiamata) { console.log(JSON.stringify({ vp, ep, errore: 'nessuna chiamata con la mossa' })); continue; }
  for (const u of chiamata.unita) for (let j = 0, n = 1; j < n; j++) {
    const p = await apri(chiamata.c, chiamata.ch); if (!p) break;
    const prima = await posti(p);
    await p.locator(`.mappa [data-presenza="${u}"]`).click({ force: true }); await p.waitForTimeout(200);
    const ss = await p.$$('.mappa .settore-punto:not(:disabled)'); n = ss.length; if (!ss[j]) { await p.close(); break; }
    const a = await ss[j].evaluate((e) => e.closest('[data-settore]').dataset.settore); await ss[j].click({ force: true }); await p.waitForTimeout(2500);
    const dopo = await posti(p); await p.close();
    for (const [k, [x, y]] of Object.entries(prima)) if (dopo[k] && k !== `unità ${u}`) salti.push({ mossa: `${u} → ${a}`, k, px: Math.round(Math.hypot(dopo[k][0] - x, dopo[k][1] - y)) });
  }
  const di = (pref) => salti.filter((s) => s.k.startsWith(pref)).map((s) => s.px).sort((x, y) => x - y), riass = (xs) => ({ elementi: xs.length, mossi: xs.filter((x) => x > 2).length, max: xs.at(-1) ?? 0, mediana_dei_mossi: xs.filter((x) => x > 2)[xs.filter((x) => x > 2).length >> 1] ?? 0 });
  console.log(JSON.stringify({ vp, ep, chiamata: chiamata.c.id, rossi, mosse: new Set(salti.map((s) => s.mossa)).size, pastiglie: riass(di('unità')), nomi: riass(di('nome')),
    peggiori: salti.sort((x, y) => y.px - x.px).slice(0, 5).map((s) => `${s.mossa}: ${s.k} ${s.px} px`) }));
}
await b.close(); srv.close();
