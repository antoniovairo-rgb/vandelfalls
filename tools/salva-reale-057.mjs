// Gioca la build 0.57.0 (commit 0d60bc9a) da Chromium headless a 360 px e copia localStorage["vandelfalls-salvataggio"]
// a metà dell'ondata 2 di e01 (due risposte date). Le scelte le fa il bot attento della 0.57.0. D-241 idea B: il primo salvataggio v3.
import { createServer } from 'node:http';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { chromium } from 'playwright-core';
// Uso (D-241): git worktree add <dir> 0d60bc9a && (cd <dir> && npx vite build) && node tools/salva-reale-057.mjs <dir>
const W = process.argv[2];
if (!W) throw new Error('serve la cartella della build 0.57.0');
const { leggiDati } = await import(`${W}/tools/dati-disco.mjs`);
const { attenta } = await import(`${W}/src/logica/bot.ts`);
const { creaCaso } = await import(`${W}/src/logica/caso.ts`);
const { chiamateAperte } = await import(`${W}/src/logica/missione.ts`);
const dati = leggiDati(`${W}/data`); const dich = new Map(dati['stato.json'].variabili.map((d) => [d.id, d]));
const m = dati['missioni/e01.json']; const bot = attenta(creaCaso(1), dich);
const TIPI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
const build = `${W}/dist`;
const srv = await new Promise((ok) => { const s = createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); const p = join(build, u === '/' ? 'index.html' : u);
  if (!existsSync(p)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': TIPI[extname(p)] ?? 'application/octet-stream' }); r.end(readFileSync(p)); }); s.listen(0, '127.0.0.1', () => ok(s)); });
const browser = await chromium.launch({ executablePath: process.env.VALMORA_CHROME ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined) });
const p = await browser.newPage({ viewport: { width: 360, height: 760 }, reducedMotion: 'reduce' });
const scena = async () => { await p.waitForFunction(() => document.querySelectorAll('.scena').length === 1 && getComputedStyle(document.querySelector('.scena')).opacity === '1', null, { timeout: 8000 }); return p.getAttribute('.scena', 'data-scena'); };
const sal = () => p.evaluate(() => JSON.parse(localStorage.getItem('vandelfalls-salvataggio') ?? 'null'));
const log = [];
try {
  await p.goto(`http://127.0.0.1:${srv.address().port}/`); await p.evaluate(() => localStorage.clear()); await p.reload();
  for (let passo = 0; passo < 200; passo++) {
    const nome = await scena(); log.push(nome);
    const s = await sal(); const ic = s?.in_corso;
    if (ic && ic.ondata === 2 && Object.keys(ic.risposte).length >= 2) break; // obiettivo: metà ondata 2 (due risposte date)
    if (nome === 'titolo') await p.getByRole('button', { name: 'Nuova partita' }).click();
    else if (nome === 'genere') await p.click('[data-genere="m"]');
    else if (nome === 'guida') await p.click('[data-azione="guida-salta"]');
    else if (nome === 'citta') await p.click('[data-azione="avvia-episodio"]');
    else if (nome === 'sala') await p.locator('.scena [data-azione="passo"], .scena [data-azione="avanti"]').first().click();
    else if (nome === 'briefing') await p.locator('.scena [data-azione="prossimo"], .scena [data-azione="passo"], .scena [data-azione="inizia"]').first().click();
    else if (nome === 'schieramento') {
      const d = bot.schiera(m, ic);
      for (const [r, ps] of Object.entries(d)) for (const [k, q] of Object.entries(ps)) for (let i = 0; i < q; i++) {
        if ((await p.getAttribute(`[data-risorsa="${r}"]`, 'aria-pressed')) !== 'true') await p.click(`[data-risorsa="${r}"]`);
        await p.click(`[data-settore="${k}"] .settore-punto`);
      }
      await p.click('[data-azione="conferma"]'); await p.click('[data-azione="conferma-davvero"]');
    } else if (nome === 'chiamata') {
      const c = chiamateAperte(m, ic)[0]; const o = bot.scegli(m, ic, c); log.push(`${c.id}/${o}`);
      await p.click(`[data-opzione="${o}"]`); await p.click('[data-conferma]');
      await p.waitForFunction((k) => JSON.parse(localStorage.getItem('vandelfalls-salvataggio')).in_corso?.risposte?.[k], c.id, { timeout: 8000 });
    } else if (nome === 'risposta') await p.click('[data-azione="continua"]');
    else if (nome === 'chiusura') await p.click('[data-azione="rapporto"]');
    else if (nome === 'tono' || nome === 'rapporto') await p.click('.scena button.pulsante');
    else throw new Error(`scena inattesa ${nome}`);
    await p.waitForTimeout(150);
  }
  const s = await p.evaluate(() => localStorage.getItem('vandelfalls-salvataggio'));
  writeFileSync('tests/salvataggi-reali/v3-0.57.0-e01-ondata2-in-corso.json', JSON.stringify(JSON.parse(s), null, 2) + '\n');
  console.log(log.join(' > '));
} catch (e) { console.log(log.join(' > ')); console.log(await p.evaluate(() => document.querySelector('.scena')?.outerHTML.slice(0, 1500))); throw e; } finally { await browser.close(); srv.close(); }
