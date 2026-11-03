import { leggiDati } from '/home/user/vandelfalls/tools/dati-disco.mjs';
import { scegliTesto } from '/home/user/vandelfalls/src/dati/testi.ts';
const d = leggiDati('/home/user/vandelfalls/data');
const testi = Object.assign({}, ...Object.entries(d).filter(([k]) => k.startsWith('testi/it/')).map(([, v]) => v));
const T = (k) => scegliTesto(testi, String(k).replace(/^testi:/,''), 'm') ?? `[[${k}]]`;
const ms = Object.entries(d).filter(([k]) => k.startsWith('missioni/')).map(([, x]) => x).sort((a, b) => a.episodio - b.episodio);
const tipo = (e) => 'tensione' in e ? 'tensione' : 'pressione' in e ? 'pressione' : 'riserva' in e ? 'riserva' : e.aggiungi === 'credito' ? 'fiducia' : JSON.stringify(e);
const out = [];
for (const m of ms) { const righe = [];
  for (const o of m.ondate) for (const c of o.chiamate ?? []) for (const op of c.opzioni) if (op.effetti_dopo) righe.push({ ep: m.id, ond: o.n, chiamata: c.id, carta: !!(c.carta||c.imprevisto), variante: c.variante_di ?? null, opz: op.id, scelta: T(op.testo), costo: op.costo ? T(op.costo) : null, effetti: op.effetti.map(tipo), dopo_ondate: op.effetti_dopo.ondate, tipi: op.effetti_dopo.effetti.map((e)=>tipo(e)+':'+(e.valore)+(e.tensione?'@'+e.tensione:'')+(e.pressione?'@'+e.pressione:'')+(e.riserva?'@'+e.riserva:'')), testo: T(op.effetti_dopo.rapporto) });
  out.push(...righe); }
console.log(JSON.stringify(out));
