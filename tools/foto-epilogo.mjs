// Guardiani nel browser di D-161 (epilogo dopo e36) e D-164 (passo «Fine stagione» nel verbale di e12 ed e24), con foto.
// Si parte dal salvataggio vero della partita A-Z (tests/salvataggi-reali/v2-0.38.0-fine-campagna.json): registro fino
// all'episodio prima, variabili di partenza dell'episodio dal registro (D-062), episodio giocato fino all'ultimo rapporto
// dal motore (pianoAttento di foto.mjs) e messo in «in_corso». Poi «Riprendi» → rapporto → verbale, come un giocatore.
// Rossi: VALMORA_ROSSI=C161E01 (dopo e36 solo la mappa), C164F01 (nessun passo «Fine stagione»), C165F01 (niente fischio),
// C165T01 (epilogo a schede invece delle tavole).
// Uso a mano: node tools/foto-epilogo.mjs <cartella-foto> [larghezze]   (build già fatta in dist/)
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { chromium } from 'playwright-core';
import { pazienza } from './attese.mjs';
import { leggiDati } from './dati-disco.mjs';
import { avanzaFino } from './foto-club.mjs';
import { pianoAttento } from './foto.mjs';
import { completaVariabili } from '../src/logica/aggiornamento.ts';

export const LARGHEZZE_EPILOGO = [360, 375, 412, 1366];
const FINALE = 'tests/salvataggi-reali/v2-0.38.0-fine-campagna.json';
const TIPI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webp': 'image/webp', '.jpg': 'image/jpeg' };

/** Salvataggio con l'episodio «id» giocato fino all'ultimo rapporto (in_corso), registro degli episodi prima. */
export function salvataggioAlRapporto(id, dirDati = 'data') {
  const fine = JSON.parse(readFileSync(FINALE, 'utf8'));
  const missioni = Object.entries(leggiDati(dirDati)).filter(([k]) => k.startsWith('missioni/')).map(([, m]) => m).sort((a, b) => a.episodio - b.episodio);
  const i = missioni.findIndex((m) => m.id === id), prima = missioni.slice(0, i).map((m) => m.id);
  // come il gioco al caricamento (C14-03): le variabili dichiarate dopo il salvataggio (es. «carte», D-189) al valore iniziale
  const v0 = completaVariabili(fine.episodi[id].variabili_prima, leggiDati(dirDati)['stato.json'].variabili);
  const piano = pianoAttento(dirDati, i, v0);
  return {
    piano, salvataggio: {
      ...fine, variabili: v0, missioni_concluse: fine.missioni_concluse.filter((x) => prima.includes(x)),
      episodi: Object.fromEntries(prima.map((x) => [x, fine.episodi[x]])), in_corso: piano.ic, rapporto_aperto: piano.ic.rapporti.at(-1).n, sconfitta: null, bozza: null,
    },
  };
}

