// D-279 (PO-152b, strada A): nella mossa le pastiglie rimaste stanno ferme. Il ricalcolo di etichette.ts sceglie il posto del
// gruppo .settore-unita (sopra, destra, sinistra…) per intero: quando un'unità arriva o parte il gruppo poteva passare dall'altra
// parte del nome e le pastiglie rimaste saltavano fino a 199 px (D-278, e08 a 360: tornelli; e26 ed e34: tribuna autorità).
// Qui, solo col «prima» della mossa (congela.ts primaDi): dopo il ricalcolo, per ogni settore con una pastiglia rimasta spostata più
// di una larghezza si rimette il gruppo dov'era (posto di prima, traslato di quanto riporta le rimaste al loro centro); chi arriva
// va dal lato libero del gruppo (in testa o in coda, con `order`), chi parte lascia il posto vuoto di C272V01. Il gruppo così
// fermato (data-fermo) è un ostacolo e il ricalcolo si rifà intorno a lui (nomi e altri gruppi). Alla fine un gruppo fermo con
// qualcosa di vietato (pastiglie o nome fuori dalla mappa, un centro di tocco sotto un disco o sul nome di un altro, il proprio disco
// coperto) o con più sovrapposizioni (px²) del ricalcolo libero e di quelle già viste, per sé o in tutto, o che fa saltare le
// pastiglie rimaste o il nome di un altro settore più che nel ricalcolo libero, si scioglie e resta il ricalcolo: è un caso
// geometrico, contato dal guardiano spostamento-po152b. Rosso C279F01: niente, come prima.
import { spento } from '../../interruttori.ts';
import { chiaveUnita, type Prima } from './congela.ts';

type Rett = { left: number; top: number; right: number; bottom: number };
const MARGINE = 5; // come etichette.ts (controllo R06 di tools/foto.mjs)
const area = (a: Rett, b: Rett) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
const centro = (r: Rett) => [(r.left + r.right) / 2, (r.top + r.bottom) / 2] as const;
const dentro = (p: readonly [number, number], q: Rett) => p[0] >= q.left && p[0] <= q.right && p[1] >= q.top && p[1] <= q.bottom;
const figli = (s: Element) => [...(s.querySelector('.settore-unita')?.children ?? [])] as HTMLElement[];
const nomeDi = (s: Element): Rett | null => { const n = s.querySelector('.settore-nome'); if (!n) return null; const r = document.createRange(); r.selectNodeContents(n);
  return [n.getBoundingClientRect(), ...r.getClientRects()].filter((x) => x.width && x.height).reduce<Rett | null>((a, x) => (a ? { left: Math.min(a.left, x.left), top: Math.min(a.top, x.top), right: Math.max(a.right, x.right), bottom: Math.max(a.bottom, x.bottom) } : x), null); };
const muovi = (g: HTMLElement, dx: number, dy: number) => { g.style.setProperty('--unita-dx', `${dx}px`); g.style.setProperty('--unita-dy', `${dy}px`); };

/** Prima del ricalcolo: nessun gruppo fermo e l'ordine del DOM. */
export function sciogli(mappa: HTMLElement) {
  for (const s of mappa.querySelectorAll<HTMLElement>('[data-fermo]')) s.removeAttribute('data-fermo');
  for (const c of mappa.querySelectorAll<HTMLElement>('.settore-unita > *')) c.style.removeProperty('order');
}

/** La pastiglia rimasta più lontana dal posto di prima (px) e la traslazione media che riporta le rimaste. */
function scarto(s: Element, prima: Prima, m: DOMRect) {
  const d = figli(s).flatMap((c) => { const k = chiaveUnita(c), q = k && prima.centri.get(k); if (!q) return [];
    const [x, y] = centro(c.getBoundingClientRect()); return [[q[0] + m.left - x, q[1] + m.top - y] as const]; });
  if (!d.length) return null;
  return { max: Math.max(...d.map(([x, y]) => Math.hypot(x, y))), dx: d.reduce((a, z) => a + z[0], 0) / d.length, dy: d.reduce((a, z) => a + z[1], 0) / d.length };
}

