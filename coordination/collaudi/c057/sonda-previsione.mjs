// C-057 punto 4: la previsione di previsione.ts contro l'esito vero, con 4 strategie e semi 1-6 (il guardiano della 0.63.0 usa
// solo «attenta», semi 1-3). Si finisce l'ondata con le stesse risposte con e senza la mossa. Uso: node coordination/collaudi/c057/sonda-previsione.mjs
import { leggiDati } from '../../../tools/dati-disco.mjs';
import { STRATEGIE } from '../../../src/logica/bot.ts';
import { creaCaso } from '../../../src/logica/caso.ts';
import { variabiliIniziali } from '../../../src/logica/condizioni.ts';
import * as M from '../../../src/logica/missione.ts';
import { mossaPossibile, sposta, spostabili } from '../../../src/logica/mossa.ts';
import { effettoMossa } from '../../../src/logica/previsione.ts';
const dati = leggiDati(), dich = new Map(dati['stato.json'].variabili.map((d) => [d.id, d]));
const ms = Object.entries(dati).filter(([k]) => /^missioni\/e\d+\.json$/.test(k)).map(([, x]) => x).sort((a, b) => a.episodio - b.episodio);
const v0 = variabiliIniziali(dich.values());
function fine(m, s, g, risp) {
  for (let c = M.chiamateAperte(m, s)[0]; c; c = M.chiamateAperte(m, s)[0]) {
    const o = risp.get(c.id), x = o && M.opzioniValide(c, s, m).some((y) => y.id === o) ? o : g.scegli(m, s, c);
    risp.set(c.id, x); s = M.rispondi(m, s, c.id, x, dich);
  }
  return M.chiudiOndata(m, s, dich).tensione;
}
const SEMI = Number(process.env.SEMI ?? 6), tab = {}, perStrategia = {}, perEp = {}, altri = { cambiaAltro: 0, tot: 0 }, opposti = [];
for (const nome of ['attenta', 'casuale', 'peggiore', 'equilibrata']) for (const m of ms) for (let seme = 1; seme <= SEMI; seme++) {
  const g = STRATEGIE[nome](creaCaso(seme), dich); let s = M.iniziaMissione(m, v0, dich);
  while (!M.missioneFinita(m, s)) {
    s = M.schiera(m, s, g.schiera(m, s));
    for (let c = M.chiamateAperte(m, s)[0]; c; c = M.chiamateAperte(m, s)[0]) {
      s = M.rispondi(m, s, c.id, g.scegli(m, s, c), dich);
      if (!mossaPossibile(m, s)) continue;
      const base = new Map(), A = fine(m, s, g, base);
      for (const x of spostabili(m, s)) for (const a of M.settoriAmmessi(m, x.risorsa).filter((k) => k !== x.settore)) {
        const mossa = { risorsa: x.risorsa, da: x.settore, a }, t = sposta(m, s, mossa), B = fine(m, t, g, new Map(base));
        altri.tot++; if (Object.keys({ ...A, ...B }).some((k) => k !== mossa.da && k !== mossa.a && (A[k] ?? 0) !== (B[k] ?? 0))) altri.cambiaAltro++;
        for (const e of effettoMossa(m, s, t, mossa, dich)) {
          const ra = A[e.settore] ?? 0, rb = B[e.settore] ?? 0, vero = rb > ra ? 'su' : rb < ra ? 'giu' : 'pari', k = `${e.verso}>${vero}`;
          tab[k] = (tab[k] ?? 0) + 1; (perStrategia[nome] ??= {})[k] = (perStrategia[nome][k] ?? 0) + 1; (perEp[m.id] ??= {})[k] = (perEp[m.id][k] ?? 0) + 1;
          if ((e.verso === 'su' && vero === 'giu') || (e.verso === 'giu' && vero === 'su')) opposti.push(`${nome} ${m.id} seme ${seme} ond.${s.ondata} dopo ${c.id}: ${mossa.risorsa} ${mossa.da}→${mossa.a}, ${e.settore} previsto ${e.verso} vero ${vero} (${ra}→${rb})`);
        }
      }
    }
    s = M.chiudiOndata(m, s, dich);
  }
}
const coinc = (t) => { const n = Object.values(t).reduce((a, b) => a + b, 0), ok = Object.entries(t).filter(([k]) => k.split('>')[0] === k.split('>')[1]).reduce((a, [, b]) => a + b, 0); return `${ok}/${n} = ${(100 * ok / n).toFixed(2)}%`; };
console.log('TOTALE', JSON.stringify(tab), coinc(tab));
for (const [n, t] of Object.entries(perStrategia)) console.log(n, JSON.stringify(t), coinc(t));
const pe = Object.entries(perEp).map(([e, t]) => [e, t, Object.values(t).reduce((a, b) => a + b, 0)]);
for (const [e, t] of pe) { const n = Object.values(t).reduce((a, b) => a + b, 0), ok = Object.entries(t).filter(([k]) => k.split('>')[0] === k.split('>')[1]).reduce((a, [, b]) => a + b, 0); if (ok / n < 0.8) console.log('episodio sotto 80%:', e, JSON.stringify(t), `${(100 * ok / n).toFixed(1)}%`); }
console.log('mosse con effetto reale su ALTRI settori oltre da/a:', altri.cambiaAltro, '/', altri.tot);
console.log('OPPOSTI', opposti.length); for (const o of opposti.slice(0, 15)) console.log(' ', o);
