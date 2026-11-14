// Uso: node foglio.mjs uscita.png [scala] img1 img2 ... : affianca le foto (con didascalia) in un foglio.
import { chromium } from '../../../../node_modules/playwright-core/index.mjs';
import { readFileSync } from 'node:fs'; import { basename } from 'node:path';
const [out, scala, ...imgs] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 100, height: 100 } });
const html = `<body style="margin:0;background:#888;display:inline-flex;gap:8px;padding:8px;align-items:flex-start;font:12px sans-serif">` + imgs.map((f) => { const [file, cap] = f.split('::'); return `<figure style="margin:0;background:#fff"><img src="data:image/png;base64,${readFileSync(file).toString('base64')}" style="display:block;zoom:${scala}"><figcaption style="padding:3px 4px;max-width:340px">${cap ?? basename(file, '.png')}</figcaption></figure>`; }).join('') + '</body>';
await p.setContent(html); await p.waitForTimeout(200);
const el = await p.$('body'); const bb = await el.boundingBox(); await p.setViewportSize({ width: Math.ceil(bb.width), height: Math.ceil(bb.height) });
await p.screenshot({ path: out, fullPage: true }); await b.close();
