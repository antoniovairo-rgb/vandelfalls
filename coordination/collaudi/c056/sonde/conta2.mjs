import * as L from './lib.mjs';
import { semeDa } from '/home/user/vandelfalls/src/logica/partita.ts';
import { variabiliIniziali } from '/home/user/vandelfalls/src/logica/condizioni.ts';
const ini = variabiliIniziali(L.dich.values()); const N = 5; let pause = 0, diff = 0, migliora = 0, peggiora = 0; const somma = (t) => Object.values(t).reduce((a, b) => a + b, 0);
const resto = (m, s0, g) => { let s = s0; for (let c = L.M.chiamateAperte(m, s)[0]; c; c = L.M.chiamateAperte(m, s)[0]) s = L.M.rispondi(m, s, c.id, g.scegli(m, s, c), L.dich); return L.M.chiudiOndata(m, s, L.dich); };
for (const m of L.ms) for (let k = 1; k <= N; k++) {
  const g = L.attenta(L.creaCaso(`${m.id}:${k}`), L.dich); let s = L.M.iniziaMissione(m, ini, L.dich, semeDa(`c056d:${m.id}:${k}`)); let rng = k * 7919;
  while (!L.M.missioneFinita(m, s)) { s = L.M.schiera(m, s, g.schiera(m, s));
    for (let c = L.M.chiamateAperte(m, s)[0]; c; c = L.M.chiamateAperte(m, s)[0]) { s = L.M.rispondi(m, s, c.id, g.scegli(m, s, c), L.dich);
      if (L.MO.mossaPossibile(m, s) && L.M.chiamateAperte(m, s).length) { const sp = L.MO.spostabili(m, s); rng = (rng * 1664525 + 1013904223) >>> 0; const u = sp[rng % sp.length]; const amm = u && L.M.settoriAmmessi(m, u.risorsa).filter((z) => z !== u.settore);
        if (u && amm.length) { pause++; const a = amm[(rng >>> 8) % amm.length]; const base = resto(m, s, g), mosso = resto(m, L.MO.sposta(m, s, { risorsa: u.risorsa, da: u.settore, a }), g);
          const tb = somma(base.tensione), tm = somma(mosso.tensione); if (tb !== tm) { diff++; tm < tb ? migliora++ : peggiora++; } } } }
    s = L.M.chiudiOndata(m, s, L.dich); } }
console.log(JSON.stringify({ pause, tensioneDiversaDopoLaChiusura: diff, pct: +(100 * diff / pause).toFixed(1), migliora, peggiora }));
