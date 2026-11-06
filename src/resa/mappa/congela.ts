// D-272 (passo 3): la disposizione di nomi e unità si ricalcola solo quando cambia qualcosa che la decide (misura della mappa,
// unità e loro stato, punti accesi, nomi, segni, «Home», caratteri). Prima si rifaceva a ogni disegno: 4 volte per risposta in
// media, 725 ms a CPU ×1 e 3,9 s a ×4 (costo-nomi.mjs «conta», 40 risposte a 360×640), quasi sempre con gli stessi ingressi.
// A ingressi uguali si rimette il risultato di prima (stesso esito, deterministico). Il congelamento da «puoi» con posto
// riservato (prima prova) rompeva tocchi e anelli dello stato «in mano» (C56-03, D-271): qui niente cambia di comportamento.
// Rosso C272C01: si rifà a ogni disegno, come prima.
import { spento } from '../../interruttori.ts';

export interface Posto { nome: string | null; unita: string | null; largo: string; ndx: string; ndy: string; udx: string; udy: string }
const memo = new WeakMap<HTMLElement, { firma: string; posti: Map<string, Posto>; risposta: Element | null }>();

const rispostaDi = (mappa: HTMLElement) => mappa.closest('main')?.querySelector('[data-messaggio="risposta"]') ?? null;

/** Tutto ciò che decide la disposizione, in una stringa. */
export function firmaDi(mappa: HTMLElement): string {
  const m = mappa.getBoundingClientRect(), rel = (r: DOMRect) => [r.left - m.left, r.top - m.top, r.width, r.height].map(Math.round).join(',');
  const casa = mappa.querySelector(':scope > .tasto-home');
  const settori = [...mappa.querySelectorAll<HTMLElement>('[data-settore]')].map((s) => {
    const p = s.querySelector<HTMLButtonElement>('.settore-punto');
    const unita = [...(s.querySelector('.settore-unita')?.children ?? [])].map((u) => `${(u as HTMLElement).dataset.presenza ?? (u as HTMLElement).dataset.fissa ?? ''}:${u.className}:${u.textContent}`).join('+');
    const segni = [...s.querySelectorAll<HTMLElement>('[data-segno]')].map((x) => x.dataset.segno).join('+');
    return `${s.dataset.settore}|${s.className}|${p?.disabled ? 0 : 1}|${s.querySelector('.settore-nome')?.textContent ?? ''}|${unita}|${segni}`;
  });
  return [Math.round(m.width), Math.round(m.height), mappa.className, mappa.hasAttribute('data-casa-fuori'), casa ? `${casa.className}@${rel(casa.getBoundingClientRect())}` : '', document.fonts?.status ?? '', ...settori].join('#');
}

const leggi = (mappa: HTMLElement) => {
  const posti = new Map<string, Posto>();
  for (const s of mappa.querySelectorAll<HTMLElement>('[data-settore]')) {
    const n = s.querySelector<HTMLElement>('.settore-nome'), g = s.querySelector<HTMLElement>('.settore-unita');
    posti.set(s.dataset.settore ?? '', { nome: s.getAttribute('data-nome'), unita: s.getAttribute('data-unita'), largo: n?.style.maxWidth ?? '',
      ndx: n?.style.getPropertyValue('--nome-dx') ?? '', ndy: n?.style.getPropertyValue('--nome-dy') ?? '', udx: g?.style.getPropertyValue('--unita-dx') ?? '', udy: g?.style.getPropertyValue('--unita-dy') ?? '' });
  }
  return posti;
};

/** Rimette il risultato di prima se gli ingressi sono gli stessi; true se l'ha rimesso. */
export function rimettiUguale(mappa: HTMLElement): boolean {
  if (spento('C272C01')) return false;
  const f = memo.get(mappa);
  if (!f || f.firma !== firmaDi(mappa)) return false;
  for (const s of mappa.querySelectorAll<HTMLElement>('[data-settore]')) {
    const p = f.posti.get(s.dataset.settore ?? ''); if (!p) return false;
    if (p.nome) s.setAttribute('data-nome', p.nome); if (p.unita) s.setAttribute('data-unita', p.unita);
    const n = s.querySelector<HTMLElement>('.settore-nome'), g = s.querySelector<HTMLElement>('.settore-unita');
    if (n) { n.style.maxWidth = p.largo; n.style.setProperty('--nome-dx', p.ndx); n.style.setProperty('--nome-dy', p.ndy); }
    if (g) { g.style.setProperty('--unita-dx', p.udx); g.style.setProperty('--unita-dy', p.udy); }
  }
  return true;
}

/** Tiene il risultato appena calcolato, con la firma degli ingressi presa prima del calcolo. */
export function tieni(mappa: HTMLElement, firma: string) { memo.set(mappa, { firma, posti: leggi(mappa), risposta: rispostaDi(mappa) }); }

/** D-272: dentro la stessa risposta con la mossa, i posti di prima (a parità di costo vincono loro: niente salti dopo la mossa).
 *  Fuori dalla mossa niente: la disposizione non dipende dalla storia (C33-04). Rosso C272P01: nessuna preferenza. */
export function postiDiPrima(mappa: HTMLElement): Map<string, Posto> | undefined {
  if (spento('C272P01') || !mappa.classList.contains('mossa')) return undefined;
  const f = memo.get(mappa), r = rispostaDi(mappa);
  return f && r && f.risposta === r ? f.posti : undefined;
}
