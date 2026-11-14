// Giro di collaudo grafico: gioca e01 a una larghezza, fotografa (finestra reale, non pagina intera) e misura ogni stato.
// Uso: node giro.mjs <larghezza> <altezza> <cartella> [movimento=reduce|no-preference] [scala-testo=1]
import { chromium } from '../../../../node_modules/playwright-core/index.mjs';
import { servi } from '../../../../tools/foto.mjs';
import { auditPagina } from './audit-pagina.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
const [L, A, cartella, movimento = 'reduce', scala = '1'] = process.argv.slice(2);
mkdirSync(cartella, { recursive: true });
const srv = await servi('dist');
const url = `http://127.0.0.1:${srv.address().port}/`;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: +L, height: +A }, reducedMotion: movimento, hasTouch: true, deviceScaleFactor: 1 });
await p.addInitScript(() => { globalThis.__VALMORA_SECONDO_MS = 1; globalThis.__VALMORA_SEME_PARTITA = 1; });
if (+scala !== 1) await p.addInitScript((k) => { const fa = () => { const cs = getComputedStyle(document.documentElement); const nomi = ['mini', 'piccolo', 'base', 'grande', 'titolo', 'numero', 'logo']; const st = document.createElement('style'); st.dataset.collaudo = 'scala'; st.textContent = ':root{' + nomi.map((n) => `--testo-${n}:${parseFloat(cs.getPropertyValue('--testo-' + n)) * k}px`).join(';') + '}'; document.head.append(st); }; if (document.readyState === 'loading') addEventListener('DOMContentLoaded', fa); else fa(); }, +scala);
if (process.env.VISIONE) { const cdp = await p.context().newCDPSession(p); await cdp.send('Emulation.setEmulatedVisionDeficiency', { type: process.env.VISIONE }); }
const FERMA = process.env.FERMA; const SEMPRE = !!process.env.SEMPRE;
const errori = []; p.on('pageerror', (e) => errori.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
const stati = []; let n = 0; const visti = new Map();
const pronta = async () => { await p.waitForFunction(() => document.querySelectorAll('.scena').length === 1 && getComputedStyle(document.querySelector('.scena')).opacity === '1' && [...document.querySelectorAll('.mappa')].every((x) => x.dataset.pronta === 'si'), null, { timeout: 8000 }).catch(() => {}); await p.waitForTimeout(350); };
const stato = async (etichetta, { sempre = false, giu = false } = {}) => {
  await pronta();
  const k = (visti.get(etichetta) ?? 0) + 1; visti.set(etichetta, k);
  const a = await p.evaluate(auditPagina);
  const nome = `${L}-${String(++n).padStart(3, '0')}-${etichetta}${k > 1 ? '-' + k : ''}`;
  if (FERMA && visti.has(FERMA) && etichetta !== FERMA) throw new Error('FINE voluta');
  if (k <= 2 || sempre || SEMPRE) { await p.screenshot({ path: `${cartella}/${nome}.png` }); if (giu && a.alto > a.finestra + 4) { await p.evaluate(() => scrollTo(0, 1e6)); await p.waitForTimeout(200); await p.screenshot({ path: `${cartella}/${nome}-fondo.png` }); await p.evaluate(() => scrollTo(0, 0)); } }
  stati.push({ nome, etichetta, ...a });
  return a;
};
const c = async (sel) => (await p.locator(sel).count()) > 0 && p.locator(sel).first().isVisible();
const premi = async (sel) => p.locator(sel).first().click();
try {
  await p.goto(url); await p.evaluate(() => localStorage.clear()); await p.reload();
  await stato('titolo', { giu: true });
  await premi('[data-azione="altro"]'); await stato('titolo-altro', { giu: true });
  if (await c('[data-azione="crediti"]')) { await premi('[data-azione="crediti"]'); await stato('crediti', { giu: true }); await p.getByRole('button', { name: /Torna/ }).first().click(); await pronta(); }
  await premi('[data-azione="altro"]').catch(() => {});
  if (await c('[data-azione="privacy"]')) { await premi('[data-azione="privacy"]'); await stato('privacy', { giu: true }); await premi('[data-azione="privacy-indietro"]').catch(async () => p.getByRole('button', { name: /Torna|Indietro/ }).first().click()); await pronta(); }
  await p.getByRole('button', { name: 'Nuova partita' }).click(); await stato('genere', { giu: true });
  await premi('[data-genere="m"]');
  let mossaFatta = 0, schedaVista = false, homeVista = false, infoVista = false;
  for (let i = 0; i < 400; i++) {
    await pronta();
    const scena = await p.getAttribute('.scena', 'data-scena');
    if (scena === 'guida') { await stato('guida', { sempre: true }); await premi((await c('[data-azione="guida-avanti"]')) ? '[data-azione="guida-avanti"]' : '[data-azione="guida-fine"]'); continue; }
    if (scena === 'citta') {
      if (visti.has('verbale')) { await stato('citta-dopo', { giu: true }); break; }
      await stato('citta', { giu: true }); await premi('[data-azione="avvia-episodio"]'); continue;
    }
    if (scena === 'schieramento') {
      await stato('schieramento-vuoto', { giu: true });
      if (!visti.has('aiuto') && await c('[data-azione="aiuto"]')) { await premi('[data-azione="aiuto"]'); await stato('aiuto', { giu: true }); await premi('[data-azione="aiuto"]').catch(() => {}); await p.keyboard.press('Escape'); await pronta(); }
      let primo = true;
      for (let k = 0; k < 14; k++) {
        const r = p.locator('[data-risorsa]:not([disabled])'); if (!(await r.count())) break;
        await r.first().click(); if (primo) { await stato('schieramento-unita-scelta'); primo = false; }
        const pts = p.locator('.settore-punto'); await pts.nth(k % (await pts.count())).click({ force: true });
      }
      await stato('schieramento-pieno', { giu: true });
      // unità finita: tocco su un settore → avviso
      await p.locator('.settore-punto').first().click({ force: true }); if (await c('[data-avviso]')) await stato('schieramento-avviso');
      await premi('[data-azione="conferma"]'); await stato('schieramento-riepilogo', { giu: true });
      if (await c('[data-azione="conferma-davvero"]')) await premi('[data-azione="conferma-davvero"]');
      continue;
    }
    if (scena === 'chiamata') {
      await stato('chiamata', { giu: true });
      if (!infoVista && await c('[data-azione="info-ondata"]')) { infoVista = true; await premi('[data-azione="info-ondata"]'); await stato('info-ondata', { giu: true }); await premi('[data-azione="info-ondata"]').catch(() => {}); await p.keyboard.press('Escape'); await pronta(); }
      if (!schedaVista) { schedaVista = true; await p.locator('.settore-punto').nth(1).click({ force: true }).catch(() => {}); if (await c('[data-scheda-settore]')) { await stato('scheda-settore'); await p.keyboard.press('Escape'); await p.locator('[data-scheda-settore]').click().catch(() => {}); await pronta(); } }
      if (await c('[data-indicatore]')) { await premi('[data-indicatore]').catch(() => {}); await p.waitForTimeout(400); await stato('chiamata-opzioni'); }
      await p.locator('.opzione:not(.esaurita)').first().click(); await stato('chiamata-scelta');
      await premi('[data-conferma]').catch(() => {}); continue;
    }
    if (scena === 'risposta') {
      await stato('risposta', { giu: true });
      const spost = p.locator('.mappa.mossa [data-presenza]:not([disabled])');
      if (mossaFatta < 2 && await spost.count()) {
        await p.evaluate(() => scrollTo(0, 0));
        await spost.first().click({ force: true }); await p.waitForTimeout(300);
        const inMano = await c('.mossa-in-mano');
        if (inMano) {
          await stato('mossa-in-mano', { sempre: true });
          const dest = await p.evaluate(() => { const mano = document.querySelector('.mossa-in-mano')?.closest('[data-settore]')?.dataset.settore; return [...document.querySelectorAll('.mappa [data-settore]')].map((s) => s.dataset.settore).filter((s) => s !== mano); });
          for (const d of dest) { await p.locator(`[data-settore="${d}"] .settore-punto`).click({ force: true }); await p.waitForTimeout(150); if (!(await c('.mossa-in-mano'))) break; }
          await p.waitForTimeout(250); const a = await p.evaluate(auditPagina); stati.push({ nome: `${L}-mossa-subito`, etichetta: 'mossa-subito', ...a }); await p.screenshot({ path: `${cartella}/${L}-${String(++n).padStart(3, '0')}-mossa-subito-${mossaFatta + 1}.png` });
          await p.waitForTimeout(2300); await stato('mossa-dopo', { sempre: true, giu: true });
          mossaFatta++;
        }
      }
      if (!homeVista && await c('[data-azione="home"]')) { homeVista = true; await premi('[data-azione="home"]'); await p.waitForTimeout(400); await stato('titolo-riprendi', { giu: true }); await p.getByRole('button', { name: 'Riprendi' }).click(); await pronta(); continue; }
      await premi('[data-azione="continua"]'); continue;
    }
    if (await c('[data-azione="passo"]')) { await stato(scena + '-passo', { giu: true }); await premi('[data-azione="passo"]'); continue; }
    await stato(scena, { giu: true });
    let fatto = false;
    for (const az of ['avanti', 'prossimo', 'inizia', 'continua', 'rapporto', 'citta', 'vai-prossimo']) if (await c(`[data-azione="${az}"]`)) { await premi(`[data-azione="${az}"]`); fatto = true; break; }
    if (!fatto && (globalThis.__prove = (globalThis.__prove ?? 0) + 1) < 6) { await p.waitForTimeout(500); continue; }
    if (!fatto) { console.log('fermo su', scena, await p.evaluate(() => [...document.querySelectorAll('button')].map((x) => x.dataset.azione + '|' + x.textContent.trim().slice(0, 20)))); break; }
  }
} catch (e) { console.log('INTERROTTO', e.message.split('\n')[0]); await p.screenshot({ path: `${cartella}/${L}-interrotto.png` }); }
writeFileSync(`${cartella}/${L}-misure.json`, JSON.stringify({ L, A, movimento, scala, errori, stati }));
console.log(L, A, movimento, scala, 'stati', stati.length, 'errori', errori.length, [...visti.keys()].join(' '));
await b.close(); srv.close();
