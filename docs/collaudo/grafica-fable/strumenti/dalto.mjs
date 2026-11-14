import { chromium } from '../../../../node_modules/playwright-core/index.mjs';
const T = { 't0': '#2fe07a', 't1': '#a6e22e', 't2': '#ffd400', 't3': '#ff9a1f', 't4': '#ff4b3a', 't5': '#ff1f6b', magenta: '#e0115f', ciano: '#00c2ff', bene: '#0b7d3e', giallo: '#ffd400', 'curva-a': '#ff7a1a', 'curva-b': '#2fa7ff' };
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 40 * Object.keys(T).length, height: 40 } });
await p.setContent('<body style="margin:0;display:flex">' + Object.values(T).map((c) => `<div style="width:40px;height:40px;background:${c}"></div>`).join(''));
const cdp = await p.context().newCDPSession(p); const q = await b.newPage();
const lab = ([r, g, bl]) => { const f = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; const R = f(r), G = f(g), B = f(bl); const X = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047, Y = 0.2126 * R + 0.7152 * G + 0.0722 * B, Z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883; const h = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116); return [116 * h(Y) - 16, 500 * (h(X) - h(Y)), 200 * (h(Y) - h(Z)), Y]; };
for (const tipo of ['none', 'deuteranopia', 'protanopia', 'tritanopia', 'achromatopsia']) {
  await cdp.send('Emulation.setEmulatedVisionDeficiency', { type: tipo });
  const png = (await p.screenshot()).toString('base64');
  const px = await q.evaluate(async ([png, n]) => { const i = new Image(); i.src = 'data:image/png;base64,' + png; await i.decode(); const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); return [...Array(n)].map((_, k) => [...x.getImageData(k * 40 + 20, 20, 1, 1).data].slice(0, 3)); }, [png, Object.keys(T).length]);
  const L = px.map(lab), nomi = Object.keys(T); const dE = (a, c) => Math.hypot(L[a][0] - L[c][0], L[a][1] - L[c][1], L[a][2] - L[c][2]).toFixed(1); const cr = (a, c) => ((Math.max(L[a][3], L[c][3]) + 0.05) / (Math.min(L[a][3], L[c][3]) + 0.05)).toFixed(2);
  console.log(tipo.padEnd(14), 'ΔE76 livelli vicini:', [0, 1, 2, 3, 4].map((i) => `${i}-${i + 1}: ${dE(i, i + 1)}`).join('  '), '| 0-2:', dE(0, 2), '| magenta-bene (scoperto/sotto controllo):', dE(6, 8), 'contrasto', cr(6, 8), '| curva a-b:', dE(10, 11), '| rgb t0..t5', px.slice(0, 6).map((x) => x.join(',')).join(' '));
}
await b.close();
