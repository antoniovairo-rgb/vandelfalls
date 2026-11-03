import * as L from './lib.mjs';
import { semeDa } from '/home/user/vandelfalls/src/logica/partita.ts';
import { variabiliIniziali } from '/home/user/vandelfalls/src/logica/condizioni.ts';
import { writeFileSync } from 'node:fs';
const ini = variabiliIniziali(L.dich.values()); const N = 8;
const per = {}; let pause = 0, conMossa = 0, cambiaChiamate = 0, cambiaTensione = 0;
for (const m of L.ms) {
  const r = (per[m.id] = { pause: 0, cambiaChiamate: 0, mosseLegali: 0 });
  for (let k = 1; k <= N; k++) {
    const g = L.attenta(L.creaCaso(`${m.id}:${k}`), L.dich); let s = L.M.iniziaMissione(m, ini, L.dich, semeDa(`c056c:${m.id}:${k}`));
    while (!L.M.missioneFinita(m, s)) { s = L.M.schiera(m, s, g.schiera(m, s));
      for (let c = L.M.chiamateAperte(m, s)[0]; c; c = L.M.chiamateAperte(m, s)[0]) { s = L.M.rispondi(m, s, c.id, g.scegli(m, s, c), L.dich);
        if (L.MO.mossaPossibile(m, s)) { pause++; r.pause++; const base = L.M.chiamateAperte(m, s).map((x) => x.id).join(); let cambia = false, n = 0;
          for (const u of L.MO.spostabili(m, s)) for (const a of L.M.settoriAmmessi(m, u.risorsa).filter((z) => z !== u.settore)) { n++; const s2 = L.MO.sposta(m, s, { risorsa: u.risorsa, da: u.settore, a }); if (L.M.chiamateAperte(m, s2).map((x) => x.id).join() !== base) cambia = true; }
          r.mosseLegali += n; if (cambia) { cambiaChiamate++; r.cambiaChiamate++; } } }
      s = L.M.chiudiOndata(m, s, L.dich); } }
}
console.log(JSON.stringify({ pause, cambiaChiamate, pct: +(100 * cambiaChiamate / pause).toFixed(1) }));
const conv = Object.entries(per).filter(([, v]) => v.cambiaChiamate).map(([k, v]) => `${k}:${v.cambiaChiamate}/${v.pause}`); console.log('episodi con almeno una pausa dove la mossa cambia le chiamate:', conv.length, conv.join(' '));
