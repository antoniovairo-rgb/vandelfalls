// node ritaglia.mjs in.png out.png x y w h zoom
import { chromium } from '../../../../node_modules/playwright-core/index.mjs'; import { readFileSync } from 'node:fs';
const [i, o, x, y, w, h, z] = process.argv.slice(2); const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: Math.round(w * z), height: Math.round(h * z) } });
await p.setContent(`<body style="margin:0;overflow:hidden"><img src="data:image/png;base64,${readFileSync(i).toString('base64')}" style="position:absolute;left:${-x}px;top:${-y}px;zoom:${z};image-rendering:pixelated">`); await p.waitForTimeout(150); await p.screenshot({ path: o }); await b.close();
