// D-272 punto 0: quanto costa la disposizione dei nomi (disponiEtichette) e del riquadro radio (collocaRadio) in una risposta.
// Profilo CPU di Chrome dal «Conferma» alla risposta ferma, su una build NON minificata (i nomi delle funzioni restano), una
// pagina sola, CPU normale e rallentata (Emulation.setCPUThrottlingRate). Il tempo «incluso» di una funzione è la somma dei
// campioni in cui è nella pila. Misura per lo sviluppo, non è un guardiano: i millisecondi dipendono dalla macchina.
// Modo «conta» (D-272, misura del ×4): niente profilatore; disponiEtichette avvolta in una copia della build (dist-nomi-conta/)
// conta chiamate, origine (effetto di React, adatta ← ResizeObserver, rifai) e millisecondi; finestra fino a 2,5 s dopo la
// risposta ferma, uguale a ogni rallentamento (i segni spariscono dopo 1,8 s veri e portano un'altra chiamata).
// Uso: node tools/costo-nomi.mjs [quante risposte, 40] [viewport, 360x640] [rallentamenti, 1,4] [profilo|conta]   (costruisce dist-nomi/)
import { execSync } from 'node:child_process';
import { cpSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { servi } from './foto.mjs';
import { leggiDati } from './dati-disco.mjs';
import { risposteCostruite } from './sonda-altezze.mjs';

const [n = '40', vp = '360x640', rall = '1,4', modo = 'profilo'] = process.argv.slice(2), [w, h] = vp.split('x').map(Number), conta = modo === 'conta';
execSync('npx vite build --minify false --outDir dist-nomi --emptyOutDir', { stdio: 'ignore' });
if (conta) { rmSync('dist-nomi-conta', { recursive: true, force: true }); cpSync('dist-nomi', 'dist-nomi-conta', { recursive: true }); /* da capo: una copia vecchia aveva due index-*.js */ const f = `dist-nomi-conta/assets/${readdirSync('dist-nomi-conta/assets').find((x) => /^index-.*\.js$/.test(x))}`, s0 = readFileSync(f, 'utf8'), A = s0.match(/function disponiEtichette\(([^)]*)\) \{/)?.[0] ?? ''; // D-272 passo 2: anche con la disposizione di prima fra gli argomenti
  if (!A) throw new Error('disponiEtichette non trovata nella build');
  writeFileSync(f, s0.replace(A, `${A} const t0 = performance.now(), pila = new Error().stack ?? ''; try { return disponiEtichette__vera(...arguments); } finally {
    (globalThis.__DE ??= []).push({ ms: performance.now() - t0, da: pila.includes('commitHook') ? 'effetto' : pila.includes('adatta') ? 'adatta' : 'rifai' }); } }\nfunction disponiEtichette__vera${A.slice('function disponiEtichette'.length)}`)); }
const dati = leggiDati('data'), dich = new Map(dati['stato.json'].variabili.map((d) => [d.id, d]));
// una risposta per chiamata (la prima opzione valida), le prime n in ordine di episodio: stesso campione prima e dopo
const viste = new Set(), campione = risposteCostruite(dati, dich).filter((c) => !viste.has(`${c.ep}|${c.id}`) && viste.add(`${c.ep}|${c.id}`)).slice(0, Number(n));
const FUNZIONI = ['disponiEtichette', 'collocaRadio'];
const srv = await servi(conta ? 'dist-nomi-conta' : 'dist-nomi'), url = `http://127.0.0.1:${srv.address().port}/`;
const b = await chromium.launch({ executablePath: process.env.VALMORA_CHROME ?? '/opt/pw-browsers/chromium' });
const stat = (xs) => { const s = [...xs].sort((a, b2) => a - b2), m = s.reduce((a, x) => a + x, 0) / (s.length || 1);
  return { media: +m.toFixed(1), mediana: +(s[s.length >> 1] ?? 0).toFixed(1), min: +(s[0] ?? 0).toFixed(1), max: +(s.at(-1) ?? 0).toFixed(1), sd: +Math.sqrt(s.reduce((a, x) => a + (x - m) ** 2, 0) / (s.length || 1)).toFixed(1), prove: s.length }; };
for (const r of rall.split(',').map(Number)) {
  const q = await b.newPage({ viewport: { width: w, height: h }, hasTouch: true, reducedMotion: 'reduce' }), cdp = await q.context().newCDPSession(q);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: r }); await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 100 });
  await q.addInitScript((xs) => { globalThis.__VALMORA_SECONDO_MS = 1; for (const x of xs) globalThis[`__NO_${x}`] = true; }, (process.env.ROSSI ?? '').split(',').filter(Boolean)); await q.goto(url); // ROSSI=C272C01: il prima, stessa build
  const lento = () => q.waitForFunction(() => { const s = document.querySelectorAll('.scena'); return s.length === 1 && getComputedStyle(s[0]).opacity === '1'; }, null, { timeout: 8000 * r }).catch(() => {});
  const per = Object.fromEntries(FUNZIONI.map((f) => [f, []])), chiamate = Object.fromEntries(FUNZIONI.map((f) => [f, []])), tot = [], da = {}; let saltate = 0;
  for (const c of campione) {
    await q.evaluate((x) => localStorage.setItem('vandelfalls-salvataggio', x), c.sal); await q.reload(); await q.getByRole('button', { name: 'Riprendi' }).click();
    if (!(await q.waitForSelector(`[data-opzione="${c.op}"]`, { timeout: 8000 * r }).then(() => true, () => false))) { saltate++; continue; }
    await lento(); await q.click(`[data-opzione="${c.op}"]`);
    if (conta) { await q.evaluate(() => { globalThis.__DE = []; }); await q.click('[data-conferma]');
      const ok = await q.waitForSelector('.scena[data-scena="risposta"]', { timeout: 8000 * r }).then(() => true, () => false); await lento(); await q.waitForTimeout(2500 + 500 * r);
      const de = await q.evaluate(() => globalThis.__DE); if (!ok) { saltate++; continue; }
      per.disponiEtichette.push(de.reduce((a, x) => a + x.ms, 0)); chiamate.disponiEtichette.push(de.length); for (const x of de) (da[x.da] ??= []).push(x.ms); continue; }
    await cdp.send('Profiler.start'); await q.click('[data-conferma]');
    const ok = await q.waitForSelector('.scena[data-scena="risposta"]', { timeout: 8000 * r }).then(() => true, () => false); await lento(); await q.waitForTimeout(300);
    const { profile } = await cdp.send('Profiler.stop'); if (!ok) { saltate++; continue; }
    const padre = new Map(); for (const x of profile.nodes) for (const f of x.children ?? []) padre.set(f, x.id);
    const nodo = new Map(profile.nodes.map((x) => [x.id, x])), dentro = Object.fromEntries(FUNZIONI.map((f) => [f, 0])), entrate = Object.fromEntries(FUNZIONI.map((f) => [f, 0]));
    let occupato = 0;
    profile.samples.forEach((id, i) => { const dt = (profile.timeDeltas[i + 1] ?? 0) / 1000, viste2 = new Set();
      if (!/^\((idle|program)\)$/.test(nodo.get(id).callFrame.functionName)) occupato += dt;
      for (let k = id; k !== undefined; k = padre.get(k)) { const f = nodo.get(k).callFrame.functionName; if (f in dentro && !viste2.has(f)) { dentro[f] += dt; viste2.add(f); } } });
    // quante volte entra: nodi distinti della funzione con un padre che non è lei stessa
    for (const x of profile.nodes) { const f = x.callFrame.functionName; if (f in entrate && nodo.get(padre.get(x.id))?.callFrame.functionName !== f) entrate[f]++; }
    for (const f of FUNZIONI) { per[f].push(dentro[f]); chiamate[f].push(entrate[f]); } tot.push(occupato);
  }
  if (conta) console.log(JSON.stringify({ vp, cpu: `×${r}`, modo, risposte: campione.length - saltate, saltate, ms_per_risposta: stat(per.disponiEtichette), chiamate_per_risposta: stat(chiamate.disponiEtichette),
    ms_per_chiamata_per_origine: Object.fromEntries(Object.entries(da).map(([k, v]) => [k, stat(v)])) }));
  else console.log(JSON.stringify({ vp, cpu: `×${r}`, risposte: campione.length - saltate, saltate, ...Object.fromEntries(FUNZIONI.map((f) => [f, { ms: stat(per[f]), posti_nella_pila: stat(chiamate[f]) }])), occupato_ms: stat(tot) }));
  await q.close();
}
await b.close(); srv.close();
