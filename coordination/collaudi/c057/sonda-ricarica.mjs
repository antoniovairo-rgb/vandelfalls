// C-057 punto 5: ricariche nella pausa con la mossa. Per ogni chiamata del campione: risposta → (se «puoi») ricarica → deve tornare la
// risposta con la mossa; «Avanti» → ricarica → deve tornare la chiamata, non la risposta; risposta senza mossa → ricarica → chiamata.
// E i salvataggi veri vecchi (tests/salvataggi-reali). Uso: VP=360x640 PER_EP=2 node coordination/collaudi/c057/sonda-ricarica.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { servi } from '../../../tools/foto.mjs';
import { leggiDati } from '../../../tools/dati-disco.mjs';
import { chiamateCostruite } from '../../../tools/sonda-altezze.mjs';
const dati = leggiDati(), dich = new Map(dati['stato.json'].variabili.map((d) => [d.id, d])), CH = 'vandelfalls-salvataggio';
const VPS = (process.env.VP ?? '360x640').split(','), PER_EP = Number(process.env.PER_EP ?? 2);
const per = new Map(); for (const c of chiamateCostruite(dati, dich)) (per.get(c.ep) ?? per.set(c.ep, []).get(c.ep)).push(c);
const campione = [...per].flatMap(([, xs]) => Array.from({ length: Math.min(PER_EP, xs.length) }, (_, i) => xs[Math.floor((i + 0.25 + 0.5 * i / Math.max(1, PER_EP - 1)) * xs.length / Math.min(PER_EP, xs.length))] ?? xs[0]));
const srv = await servi('dist'), url = `http://127.0.0.1:${srv.address().port}/`, b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const out = (o) => console.log(JSON.stringify(o));
const scena = (p) => p.evaluate(() => { const m = document.querySelector('[data-messaggio]')?.dataset.messaggio ?? null; const costo = [...document.querySelectorAll('[data-rapporto-costo]')].filter((e) => e.checkVisibility() && e.getBoundingClientRect().height > 2 && !e.closest('.radio-mappa')?.classList.contains('muto')).map((e) => e.querySelector('[data-costo]')?.textContent.trim()).filter(Boolean);
  return { m, mossa: document.querySelector('[data-mossa]')?.dataset.mossa ?? null, costo, mappa: Math.round(document.querySelector('.mappa')?.getBoundingClientRect().height ?? 0), ecc: document.scrollingElement.scrollHeight - innerHeight }; });
const ricarica = async (p) => { await p.reload(); await p.getByRole('button', { name: 'Riprendi' }).click(); await p.waitForTimeout(600); };
for (const vp of VPS) {
  const [w, h] = vp.split('x').map(Number);
  const nuova = async (sal) => { const p = await b.newPage({ viewport: { width: w, height: h }, hasTouch: true, reducedMotion: 'reduce' }); await p.addInitScript(() => { globalThis.__VALMORA_SECONDO_MS = 1; });
    p.on('pageerror', (e) => out({ tipo: 'errore', vp, msg: e.message })); await p.goto(url); await p.evaluate(([a, v]) => localStorage.setItem(a, v), [CH, sal]); await p.reload(); return p; };
  for (const f of readdirSync('tests/salvataggi-reali').filter((x) => x.endsWith('.json'))) {
    const p = await nuova(readFileSync(`tests/salvataggi-reali/${f}`, 'utf8')); const r = await p.getByRole('button', { name: 'Riprendi' }).click().then(() => true).catch(() => false);
    await p.waitForTimeout(900); out({ tipo: 'salvatoVero', vp, file: f, riprendi: r, ...(await scena(p)), titolo: await p.title() }); await p.close(); }
  for (const c of campione) {
    const dove = { vp, ep: c.ep, id: c.id }, p = await nuova(c.sal);
    await p.getByRole('button', { name: 'Riprendi' }).click();
    if (!(await p.waitForSelector(`[data-messaggio="chiamata-${c.id}"]`, { timeout: 15000 }).then(() => true).catch(() => false))) { out({ ...dove, tipo: 'nonApre' }); await p.close(); continue; }
    const op = await p.evaluate(() => [...document.querySelectorAll('[data-opzione]:not(:disabled):not([aria-disabled="true"])')].map((e) => e.dataset.opzione));
    await p.tap(`[data-opzione="${op[0]}"]`); await p.tap('[data-conferma]').catch(() => {});
    if (!(await p.waitForSelector('[data-messaggio="risposta"]', { timeout: 15000 }).then(() => true).catch(() => false))) { out({ ...dove, tipo: 'nessunaRisposta' }); await p.close(); continue; }
    await p.waitForTimeout(500); const a = await scena(p), rec = { ...dove, tipo: 'ricarica', prima: a };
    await ricarica(p); rec.dopoRicarica = await scena(p);
    if (a.mossa === 'puoi') {
      rec.tornaRisposta = rec.dopoRicarica.m === 'risposta' && rec.dopoRicarica.mossa === 'puoi';
      if (rec.dopoRicarica.m === 'risposta') { await p.tap('[data-azione="continua"]'); await p.waitForTimeout(500); rec.dopoAvanti = await scena(p); await ricarica(p); rec.dopoAvantiRicarica = await scena(p); }
    } else { rec.senzaMossaTornaRisposta = rec.dopoRicarica.m === 'risposta'; }
    out(rec); await p.close(); }
}
await b.close(); srv.close();
