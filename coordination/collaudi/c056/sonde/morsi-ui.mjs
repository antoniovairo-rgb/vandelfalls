// uso: node morsi-ui.mjs <ep> <W> <H> [foto]
import * as L from './lib.mjs';
import { opzioniValide } from '/home/user/vandelfalls/src/logica/missione.ts';
import { morsiDellOndata } from '/home/user/vandelfalls/src/logica/dopo.ts';
import { writeFileSync } from 'node:fs';
const [ep, W, H, foto = '0'] = process.argv.slice(2); const m = L.miss(ep), idx = L.ms.indexOf(m); const FOTO = '/home/user/vandelfalls/coordination/collaudi/c056';
const R = { ep, vp: `${W}x${H}`, chiusure: 0, morsiAttesi: 0, morsiVisti: 0, difetti: [], esempi: [], eccMax: 0, comodeScelte: 0 };
const tipo = (e) => 'tensione' in e ? 'Tensione' : 'pressione' in e ? 'Pressione' : 'riserva' in e ? 'riserva' : 'Fiducia';
const a = await L.avvia([+W, +H]); const p = await a.nuova(L.salvataggioPrima(idx));
await p.getByRole('button', { name: 'Riprendi' }).click(); await p.click('[data-azione="avvia-episodio"]');
const g = L.attenta(L.creaCaso(1), L.dich);
const strat = { schiera: g.schiera, scegli(mm, s, c) { const v = opzioniValide(c, s, mm); const x = v.find((o) => o.effetti.length === 0 && o.effetti_dopo); if (x) { R.comodeScelte++; return x.id; } return g.scegli(mm, s, c); } };
let primo = true;
try { await L.gioca(p, m, strat, { chiusura: async (pp, { s }) => {
  R.chiusure++; const attesi = morsiDellOndata(m, s.scelte, s.ondata); R.morsiAttesi += attesi.length;
  const ui = await pp.evaluate(() => ({ righe: [...document.querySelectorAll('[data-radio-dopo]')].map((e) => ({ costo: e.querySelector('[data-costo-morso]')?.textContent.trim() ?? null, testo: e.textContent.trim() })), tace: !![...document.querySelectorAll('.scena [data-messaggio], .scena .messaggio')].find((e) => /La radio tace/.test(e.textContent)), ecc: document.scrollingElement.scrollHeight - innerHeight }));
  R.eccMax = Math.max(R.eccMax, ui.ecc); R.morsiVisti += ui.righe.length;
  if (ui.righe.length !== attesi.length) R.difetti.push(`${ep} ond ${s.ondata}: morsi attesi ${attesi.length}, visti ${ui.righe.length}`);
  if (!attesi.length && !ui.tace) R.difetti.push(`${ep} ond ${s.ondata}: senza morsi manca «La radio tace»`);
  attesi.forEach((x, i) => { const r = ui.righe.find((y) => y.testo.includes(L.T(x.dopo.rapporto))); if (!r) { R.difetti.push(`${ep} ond ${s.ondata}: testo del morso ${x.chiamata}/${x.opzione} non mostrato`); return; }
    const t0 = x.dopo.effetti.map(tipo)[0]; const okTipo = t0 === 'riserva' ? /^(Squadre|Steward|Mediatore)/i.test(r.costo ?? '') : (r.costo ?? '').startsWith(t0);
    const v = x.dopo.effetti[0].valore; const segno = v > 0 ? '+' : '−'; const okSegno = (r.costo ?? '').includes(segno + Math.abs(v));
    if (!okTipo || !okSegno) R.difetti.push(`${ep} ond ${s.ondata}: costo «${r.costo}» ≠ effetto ${JSON.stringify(x.dopo.effetti[0])}`);
    R.esempi.push({ ond: s.ondata, scelta: `${x.chiamata}/${x.opzione}`, costo: r.costo, testo: r.testo.slice(0, 160) }); });
  if (ui.ecc > 0) R.difetti.push(`${ep} ond ${s.ondata}: la chiusura scorre di ${ui.ecc} px a ${R.vp}`);
  if (primo && attesi.length && foto === '1') { primo = false; await pp.screenshot({ path: `${FOTO}/morso-${ep}-${R.vp}.png` }); }
} }); } catch (e) { R.difetti.push('eccezione pilota: ' + String(e.message).split('\n')[0]); }
const fine = (await L.sal(p)); R.episodio = fine?.episodi?.[ep] ?? null; R.errori = p.errori;
writeFileSync(`${process.env.OUT}/morsi-${ep}-${R.vp}.json`, JSON.stringify(R, null, 1));
console.log(JSON.stringify({ ep, vp: R.vp, chiusure: R.chiusure, attesi: R.morsiAttesi, visti: R.morsiVisti, comode: R.comodeScelte, eccMax: R.eccMax, difetti: R.difetti.length }));
await a.chiudi();
