// D-272 (PO-160) passo 1: i nomi dei settori come ostacoli del riquadro radio. Foto e fogli-provini PRIMA / A / B.
// PRIMA = rosso C272N01 sulla build A (il riquadro ignora i nomi, come main); A = nomi ostacoli veri (se il riquadro non trova
// posto va «stretto» o «muto»: l'indicazione passa sotto la mappa); B = prima i nomi ostacoli, senza posto si torna agli ostacoli
// di prima (copre i nomi solo quando altrimenti sarebbe «muto»). Episodi e01, e03, e13 (viale_pieno), e35; stati «puoi» e «dove».
// Uso: node coordination/handoffs/sviluppatrice/d272/provini.mjs <build A> <build B>   (foto in out/d272/, fogli accanto a questo file)
// Versione d'uscita (variante A + memo + testo breve + strada 1): node … provini.mjs --uscita <build di main> <build del ramo>
//   colonne PRIMA (main) e DOPO (ramo) per «puoi», «dove» e «dopo la mossa»; fogli provini-uscita-<vp>.png
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { servi } from '../../../../tools/foto.mjs';
import { leggiDati } from '../../../../tools/dati-disco.mjs';
import { chiamateCostruite } from '../../../../tools/sonda-altezze.mjs';

const uscita = process.argv[2] === '--uscita', [buildA, buildB] = process.argv.slice(uscita ? 3 : 2);
const VP = [[360, 640], [375, 667], [412, 915]], EPISODI = [['e01'], ['e03'], ['e13', 'viale_pieno'], ['e35']], STATI = uscita ? ['puoi', 'dove', 'dopo'] : ['puoi', 'dove'];
const qui = dirname(fileURLToPath(import.meta.url)), radice = resolve(uscita ? 'out/d272-uscita' : 'out/d272');
const VARIANTI = uscita ? [['PRIMA', buildA, []], ['DOPO', buildB, []]] : [['prima', buildA, ['C272N01']], ['A', buildA, []], ['B', buildB, []]];
const dati = leggiDati(), dich = new Map(dati['stato.json'].variabili.map((d) => [d.id, d])), tutte = chiamateCostruite(dati, dich);
const b = await chromium.launch({ executablePath: process.env.VALMORA_CHROME ?? '/opt/pw-browsers/chromium' }), male = [];
for (const [nomeV, build, rossi] of VARIANTI) {
  const srv = await servi(build), url = `http://127.0.0.1:${srv.address().port}/`, cartella = join(radice, nomeV); mkdirSync(cartella, { recursive: true });
  for (const [w, h] of VP) for (const [ep, id] of EPISODI) {
    let ok = false;
    for (const c of tutte.filter((x) => x.ep === ep && (!id || x.id === id)).slice(0, 6)) {
      const ch = dati[`missioni/${ep}.json`].ondate.flatMap((o) => o.chiamate ?? []).find((x) => x.id === c.id);
      const p = await b.newPage({ viewport: { width: w, height: h }, hasTouch: true, reducedMotion: 'reduce' });
      await p.addInitScript((xs) => { globalThis.__VALMORA_SECONDO_MS = 1; for (const x of xs) globalThis[`__NO_${x}`] = true; }, rossi);
      await p.goto(url); await p.evaluate((v) => localStorage.setItem('vandelfalls-salvataggio', v), c.sal); await p.reload();
      await p.getByRole('button', { name: 'Riprendi' }).click();
      const aperta = await p.waitForSelector(`[data-messaggio="chiamata-${c.id}"]`, { timeout: 15000 }).then(() => true, () => false);
      if (!aperta || !ch) { await p.close(); continue; }
      await p.click(`[data-opzione="${ch.opzioni[0].id}"]`); await p.click('[data-conferma]').catch(() => {});
      if (!(await p.waitForSelector('.mappa [data-mossa="puoi"]', { timeout: 15000, state: 'attached' }).then(() => true, () => false))) { await p.close(); continue; }
      await p.waitForTimeout(6000); // segni e versione spariti: la foto è la pagina ferma
      await p.screenshot({ path: join(cartella, `${w}x${h}-${ep}-puoi.png`) });
      const u = await p.$('.mappa [data-presenza]:not(:disabled)');
      if (u) { await u.click({ force: true }); await p.waitForTimeout(400); await p.screenshot({ path: join(cartella, `${w}x${h}-${ep}-dove.png`) });
        const a = uscita && await p.$('.mappa .settore-punto:not(:disabled)'); if (a) { await a.click({ force: true }); await p.waitForTimeout(2500); await p.screenshot({ path: join(cartella, `${w}x${h}-${ep}-dopo.png`) }); } }
      ok = true; await p.close(); break;
    }
    if (!ok) male.push(`${nomeV} ${w}x${h} ${ep}: nessuna chiamata con la mossa`);
  }
  srv.close();
}
for (const [w, h] of VP) {
  const s = 0.5, cella = (v, ep, st) => `<img src="file://${join(radice, v, `${w}x${h}-${ep}-${st}.png`)}" width="${Math.round(w * s)}" height="${Math.round(h * s)}">`;
  const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:16px;background:#f3f3f3;font:13px/1.3 sans-serif;color:#111}
    h1{font-size:18px;margin:0 0 4px}p{margin:0 0 12px}table{border-collapse:collapse}td,th{padding:4px 6px;vertical-align:top;text-align:center}
    .sx{border-left:2px solid #111}img{display:block;border:1px solid #999}</style>
    <h1>${uscita ? 'D-272: nomi mai coperti, mappa più leggera, testo sotto la mappa compatto' : 'D-272 passo 1: nomi dei settori e riquadro radio'} · ${w}×${h}</h1>
    <p>${uscita ? 'PRIMA: main 0.67.x. DOPO: il riquadro radio non copre mai i nomi dei settori (variante A); se non trova posto, indicazione e costo si leggono sotto la mappa, in testo piccolo; «Previsione: nessun cambiamento.».' : 'PRIMA: il riquadro può coprire i nomi (come main). A: i nomi sono ostacoli; senza posto il riquadro si riduce o passa sotto la mappa. B: come A, ma senza posto torna a coprire i nomi invece di sparire.'}</p>
    <table><tr><th></th>${STATI.map((st) => `<th colspan="${VARIANTI.length}" class="sx">${st === 'puoi' ? '«Puoi spostare»' : st === 'dove' ? 'Unità in mano' : 'Dopo la mossa'}</th>`).join('')}</tr>
    <tr><th></th>${STATI.map(() => VARIANTI.map(([v], i) => `<th${i ? '' : ' class="sx"'}>${v}</th>`).join('')).join('')}</tr>
    ${EPISODI.map(([ep, id]) => `<tr><th>${ep}${id ? `<br>${id}` : ''}</th>${STATI.map((st) => VARIANTI.map(([v], i) => `<td${i ? '' : ' class="sx"'}>${cella(v, ep, st)}</td>`).join('')).join('')}</tr>`).join('')}</table>`;
  const f = join(radice, `provini-${uscita ? 'uscita-' : ''}${w}x${h}.html`); writeFileSync(f, html); // da file: le foto file:// si caricano (da about:blank no)
  const pg = await b.newPage({ viewport: { width: 1600, height: 900 } }); await pg.goto(`file://${f}`); await pg.waitForTimeout(300);
  await pg.screenshot({ path: join(qui, `provini-${uscita ? 'uscita-' : ''}${w}x${h}.png`), fullPage: true }); await pg.close();
}
await b.close();
for (const x of male) console.log(`MANCA: ${x}`);
