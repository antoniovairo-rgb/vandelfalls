// C-057 punto 2: la mappa della risposta si abbassa e poi resta ferma? Per ogni chiamata: N aperture identiche (stesso salvataggio, stesso
// tocco), altezza della mappa registrata da un ResizeObserver con l'istante (ms dal comparire della risposta), poi un tocco sull'unità.
// Uso: VP=360x640 CASI=e10/imp_cantiere,... N=5 node sonda-stabilita.mjs
import { chromium } from 'playwright-core';
import { servi } from '../../../tools/foto.mjs';
import { leggiDati } from '../../../tools/dati-disco.mjs';
import { chiamateCostruite } from '../../../tools/sonda-altezze.mjs';
const dati = leggiDati(), dich = new Map(dati['stato.json'].variabili.map((d) => [d.id, d])), CH = 'vandelfalls-salvataggio';
const CASI = new Set(process.env.CASI.split(',')), N = Number(process.env.N ?? 5), VPS = (process.env.VP ?? '360x640').split(',');
const tutte = chiamateCostruite(dati, dich).filter((c) => CASI.has(`${c.ep}/${c.id}`));
const srv = await servi('dist'), url = `http://127.0.0.1:${srv.address().port}/`, b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const vp of VPS) { const [w, h] = vp.split('x').map(Number);
  for (const c of tutte) { const finali = [], tracce = [];
    for (let i = 0; i < N; i++) {
      const p = await b.newPage({ viewport: { width: w, height: h }, hasTouch: true, reducedMotion: 'reduce' }); await p.addInitScript(() => { globalThis.__VALMORA_SECONDO_MS = 1; });
      await p.goto(url); await p.evaluate(([a, v]) => localStorage.setItem(a, v), [CH, c.sal]); await p.reload(); await p.getByRole('button', { name: 'Riprendi' }).click();
      await p.waitForSelector(`[data-messaggio="chiamata-${c.id}"]`, { timeout: 15000 }); await p.waitForTimeout(300);
      await p.evaluate(() => { globalThis.__tr = []; const t0 = performance.now(); const reg = () => { const m = document.querySelector('.mappa'); if (m) { const hh = Math.round(m.getBoundingClientRect().height), l = globalThis.__tr.at(-1); if (!l || l[1] !== hh) globalThis.__tr.push([Math.round(performance.now() - t0), hh]); } requestAnimationFrame(reg); }; reg(); });
      const op = await p.evaluate(() => document.querySelector('[data-opzione]:not(:disabled):not([aria-disabled="true"])').dataset.opzione);
      await p.tap(`[data-opzione="${op}"]`); await p.tap('[data-conferma]').catch(() => {}); await p.waitForSelector('[data-messaggio="risposta"]'); await p.waitForTimeout(1500);
      const tr = await p.evaluate(() => globalThis.__tr), mossa = await p.evaluate(() => document.querySelector('[data-mossa]')?.dataset.mossa ?? null);
      let dopoUnita = null; if (mossa === 'puoi') { const bb = await p.locator('.mappa [data-presenza]:not(:disabled)').first().boundingBox(); await p.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(500); dopoUnita = await p.evaluate(() => Math.round(document.querySelector('.mappa').getBoundingClientRect().height)); }
      finali.push(tr.at(-1)?.[1]); tracce.push({ tr, dopoUnita }); await p.close(); }
    console.log(JSON.stringify({ vp, caso: `${c.ep}/${c.id}`, finali, tracce })); } }
await b.close(); srv.close();
