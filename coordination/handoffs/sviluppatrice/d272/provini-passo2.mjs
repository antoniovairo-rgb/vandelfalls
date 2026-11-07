// D-272 passo 2 (scelta del PO «Sì, posto vuoto»): provini PRIMA / DOPO della mossa in e03 auto_in_sosta, la mossa del caso
// misurato (squadre@quartiere → piazzale: a 360 su main le pastiglie rimaste in Quartiere saltavano fino a 133 px).
// Due foto per colonna: «Puoi spostare» (prima della mossa) e «Dopo la mossa». Sopra ogni foto «dopo» i salti di quella mossa,
// misurati sulle pagine stesse (centri dei tocchi e dei nomi rispetto alla mappa, fra le due foto). Sotto, i numeri di
// salti-mossa su tutte le 24 mosse di e03 (PRIMA, DOPO, e la taratura «nomi 30» scartata), dati a mano da misure-passo2.json.
// Uso: node coordination/handoffs/sviluppatrice/d272/provini-passo2.mjs <build di main> <build del ramo>
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { servi } from '../../../../tools/foto.mjs';
import { leggiDati } from '../../../../tools/dati-disco.mjs';
import { chiamateCostruite } from '../../../../tools/sonda-altezze.mjs';

const [buildA, buildB] = process.argv.slice(2), EP = 'e03', ID = 'auto_in_sosta', U = 'squadre@quartiere', A = 'piazzale';
const VP = [[360, 640], [375, 667], [412, 915]], qui = dirname(fileURLToPath(import.meta.url)), radice = resolve('out/d272-passo2');
const misure = JSON.parse(readFileSync(join(qui, 'misure-passo2.json'), 'utf8'));
const dati = leggiDati(), dich = new Map(dati['stato.json'].variabili.map((d) => [d.id, d]));
const c = chiamateCostruite(dati, dich).find((x) => x.ep === EP && x.id === ID), ch = dati[`missioni/${EP}.json`].ondate.flatMap((o) => o.chiamate ?? []).find((x) => x.id === ID);
const centri = (p) => p.evaluate(() => { const m = document.querySelector('.mappa').getBoundingClientRect(), cc = (r) => [(r.left + r.right) / 2 - m.left, (r.top + r.bottom) / 2 - m.top];
  const o = {}; for (const e of document.querySelectorAll('.mappa [data-presenza], .mappa [data-fissa]')) o[`unità ${e.dataset.presenza ?? e.dataset.fissa}`] = cc(e.getBoundingClientRect());
  for (const s of document.querySelectorAll('.mappa [data-settore]')) { const n = s.querySelector('.settore-nome'); if (n) o[`nome ${s.dataset.settore}`] = cc(n.getBoundingClientRect()); } return o; });
