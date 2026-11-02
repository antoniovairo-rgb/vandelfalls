// Bot su tutte le missioni di data/: ogni strategia × semi 1…N. Conta blocchi (eccezioni o nessun
// esito), distribuzione degli esiti e tensione massima. Uso: node tools/bot.mjs [N]
import { leggiDati } from './dati-disco.mjs';
import { creaCaso } from '../src/logica/caso.ts';
import { variabiliIniziali } from '../src/logica/condizioni.ts';
import { chiamateAperte, chiudiOndata, concludiMissione, giocaMissione, iniziaMissione, missioneFinita, opzioniValide, rispondi, schiera } from '../src/logica/missione.ts';
import { DETERMINISTICHE, STRATEGIE, attenta, casuale } from '../src/logica/bot.ts';
import { semeDa } from '../src/logica/partita.ts';
import { morsiInAttesa } from '../src/logica/dopo.ts';
import { spento } from '../src/interruttori.ts';
import { valutaEpisodio } from '../src/logica/episodi.ts';

const contesto = (dati) => {
  const dich = new Map(dati['stato.json'].variabili.map((d) => [d.id, d]));
  return { dich, iniziali: variabiliIniziali(dich.values()), missioni: Object.entries(dati).filter(([k]) => k.startsWith('missioni/')).map(([, m]) => m) };
};

/** Variabili di storia (enum) lette dalle condizioni degli esiti di una missione. */
const enumNegliEsiti = (m, dich) => {
  const lette = new Set();
  const giu = (c) => { if (!c) return; if (c.var && dich.get(c.var)?.tipo === 'enum') lette.add(c.var); for (const x of c.tutte ?? c.almeno_una ?? []) giu(x); giu(c.non); };
  for (const e of m.esiti) giu(e.se);
  return [...lette];
};

/** D-106: se gli esiti leggono variabili di storia (enum), la missione si gioca anche da ogni combinazione dei loro
 *  valori, come se la campagna li avesse prodotti. Prima la combinazione iniziale (righe invariate), poi le altre in
 *  ordine di dichiarazione: deterministico. Rosso __NO_D106BOT: solo le variabili iniziali. */
const partenze = (m, dich, iniziali) => {
  let combo = [{ etichetta: '', variabili: iniziali }];
  if (spento('D106BOT')) return combo;
  for (const id of enumNegliEsiti(m, dich)) {
    const valori = [iniziali[id], ...dich.get(id).valori.filter((x) => x !== iniziali[id])];
    combo = combo.flatMap((c) => valori.map((x) => ({ etichetta: x === iniziali[id] ? c.etichetta : `${c.etichetta} [${id}=${x}]`, variabili: { ...c.variabili, [id]: x } })));
  }
  return combo;
};

export function giraBot(dati, semi = 1000) {
  const { dich, iniziali, missioni } = contesto(dati);
  const rapporto = [];
  for (const m of missioni) for (const { etichetta, variabili: partenza } of partenze(m, dich, iniziali)) for (const [nome, strategia] of Object.entries(STRATEGIE)) {
    const esiti = {}; const blocchi = []; const tensioni = []; const stelle = { 0: 0, 1: 0, 2: 0, 3: 0 };
    // D-089: una strategia deterministica gioca la stessa partita con ogni seme → una sola, contata «semi» volte (rosso __NO_C11D01)
    // D-252 (bilanciamento della varietà): il giocatore casuale gioca ogni seme con un seme di partita suo (carta del mazzo,
    // posto, varianti), come chi gioca davvero: D-108/D-154/D-162 misurano quindi le partite vere. Le strategie deterministiche
    // giocano la partita classica (seme 0). Rosso __NO_C252B01: anche il casuale solo sulla classica, come prima.
    const una = DETERMINISTICHE.has(nome) && !spento('C11D01');
    for (let seme = 1; seme <= (una ? 1 : semi); seme++) {
      const volte = una ? semi : 1;
      try {
        const r = giocaMissione(m, partenza, dich, strategia(creaCaso(`${m.id}:${nome}:${seme}`), dich), DETERMINISTICHE.has(nome) || spento('C252B01') ? 0 : semeDa(`${m.id}:${nome}:${seme}`));
        esiti[r.esito.id] = (esiti[r.esito.id] ?? 0) + volte;
        stelle[valutaEpisodio(m, r).stelle] += volte;
        for (let i = 0; i < volte; i++) tensioni.push(r.variabili.tensione_max);
      } catch (e) { for (let i = 0; i < volte; i++) blocchi.push(`seme ${una ? i + 1 : seme}: ${e.message}`); }
    }
    tensioni.sort((a, b) => a - b);
    const media = tensioni.reduce((s, x) => s + x, 0) / (tensioni.length || 1);
    rapporto.push({ missione: m.id, strategia: `${nome}${etichetta}`, semi, blocchi, esiti, stelle,
      tensione: { media: +media.toFixed(2), mediana: tensioni[Math.floor(tensioni.length / 2)], min: tensioni[0], max: tensioni.at(-1) } });
  }
  return rapporto;
}

/** «Le scelte contano»: stesso schieramento (attento), risposte a caso → quanti esiti diversi? */
export function sceltePesano(dati, semi = 300) {
  const { dich, iniziali, missioni } = contesto(dati);
  return missioni.map((m) => {
    const esiti = {};
    for (let seme = 1; seme <= semi; seme++) {
      const caso = creaCaso(`scelte:${m.id}:${seme}`);
      const g = { schiera: attenta(caso, dich).schiera, scegli: (mm, s, c) => caso.scegli(opzioniValide(c, s, mm)).id };
      const r = giocaMissione(m, iniziali, dich, g);
      esiti[r.esito.id] = (esiti[r.esito.id] ?? 0) + 1;
    }
    return { missione: m.id, semi, esiti };
  });
}

