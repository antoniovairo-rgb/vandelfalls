// PO-159 / D-271: fogli-provini PRIMA/DOPO della mossa, uno per misura di schermo (360×640, 375×667, 412×915).
// Righe: e01, e03, e16 (imp_nebbia), e35; colonne: «puoi», «dove», «dopo la mossa», ognuna PRIMA e DOPO affiancate.
// Legge le foto di foto-ux159.mjs (out/ux159/prima, out/ux159/dopo) e scrive i fogli accanto a questo file.
// Uso: node coordination/handoffs/sviluppatrice/ux159/provini.mjs
import { existsSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { VP, EPISODI, STATI } from './foto-ux159.mjs';

const qui = dirname(fileURLToPath(import.meta.url)), foto = resolve('out/ux159');
const NOMI = { puoi: '«Puoi spostare»', dove: '«Tocca il settore» (unità in mano)', dopo: 'Dopo la mossa' };
const b = await chromium.launch({ executablePath: process.env.VALMORA_CHROME ?? '/opt/pw-browsers/chromium' });
for (const [w, h] of VP) {
  const s = 0.5, cw = Math.round(w * s), ch = Math.round(h * s);
  const cella = (q, ep, st) => { const f = join(foto, q, `${w}x${h}-${ep}-${st}.png`);
    return existsSync(f) ? `<img src="file://${f}" width="${cw}" height="${ch}">` : `<div class="manca" style="width:${cw}px;height:${ch}px">manca</div>`; };
  const html = `<!doctype html><meta charset="utf-8"><style>
    body { margin: 0; padding: 16px; background: #f3f3f3; font: 13px/1.3 sans-serif; color: #111; }
    h1 { font-size: 18px; margin: 0 0 4px; } p { margin: 0 0 12px; }
    table { border-collapse: collapse; } td, th { padding: 4px 6px; vertical-align: top; text-align: center; }
    th.stato { border-bottom: 2px solid #111; } th.ep { text-align: left; white-space: nowrap; }
    .sx { border-left: 2px solid #111; } img { display: block; border: 1px solid #999; } .manca { background: #ddd; display: grid; place-items: center; }
    .q { font-weight: 700; } .dopo { color: #b00045; }</style>
    <h1>D-271 (PO-159): la mossa senza tratteggio · ${w}×${h}</h1>
    <p>PRIMA = main 6015826 (0.64.0); DOPO = ramo claude/valmora-ux159. Foto col movimento ridotto: l'alone che pulsa è fermo, si vede l'anello pieno. La versione in basso a sinistra c'è PRIMA e nel DOPO è già svanita (dopo 4 s).</p>
    <table><tr><th></th>${STATI.map((st) => `<th class="stato sx" colspan="2">${NOMI[st]}</th>`).join('')}</tr>
    <tr><th></th>${STATI.map(() => '<th class="q sx">PRIMA</th><th class="q dopo">DOPO</th>').join('')}</tr>
    ${EPISODI.map(([ep, id]) => `<tr><th class="ep">${ep}${id ? `<br>${id}` : ''}</th>${STATI.map((st) => `<td class="sx">${cella('prima', ep, st)}</td><td>${cella('dopo', ep, st)}</td>`).join('')}</tr>`).join('')}
    </table>`;
  const f = join(foto, `provini-${w}x${h}.html`); writeFileSync(f, html);
  const p = await b.newPage({ viewport: { width: 140 + 6 * (cw + 16), height: 400 }, deviceScaleFactor: 2 });
  await p.goto(`file://${f}`); await p.waitForLoadState('load');
  await p.screenshot({ path: join(qui, `provini-${w}x${h}.png`), fullPage: true }); await p.close();
  console.log(`provini: ${join(qui, `provini-${w}x${h}.png`)}`);
}
await b.close();
