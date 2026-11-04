// PO-158 / D-265: misure della città. Uso: node misura.mjs <cartella-foto> [dist]  (dal repo)
import { chromium } from '/home/user/valmora/node_modules/playwright-core/index.mjs';
const R = '/home/user/valmora/tools/';
const { resaFissa } = await import(R + 'caratteri.mjs'); resaFissa();
const { servi } = await import(R + 'foto.mjs');
const { missioniDai, salvataggioTutti } = await import(R + 'foto-bozze.mjs');
const cartella = process.argv[2], dir = process.argv[3] ?? 'dist';
const { missioni, v0 } = missioniDai('data'), tutto = salvataggioTutti(missioni, v0);
const fino = (id) => { const prima = missioni.slice(0, missioni.findIndex((m) => m.id === id)).map((m) => m.id);
  return JSON.stringify({ ...tutto, missioni_concluse: prima, episodi: Object.fromEntries(prima.map((x) => [x, tutto.episodi[x]])) }); };
const srv = await servi(dir), url = `http://127.0.0.1:${srv.address().port}/`;
const b = await chromium.launch({ executablePath: process.env.VALMORA_CHROME });
const misura = (p) => p.evaluate(() => {
  const r = (e) => e.getBoundingClientRect(), out = {};
  const sv = document.querySelector('[data-citta-striscia] svg');
  if (sv) { const rs = r(sv); out.striscia = Math.round(rs.height);
    const persone = [...sv.querySelectorAll('[data-persona]')].map((g) => { const inn = g.querySelector('g[transform]') ?? g, m = inn.getScreenCTM();
      const teste = [...g.querySelectorAll('.v-pelle, [class*="capelli"], [class*="berretto"]')].map((e) => r(e).top);
      const petto = new DOMPoint(0, 76).matrixTransform(m).y;
      return { testa: Math.round(Math.min(...teste) - rs.top), petto: Math.round(rs.bottom - petto), alta: Math.round(rs.bottom - Math.min(...teste)) }; });
    out.persone = persone; }
  const px = (v) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(v)) || 0;
  const bolle = [...document.querySelectorAll('.mappa.citta [data-episodio] .settore-punto')].map((e) => { const q = r(e), cs = getComputedStyle(e), acc = e.closest('.acceso');
    const ext = acc ? (parseFloat(cs.outlineWidth) || 0) + (parseFloat(cs.outlineOffset) || 0) : 0;
    return { n: e.textContent.trim(), x: q.left + q.width / 2, y: q.top + q.height / 2, r: q.width / 2 + ext, futuro: !!e.closest('.futuro'), col: cs.color, bg: cs.backgroundColor, op: getComputedStyle(e.closest('.settore')).opacity }; });
  let min = Infinity; const sopra = [];
  for (let i = 0; i < bolle.length; i++) for (let j = i + 1; j < bolle.length; j++) { const a = bolle[i], c = bolle[j], g = Math.hypot(a.x - c.x, a.y - c.y) - a.r - c.r; min = Math.min(min, g); if (g < 0) sopra.push(`${a.n}-${c.n} ${Math.round(g)}`); }
  out.bolle = { n: bolle.length, gapMin: Math.round(min * 10) / 10, sopra, futuro: bolle.find((x) => x.futuro) && (({ col, bg, op }) => ({ col, bg, op }))(bolle.find((x) => x.futuro)) };
  const m = document.querySelector('.mappa.citta'); out.mappa = m ? { alto: Math.round(r(m).top + scrollY), h: Math.round(r(m).height), w: Math.round(r(m).width) } : null;
  out.nomi = [...document.querySelectorAll('.scheda .sfida *')].filter((e) => e.children.length === 0 && e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent.trim());
  out.ecc = document.scrollingElement.scrollHeight - innerHeight;
  return out;
});
const ris = [];
for (const w of [360, 375, 412]) for (const h of [640, 760, 830, 915]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
  const apri = async (sal) => { await p.goto(url); await p.evaluate((v) => localStorage.setItem('vandelfalls-salvataggio', v), sal); await p.reload();
    await p.getByRole('button', { name: 'Riprendi' }).click(); await p.waitForSelector('.scena[data-scena="citta"]'); await p.waitForTimeout(400); };
  await apri(fino('e01')); await p.click('[data-episodio="e01"] .settore-punto'); await p.waitForTimeout(500);
  const a = await misura(p); ris.push({ vp: `${w}x${h}`, stato: 'po158', ...a });
  if (cartella) await p.screenshot({ path: `${cartella}/${w}x${h}-po158.png` });
  await apri(JSON.stringify(tutto));
  for (const s of [1, 2, 3]) { await p.click(`[data-stagione="${s}"]`); await p.waitForTimeout(350); const m = await misura(p); ris.push({ vp: `${w}x${h}`, stato: `tutto-s${s}`, bolle: m.bolle, mappa: m.mappa }); }
  await p.close();
}
console.log(JSON.stringify(ris));
await b.close(); srv.close();
