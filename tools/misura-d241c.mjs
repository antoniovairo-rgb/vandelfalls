// D-241 idea C (PO-152): misure del «nessun costo morde dopo». Uso: node tools/misura-d241c.mjs [semi=300]
// Modello: tools/misura-d241.mjs. 4 strategie × «semi» semi di partita (gli stessi di misura-d241: d241:<episodio>:<bot>:<s>);
// ogni partita si gioca due volte con lo stesso seme: prima = rosso __NO_C241C01 (nessun effetto ritardato, il gioco 0.54),
// dopo = effetti ritardati. Conta blocchi (eccezioni o nessun esito), vittorie (esito non fallito) e morsi arrivati.
import { leggiDati } from './dati-disco.mjs';
import { creaCaso } from '../src/logica/caso.ts';
import { variabiliIniziali } from '../src/logica/condizioni.ts';
import { chiamateAperte, chiudiOndata, concludiMissione, giocaMissione, iniziaMissione, missioneFinita, opzioniValide, rispondi, schiera } from '../src/logica/missione.ts';
import { semeDa } from '../src/logica/partita.ts';
import { STRATEGIE, attenta } from '../src/logica/bot.ts';
import { valutaEpisodio } from '../src/logica/episodi.ts';

export function partite(dati, semi = 300) {
  const dich = new Map(dati['stato.json'].variabili.map((d) => [d.id, d]));
  const iniziali = variabiliIniziali(dich.values());
  const missioni = Object.entries(dati).filter(([k]) => k.startsWith('missioni/')).map(([, m]) => m).sort((a, b) => a.episodio - b.episodio);
  return missioni.map((m) => {
    const r = { missione: m.id, blocchi: [], prima: {}, dopo: {}, morsi: 0 };
    for (const [nome, strategia] of Object.entries(STRATEGIE)) {
      let vp = 0, vd = 0;
      for (let s = 1; s <= semi; s++) {
        const seme = semeDa(`d241:${m.id}:${nome}:${s}`), g = () => strategia(creaCaso(`${m.id}:${nome}:${s}`), dich);
        try {
          globalThis.__NO_C241C01 = true;
          vp += +!giocaMissione(m, iniziali, dich, g(), seme).esito.fallita;
        } catch (e) { r.blocchi.push(`${nome} seme ${s} (rosso): ${e.message}`); } finally { delete globalThis.__NO_C241C01; }
        try {
          const x = giocaMissione(m, iniziali, dich, g(), seme);
          vd += +!x.esito.fallita; r.morsi += x.rapporti.reduce((t, y) => t + (y.radio?.length ?? 0), 0);
        } catch (e) { r.blocchi.push(`${nome} seme ${s}: ${e.message}`); }
      }
      r.prima[nome] = vp / semi; r.dopo[nome] = vd / semi;
    }
    return r;
  });
}

/** D-247: quanti morsi per tipo (tensione, pressione, riserva, fiducia) e quanti tipi per episodio (varianti escluse). */
export function tipiMorsi(dati) {
  const tipo = (e) => ('tensione' in e ? 'tensione' : 'pressione' in e ? 'pressione' : 'riserva' in e ? 'riserva' : 'fiducia');
  const tot = {}, per = {};
  for (const [k, m] of Object.entries(dati)) if (/^missioni\/e\d+\.json$/.test(k)) for (const o of m.ondate) for (const c of o.chiamate ?? []) if (!c.variante_di)
    for (const x of c.opzioni) for (const e of x.effetti_dopo?.effetti ?? []) { tot[tipo(e)] = (tot[tipo(e)] ?? 0) + 1; (per[m.id] ??= new Set()).add(tipo(e)); }
  return { tot, per: Object.fromEntries(Object.entries(per).sort().map(([id, s]) => [id, s.size])) };
}

/** C54-07 (D-253): «la comoda conviene?» Schieramento del bot attento; politica «comoda» (l'opzione con effetti_dopo quando c'è)
 *  contro «non comoda» (una a caso fra quelle senza); stessi semi di coordination/sonde/c054-peso.mjs del collaudo C-054.
 *  Criterio: la comoda non domina se le sue stelle medie non superano quelle della non comoda. */
