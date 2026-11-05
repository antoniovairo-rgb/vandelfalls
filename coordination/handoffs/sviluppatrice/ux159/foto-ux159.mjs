// PO-159 / D-271: foto della mossa in ondata, PRIMA e DOPO, per i provini del PO.
// Episodi e01, e03, e16 (imprevisto imp_nebbia), e35; stati «puoi» (risposta con la mossa), «dove» (prima unità in mano),
// «dopo» (mossa fatta sul primo settore ammesso); a 360×640, 375×667 e 412×915. Chiamate costruite col motore (sonda-altezze),
// aperte da salvataggio come in tools/foto-po152-b.mjs.
// Uso: node coordination/handoffs/sviluppatrice/ux159/foto-ux159.mjs <build> <etichetta>   (foto in out/ux159/<etichetta>/)
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { servi } from '../../../../tools/foto.mjs';
import { leggiDati } from '../../../../tools/dati-disco.mjs';
import { chiamateCostruite } from '../../../../tools/sonda-altezze.mjs';

export const VP = [[360, 640], [375, 667], [412, 915]];
export const EPISODI = [['e01'], ['e03'], ['e16', 'imp_nebbia'], ['e35']];
export const STATI = ['puoi', 'dove', 'dopo'];
const CHIAVE = 'vandelfalls-salvataggio';

export async function foto(build, etichetta, browser) {
  const dati = leggiDati(), dich = new Map(dati['stato.json'].variabili.map((d) => [d.id, d])), tutte = chiamateCostruite(dati, dich);
  const srv = await servi(build), url = `http://127.0.0.1:${srv.address().port}/`, cartella = join('out/ux159', etichetta), fatte = [], male = [];
  mkdirSync(cartella, { recursive: true });
  for (const [w, h] of VP) for (const [ep, id] of EPISODI) {
    const candidate = tutte.filter((c) => c.ep === ep && (!id || c.id === id));
    let ok = false;
    for (const c of candidate.slice(0, 6)) {
      const ch = dati[`missioni/${ep}.json`].ondate.flatMap((o) => o.chiamate ?? []).find((x) => x.id === c.id)
        ?? dati[`imprevisti/${ep}.json`]?.imprevisti?.find?.((x) => x.id === c.id);
      const p = await browser.newPage({ viewport: { width: w, height: h }, hasTouch: true, reducedMotion: 'reduce' });
      await p.addInitScript(() => { globalThis.__VALMORA_SECONDO_MS = 1; });
      await p.goto(url); await p.evaluate(([k, v]) => localStorage.setItem(k, v), [CHIAVE, c.sal]); await p.reload();
      await p.getByRole('button', { name: 'Riprendi' }).click();
      const aperta = await p.waitForSelector(`[data-messaggio="chiamata-${c.id}"]`, { timeout: 15000 }).then(() => true, () => false);
      const op = ch?.opzioni?.[0]?.id ?? await p.$eval('[data-opzione]:not(:disabled)', (e) => e.dataset.opzione).catch(() => null);
      if (!aperta || !op) { await p.close(); continue; }
      await p.click(`[data-opzione="${op}"]`); await p.click('[data-conferma]').catch(() => {});
      if (!(await p.waitForSelector('.mappa [data-mossa="puoi"]', { timeout: 15000, state: 'attached' }).then(() => true, () => false))) { await p.close(); continue; }
      const nome = (s) => join(cartella, `${w}x${h}-${ep}-${s}.png`);
      await p.waitForTimeout(6000); // la versione (D-271) ha già fatto il suo tempo: la foto è quella del gioco
      await p.screenshot({ path: nome('puoi') });
      const u = await p.$('.mappa [data-presenza]:not(:disabled)');
      if (!u) { await p.close(); continue; }
      await u.click({ force: true }); await p.waitForTimeout(300); await p.screenshot({ path: nome('dove') });
      const a = await p.$('.mappa .settore-punto:not(:disabled)');
      if (a) { await a.click({ force: true }); await p.waitForTimeout(400); await p.screenshot({ path: nome('dopo') }); }
      else male.push(`${w}x${h} ${ep} ${c.id}: nessun settore ammesso`);
      fatte.push(`${w}x${h} ${ep} ${c.id}/${op}`); ok = true; await p.close(); break;
    }
    if (!ok) male.push(`${w}x${h} ${ep}${id ? ` ${id}` : ''}: nessuna chiamata con la mossa`);
  }
  srv.close();
  return { fatte, male, cartella };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [build, etichetta] = process.argv.slice(2), b = await chromium.launch({ executablePath: process.env.VALMORA_CHROME ?? '/opt/pw-browsers/chromium' });
  const r = await foto(build, etichetta, b); await b.close();
  for (const x of r.fatte) console.log(`foto: ${x}`);
  for (const x of r.male) console.log(`MANCA: ${x}`);
  process.exit(r.male.length ? 1 : 0);
}
