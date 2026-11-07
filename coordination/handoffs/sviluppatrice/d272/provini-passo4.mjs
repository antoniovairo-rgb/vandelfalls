// D-272 passo 4: dopo la mossa, per circa 2 s, «−1» sul settore lasciato e «+1» su quello d'arrivo. Provini PRIMA / DOPO in e03
// auto_in_sosta, mossa squadre@quartiere → piazzale (la stessa del passo 2). Colonne: PRIMA (main) a 0,3 s dalla mossa; DOPO a 0,3 s
// (col segno); DOPO a 2,5 s (segno sparito). Riduzione del movimento attiva (come i guardiani): il segno compare senza animazione.
// Uso: node coordination/handoffs/sviluppatrice/d272/provini-passo4.mjs <build di main> <build del ramo>
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { servi } from '../../../../tools/foto.mjs';
import { leggiDati } from '../../../../tools/dati-disco.mjs';
import { chiamateCostruite } from '../../../../tools/sonda-altezze.mjs';

const [buildA, buildB] = process.argv.slice(2), EP = 'e03', ID = 'auto_in_sosta', U = 'squadre@quartiere', A = 'piazzale';
const VP = [[360, 640], [375, 667], [412, 915]], qui = dirname(fileURLToPath(import.meta.url)), radice = resolve('out/d272-passo4');
const dati = leggiDati(), dich = new Map(dati['stato.json'].variabili.map((d) => [d.id, d]));
const c = chiamateCostruite(dati, dich).find((x) => x.ep === EP && x.id === ID), ch = dati[`missioni/${EP}.json`].ondate.flatMap((o) => o.chiamate ?? []).find((x) => x.id === ID);
const b = await chromium.launch({ executablePath: process.env.VALMORA_CHROME ?? '/opt/pw-browsers/chromium' }), visti = {};
for (const [nomeV, build, tempi] of [['PRIMA', buildA, [300]], ['DOPO', buildB, [300, 2500]]]) {
  const srv = await servi(build), url = `http://127.0.0.1:${srv.address().port}/`, cartella = join(radice, nomeV); mkdirSync(cartella, { recursive: true });
  for (const [w, h] of VP) {
    const p = await b.newPage({ viewport: { width: w, height: h }, hasTouch: true, reducedMotion: 'reduce', deviceScaleFactor: 2 });
    await p.addInitScript(() => { globalThis.__VALMORA_SECONDO_MS = 1; });
    await p.goto(url); await p.evaluate((v) => localStorage.setItem('vandelfalls-salvataggio', v), c.sal); await p.reload(); await p.getByRole('button', { name: 'Riprendi' }).click();
    await p.waitForSelector(`[data-messaggio="chiamata-${ID}"]`, { timeout: 15000 });
    await p.click(`[data-opzione="${ch.opzioni[0].id}"]`); await p.click('[data-conferma]').catch(() => {});
    await p.waitForSelector('.mappa [data-mossa="puoi"]', { timeout: 15000, state: 'attached' }); await p.waitForTimeout(6000);
    await p.locator(`.mappa [data-presenza="${U}"]`).click({ force: true }); await p.waitForTimeout(400);
    await p.locator(`.mappa [data-settore="${A}"] .settore-punto`).click({ force: true }); let t0 = 0;
    for (const t of tempi) { await p.waitForTimeout(t - t0); t0 = t; await p.screenshot({ path: join(cartella, `${w}x${h}-${t}.png`) });
      visti[`${nomeV} ${w} ${t}`] = await p.$$eval('.mappa .segno-mossa', (xs) => xs.map((x) => x.dataset.segnoMossa)); }
    await p.close();
  }
  srv.close();
}
for (const [w, h] of VP) {
  const s = 0.75, cella = (v, t) => `<img src="file://${join(radice, v, `${w}x${h}-${t}.png`)}" width="${Math.round(w * s)}" height="${Math.round(h * s)}">`;
  const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:16px;background:#f3f3f3;font:13px/1.3 sans-serif;color:#111}
    h1{font-size:18px;margin:0 0 4px}p{margin:0 0 10px}table{border-collapse:collapse}td,th{padding:4px 6px;vertical-align:top;text-align:center}
    .sx{border-left:2px solid #111}img{display:block;border:1px solid #999}.m{font-size:12px}</style>
    <h1>D-272 passo 4: segno «−1 / +1» dopo la mossa · ${w}×${h}</h1>
    <p>e03 «${ID}», mossa ${U} → ${A}. PRIMA: main 0.69.0 (5bdf0515). DOPO: per circa 2 s «−1» sul disco del settore lasciato e «+1» su quello d'arrivo, sotto i nomi; non prende tocchi, non sposta nomi né pastiglie.</p>
    <table><tr><th class="sx">PRIMA, 0,3 s dopo la mossa</th><th class="sx">DOPO, 0,3 s dopo la mossa</th><th>DOPO, 2,5 s dopo la mossa</th></tr>
    <tr><td class="sx">${cella('PRIMA', 300)}</td><td class="sx">${cella('DOPO', 300)}</td><td>${cella('DOPO', 2500)}</td></tr>
    <tr class="m"><td class="sx">segni: ${visti[`PRIMA ${w} 300`].join(', ') || 'nessuno'}</td><td class="sx">segni: ${visti[`DOPO ${w} 300`].join(', ') || 'nessuno'}</td><td>segni: ${visti[`DOPO ${w} 2500`].join(', ') || 'nessuno'}</td></tr></table>`;
  const f = join(radice, `provini-passo4-${w}x${h}.html`); writeFileSync(f, html);
  const pg = await b.newPage({ viewport: { width: 1250, height: 900 }, deviceScaleFactor: 2 }); await pg.goto(`file://${f}`); await pg.waitForTimeout(300);
  await pg.screenshot({ path: join(qui, `provini-passo4-${w}x${h}.png`), fullPage: true }); await pg.close();
}
await b.close(); console.log(JSON.stringify(visti));