// VALMORA_LARGHEZZE (CI divisa per larghezza) limita anche questo giro, come quello di foto.mjs
const daAmbiente = () => (process.env.VALMORA_LARGHEZZE ? process.env.VALMORA_LARGHEZZE.split(',').map(Number) : LARGHEZZE_EPILOGO);
export async function giraEpilogo(cartella = 'out/foto', build = 'dist', larghezze = daAmbiente(), rossi = (process.env.VALMORA_ROSSI ?? '').split(',').filter(Boolean)) {
  mkdirSync(cartella, { recursive: true });
  const srv = await new Promise((ok) => { const s = createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); const p = join(build, u === '/' ? 'index.html' : u);
    if (!existsSync(p)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': TIPI[extname(p)] ?? 'application/octet-stream' }); r.end(readFileSync(p)); }); s.listen(0, '127.0.0.1', () => ok(s)); });
  const browser = pazienza(await chromium.launch({ executablePath: process.env.VALMORA_CHROME ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined) }));
  const stati = Object.fromEntries(['e12', 'e24', 'e36'].map((id) => [id, salvataggioAlRapporto(id)]));
  const giri = [];
  try {
    for (const larghezza of larghezze) {
      const g = { larghezza, errori: [], scorrimento: [], attesi: [] };
      const atteso = (cosa, ok) => g.attesi.push({ cosa: `epilogo: ${cosa}`, ok });
      const pagina = await browser.newPage({ viewport: { width: larghezza, height: larghezza > 1000 ? 768 : 800 }, reducedMotion: 'reduce' });
      if (rossi.length) await pagina.addInitScript((xs) => { for (const x of xs) globalThis[`__NO_${x}`] = true; }, rossi);
      pagina.on('console', (m) => { if (m.type() === 'error') g.errori.push(m.text()); });
      pagina.on('pageerror', (e) => g.errori.push(e.message));
      // strumento instabile (28/10, bracci in parallelo con carico ~20 su 4 core: il clic su «avanti» fermo 30 s mentre la pagina
      // calcola il verbale): si attende la scena e il clic fino a 60 s. È un'attesa, non una soglia: se la scena non arriva, rosso
      const scena = async (nome) => {
        await pagina.waitForSelector(`.scena[data-scena="${nome}"]`, { timeout: 60_000 });
        await pagina.waitForFunction(() => document.querySelectorAll('.scena').length === 1 && getComputedStyle(document.querySelector('.scena')).opacity === '1', null, { timeout: 60_000 });
      };
      const foto = async (nome) => {
        const [contenuto, finestra] = await pagina.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
        if (contenuto > finestra) g.scorrimento.push({ schermata: nome, contenuto, finestra });
        await pagina.screenshot({ path: join(cartella, `${larghezza}-${nome}.jpg`), fullPage: true, type: 'jpeg', quality: 70 });
      };
      /** Comandi visibili sotto 44 px, testi sotto 12 px, chiavi di testo mancanti «[[…]]». */
      const misure = async (dove) => {
        const r = await pagina.evaluate(() => ({
          piccoli: [...document.querySelectorAll('.scena button')].filter((b) => b.getClientRects().length).map((b) => [b.textContent.trim() || b.getAttribute('aria-label'), b.getBoundingClientRect()])
            .filter(([, q]) => q.width < 44 || q.height < 44).map(([n, q]) => `${n} ${q.width.toFixed(0)}×${q.height.toFixed(0)}`),
          minuti: [...document.querySelectorAll('.scena *')].filter((e) => e.getClientRects().length && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 12).map((e) => e.textContent.trim().slice(0, 20)),
          mancanti: (document.querySelector('.scena')?.textContent.match(/\[\[[^\]]+\]\]/g) ?? []),
        }));
        atteso(`${dove}: tocchi sotto 44 px: ${r.piccoli.join(', ')}`, !r.piccoli.length);
        atteso(`${dove}: testi sotto 12 px: ${r.minuti.join(', ')}`, !r.minuti.length);
        atteso(`${dove}: testi mancanti ${r.mancanti.join(', ')}`, !r.mancanti.length);
      };
      const alVerbale = async (id) => {
        await pagina.goto(`http://127.0.0.1:${srv.address().port}/`); await scena('titolo');
        await pagina.evaluate((v) => localStorage.setItem('vandelfalls-salvataggio', v), JSON.stringify(stati[id].salvataggio));
        await pagina.reload(); await scena('titolo');
        await pagina.getByRole('button', { name: 'Riprendi' }).click(); await scena('rapporto');
        await pagina.click('[data-azione="avanti"]', { timeout: 60_000 }); await scena('verbale');
        atteso(`${id}: verbale fallito (${stati[id].piano.esito}), il controllo non si può fare`, !stati[id].piano.fallita);
        await avanzaFino(pagina, '.passi-nav[data-ultimo]', async () => {});
      };
      try {
        // D-164: e12 ed e24, ultimo passo «Fine stagione N» con stelle e fili aperti, poi «Prossimo episodio» = stagione nuova
        for (const [id, n, dopo] of [['e12', 1, 'e13'], ['e24', 2, 'e25']]) {
          await alVerbale(id);
          const passo = pagina.locator(`.passo:not([hidden]) [data-fine-stagione="${n}"]`);
          atteso(`${id}: ultimo passo del verbale senza «Fine stagione ${n}» (D-164)`, (await passo.count()) === 1);
          if (await passo.count()) {
            const [stelle, aperti] = await pagina.evaluate(() => [document.querySelectorAll('.passo:not([hidden]) [data-stelle-stagione]').length, document.querySelectorAll('.passo:not([hidden]) [data-fili="aperti"] [data-filo]').length]);
            atteso(`${id}: «Fine stagione» con ${stelle} righe di stelle e ${aperti} fili aperti (servono 1 e ≥ 1)`, stelle === 1 && aperti >= 1);
          }
          await misure(`${id} fine stagione`); await foto(`${id}-verbale-fine`);
          // C43-06 (D-196): il passo non scorre e «Prossimo episodio» è nella finestra (e24 a 360×760: 250 px, top 896). Rosso C196V01.
          const [ecc, giu] = await pagina.evaluate(() => [document.scrollingElement.scrollHeight - innerHeight, (document.querySelector('[data-azione="prossimo"]')?.getBoundingClientRect().bottom ?? 0) - innerHeight]);
          atteso(`${id} fine stagione ${pagina.viewportSize().width}×${pagina.viewportSize().height}: la pagina scorre di ${ecc} px, «Prossimo episodio» ${giu > 0 ? `${Math.round(giu)} px sotto la piega` : 'in vista'} (C43-06)`, ecc <= 0 && giu <= 0);
          const prossimo = pagina.locator('[data-azione="prossimo"]');
          atteso(`${id}: manca «Prossimo episodio» dopo «Fine stagione»`, (await prossimo.count()) === 1);
          if (await prossimo.count()) { await prossimo.click(); await scena('sala'); const m = await pagina.getAttribute('.scena', 'data-missione'); atteso(`${id}: «Prossimo episodio» apre ${m} invece di ${dopo}`, m === dopo); }
        }
        // D-161: e36 → «Epilogo» → schermata con carriera, sei scelte, stelle → città (anche da tastiera) → «Rileggi l'epilogo»
        await alVerbale('e36');
        await foto('e36-verbale-fine');
        const vai = pagina.locator('.passo:not([hidden]) ~ .passi-nav [data-azione="epilogo"], .passi-nav [data-azione="epilogo"]');
        atteso('e36: ultimo passo del verbale senza «Epilogo» (D-161)', (await vai.count()) === 1);
        if (await vai.count()) {
          // D-165 parte 1: fischio, col movimento (si spegne un settore alla volta) e salto con Invio. Rosso C165F01: niente.
          await pagina.emulateMedia({ reducedMotion: 'no-preference' });
          await vai.click();
          const fischio = await pagina.waitForSelector('.scena[data-scena="fischio"]', { timeout: 5000 }).then(() => true, () => false);
          atteso('e36: dopo «Epilogo» manca il fischio dell\'ultimo derby (D-165)', fischio);
          if (fischio) {
            const prima = await pagina.evaluate(() => [document.querySelectorAll('.mappa .settore.spento').length, document.querySelectorAll('.mappa .settore').length, document.querySelector('.mappa')?.dataset.vuota]);
            atteso(`e36 fischio: all'inizio ${prima[0]} settori spenti su ${prima[1]} (si spengono uno alla volta), città vuota «${prima[2]}»`, prima[0] < prima[1] && prima[2] === 'si');
            const buio = await pagina.waitForSelector('[data-fischio="buio"]', { timeout: 15000 }).then(() => true, () => false);
            const dopo = await pagina.evaluate(() => [document.querySelectorAll('.mappa .settore.spento').length, !!document.querySelector('.mappa.buio')]);
            atteso(`e36 fischio: alla fine ${dopo[0]} settori spenti su ${prima[1]}, sala al buio ${dopo[1]}`, buio && dopo[0] === prima[1] && dopo[1]);
            await misure('e36 fischio'); await foto('e36-fischio');
            await pagina.evaluate(() => document.querySelector('.scena')?.focus()); await pagina.keyboard.press('Enter');
          }
          await pagina.emulateMedia({ reducedMotion: 'reduce' });
          await scena('epilogo');
          // D-165/D-171: tavole grandi, una per filo coi valori della partita, poi il bar con protagonista e Malvasi (busti PO-119)
          const v = stati.e36.salvataggio.variabili, genere = stati.e36.salvataggio.genere;
          const r = await pagina.evaluate(() => ({
            tavole: [...document.querySelectorAll('.scena [data-tavola]')].map((x) => `${x.dataset.tavola}=${x.dataset.valore ?? x.dataset.carriera}`),
            busti: [...document.querySelectorAll('[data-tavola="bar"] [data-busto]:not([data-busto="1"])')].map((x) => x.dataset.busto).join(','),
            numeri: document.querySelectorAll('[data-tavola="bar"] [data-numeri] .etichetta').length, fuoco: !!document.activeElement?.closest('.scena'),
            riga: document.querySelector('[data-tavola="fabbro"] [data-riga="pista_cattura"]')?.dataset.valore ?? null }));
          // C43-01 (D-196): anche la tavola «carte» (D-189). Rosso VALMORA_ROSSI=C4301: manca
          const attese = [`fabbro=${v.rapporto_dessi}`, `testimone=${v.testimone}`, `busta=${v.busta}`, `talpa=${v.sospetti_talpa}`, `fascicolo=${v.fascicolo}`, `carte=${v.carte}`];
          atteso(`e36 epilogo: tavole «${r.tavole.join(', ')}» invece di «${attese.join(', ')}, bar» (D-165, D-171, D-189)`, r.tavole.slice(0, attese.length).join() === attese.join() && /^bar=(confermato|prorogato|sostituito)$/.test(r.tavole[attese.length] ?? ''));
          atteso(`e36 epilogo: al bar i busti «${r.busti}» (servono protagonista ${genere === 'f' ? 'lunghi' : 'corti'} e Malvasi berretto)`, r.busti === `${genere === 'f' ? 'lunghi' : 'corti'},berretto`);
          atteso(`e36 epilogo: ${r.numeri} numeri della carriera (stelle, episodi, fiducia)`, r.numeri === 3);
          // D-197: «pista_cattura» come riga sotto la tavola del Fabbro. Rosso VALMORA_ROSSI=C4301P: manca
          atteso(`e36 epilogo: sotto il Fabbro la riga «pista_cattura» = ${r.riga} invece di ${v.pista_cattura}`, r.riga === String(v.pista_cattura));
          atteso('e36 epilogo: il fuoco non è sulla scena (D-142)', r.fuoco);
          await misure('e36 epilogo'); await foto('e36-epilogo');
          // da tastiera: Tab fino ad «Alla mappa della città», Invio → città
          let tab = 0;
          while (tab < 12 && !(await pagina.evaluate(() => document.activeElement?.dataset?.azione === 'citta' && !!document.activeElement.closest('.scena')))) { await pagina.keyboard.press('Tab'); tab++; }
          atteso(`e36 epilogo: «Alla mappa della città» non raggiunto con ${tab} Tab`, tab < 12);
          await pagina.keyboard.press('Enter'); await scena('citta');
          const rileggi = pagina.locator('[data-azione="epilogo"]');
          atteso('città a campagna finita: manca «Rileggi l\'epilogo» (D-161)', (await rileggi.count()) === 1);
          await misure('città a campagna finita'); await foto('e36-citta');
          if (await rileggi.count()) { await rileggi.click(); await scena('epilogo'); await pagina.click('.scena [data-azione="citta"]'); await scena('citta'); }
        }
      } catch (e) { g.errori.push(`giro interrotto: ${e.message.split('\n')[0]}`); }
      await pagina.close();
      giri.push(g);
    }
  } finally { await browser.close(); srv.close(); }
  return giri;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const giri = await giraEpilogo(process.argv[2] ?? 'out/foto-epilogo', 'dist', process.argv[3] ? process.argv[3].split(',').map(Number) : LARGHEZZE_EPILOGO);
  const { controllaGiro } = await import('./controlli-grafica.mjs');
  const p = giri.flatMap(controllaGiro);
  console.log(p.length ? p.join('\n') : 'verde'); process.exit(p.length ? 1 : 0);
}
