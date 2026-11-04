// C-057: foto dei rilievi. Uso: node coordination/collaudi/c057/foto-rilievi.mjs <cartella>
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { servi } from '../../../tools/foto.mjs';
import { leggiDati } from '../../../tools/dati-disco.mjs';
import { chiamateCostruite } from '../../../tools/sonda-altezze.mjs';
const dati = leggiDati(), dich = new Map(dati['stato.json'].variabili.map((d) => [d.id, d])), CH = 'vandelfalls-salvataggio', dir = process.argv[2];
const tutte = chiamateCostruite(dati, dich), srv = await servi('dist'), url = `http://127.0.0.1:${srv.address().port}/`, b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const casi = [['360x640', 'e03/laser', 'salto'], ['360x640', 'e16/imp_nebbia', 'previsione'], ['360x640', 'e35/curiosi_notte', 'gradini'], ['375x667', 'e03/laser', 'salto']];
for (const [vp, id, cosa] of casi) { const [w, h] = vp.split('x').map(Number), c = tutte.find((x) => `${x.ep}/${x.id}` === id), n = `${vp}-${c.ep}-${c.id}-${cosa}`;
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true, reducedMotion: 'reduce' }); await p.addInitScript(() => { globalThis.__VALMORA_SECONDO_MS = 1; });
  await p.goto(url); await p.evaluate(([a, v]) => localStorage.setItem(a, v), [CH, c.sal]); await p.reload(); await p.getByRole('button', { name: 'Riprendi' }).click();
  await p.waitForSelector(`[data-messaggio="chiamata-${c.id}"]`); await p.waitForTimeout(300); await p.screenshot({ path: join(dir, `${n}-0-chiamata.png`) });
  const op = await p.evaluate(() => document.querySelector('[data-opzione]:not(:disabled):not([aria-disabled="true"])').dataset.opzione);
  await p.tap(`[data-opzione="${op}"]`); await p.tap('[data-conferma]'); await p.waitForSelector('[data-messaggio="risposta"]');
  if (cosa === 'gradini') { await p.waitForTimeout(150); await p.screenshot({ path: join(dir, `${n}-1-subito.png`) }); } await p.waitForTimeout(1800); await p.screenshot({ path: join(dir, `${n}-2-ferma.png`) });
  const u = p.locator('.mappa [data-presenza]:not(:disabled)').first(), bb = await u.boundingBox(); if (bb) { await p.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(500); await p.screenshot({ path: join(dir, `${n}-3-unita.png`) });
    const s = p.locator('.mappa .settore-punto:not(:disabled)').last(), sb = await s.boundingBox(); if (sb) { await p.touchscreen.tap(sb.x + sb.width / 2, sb.y + sb.height / 2); await p.waitForTimeout(500); await p.screenshot({ path: join(dir, `${n}-4-fatta.png`) }); } }
  await p.close(); }
await b.close(); srv.close();
