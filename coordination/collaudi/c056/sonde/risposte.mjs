// uso: node risposte.mjs <campione|tutte> <larghezza> <altezza>
import * as L from './lib.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { chiamateCostruite } from '/home/user/vandelfalls/tools/sonda-altezze.mjs';
const [modo, W, H] = process.argv.slice(2);
const d = JSON.parse(readFileSync(process.env.OUT + '/../diff-testi.json'));
const chiavi = (modo === 'campione' ? JSON.parse(readFileSync(process.env.OUT + '/../campione40.json')) : d.cambiati.filter((x) => x[1].endsWith('.r'))).map((x) => x[1]);
// chiave testo → ep/chiamata/opzione
const mappa = new Map();
for (const m of L.ms) for (const o of m.ondate) for (const c of o.chiamate ?? []) for (const op of c.opzioni) if (op.risposta) mappa.set(op.risposta.replace(/^testi:/, ''), { ep: m.id, chiamata: c.id, opzione: op.id });
const cc = chiamateCostruite(L.dati, L.dich); const perId = new Map(cc.map((x) => [`${x.ep}/${x.id}`, x]));
const a = await L.avvia([+W, +H]); const out = [];
let p = await a.nuova(null);
for (const k of chiavi) {
  const base = k.replace(/\.r$/, ''); const mp = mappa.get(k) ?? mappa.get(base);
  if (!mp) { out.push({ k, errore: 'chiave non trovata nelle opzioni' }); continue; }
  const c = perId.get(`${mp.ep}/${mp.chiamata}`); if (!c) { out.push({ k, ...mp, errore: 'nessuna chiamata costruita' }); continue; }
  try {
    await p.evaluate(([ch, v]) => localStorage.setItem(ch, v), [L.CHIAVE, c.sal]); await p.reload();
    await p.getByRole('button', { name: 'Riprendi' }).click();
    await p.waitForSelector(`[data-messaggio="chiamata-${c.id}"]`, { timeout: 20000 }); await L.quieta(p);
    await p.click(`[data-opzione="${mp.opzione}"]`); await p.click('[data-azione="conferma-risposta"]');
    await p.waitForSelector('[data-messaggio="risposta"]', { timeout: 20000 }); await L.quieta(p); await p.waitForTimeout(150);
    const r = await p.evaluate(() => { const e = document.querySelector('[data-messaggio="risposta"]'); return { testo: [...document.querySelectorAll('[data-messaggio]')].map((x) => x.textContent.trim()).join(' || '), ecc: document.scrollingElement.scrollHeight - innerHeight, orizz: document.documentElement.scrollWidth - innerWidth, tagliato: !!e && (e.scrollHeight > e.clientHeight + 1) }; });
    const atteso = L.T(k);
    out.push({ k, ...mp, ...r, atteso: r.testo?.includes(atteso) ?? false });
  } catch (e) { out.push({ k, ...mp, errore: String(e.message).split('\n')[0] }); p = await a.nuova(null); }
}
writeFileSync(`${process.env.OUT}/risposte-${modo}-${W}x${H}.json`, JSON.stringify(out, null, 1));
const ok = out.filter((x) => !x.errore); console.log(modo, W + 'x' + H, 'n', out.length, 'errori', out.length - ok.length, 'ecc>0', ok.filter((x) => x.ecc > 0).length, 'max ecc', Math.max(0, ...ok.map((x) => x.ecc)), 'testo diverso', ok.filter((x) => !x.atteso).length, 'orizz', ok.filter((x) => x.orizz > 0).length);
await a.chiudi();