/** Il primo divieto per il settore s nella posizione attuale ('' se nessuno); con `soloSuoi` solo quelli che non dipendono dagli altri. */
export function divieto(s: HTMLElement, settori: HTMLElement[], m: DOMRect, soloSuoi = false): string {
  // i tocchi (44 px) escono dal bordo e si toccano fra loro anche nel ricalcolo: contano le pastiglie visibili; dei tocchi contano
  // i centri (sotto un disco, sopra un nome: D-145) e il proprio disco coperto (C56-03)
  const vis = (x: Element) => figli(x).flatMap((c) => { const v = c.querySelector('.pastiglia'); return v ? [v.getBoundingClientRect() as Rett] : []; });
  const tocchi = figli(s).filter((c) => !c.hasAttribute('data-vuoto')).map((c) => c.getBoundingClientRect() as Rett), mie = vis(s), altri = settori.filter((x) => x !== s);
  const interno = { left: m.left + MARGINE, top: m.top + MARGINE, right: m.right - MARGINE, bottom: m.bottom - MARGINE };
  const fuori = (r: Rett) => r.left < interno.left - 0.5 || r.top < interno.top - 0.5 || r.right > interno.right + 0.5 || r.bottom > interno.bottom + 0.5;
  const disco = (x: Element) => x.querySelector('.settore-punto')!.getBoundingClientRect() as Rett, casa = s.closest('.mappa')?.querySelector(':scope > .tasto-home');
  const dischi = [...altri.map(disco), ...(casa ? [casa.getBoundingClientRect() as Rett] : [])];
  if (mie.some(fuori)) return 'fuori';
  if (tocchi.some((t) => dischi.some((d) => dentro(centro(t), d)) || dentro(centro(disco(s)), t))) return 'disco';
  if (soloSuoi) return '';
  const nomi = altri.map(nomeDi).filter((r): r is Rett => !!r);
  if (tocchi.some((t) => nomi.some((r) => dentro(centro(t), r)))) return 'nome rubato';
  const nome = nomeDi(s); if (nome && fuori(nome)) return 'nome fuori';
  return '';
}

/** px² di sovrapposizione del settore s: le sue pastiglie e il suo nome sopra nomi, pastiglie e dischi degli altri e fra loro. */
function pena(s: HTMLElement, settori: HTMLElement[]): number {
  const vis = (x: Element) => figli(x).flatMap((c) => { const v = c.querySelector('.pastiglia'); return v ? [v.getBoundingClientRect() as Rett] : []; });
  const altri = settori.filter((x) => x !== s), mie = vis(s), nome = nomeDi(s), casa = s.closest('.mappa')?.querySelector(':scope > .tasto-home');
  const loro = [...altri.flatMap((x) => [nomeDi(x), ...vis(x)]), ...altri.map((x) => x.querySelector('.settore-punto')!.getBoundingClientRect() as Rett), ...(casa ? [casa.getBoundingClientRect() as Rett] : [])].filter((r): r is Rett => !!r);
  const su = (a: Rett) => loro.reduce((t, r) => t + area(a, r), 0);
  return mie.reduce((t, a) => t + su(a), 0) + (nome ? su(nome) + mie.reduce((t, a) => t + area(a, nome), 0) : 0);
}

// le sovrapposizioni dell'ultima disposizione (già vista dal giocatore): tenendo fermo un gruppo si accetta di tornare fin lì
const viste = new WeakMap<HTMLElement, Map<string, number>>();

/** Ricalcolo della mossa con le pastiglie rimaste ferme dove si può (vedi sopra). `disponi` è il ricalcolo di etichette.ts. */
export function disponiFermi(mappa: HTMLElement, prima: Prima | null, disponi: () => void) {
  const prime = viste.get(mappa);
  fermiDentro(mappa, prima, disponi, prime);
  const settori = [...mappa.querySelectorAll<HTMLElement>('[data-settore]')];
  viste.set(mappa, new Map(settori.map((s) => [s.dataset.settore ?? '', pena(s, settori)])));
}

