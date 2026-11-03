import * as L from './lib.mjs';
import { writeFileSync } from 'node:fs';
const FOTO = '/home/user/vandelfalls/coordination/collaudi/c056'; const VP = [375, 667];
const a = await L.avvia(VP); const p = await a.nuova(null);
await p.getByRole('button', { name: 'Nuova partita' }).click(); await p.click('[data-genere="m"]'); await p.click('[data-azione="guida-salta"]');
const PIANO = [['e01', 'giusta'], ['e02', 'giusta'], ['e03', 'sbagliata'], ['e04', 'giusta'], ['e05', 'sbagliata'], ['e06', 'giusta']];
const R = { episodi: [] };
for (const [ep, modo] of PIANO) {
  const m = L.miss(ep); const g = L.attenta(L.creaCaso(1), L.dich), eq = L.equilibrata(L.creaCaso(1), L.dich), pe = L.peggiore(L.creaCaso(1), L.dich);
  let tentativo = 0; await p.locator('[data-azione="avvia-episodio"]').waitFor({ timeout: 15000 }); await p.click('[data-azione="avvia-episodio"]');
  for (;;) { tentativo++;
    const sbagl = modo === 'sbagliata' && tentativo === 1;
    const info = { ep, modo: sbagl ? 'sbagliata' : 'giusta', tentativo, pause: 0, mosseFatte: 0, mosseSuggerite: 0, morsi: 0, risposte: 0, scene: 0, ecc: 0, testi: [] };
    const strat = { schiera: g.schiera, scegli: sbagl ? pe.scegli : eq.scegli };
    const hook = {
      chiamata: async (pp) => { info.risposte++; info.scene++; if (info.risposte === 1 && tentativo === 1 && ['e01', 'e03', 'e05'].includes(ep)) await pp.screenshot({ path: `${FOTO}/gioco-${ep}-1-chiamata.png` }); },
      risposta: async (pp, { s }) => { info.pause++; info.scene++; const st = await L.stato(pp); info.ecc = Math.max(info.ecc, st.ecc);
        if (L.MO.mossaPossibile(m, s)) { const x = g.muovi?.(m, s); if (x) { info.mosseSuggerite++; await pp.locator(`.mappa [data-presenza="${x.risorsa}@${x.da}"]`).click(); await pp.locator(`.mappa [data-settore="${x.a}"] .settore-punto`).click({ force: true }); await pp.waitForTimeout(150); info.mosseFatte++; if (info.mosseFatte === 1 && tentativo === 1 && ep === 'e01') await pp.screenshot({ path: `${FOTO}/gioco-${ep}-2-mossa.png` }); } } },
      chiusura: async (pp, { s }) => { info.scene++; const t = await pp.evaluate(() => [...document.querySelectorAll('[data-radio-dopo]')].map((e) => e.textContent.trim())); info.morsi += t.length; info.testi.push(...t.slice(0, 2)); if (t.length && ep === 'e05' && tentativo === 1) await pp.screenshot({ path: `${FOTO}/gioco-${ep}-3-morso.png` }); },
      rapporto: async (pp) => { info.scene++; if (['e03', 'e05'].includes(ep) && tentativo === 1 && !info.fotoRapporto) { info.fotoRapporto = 1; await pp.screenshot({ path: `${FOTO}/gioco-${ep}-4-rapporto.png` }); } },
      verbale: async (pp) => { info.scene++; info.verbale = await pp.evaluate(() => document.querySelector('.scena')?.textContent.replace(/\s+/g, ' ').trim().slice(0, 420)); await pp.screenshot({ path: `${FOTO}/gioco-${ep}-5-verbale-t${tentativo}.png` }); },
    };
    const t0 = Date.now(); await L.gioca(p, m, strat, hook); info.secondiReali = Math.round((Date.now() - t0) / 1000);
    const sv = await L.sal(p); const reg = sv.episodi?.[ep]?.migliore; info.esito = await p.evaluate(() => document.querySelector('.scena h1,.scena h2')?.textContent.trim() ?? null); info.stelle = reg?.stelle ?? null; info.registrato = !!reg; R.episodi.push(info);
    console.log(JSON.stringify({ ep, tentativo, modo: info.modo, stelle: info.stelle, reg: info.registrato, pause: info.pause, mosse: info.mosseFatte, morsi: info.morsi, ecc: info.ecc }));
    if (info.registrato) { for (let k = 0; k < 30 && (await p.locator('.scena [data-azione="epilogo"], .scena [data-azione="citta"]').count()) === 0; k++) { await p.click('.scena [data-azione="passo"]'); await p.waitForTimeout(250); } await p.click('.scena [data-azione="epilogo"], .scena [data-azione="citta"]'); await L.quieta(p); for (let k = 0; k < 6 && (await p.locator('[data-azione="avvia-episodio"]').count()) === 0; k++) { const c = p.locator('.scena [data-azione="citta"], .scena [data-azione="epilogo"], .scena [data-azione="continua"], .scena [data-azione="avanti"]').first(); if (await c.count()) await c.click(); await p.waitForTimeout(400); } break; }
    // fallito: rigioca
    const rg = p.locator('[data-azione="rigioca"],[data-azione="riparti"],[data-azione="riprova"]').first(); if (await rg.count()) await rg.click(); else { await p.click('[data-azione="citta"]'); }
    await L.quieta(p); if (tentativo >= 3) break;
  }
}
R.errori = p.errori; writeFileSync(process.env.OUT + '/play.json', JSON.stringify(R, null, 1)); await a.chiudi();
