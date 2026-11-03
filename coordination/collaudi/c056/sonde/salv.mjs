import * as L from './lib.mjs';
import { writeFileSync } from 'node:fs';
const R = { vecchi: [] };
for (const [ep, idx, stopA, vp] of [['e01', 0, 6, [375, 667]], ['e03', 2, 8, [360, 640]]]) {
  const m = L.miss(ep);
  // 1) 0.58.0: gioca fino alla chiamata numero stopA, poi salva
  const a8 = await L.avvia(vp, { dist: '/tmp/claude-0/wt058/dist' });
  const p8 = await a8.nuova(idx ? L.salvataggioPrima(idx).replace('"save_version":4', '"save_version":3') : null);
  if (!idx) { await p8.getByRole('button', { name: 'Nuova partita' }).click(); await p8.click('[data-genere="m"]'); await p8.click('[data-azione="guida-salta"]'); } else await p8.getByRole('button', { name: 'Riprendi' }).click();
  await p8.click('[data-azione="avvia-episodio"]');
  let n = 0; const stop = new Error('stop');
  try { await L.gioca(p8, m, L.attenta(L.creaCaso(1), L.dich), { chiamata: async () => { if (++n === stopA) throw stop; } }); } catch (e) { if (e !== stop) throw e; }
  const raw = await p8.evaluate((k) => localStorage.getItem(k), L.CHIAVE); const v = JSON.parse(raw);
  writeFileSync(`${process.env.OUT}/salvataggio-058-${ep}.json`, raw);
  const info = { ep, da: v.game_version, save_version: v.save_version, ondata: v.in_corso.ondata, scelte: v.in_corso.scelte.length, mosse: v.in_corso.mosse ?? '(assente)', seme: v.in_corso.seme };
  await a8.chiudi();
  // 2) la 0.59.0 lo riprende
  const a9 = await L.avvia(vp); const p9 = await a9.nuova(raw); const errCaricamento = [];
  await p9.getByRole('button', { name: 'Riprendi' }).click(); await L.quieta(p9);
  const sc = await L.scena(p9), s9 = (await L.sal(p9)); const cid = await p9.getAttribute('[data-messaggio^="chiamata-"]', 'data-messaggio').catch(() => null);
  const attesa = L.M.chiamateAperte(m, v.in_corso)[0]?.id;
  info.riprendeScena = sc; info.chiamataUI = cid; info.chiamataAttesaDalMotore = attesa; info.dopo = { save_version: s9.save_version, mosse: s9.in_corso.mosse, disposizioneUguale: JSON.stringify(s9.in_corso.disposizione) === JSON.stringify(v.in_corso.disposizione), scelteUguali: JSON.stringify(s9.in_corso.scelte) === JSON.stringify(v.in_corso.scelte), seme: s9.in_corso.seme === v.in_corso.seme };
  await p9.screenshot({ path: `/home/user/vandelfalls/coordination/collaudi/c056/salvataggio-058-${ep}-ripreso-${vp[0]}x${vp[1]}.png` });
  // 3) lo finisce, con la mossa a ogni pausa possibile
  let mosse = 0, pauseMossa = 0;
  const hook = { risposta: async (pp, { s }) => { if (L.MO.mossaPossibile(m, s)) { pauseMossa++; const sp = L.MO.spostabili(m, s)[0]; if (sp) { const a = L.M.settoriAmmessi(m, sp.risorsa).find((k) => k !== sp.settore); if (a) { await pp.locator(`.mappa [data-presenza="${sp.risorsa}@${sp.settore}"]`).click(); await pp.locator(`.mappa [data-settore="${a}"] .settore-punto`).click({ force: true }); mosse++; } } } } };
  try { await L.gioca(p9, m, L.attenta(L.creaCaso(1), L.dich), hook); info.finito = await L.scena(p9); } catch (e) { info.finito = 'ERRORE ' + String(e.message).split('\n')[0]; }
  info.pauseMossa = pauseMossa; info.mosseFatte = mosse; info.erroriConsole = p9.errori;
  const fin = await L.sal(p9); info.finale = { save_version: fin.save_version, game_version: fin.game_version, episodio: fin.episodi?.[ep]?.migliore ?? null };
  R.vecchi.push(info); await a9.chiudi();
}
writeFileSync(`${process.env.OUT}/salvataggi.json`, JSON.stringify(R, null, 1)); console.log(JSON.stringify(R, null, 1));