function fermiDentro(mappa: HTMLElement, prima: Prima | null, disponi: () => void, prime: Map<string, number> | undefined) {
  sciogli(mappa); disponi();
  if (!prima || spento('C279F01')) return;
  const m = mappa.getBoundingClientRect(), settori = [...mappa.querySelectorAll<HTMLElement>('[data-settore]')], fermi: HTMLElement[] = [];
  // le sovrapposizioni del ricalcolo libero o, se più, quelle già viste: coi gruppi fermi non devono crescere (né per fermo né in tutto)
  // e quanto si spostano le rimaste e il nome di ogni settore nel ricalcolo libero: un gruppo fermo non deve farne saltare un altro
  // (e31 a 360: pastiglie di Piazzale, 138 px; e32: nome di Strada Larkspire, 79 px)
  const nomeVia = (s: HTMLElement) => { const q = prima.centri.get(`nome ${s.dataset.settore}`), n = s.querySelector('.settore-nome'); if (!q || !n) return 0;
    const [x, y] = centro(n.getBoundingClientRect()); return Math.hypot(x - m.left - q[0], y - m.top - q[1]); };
  const via = (s: HTMLElement) => Math.max(scarto(s, prima, m)?.max ?? 0, nomeVia(s)), larghe = (s: HTMLElement) => s.querySelector('.settore-unita')?.firstElementChild?.getBoundingClientRect().width ?? 0;
  const via0 = new Map(settori.map((s) => [s, Math.max(via(s), larghe(s))]));
  const pena0 = new Map(settori.map((s) => [s, Math.max(pena(s, settori), prima ? prime?.get(s.dataset.settore ?? '') ?? 0 : 0)])), tutta = (f: (s: HTMLElement) => number) => settori.reduce((t, s) => t + f(s), 0);
  for (const s of settori) {
    const g = s.querySelector<HTMLElement>('.settore-unita'), pp = prima.posti.get(s.dataset.settore ?? ''), ora = g && pp?.unita ? scarto(s, prima, m) : null;
    const larga = g?.firstElementChild?.getBoundingClientRect().width ?? 0;
    if (!g || !pp?.unita || !ora || ora.max <= larga) continue;
    const prove = { unita: s.getAttribute('data-unita'), dx: g.style.getPropertyValue('--unita-dx'), dy: g.style.getPropertyValue('--unita-dy') };
    const nuovi = figli(s).filter((c) => { const k = chiaveUnita(c); return k && !prima.centri.has(k); });
    let meglio: { max: number; ordine: number; dx: number; dy: number } | null = null;
    for (const ordine of nuovi.length ? [0, -1, 1] : [0]) { // ordine del DOM, chi arriva in testa, in coda
      s.setAttribute('data-unita', pp.unita); muovi(g, 0, 0); for (const c of nuovi) c.style.setProperty('order', String(ordine));
      const d = scarto(s, prima, m); if (!d) continue;
      muovi(g, d.dx, d.dy); const dopo = scarto(s, prima, m);
      if (dopo && dopo.max <= larga && !divieto(s, settori, m, true) && (!meglio || dopo.max < meglio.max - 0.5)) meglio = { max: dopo.max, ordine, dx: d.dx, dy: d.dy };
    }
    for (const c of nuovi) c.style.setProperty('order', String(meglio?.ordine ?? 0));
    if (meglio) { s.setAttribute('data-unita', pp.unita); muovi(g, meglio.dx, meglio.dy); s.setAttribute('data-fermo', ''); fermi.push(s); }
    else { if (prove.unita) s.setAttribute('data-unita', prove.unita); g.style.setProperty('--unita-dx', prove.dx); g.style.setProperty('--unita-dy', prove.dy); for (const c of nuovi) c.style.removeProperty('order'); }
  }
  if (!fermi.length) return;
  // il ricalcolo intorno ai gruppi fermi; chi resta con un divieto si scioglie e si rifà (al più tante volte quanti i fermi)
  for (let giro = 0; giro <= fermi.length; giro++) {
    disponi();
    const ora = new Map(settori.map((s) => [s, pena(s, settori)])), cresce = (s: HTMLElement) => ora.get(s)! - pena0.get(s)!;
    const male = settori.filter((s) => s.hasAttribute('data-fermo') && (divieto(s, settori, m) || cresce(s) > 0.5));
    if (!male.length && tutta((s) => ora.get(s)!) > tutta((s) => pena0.get(s)!) + 0.5) // in tutto peggio: si scioglie il fermo che pesa di più
      male.push(settori.filter((s) => s.hasAttribute('data-fermo')).sort((a, b) => cresce(b) - cresce(a))[0]!);
    const saltati = male.length ? [] : settori.filter((s) => (!s.hasAttribute('data-fermo') ? via(s) : nomeVia(s)) > via0.get(s)! + 0.5);
    if (saltati.length) { // si scioglie il fermo più vicino al primo settore saltato
      const [x, y] = centro(saltati[0]!.querySelector('.settore-punto')!.getBoundingClientRect()), d = (s: HTMLElement) => { const [a, b] = centro(s.querySelector('.settore-punto')!.getBoundingClientRect()); return Math.hypot(a - x, b - y); };
      male.push(settori.filter((s) => s.hasAttribute('data-fermo')).sort((a, b) => d(a) - d(b))[0]!); }
    if (!male.length) return;
    for (const s of male) { s.removeAttribute('data-fermo'); for (const c of figli(s)) c.style.removeProperty('order'); }
  }
  disponi();
}
