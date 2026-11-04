// D-262 punto 1 (scelta del PO): l'effetto della mossa si vede subito. Dopo la mossa la mappa dice come cambia la tensione
// prevista alla chiusura dell'ondata nel settore lasciato e in quello coperto (▲/▼). Previsione con le regole che ci sono:
// la chiusura (chiudiOndata) sullo stato di adesso, come se le chiamate ancora aperte non cambiassero nulla (la stessa stima
// del bot, bot.ts). Pura e deterministica. Rosso __NO_C262E01: nessun effetto.
import { spento } from '../interruttori.ts';
import { chiamateAperte, chiudiOndata, type InCorso } from './missione.ts';
import type { Mossa } from './mossa.ts';
import type { Dichiarazione, Missione } from './tipi.ts';

type Dich = Map<string, Dichiarazione>;

/** Tensione di ogni settore alla chiusura dell'ondata, se le chiamate ancora aperte non cambiassero nulla. */
export function tensioneStimata(m: Missione, s: InCorso, d: Dich): Record<string, number> {
  let x = s; // D-246: l'imprevisto può aprirsi solo dopo altre risposte, quindi si chiude finché resta qualcosa di aperto
  for (let a = chiamateAperte(m, x); a.length; a = chiamateAperte(m, x)) x = { ...x, risposte: { ...x.risposte, ...Object.fromEntries(a.map((c) => [c.id, '—'])) } };
  return chiudiOndata(m, x, d).tensione;
}

export interface EffettoMossa { settore: string; verso: 'su' | 'giu' | 'pari' }

/** Come cambia la tensione prevista alla chiusura nel settore lasciato e in quello coperto (prima e dopo la mossa). */
export function effettoMossa(m: Missione, prima: InCorso, dopo: InCorso, mossa: Mossa, d: Dich): EffettoMossa[] {
  if (spento('C262E01')) return [];
  const a = tensioneStimata(m, prima, d), b = tensioneStimata(m, dopo, d);
  return [mossa.da, mossa.a].map((k) => ({ settore: k, verso: (b[k] ?? 0) > (a[k] ?? 0) ? 'su' : (b[k] ?? 0) < (a[k] ?? 0) ? 'giu' : 'pari' }));
}
