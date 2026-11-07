// D-272 (passo 3): la disposizione di nomi e unità si ricalcola solo quando cambia qualcosa che la decide (misura della mappa,
// unità e loro stato, punti accesi, nomi, segni, «Home», caratteri). Prima si rifaceva a ogni disegno: 4 volte per risposta in
// media, 725 ms a CPU ×1 e 3,9 s a ×4 (costo-nomi.mjs «conta», 40 risposte a 360×640), quasi sempre con gli stessi ingressi.
// A ingressi uguali si rimette il risultato di prima (stesso esito, deterministico). Il congelamento da «puoi» con posto
// riservato (prima prova) rompeva tocchi e anelli dello stato «in mano» (C56-03, D-271): qui niente cambia di comportamento.
// Rosso C272C01: si rifà a ogni disegno, come prima.
import { spento } from '../../interruttori.ts';

export interface Posto { nome: string | null; unita: string | null; largo: string; ndx: string; ndy: string; udx: string; udy: string }
export interface Prima { firma: string; posti: Map<string, Posto>; centri: Map<string, readonly [number, number]> }
const memo = new WeakMap<HTMLElement, Prima>();

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
  for (const s of mappa.querySelectorAll<HTMLElement>('[data-settore]')) { const p = f.posti.get(s.dataset.settore ?? ''); if (!p) return false; metti(s, p); }
  return true;
}

/** Rimette in un settore il posto di nome e unità tenuto prima. */
export function metti(s: HTMLElement, p: Posto) {
  if (p.nome) s.setAttribute('data-nome', p.nome); if (p.unita) s.setAttribute('data-unita', p.unita);
  const n = s.querySelector<HTMLElement>('.settore-nome'), g = s.querySelector<HTMLElement>('.settore-unita');
  if (n) { n.style.maxWidth = p.largo; n.style.setProperty('--nome-dx', p.ndx); n.style.setProperty('--nome-dy', p.ndy); }
  if (g) { g.style.setProperty('--unita-dx', p.udx); g.style.setProperty('--unita-dy', p.udy); }
}

// D-272 (passo 2): dopo la mossa le pastiglie rimaste ferme saltavano fino a 133 px (e03 a 360, squadre@quartiere → piazzale:
// il gruppo di Quartiere da «sopra» a «sotto»), perché ogni ricalcolo ripartiva da zero. Il ricalcolo riceve la disposizione di
// prima (posti e centri di nomi e tocchi, rispetto alla mappa) e conta quanto sposta ogni elemento che c'era già.
// Con gli stessi ingressi (stessa firma) non c'è un «prima»: il ricalcolo resta quello di sempre. Il «prima» vale solo nella
// mossa e alla stessa larghezza: fuori (schieramento, cambio di misura) la disposizione non dipende dallo stato di prima
// (C33-04; CI 1355 rossa su 8329ef4b, «la disposizione cambia ripartendo da un altro stato» in e02-e06). Rosso C272W01: nessun prima;
// rosso C272W02: il «prima» anche fuori dalla mossa e a un'altra larghezza, com'era su 8329ef4b.
export function primaDi(mappa: HTMLElement, firma: string): Prima | null {
  const f = memo.get(mappa);
  return !f || f.firma === firma || spento('C272W01') || (!spento('C272W02') && (!mappa.querySelector('.radio-mappa [data-mossa]') || f.firma.split('#')[0] !== firma.split('#')[0])) ? null : f;
}

const centriDi = (mappa: HTMLElement) => {
  const m = mappa.getBoundingClientRect(), c = new Map<string, readonly [number, number]>(), cc = (r: DOMRect) => [(r.left + r.right) / 2 - m.left, (r.top + r.bottom) / 2 - m.top] as const;
  for (const s of mappa.querySelectorAll<HTMLElement>('[data-settore]')) {
    const n = s.querySelector('.settore-nome'); if (n) c.set(`nome ${s.dataset.settore}`, cc(n.getBoundingClientRect()));
    for (const u of s.querySelector('.settore-unita')?.children ?? []) { const k = chiaveUnita(u); if (k) c.set(k, cc(u.getBoundingClientRect())); }
  }
  return c;
};
/** La chiave di un tocco d'unità nei centri di prima (l'unità mossa cambia chiave: il suo salto non si conta). */
export const chiaveUnita = (u: Element) => { const d = (u as HTMLElement).dataset, k = d.presenza ?? d.fissa; return k ? `unità ${k}` : null; };

/** Tiene il risultato appena calcolato, con la firma degli ingressi presa prima del calcolo. */
export function tieni(mappa: HTMLElement, firma: string) { memo.set(mappa, { firma, posti: leggi(mappa), centri: centriDi(mappa) }); }
