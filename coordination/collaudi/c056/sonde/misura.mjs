import * as L from './lib.mjs';
import { semeDa } from '/home/user/vandelfalls/src/logica/partita.ts';
const N = +(process.argv[2] ?? 100);
const v0 = L.variabiliIniziali ? null : null;
import { variabiliIniziali } from '/home/user/vandelfalls/src/logica/condizioni.ts';
import { opzioniValide, giocaMissione, settoriAmmessi } from '/home/user/vandelfalls/src/logica/missione.ts';
const ini = variabiliIniziali(L.dich.values());
const comoda = (d, caso) => { const g = L.attenta(caso, d); return { ...g, muovi: undefined, scegli(m, s, c) { const v = opzioniValide(c, s, m); const x = v.find((o) => o.effetti.length === 0 && o.effetti_dopo) ?? null; return x ? x.id : g.scegli(m, s, c); } }; };
const comodaPura = (d, caso) => { const g = L.attenta(caso, d); return { ...g, muovi: undefined, scegli(m, s, c) { const v = opzioniValide(c, s, m); const x = v.find((o) => o.effetti.length === 0 && o.effetti_dopo) ?? v.find((o) => o.effetti.length === 0); return x ? x.id : g.scegli(m, s, c); } }; };
const attentaSenza = (d, caso) => ({ ...L.attenta(caso, d), muovi: undefined });
const attentaLibera = (d, caso) => { const g = L.attenta(caso, d); return { ...g, muovi(m, s) { /* migliore mossa qualsiasi per stima: confronto con nessuna mossa */
  const base = L.attenta(caso, d); return g.muovi(m, s); } }; };
const POL = { attenta: (d, c) => L.attenta(c, d), attentaSenzaMossa: (d, c) => attentaSenza(d, c), comoda: comoda, comodaPura: comodaPura, casuale: (d, c) => L.STRATEGIE.casuale(c, d), equilibrata: (d, c) => L.STRATEGIE.equilibrata(c, d) };
const risultati = {};
for (const m of L.ms) {
  for (const [nome, mk] of Object.entries(POL)) for (const morsi of [true, false]) {
    let st = 0, fall = 0, n = 0, morsiArrivati = 0, muove = 0;
    for (let s = 1; s <= N; s++) {
      const seme = semeDa(`c056:${m.id}:${nome}:${s}`); if (!morsi) globalThis.__NO_C241C01 = true; else delete globalThis.__NO_C241C01;
      try { const g = mk(L.dich, L.creaCaso(`${m.id}:${nome}:${s}`)); const x = giocaMissione(m, ini, L.dich, g, seme);
        const stelle = x.esito.fallita ? 0 : L.valutaEpisodio(m, x).stelle; st += stelle; fall += +!!x.esito.fallita; n++; morsiArrivati += x.rapporti.reduce((t, y) => t + (y.radio?.length ?? 0), 0);
      } catch (e) { (risultati.blocchi ??= []).push(`${m.id} ${nome} ${s}: ${e.message}`); }
    }
    delete globalThis.__NO_C241C01;
    (risultati[m.id] ??= {})[`${nome}|${morsi ? 'morsi' : 'senza'}`] = { stelle: +(st / n).toFixed(3), fall: +(fall / n).toFixed(3), morsi: +(morsiArrivati / n).toFixed(2), n };
  }
}
import { writeFileSync } from 'node:fs'; writeFileSync(process.env.OUT + '/misura.json', JSON.stringify(risultati));
// aggregato
const agg = {}; for (const [ep, r] of Object.entries(risultati)) { if (ep === 'blocchi') continue; for (const [k, v] of Object.entries(r)) { const a = (agg[k] ??= { s: 0, f: 0, mo: 0, e: 0 }); a.s += v.stelle; a.f += v.fall; a.mo += v.morsi; a.e++; } }
for (const [k, a] of Object.entries(agg)) console.log(k.padEnd(28), 'stelle', (a.s / a.e).toFixed(3), 'fallite', (100 * a.f / a.e).toFixed(1) + '%', 'morsi/partita', (a.mo / a.e).toFixed(2));
console.log('blocchi', (risultati.blocchi ?? []).length, (risultati.blocchi ?? []).slice(0, 3));