/** Esiste una sequenza di scelte (schieramento attento) che arriva ad almeno n stelle? Ricerca in profondità,
 *  si ferma al primo esempio. Serve quando nessuna strategia ci arriva da sola (C-05). */
export function esisteStelle(dati, id, n, limite = 400000) {
  const { dich, iniziali } = contesto(dati);
  const m = dati[`missioni/${id}.json`];
  const att = attenta(creaCaso(1), dich);
  const chiamate = m.ondate.flatMap((o) => o.chiamate ?? []);
  const lim = chiamate.map((c) => c.opzioni.length); const idx = lim.map(() => 0);
  for (let prove = 0; prove < limite; prove++) {
    const r = giocaMissione(m, iniziali, dich, { schiera: att.schiera, scegli: (mm, s, c) => { const v = opzioniValide(c, s, mm); const k = chiamate.findIndex((x) => x.id === c.id); return (v[idx[k] % v.length] ?? v[0]).id; } });
    if (valutaEpisodio(m, r).stelle >= n) return true;
    let i = 0; while (i < idx.length && ++idx[i] === lim[i]) idx[i++] = 0;
    if (i === idx.length) return false;
  }
  return false;
}

/** Come esisteStelle ma esaustiva e veloce: ricerca in profondità sugli stati (schieramento attento), con memoria e
 *  potatura (tensione_max non scende mai). Entrando con le variabili «iniziali» date, 3★ possibili? (D-105) */
export function treStellePossibili(dati, id, iniziali) {
  const { dich } = contesto(dati);
  const m = dati[`missioni/${id}.json`]; const att = attenta(creaCaso(1), dich); const visti = new Set();
  // D-241 idea C: nella chiave anche i morsi in attesa (senza, uno stato con un morso in arrivo e uno senza si confondevano)
  const chiave = (s) => JSON.stringify([s.ondata, s.tensione, s.riserva, s.riposo, s.disposizione, s.modifiche, s.risposte, s.variabili, s.fisse, morsiInAttesa(m, s.scelte, s.ondata).map((x) => `${x.chiamata}/${x.opzione}`)]);
  const cerca = (s) => {
    if (missioneFinita(m, s)) return valutaEpisodio(m, concludiMissione(m, s, dich)).stelle >= 3;
    if (s.variabili.tensione_max > 3) return false;
    const k = chiave(s); if (visti.has(k)) return false; visti.add(k);
    if (!s.disposizione) return cerca(schiera(m, s, att.schiera(m, s)));
    const c = chiamateAperte(m, s)[0];
    if (!c) return cerca(chiudiOndata(m, s, dich));
    return opzioniValide(c, s, m).some((o) => cerca(rispondi(m, s, c.id, o.id, dich)));
  };
  return cerca(iniziaMissione(m, iniziali, dich));
}

/** D-105: entrando in ogni episodio con fiducia 0 (la peggiore), il minimo la rialza e le 3★ restano possibili. */
export function controllaFiduciaMinima(dati) {
  const { iniziali, missioni } = contesto(dati);
  return missioni.filter((m) => !treStellePossibili(dati, m.id, { ...iniziali, credito: 0 }))
    .map((m) => `${m.id}: entrando con fiducia 0 le 3 stelle non sono raggiungibili (D-105)`);
}

/** Campagna: episodi in fila, variabili portate da uno all'altro (giocatore casuale). Quali chiamate compaiono?
 *  D-241: ogni episodio col suo seme di partita, così compaiono anche le carte del mazzo e le varianti. */
export function chiamateViste(dati, semi = 300) {
  const { dich, iniziali, missioni } = contesto(dati);
  const ordinate = [...missioni].sort((a, b) => a.episodio - b.episodio);
  const viste = new Set();
  for (let seme = 1; seme <= semi; seme++) {
    let v = iniziali;
    for (const m of ordinate) {
      const g = casuale(creaCaso(`campagna:${m.id}:${seme}`), dich);
      const r = giocaMissione(m, v, dich, { schiera: g.schiera, scegli: (mm, s, c) => { viste.add(`${m.id}:${c.id}`); return g.scegli(mm, s, c); } }, semeDa(`campagna:${m.id}:${seme}`));
      v = r.variabili;
    }
  }
  return ordinate.map((m) => ({ missione: m.id, mai: m.ondate.flatMap((o) => o.chiamate ?? []).filter((c) => !viste.has(`${m.id}:${c.id}`)).map((c) => c.id) }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dati = leggiDati(); const n = Number(process.argv[2] ?? 1000);
  for (const r of giraBot(dati, n)) console.log(`${r.missione} · ${r.strategia}: blocchi ${r.blocchi.length}/${r.semi} · esiti ${JSON.stringify(r.esiti)} · stelle ${JSON.stringify(r.stelle)} · tensione_max media ${r.tensione.media}, mediana ${r.tensione.mediana}, min ${r.tensione.min}, max ${r.tensione.max}`);
  for (const r of chiamateViste(dati)) console.log(`${r.missione} · campagna: chiamate mai comparse ${JSON.stringify(r.mai)}`);
  for (const r of sceltePesano(dati)) console.log(`${r.missione} · scelte a caso con schieramento attento: ${JSON.stringify(r.esiti)}`);
}
