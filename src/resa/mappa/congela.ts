// D-272 (passo 3): con la mossa la disposizione di nomi e unità resta ferma da «puoi» alla chiamata dopo. Prima si rifaceva a
// ogni disegno (4 volte per risposta in media, 725 ms a CPU ×1 e 3,9 s a ×4, costo-nomi.mjs «conta»), e dopo la mossa pastiglie
// e nomi saltavano (e03 a 360/375: 4 pastiglie spostate di 91-139 px, 3 nomi di 53-94 px). La disposizione si calcola una
// volta per misura della mappa e si rimette uguale; cambia solo se la mappa cambia misura (C57-01 dice che non succede).
// Chiave: il messaggio della risposta, come la mappa tenuta di adatta.ts (alla chiamata dopo è un altro elemento).
// Rosso C272C01: si rifà a ogni disegno, come prima.
import { spento } from '../../interruttori.ts';

interface Posto { nome: string | null; unita: string | null; largo: string; ndx: string; ndy: string; udx: string; udy: string }
const ferme = new WeakMap<Element, { misura: string; posti: Map<string, Posto> }>();

const chiaveDi = (mappa: HTMLElement) => (mappa.classList.contains('mossa') && !spento('C272C01') ? mappa.closest('main')?.querySelector('[data-messaggio="risposta"]') ?? null : null);
const misuraDi = (mappa: HTMLElement) => { const r = mappa.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)}`; };

/** Rimette la disposizione ferma, se c'è per questa risposta e questa misura della mappa; true se l'ha rimessa. */
export function rimettiFerma(mappa: HTMLElement): boolean {
  const k = chiaveDi(mappa), f = k ? ferme.get(k) : undefined;
  if (!f || f.misura !== misuraDi(mappa)) return false;
  for (const s of mappa.querySelectorAll<HTMLElement>('[data-settore]')) {
    const p = f.posti.get(s.dataset.settore ?? ''); if (!p) return false; // un settore nuovo: si rifà
    if (p.nome) s.setAttribute('data-nome', p.nome); if (p.unita) s.setAttribute('data-unita', p.unita);
    const n = s.querySelector<HTMLElement>('.settore-nome'), g = s.querySelector<HTMLElement>('.settore-unita');
    if (n) { n.style.maxWidth = p.largo; n.style.setProperty('--nome-dx', p.ndx); n.style.setProperty('--nome-dy', p.ndy); }
    if (g) { g.style.setProperty('--unita-dx', p.udx); g.style.setProperty('--unita-dy', p.udy); }
  }
  return true;
}

/** Tiene la disposizione appena calcolata per questa risposta (con la mossa). */
export function tieniFerma(mappa: HTMLElement) {
  const k = chiaveDi(mappa); if (!k) return;
  const posti = new Map<string, Posto>();
  for (const s of mappa.querySelectorAll<HTMLElement>('[data-settore]')) {
    const n = s.querySelector<HTMLElement>('.settore-nome'), g = s.querySelector<HTMLElement>('.settore-unita');
    posti.set(s.dataset.settore ?? '', { nome: s.getAttribute('data-nome'), unita: s.getAttribute('data-unita'), largo: n?.style.maxWidth ?? '',
      ndx: n?.style.getPropertyValue('--nome-dx') ?? '', ndy: n?.style.getPropertyValue('--nome-dy') ?? '', udx: g?.style.getPropertyValue('--unita-dx') ?? '', udy: g?.style.getPropertyValue('--unita-dy') ?? '' });
  }
  ferme.set(k, { misura: misuraDi(mappa), posti });
}