const b = await chromium.launch({ executablePath: process.env.VALMORA_CHROME ?? '/opt/pw-browsers/chromium' }), salti = {};
for (const [nomeV, build] of [['PRIMA', buildA], ['DOPO', buildB]]) {
  const srv = await servi(build), url = `http://127.0.0.1:${srv.address().port}/`, cartella = join(radice, nomeV); mkdirSync(cartella, { recursive: true });
  for (const [w, h] of VP) {
    const p = await b.newPage({ viewport: { width: w, height: h }, hasTouch: true, reducedMotion: 'reduce', deviceScaleFactor: 2 });
    await p.addInitScript(() => { globalThis.__VALMORA_SECONDO_MS = 1; });
    await p.goto(url); await p.evaluate((v) => localStorage.setItem('vandelfalls-salvataggio', v), c.sal); await p.reload(); await p.getByRole('button', { name: 'Riprendi' }).click();
    await p.waitForSelector(`[data-messaggio="chiamata-${ID}"]`, { timeout: 15000 });
    await p.click(`[data-opzione="${ch.opzioni[0].id}"]`); await p.click('[data-conferma]').catch(() => {});
    await p.waitForSelector('.mappa [data-mossa="puoi"]', { timeout: 15000, state: 'attached' }); await p.waitForTimeout(6000); // segni e versione spariti
    const prima = await centri(p); await p.screenshot({ path: join(cartella, `${w}x${h}-puoi.png`) });
    await p.locator(`.mappa [data-presenza="${U}"]`).click({ force: true }); await p.waitForTimeout(400);
    await p.locator(`.mappa [data-settore="${A}"] .settore-punto`).click({ force: true }); await p.waitForTimeout(6000);
    const dopo = await centri(p); await p.screenshot({ path: join(cartella, `${w}x${h}-dopo.png`) }); await p.close();
    salti[`${nomeV} ${w}`] = Object.entries(prima).filter(([k]) => k !== `unità ${U}` && dopo[k]).map(([k, [x, y]]) => [k, Math.round(Math.hypot(dopo[k][0] - x, dopo[k][1] - y))]).filter(([, px]) => px > 0).sort((x, y) => y[1] - x[1]);
  }
  srv.close();
}
const riga = (xs) => xs.length ? xs.slice(0, 6).map(([k, px]) => `${k.replace(/@.*/, '').replace('unità ', '').replace('nome ', 'nome ')}${k.includes('@') ? `@${k.split('@')[1]}` : ''} ${px} px`).join('<br>') : 'nessun salto';
for (const [w, h] of VP) {
  const s = 0.75, cella = (v, st) => `<img src="file://${join(radice, v, `${w}x${h}-${st}.png`)}" width="${Math.round(w * s)}" height="${Math.round(h * s)}">`;
  const t = misure[w], tab = (k) => `<td>${t[k].partenza}</td><td>${t[k].arrivo}</td><td>${t[k].altri}</td><td>${t[k].nomi}</td>`;
  const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:16px;background:#f3f3f3;font:13px/1.3 sans-serif;color:#111}
    h1{font-size:18px;margin:0 0 4px}p{margin:0 0 10px}table{border-collapse:collapse}td,th{padding:4px 6px;vertical-align:top;text-align:center}
    .sx{border-left:2px solid #111}img{display:block;border:1px solid #999}.n td,.n th{border:1px solid #bbb;background:#fff}.m{font-size:12px;text-align:left}</style>
    <h1>D-272 passo 2: posto vuoto e costo di spostamento · ${w}×${h}</h1>
    <p>e03 «${ID}», mossa ${U} → ${A}. PRIMA: main 0.68.0 (553c26fa). DOPO: il posto dell'unità partita resta vuoto fino alla chiamata dopo; il ricalcolo, solo nella mossa, conta lo spostamento dal posto di prima.</p>
    <table><tr><th colspan="2" class="sx">«Puoi spostare»</th><th colspan="2" class="sx">Dopo la mossa</th></tr>
    <tr><th class="sx">PRIMA</th><th>DOPO</th><th class="sx">PRIMA</th><th>DOPO</th></tr>
    <tr><td class="sx">${cella('PRIMA', 'puoi')}</td><td>${cella('DOPO', 'puoi')}</td><td class="sx">${cella('PRIMA', 'dopo')}</td><td>${cella('DOPO', 'dopo')}</td></tr>
    <tr><td class="sx"></td><td></td><td class="sx m">${riga(salti[`PRIMA ${w}`])}</td><td class="m">${riga(salti[`DOPO ${w}`])}</td></tr></table>
    <p style="margin-top:10px"><b>Salto massimo in px su tutte le 24 mosse di e03</b> (salti-mossa, ${t.vp}; «unità partenza» = pastiglie rimaste nel settore da cui parte l'unità)</p>
    <table class="n"><tr><th></th><th>unità partenza</th><th>unità arrivo</th><th>unità altri settori</th><th>nomi</th></tr>
    <tr><th>PRIMA (main)</th>${tab('prima')}</tr><tr><th>DOPO (questo ramo)</th>${tab('dopo')}</tr><tr><th>«nomi 30» (taratura scartata)</th>${tab('nomi30')}</tr></table>
    <p class="m" style="margin-top:6px">Il compromesso: DOPO le pastiglie rimaste ferme non saltano più (sotto il tocco, 44 px), ma i nomi saltano di più (max ${t.dopo.nomi} contro ${t.prima.nomi} px). Con «nomi 30» i nomi restano fermi ma a 375 tornano i salti delle pastiglie (117 px): criteri fissati non rispettati, scartata.</p>`;
  const f = join(radice, `provini-passo2-${w}x${h}.html`); writeFileSync(f, html);
  const pg = await b.newPage({ viewport: { width: 1250, height: 900 }, deviceScaleFactor: 2 }); await pg.goto(`file://${f}`); await pg.waitForTimeout(300);
  await pg.screenshot({ path: join(qui, `provini-passo2-${w}x${h}.png`), fullPage: true }); await pg.close();
}
await b.close();
writeFileSync(join(radice, 'salti-provini.json'), JSON.stringify(salti, null, 1));
console.log(JSON.stringify(Object.fromEntries(Object.entries(salti).map(([k, v]) => [k, v.slice(0, 4)]))));
