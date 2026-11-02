// D-257 (D-254): guardiano dei caratteri. Su un Chromium che vede solo DejaVu e Liberation (tools/caratteri/fonts.conf,
// come una macchina senza Inter), sulla build in dist/:
//  (a) document.fonts.check per Inter 400/500/600/700 e Space Grotesk 700;
//  (b) ogni carattere dei testi (data/testi) e delle stringhe della resa, in Inter a ogni peso e nel carattere dei titoli,
//      si disegna con un file incluso, mai col sistema (CDP CSS.getPlatformFontsForNode); così anche i simboli ≤ ≥ ▲ ▼ ⚑…;
//  (c) i testi della home vengono dai file inclusi;
//  (d) larghezza campione: Inter 400 a 15 px senza hinting, avanzamenti frazionari (telefono); con l'hinting di serie di
//      una macchina Linux le larghezze si arrotondano al pixel e gli a capo cambiano (causa degli a capo diversi in CI).
// Rosso C254F01: i file di Inter non arrivano (richieste bloccate), come senza il file.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { servi } from './foto.mjs';

export const FONTCONFIG = resolve('tools/caratteri/fonts.conf');
// misura del 2026-11-02 (container e fontconfig fisso, Chromium di /opt/pw-browsers): con l'hinting di serie 340.000
export const CAMPIONE = { testo: 'Pattuglia in Via Roma, «subito» è già qui — 1234', larghezza: 340.484 };
const PESI = [400, 500, 600, 700];

/** Caratteri da coprire: tutti quelli dei testi del gioco e delle stringhe della resa (commenti esclusi). */
export function caratteriDelGioco() {
  const tutti = (d) => readdirSync(d, { withFileTypes: true }).flatMap((x) => (x.isDirectory() ? tutti(join(d, x.name)) : [join(d, x.name)]));
  const set = new Set();
  for (const p of tutti('data/testi')) if (p.endsWith('.json')) for (const v of Object.values(JSON.parse(readFileSync(p, 'utf8')))) for (const c of String(v)) set.add(c);
  for (const p of tutti('src/resa')) if (/\.(tsx?)$/.test(p)) {
    const s = readFileSync(p, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
    for (const m of s.matchAll(/'([^'\n]*)'|"([^"\n]*)"|`([^`]*)`|>([^<>{}\n]+)</g)) for (const c of m.slice(1).find((x) => x !== undefined) ?? '') set.add(c);
  }
  return [...set].filter((c) => c.codePointAt(0) > 0x20 && !/\s/.test(c)).sort();
}

export async function giraCaratteri(dir = 'dist', rossi = []) {
  const errori = [];
  const percorso = process.env.VALMORA_CHROME ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
  const srv = await servi(dir), url = `http://127.0.0.1:${srv.address().port}/`;
  const browser = await chromium.launch({ executablePath: percorso, env: { ...process.env, FONTCONFIG_FILE: FONTCONFIG } });
  try {
    const p = await browser.newPage({ viewport: { width: 360, height: 640 } });
    if (rossi.includes('C254F01')) await p.route(/inter-latin-[0-9]+-normal[^/]*\.woff2$/, (r) => r.abort());
    await p.goto(url); await p.waitForSelector('button');
    const caratteri = caratteriDelGioco(), casi = [];
    for (const fam of ['var(--font)', 'var(--font-titoli)']) for (const w of PESI) casi.push({ fam, w, testo: caratteri.join('') });
    await p.evaluate(({ casi, campione }) => {
      casi.forEach((c, i) => { const s = document.createElement('span'); s.id = `car-${i}`; s.textContent = c.testo; s.style.cssText = `font-family:${c.fam};font-weight:${c.w};font-size:16px;position:absolute;left:0;top:0;white-space:nowrap;visibility:hidden`; document.body.append(s); });
      const s = document.createElement('span'); s.id = 'car-campione'; s.textContent = campione; s.style.cssText = 'font-family:Inter;font-weight:400;font-size:15px;position:absolute;left:0;top:0;white-space:nowrap;visibility:hidden'; document.body.append(s);
    }, { casi, campione: CAMPIONE.testo });
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(200);
    // (a)
    const check = await p.evaluate((pesi) => [...pesi.map((w) => [`Inter ${w}`, document.fonts.check(`${w} 16px Inter`, 'Aa')]), ['Space Grotesk 700', document.fonts.check('700 16px "Space Grotesk"', 'Aa')]], PESI);
    for (const [nome, ok] of check) if (!ok) errori.push(`D-257: document.fonts.check falso per ${nome}: il file del carattere non c'è o non si carica`);
    // (b) e (c)
    const cdp = await p.context().newCDPSession(p); await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
    const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
    const fonti = async (nodeId) => (await cdp.send('CSS.getPlatformFontsForNode', { nodeId })).fonts;
    for (const [i, c] of casi.entries()) {
      const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: `#car-${i}` });
      const sistema = (await fonti(nodeId)).filter((f) => !f.isCustomFont);
      if (sistema.length) errori.push(`D-257: ${c.fam} ${c.w}: ${sistema.map((f) => `${f.glyphCount} caratteri da «${f.familyName}» del sistema`).join(', ')}`);
    }
    const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: '#app :is(button, p, h1, h2, h3, span, strong, li)' });
    const home = new Set();
    for (const id of nodeIds) for (const f of await fonti(id)) if (!f.isCustomFont) home.add(f.familyName);
    if (home.size) errori.push(`D-257: home con testo dal carattere di sistema: ${[...home].join(', ')}`);
    // (d)
    const larga = await p.evaluate(() => document.getElementById('car-campione').getBoundingClientRect().width);
    if (Math.abs(larga - CAMPIONE.larghezza) > 0.01) errori.push(`D-257: larghezza campione di Inter 400 a 15 px ${larga.toFixed(3)} invece di ${CAMPIONE.larghezza} (resa con hinting o carattere diverso: gli a capo cambiano)`);
  } finally { await browser.close(); srv.close(); }
  return errori;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const errori = await giraCaratteri('dist', (process.env.VALMORA_ROSSI ?? '').split(',').filter(Boolean));
  console.log(errori.length ? errori.join('\n') : 'caratteri: verde'); process.exitCode = errori.length ? 1 : 0;
}
