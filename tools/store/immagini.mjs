// PO-144 (S-23): immagini della scheda Play Store, ripetibili. Uso: node tools/store/immagini.mjs [cartella] [build]
//   predefinite: store/it-IT, dist (serve `npx vite build` prima). Requisiti: tools/store/misure.mjs (fonte: answer 9866151).
// - icona.png 512×512, PNG RGBA (32 bit), dalla sorgente di tools/icona (stessa «piena» del lanciatore);
// - grafica.jpg 1024×500, JPEG (niente alfa), fatta dentro la build vera: token, caratteri e logo del gioco;
// - schermata-1..4.jpg 1080×1920 (9:16): home, città, una chiamata, il verbale di e01, dal gioco vero a 360×640 × 3.
//   Gli stati arrivano dal motore (giocatore attento di tools/foto.mjs) come salvataggi; poi «Riprendi».
// Rossi (VALMORA_ROSSI=…, solo per provare il guardiano): C268S01 bollo della versione nelle schermate (C54-02), S23I01 icona a 1024 px, S23F01 grafica in PNG con alfa,
// S23S01 schermate a densità 1 (360×640).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { servi, pianoAttento } from '../foto.mjs';
import { iconaSvg } from '../icona/icona.svg.mjs';
import { rgba } from './png.mjs';
import { leggiDati } from '../dati-disco.mjs';
import { variabiliIniziali } from '../../src/logica/condizioni.ts';
import { chiamateAperte, chiudiOndata, iniziaMissione, rispondi, schiera } from '../../src/logica/missione.ts';
import { attenta } from '../../src/logica/bot.ts';
import { creaCaso } from '../../src/logica/caso.ts';
import { GAME_VERSION } from '../../src/versione.ts';

const cartella = process.argv[2] ?? 'store/it-IT', build = process.argv[3] ?? 'dist';
for (const x of (process.env.VALMORA_ROSSI ?? '').split(',').filter(Boolean)) globalThis[`__NO_${x}`] = true;
const rossi = { has: (x) => globalThis[`__NO_${x}`] === true }; // interruttori rossi globalThis.__NO_S23…
mkdirSync(cartella, { recursive: true });

// Stati della partita (deterministici: seme 1, giocatore attento).
const dati = leggiDati('data'), dich = new Map(dati['stato.json'].variabili.map((d) => [d.id, d]));
const piano = pianoAttento('data', 0), m = piano.m, v0 = variabiliIniziali(dich.values());
const base = { save_version: 2, game_version: GAME_VERSION, seme: 1, caso: 1, variabili: v0, missioni_concluse: [], episodi: {}, genere: 'm', rapporto_aperto: null, in_corso: null };
function allaChiamata() { // la prima chiamata aperta della partita attenta
  const g = attenta(creaCaso(1), dich);
  let s = iniziaMissione(m, v0, dich);
  for (let n = 0; n < 10; n++) {
    s = schiera(m, s, g.schiera(m, s));
    if (chiamateAperte(m, s).length) return s;
    for (let c = chiamateAperte(m, s)[0]; c; c = chiamateAperte(m, s)[0]) s = rispondi(m, s, c.id, g.scegli(m, s, c), dich);
    s = chiudiOndata(m, s, dich);
  }
  throw new Error(`${m.id}: nessuna chiamata aperta`);
}

