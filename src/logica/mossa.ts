// D-241 idea B, «una mossa per chiamata»: fra una chiamata e l'altra (dopo la risposta, prima che si apra la successiva
// dell'ondata) il giocatore può spostare UNA unità già schierata da un settore a un altro. Facoltativa. Pura e deterministica.
// - Si spostano solo unità dello schieramento dell'ondata (non le fisse, D-082, che stanno in «fisse»; non quelle a riposo,
//   che non sono schierate) e solo verso un settore dove quella risorsa si può mettere (settoriAmmessi).
// - Una per chiamata: la mossa fatta si segna in «mosse» con «ondata:chiamata» dell'ultima risposta; finisce nel salvataggio
//   (SAVE_VERSION 4), quindi dopo una ricarica la mossa usata resta usata. Rosso __NO_C241B01: mosse illimitate.
// - La mossa cambia la disposizione: conta per le condizioni «senza» delle chiamate dopo e per la chiusura dell'ondata.
import { spento } from '../interruttori.ts';
import { chiamateAperte, missioneFinita, settoriAmmessi, type InCorso } from './missione.ts';
import type { Missione } from './tipi.ts';

export interface Mossa { risorsa: string; da: string; a: string }

/** Il turno della mossa («ondata:chiamata» dell'ultima risposta), o null se ora non si può muovere. */
export function turnoMossa(m: Missione, s: InCorso): string | null {
  if (!s.disposizione || missioneFinita(m, s)) return null;
  const ultima = s.scelte.filter((x) => x.ondata === s.ondata).at(-1);
  if (!ultima || !chiamateAperte(m, s).length) return null;
  return `${s.ondata}:${ultima.chiamata}`;
}

export function mossaPossibile(m: Missione, s: InCorso): boolean {
  const t = turnoMossa(m, s);
  return t !== null && (spento('C241B01') || !(s.mosse ?? []).includes(t));
}

/** Le unità che si possono spostare adesso, per risorsa e settore (le fisse no). */
export function spostabili(m: Missione, s: InCorso): { risorsa: string; settore: string }[] {
  if (!mossaPossibile(m, s)) return [];
  return Object.entries(s.disposizione ?? {}).filter(([r]) => !m.mappa.risorse[r]?.fissa)
    .flatMap(([r, ps]) => Object.entries(ps).filter(([, n]) => n > 0).map(([settore]) => ({ risorsa: r, settore })));
}

export function sposta(m: Missione, s: InCorso, x: Mossa): InCorso {
  const t = turnoMossa(m, s);
  if (t === null) throw new Error(`${m.id}: ora non si può spostare (si sposta fra una chiamata e l'altra)`);
  if (!mossaPossibile(m, s)) throw new Error(`${m.id}: la mossa di questa chiamata è già fatta`);
  if (m.mappa.risorse[x.risorsa]?.fissa) throw new Error(`${m.id}: ${x.risorsa} sono fisse, non si spostano`);
  if (((s.disposizione ?? {})[x.risorsa]?.[x.da] ?? 0) < 1) throw new Error(`${m.id}: nessuna unità ${x.risorsa} in «${x.da}»`);
  if (x.a === x.da || !settoriAmmessi(m, x.risorsa).includes(x.a)) throw new Error(`${m.id}: ${x.risorsa} non si può portare in «${x.a}»`);
  const d = structuredClone(s.disposizione!);
  d[x.risorsa]![x.da] = d[x.risorsa]![x.da]! - 1;
  d[x.risorsa]![x.a] = (d[x.risorsa]![x.a] ?? 0) + 1;
  return { ...s, disposizione: d, mosse: [...(s.mosse ?? []), t] };
}