export function comodaContro(dati, semi = 60) {
  const dich = new Map(dati['stato.json'].variabili.map((d) => [d.id, d])), v0 = variabiliIniziali(dich.values());
  const ms = Object.entries(dati).filter(([k]) => /^missioni\/e\d+\.json$/.test(k)).map(([, m]) => m).sort((a, b) => a.episodio - b.episodio);
  const pol = { comoda: (ok, r) => ok.find((o) => o.effetti_dopo) ?? r.scegli(ok), non_comoda: (ok, r) => { const x = ok.filter((o) => !o.effetti_dopo); return r.scegli(x.length ? x : ok); } };
  return Object.fromEntries(Object.entries(pol).map(([nome, f]) => { let st = 0, fa = 0, n = 0;
    for (const m of ms) for (let seme = 1; seme <= semi; seme++) {
      const g = attenta(creaCaso(seme), dich), r = creaCaso(seme * 31 + 3); let s = iniziaMissione(m, v0, dich, seme);
      while (!missioneFinita(m, s)) { s = schiera(m, s, g.schiera(m, s)); for (let c = chiamateAperte(m, s)[0]; c; c = chiamateAperte(m, s)[0]) s = rispondi(m, s, c.id, f(opzioniValide(c, s, m), r).id, dich); s = chiudiOndata(m, s, dich); }
      const e = concludiMissione(m, s, dich); st += valutaEpisodio(m, e).stelle; fa += +!!e.esito.fallita; n++; }
    return [nome, { episodi: n, stelle: st / n, fallite: 100 * fa / n }]; }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const t = tipiMorsi(leggiDati()), n = Object.values(t.per);
  console.log(`tipi di morso: ${JSON.stringify(t.tot)}; tipi per episodio: min ${Math.min(...n)}, max ${Math.max(...n)}, episodi con 4 tipi ${n.filter((x) => x === 4).length}`);
  const cc = comodaContro(leggiDati(), 60);
  console.log(`comoda contro non comoda (attenta, 60 semi): comoda ${cc.comoda.stelle.toFixed(3)}★ ${cc.comoda.fallite.toFixed(1)}% · non comoda ${cc.non_comoda.stelle.toFixed(3)}★ ${cc.non_comoda.fallite.toFixed(1)}% → ${cc.comoda.stelle <= cc.non_comoda.stelle ? 'non domina' : 'DOMINA'}`);
  const semi = Number(process.argv[2] ?? 300), par = partite(leggiDati(), semi);
  const pc = (x) => `${(100 * x).toFixed(1)}%`;
  console.log(`| episodio | blocchi su ${semi}×4×2 | morsi | casuale prima → dopo | attenta | equilibrata | peggiore |`);
  console.log('|---|---|---|---|---|---|---|');
  for (const r of par) console.log(`| ${r.missione} | ${r.blocchi.length} | ${r.morsi} | ${pc(r.prima.casuale)} → ${pc(r.dopo.casuale)} | ${pc(r.prima.attenta)} → ${pc(r.dopo.attenta)} | ${pc(r.prima.equilibrata)} → ${pc(r.dopo.equilibrata)} | ${pc(r.prima.peggiore)} → ${pc(r.dopo.peggiore)} |`);
  for (const nome of Object.keys(STRATEGIE)) {
    const dd = par.map((r) => 100 * (r.dopo[nome] - r.prima[nome])).sort((a, b) => a - b), med = dd.reduce((s, x) => s + x, 0) / dd.length;
    const sd = Math.sqrt(dd.reduce((s, x) => s + (x - med) ** 2, 0) / dd.length);
    console.log(`${nome}: scarto dopo − prima in punti, min ${dd[0].toFixed(1)}, mediana ${dd[Math.floor(dd.length / 2)].toFixed(1)}, media ${med.toFixed(1)}, max ${dd.at(-1).toFixed(1)}, dev. std ${sd.toFixed(1)}, ${dd.length} episodi × ${semi} semi`);
  }
  console.log(`blocchi totali: ${par.reduce((s, r) => s + r.blocchi.length, 0)} su ${par.length * semi * 4 * 2} partite; morsi arrivati: ${par.reduce((s, r) => s + r.morsi, 0)}`);
  for (const r of par) for (const b of r.blocchi.slice(0, 3)) console.log(`  ${r.missione} ${b}`);
}