const srv = await servi(build), url = `http://127.0.0.1:${srv.address().port}/`;
const browser = await chromium.launch({ executablePath: process.env.VALMORA_CHROME ?? '/opt/pw-browsers/chromium' });
const fatti = [];
try {
  // Icona
  const p = await browser.newPage();
  const lato = rossi.has('S23I01') ? 1024 : 512;
  await p.setViewportSize({ width: lato, height: lato });
  await p.setContent(`<html><body style="margin:0;background:transparent">${iconaSvg({ sfondo: true, scala: 1.25 }).replace('width="1024" height="1024"', `width="${lato}" height="${lato}"`)}</body></html>`);
  writeFileSync(join(cartella, 'icona.png'), rgba(await p.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: lato, height: lato } }))); // 32 bit (png.mjs)
  fatti.push('icona.png');

  // Grafica in evidenza: dentro la build, così valgono token.css, caratteri e classi del logo.
  await p.setViewportSize({ width: 1024, height: 500 });
  await p.goto(url); await p.waitForSelector('main[data-schermata="titolo"]');
  await p.evaluate(() => {
    document.body.innerHTML = `<div style="width:1024px;height:500px;display:flex;align-items:center;gap:var(--spazio-6);padding:0 var(--spazio-6);box-sizing:border-box;background:var(--colore-fondo)">
      <img src="./icone/icona.svg" alt="" style="width:300px;height:300px;flex:none;border:var(--bordo) solid var(--nero);box-shadow:var(--ombra-1)">
      <div class="logo"><h1 class="logo-nome" style="font-size:80px;white-space:nowrap">Vandel Falls</h1>
      <div class="logo-sotto" style="font-size:40px;margin-top:var(--spazio-4)">Cortina di fumo</div></div></div>`;
  });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(200);
  if (rossi.has('S23F01')) writeFileSync(join(cartella, 'grafica.png'), rgba(await p.screenshot({ omitBackground: true })));
  else writeFileSync(join(cartella, 'grafica.jpg'), await p.screenshot({ type: 'jpeg', quality: 90 }));
  fatti.push('grafica');
  await p.close();

  // Schermate dal gioco vero: 360×640 CSS × 3 = 1080×1920.
  const dsf = rossi.has('S23S01') ? 1 : 3;
  const scatta = async (n, salvataggio, arriva) => {
    const q = await browser.newPage({ viewport: { width: 360, height: 640 }, deviceScaleFactor: dsf, reducedMotion: 'reduce' });
    const errori = []; q.on('pageerror', (e) => errori.push(e.message));
    await q.goto(url);
    await q.evaluate((v) => { localStorage.clear(); localStorage.setItem('vandelfalls-guida-vista', 'si'); if (v) localStorage.setItem('vandelfalls-salvataggio', v); }, salvataggio && JSON.stringify(salvataggio));
    await q.reload(); await q.waitForSelector('main[data-schermata="titolo"]');
    const scena = await arriva(q);
    await q.evaluate(() => document.fonts.ready); await q.mouse.move(0, 0);
    // il verbale entra con una transizione: si scatta a animazioni finite (prima: 2 schermate diverse su 5 giri)
    await q.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'), null, { timeout: 10000 }); await q.waitForTimeout(400);
    if (errori.length) throw new Error(`schermata ${n}: ${errori.join('; ')}`);
    // C54-02 (D-268): il bollo della versione invecchiava le foto a ogni rilascio (lo store aveva «v0.56.0» con la 0.57.0):
    // nelle schermate dello store non c'è. Guardiano: se dopo averlo nascosto si vede ancora, lo strumento si ferma.
    // Rosso C268S01: non si nasconde (e il guardiano lo deve vedere).
    if (!rossi.has('C268S01')) await q.addStyleTag({ content: '[data-versione-angolo] { visibility: hidden !important; }' });
    if (await q.evaluate(() => [...document.querySelectorAll('[data-versione-angolo]')].some((e) => e.checkVisibility({ visibilityProperty: true }))))
      throw new Error(`schermata ${n}: si vede il bollo della versione (C54-02: le foto dello store non lo portano)`);
    writeFileSync(join(cartella, `schermata-${n}.jpg`), await q.screenshot({ type: 'jpeg', quality: 90 }));
    fatti.push(`schermata-${n} (${scena})`); await q.close();
  };
  const ferma = (q, nome) => q.waitForFunction((x) => document.querySelector(`.scena[data-scena="${x}"]`) && document.querySelectorAll('.scena').length === 1 && getComputedStyle(document.querySelector('.scena')).opacity === '1' && [...document.querySelectorAll('.mappa')].every((y) => y.dataset.pronta === 'si'), nome, { timeout: 15000 }).then(() => nome);
  const riprendi = async (q) => { await q.getByRole('button', { name: 'Riprendi' }).click(); };
  await scatta(1, base, async () => 'titolo');
  await scatta(2, base, async (q) => { await riprendi(q); return ferma(q, 'citta'); });
  await scatta(3, { ...base, in_corso: allaChiamata() }, async (q) => { await riprendi(q); return ferma(q, 'chiamata'); });
  await scatta(4, { ...base, in_corso: piano.ic }, async (q) => {
    await riprendi(q); await ferma(q, 'rapporto');
    for (let i = 0; i < 12 && !(await q.locator('.scena[data-scena="verbale"]').count()); i++) {
      const b = q.locator('.scena [data-azione="continua"], .scena [data-azione="avanti"], .scena [data-azione="passo"]').first();
      if (!(await b.count())) break;
      await b.click(); await q.waitForTimeout(300);
    }
    return ferma(q, 'verbale');
  });
} finally { await browser.close(); srv.close(); }
console.log(`immagini in ${cartella}: ${fatti.join(', ')} (e01 «${m.id}», giocatore ${piano.giocatore})`);
