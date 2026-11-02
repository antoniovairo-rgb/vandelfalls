// Guardiano offline (S-22, C14-01: pagina bianca offline). Su http://localhost (dove il service worker si
// registra), con la build in dist/:
//  O1 sola home visitata online, poi offline → «Nuova partita» → città con la mappa, nessun errore;
//  O2 offline, uno script che non esiste non riceve index.html (prima: pagina HTML al posto del modulo);
//  O3 offline, modulo della città tolto dalla cache → avviso con «Riprova», non una pagina bianca;
//  O4 rilascio nuovo (sw.js con un'altra versione) aperto online → la cache della build vecchia non c'è più.
//  O5 online durante un rilascio, un file della build vecchia risponde 404 ma è in cache: si usa la cache (C16-03).
// Uso a mano: node tools/offline.mjs [dist]; VALMORA_ROSSI=C14O01,… accende i rossi (come in foto.mjs).
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { pazienza } from './attese.mjs';

const TIPI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.webmanifest': 'application/manifest+json' };

export async function giraOffline(build = 'dist', rossi = (process.env.VALMORA_ROSSI ?? '').split(',').filter(Boolean)) {
  const radice = resolve(build);
  let rete = true, versioneFinta = null, sparito = null; // sparito: file che il server non ha più (rilascio nuovo)
  const srv = createServer((q, r) => {
    if (!rete) { r.destroy(); return; }
    const u = decodeURIComponent((q.url ?? '/').split('?')[0]);
    const p = join(radice, u === '/' ? 'index.html' : u);
    if (!existsSync(p) || (sparito && sparito.test(u))) { r.writeHead(404); return r.end(); }
    let corpo = readFileSync(p);
    if (versioneFinta && u === '/sw.js') corpo = Buffer.from(corpo.toString().replace(/const VERSIONE = '[^']*'/, `const VERSIONE = '${versioneFinta}'`));
    r.writeHead(200, { 'content-type': TIPI[extname(p)] ?? 'application/octet-stream', 'cache-control': 'no-store' }); r.end(corpo);
  });
  await new Promise((ok) => srv.listen(0, '127.0.0.1', ok));
  const URL = `http://localhost:${srv.address().port}/`;
  const percorso = process.env.VALMORA_CHROME ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
  const browser = pazienza(await chromium.launch({ executablePath: percorso }));
  const problemi = [];
  const atteso = (cosa, ok) => { if (!ok) problemi.push(`offline: ${cosa}`); };
  const scena = (p, n) => p.waitForFunction((n) => { const s = document.querySelectorAll('.scena'); return s.length === 1 && s[0].dataset.scena === n && getComputedStyle(s[0]).opacity === '1'; }, n, { timeout: 8000 });
  async function contesto() {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 760 }, reducedMotion: 'reduce' });
    if (rossi.length) await ctx.addInitScript((xs) => { for (const x of xs) globalThis[`__NO_${x}`] = true; }, rossi);
    const p = await ctx.newPage(); p.errori = [];
    p.on('pageerror', (e) => p.errori.push(e.message.slice(0, 120)));
    rete = true; versioneFinta = null; sparito = null;
    await p.goto(URL); await p.evaluate(() => navigator.serviceWorker.ready); await p.waitForTimeout(300); await p.reload(); await scena(p, 'titolo');
    return { ctx, p };
  }
  const offline = async (ctx) => { rete = false; await ctx.setOffline(true); };
  const nuova = async (p) => {
    await p.getByRole('button', { name: 'Nuova partita' }).click(); await scena(p, 'genere'); await p.click('[data-genere="m"]');
    await p.waitForFunction(() => ['guida', 'citta'].includes(document.querySelector('.scena')?.dataset.scena) || document.querySelector('[data-errore-carica]'), null, { timeout: 8000 }).catch(() => {});
    if (await p.locator('[data-azione="guida-salta"]').count()) await p.click('[data-azione="guida-salta"]');
  };
  try {
    { // O1
      const { ctx, p } = await contesto(); await offline(ctx); await p.reload(); await scena(p, 'titolo');
      await nuova(p);
      const citta = await scena(p, 'citta').then(() => true, () => false);
      const mappa = citta && await p.waitForSelector('.mappa[data-pronta="si"]', { timeout: 5000 }).then(() => true, () => false);
      atteso(`O1 home online, poi offline «Nuova partita»: città ${citta ? 'sì' : 'no'}, mappa ${mappa ? 'sì' : 'no'}, errori: ${p.errori.slice(0, 2).join(' | ')}`, citta && mappa && !p.errori.length);
      // O2: offline uno script che manca non deve ricevere la pagina
      const r = await p.evaluate(() => fetch('./assets/non-esiste.js').then((x) => x.headers.get('content-type') ?? 'nessun tipo', () => 'errore di rete'));
      atteso(`O2 offline uno script mancante riceve «${r}» invece di un errore`, r === 'errore di rete' || !/html/.test(r));
      await ctx.close();
    }
    { // O3: modulo della città tolto dalla cache → avviso con «Riprova»
      const { ctx, p } = await contesto();
      await p.evaluate(async () => { for (const n of await caches.keys()) { const c = await caches.open(n); for (const r of await c.keys()) if (/StratoCitta/.test(r.url)) await c.delete(r); } });
      await offline(ctx); await p.reload(); await scena(p, 'titolo'); await nuova(p); await p.waitForTimeout(1500);
      const avviso = (await p.locator('[data-errore-carica] [data-azione="riprova"]').count()) === 1;
      const conMappa = (await p.locator('.mappa[data-pronta="si"]').count()) === 1; // senza WebGL la città non carica il modulo
      atteso('O3 modulo mancante offline: niente «Riprova», pagina bianca', avviso || conMappa);
      await ctx.close();
    }
    { // O5 (C16-03): online, scheda della build vecchia aperta, il server non ha più il modulo della città (404)
      const { ctx, p } = await contesto();
      sparito = /StratoCitta/;
      await nuova(p);
      const citta = await p.waitForSelector('.mappa[data-pronta="si"]', { timeout: 6000 }).then(() => true, () => false);
      atteso(`O5 online durante un rilascio: modulo vecchio 404 sul server ma in cache, la città ${citta ? 'si apre' : 'non si apre'} (C16-03)`, citta && !(await p.locator('[data-errore-carica]').count()));
      await ctx.close();
    }
    { // O4: rilascio nuovo → via la cache vecchia
      const { ctx, p } = await contesto();
      await p.evaluate(() => Promise.all([caches.open('valmora-0.54.0'), caches.open('varcalda-0.56.0')])); // D-244, D-249: le cache coi nomi di prima spariscono
      const prima = await p.evaluate(() => caches.keys());
      versioneFinta = 'rilascio-nuovo';
      await p.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => r?.update()));
      for (let k = 0; k < 60; k++) { const n = await p.evaluate(() => caches.keys()); if (n.length === 1 && n[0] === 'vandelfalls-rilascio-nuovo') break; await p.waitForTimeout(250); } // fino a 15 s
      const dopo = await p.evaluate(() => caches.keys());
      atteso(`O4 dopo il rilascio nuovo le cache sono «${dopo.join(', ')}» (prima «${prima.join(', ')}»): la vecchia doveva sparire`, dopo.length === 1 && dopo[0] === 'vandelfalls-rilascio-nuovo');
      await ctx.close();
    }
  } catch (e) { problemi.push(`offline: giro interrotto: ${e.message.split('\n')[0]}`); }
  await browser.close(); srv.close();
  return problemi;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const p = await giraOffline(process.argv[2] ?? 'dist');
  console.log(p.length ? p.join('\n') : 'offline: verde (O1-O4)');
  process.exit(p.length ? 1 : 0);
}
