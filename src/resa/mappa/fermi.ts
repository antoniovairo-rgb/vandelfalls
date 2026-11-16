// D-279 (PO-152b, strada A): nella mossa le pastiglie rimaste stanno ferme. Il ricalcolo di etichette.ts sceglie il posto del
// gruppo .settore-unita (sopra, destra, sinistra…) per intero: quando un'unità arriva o parte il gruppo poteva passare dall'altra
// parte del nome e le pastiglie rimaste saltavano fino a 199 px (D-278, e08 a 360: tornelli; e26 ed e34: tribuna autorità).
// Qui, solo col «prima» della mossa (congela.ts primaDi): dopo il ricalcolo, per ogni settore con una pastiglia rimasta spostata più
// di una larghezza si rimette il gruppo dov'era (posto di prima, traslato di quanto riporta le rimaste al loro centro); chi arriva
// va dal lato libero del gruppo (in testa o in coda, con `order`), chi parte lascia il posto vuoto di C272V01. Se così il gruppo
// esce dalla mappa o copre un disco, si prova uno scarto piccolo (entro una larghezza) dalla traslazione esatta (D-280, e08 a 360:
// tornelli 7 px a sinistra). Il gruppo così fermato (data-fermo) è un ostacolo e il ricalcolo si rifà intorno a lui (nomi e altri
// gruppi), una volta sola (D-280, costo). Se così c'è qualcosa di vietato (pastiglie o nome fuori dalla mappa, un centro di tocco sotto
// un disco o sul nome di un altro, il proprio disco coperto), più sovrapposizioni (px²) del ricalcolo libero e di quelle già viste,
// per un fermo o in tutto, un settore che salta più del ricalcolo libero e di una larghezza, o più pastiglie coperte oltre metà da un
// nome del ricalcolo libero (D-281), si torna al ricalcolo libero: è un caso geometrico, contato dal guardiano spostamento-po152b.
// L'ordine dato a chi arriva resta finché dura la mossa (D-281). Rosso C279F01: niente, come prima.
import { spento } from '../../interruttori.ts';
import { chiaveUnita, type Prima } from './congela.ts';
import { area, MARGINE, unisci, type Rett } from './etichette.ts';

const centro = (r: Rett) => [(r.left + r.right) / 2, (r.top + r.bottom) / 2] as const;
const dentro = (p: readonly [number, number], q: Rett) => p[0] >= q.left && p[0] <= q.right && p[1] >= q.top && p[1] <= q.bottom;
const figli = (s: Element) => [...(s.querySelector('.settore-unita')?.children ?? [])] as HTMLElement[];
const nomeDi = (s: Element): Rett | null => { const n = s.querySelector('.settore-nome'); if (!n) return null;
  const r = document.createRange(); r.selectNodeContents(n); return unisci([n.getBoundingClientRect(), ...r.getClientRects()]); };
const muovi = (g: HTMLElement, dx: number, dy: number) => { g.style.setProperty('--unita-dx', `${dx}px`); g.style.setProperty('--unita-dy', `${dy}px`); };
const vis = (x: Element) => figli(x).flatMap((c) => { const v = c.querySelector('.pastiglia'); return v ? [v.getBoundingClientRect()] : []; });
const interno = (m: Rett): Rett => ({ left: m.left + MARGINE, top: m.top + MARGINE, right: m.right - MARGINE, bottom: m.bottom - MARGINE });
const verso = (x: number) => Math.sign(x) * Math.ceil(Math.abs(x)); // px interi, mai meno del necessario

/** Prima del ricalcolo: nessun gruppo fermo e, fuori dalla mossa, l'ordine del DOM. */
// D-281 (revisione 3, rilievo 2): nella mossa l'ordine dato a chi arriva («in testa») resta legato alla sua unità. Si toglieva a ogni
// ricalcolo: con la mossa fatta coi segni ▲/▼ ancora in pagina, alla loro sparizione il ricalcolo dopo rimetteva l'arrivata in coda e
// le rimaste saltavano di 44-88 px (e21 a 360, squadre@ex_fonderia → curva_cinderwick). Rosso C281O01: si toglie sempre, come prima
export function sciogli(mappa: HTMLElement, tieniOrdine = false) {
  for (const s of mappa.querySelectorAll<HTMLElement>('[data-fermo]')) s.removeAttribute('data-fermo');
  if (!tieniOrdine || spento('C281O01')) for (const c of mappa.querySelectorAll<HTMLElement>('.settore-unita > *')) c.style.removeProperty('order');
}

/** Le pastiglie coperte per più di metà da un nome, suo o di altri (D-281, revisione 3, rilievo 1). */
function coperte(settori: HTMLElement[]): number {
  const nomi = settori.map(nomeDi).filter((r): r is Rett => !!r);
  return settori.reduce((t, s) => t + vis(s).filter((a) => nomi.some((n) => area(a, n) > ((a.right - a.left) * (a.bottom - a.top)) / 2)).length, 0);
}

/** La pastiglia rimasta più lontana dal posto di prima (px) e la traslazione media che riporta le rimaste. */
function scarto(s: Element, prima: Prima, m: DOMRect) {
  const d = figli(s).flatMap((c) => { const k = chiaveUnita(c), q = k && prima.centri.get(k); if (!q) return [];
    const [x, y] = centro(c.getBoundingClientRect()); return [[q[0] + m.left - x, q[1] + m.top - y] as const]; });
  if (!d.length) return null;
  const media = (i: 0 | 1) => d.reduce((a, z) => a + z[i], 0) / d.length;
  return { max: Math.max(...d.map(([x, y]) => Math.hypot(x, y))), dx: media(0), dy: media(1) };
}

/** Il primo divieto per il settore s nella posizione attuale ('' se nessuno); con `soloSuoi` solo quelli che non dipendono dagli altri. */
export function divieto(s: HTMLElement, settori: HTMLElement[], m: DOMRect, soloSuoi = false): string {
  // i tocchi (44 px) escono dal bordo e si toccano fra loro anche nel ricalcolo: contano le pastiglie visibili; dei tocchi contano
  // i centri (sotto un disco, sopra un nome: D-145) e il proprio disco coperto (C56-03)
  const tocchi = figli(s).filter((c) => !c.hasAttribute('data-vuoto')).map((c) => c.getBoundingClientRect()), altri = settori.filter((x) => x !== s);
  const q = interno(m), fuori = (r: Rett) => r.left < q.left - 0.5 || r.top < q.top - 0.5 || r.right > q.right + 0.5 || r.bottom > q.bottom + 0.5;
  const disco = (x: Element) => x.querySelector('.settore-punto')!.getBoundingClientRect(), casa = s.closest('.mappa')?.querySelector(':scope > .tasto-home');
  const dischi = [...altri.map(disco), ...(casa ? [casa.getBoundingClientRect()] : [])];
  if (vis(s).some(fuori)) return 'fuori';
  if (tocchi.some((t) => dischi.some((d) => dentro(centro(t), d)) || dentro(centro(disco(s)), t))) return 'disco';
  if (soloSuoi) return '';
  const nomi = altri.map(nomeDi).filter((r): r is Rett => !!r);
  if (tocchi.some((t) => nomi.some((r) => dentro(centro(t), r)))) return 'nome rubato';
  const nome = nomeDi(s); if (nome && fuori(nome)) return 'nome fuori';
  return '';
}

/** px² di sovrapposizione del settore s: le sue pastiglie e il suo nome sopra nomi, pastiglie e dischi degli altri e fra loro. */
function pena(s: HTMLElement, settori: HTMLElement[]): number {
  const altri = settori.filter((x) => x !== s), mie = vis(s), nome = nomeDi(s), casa = s.closest('.mappa')?.querySelector(':scope > .tasto-home');
  const dischi = altri.map((x) => x.querySelector('.settore-punto')!.getBoundingClientRect());
  const loro = [...altri.flatMap((x) => [nomeDi(x), ...vis(x)]), ...dischi, ...(casa ? [casa.getBoundingClientRect()] : [])].filter((r): r is Rett => !!r);
  const su = (a: Rett) => loro.reduce((t, r) => t + area(a, r), 0);
  return mie.reduce((t, a) => t + su(a), 0) + (nome ? su(nome) + mie.reduce((t, a) => t + area(a, nome), 0) : 0);
}

// le sovrapposizioni dell'ultima disposizione (già vista dal giocatore): tenendo fermo un gruppo si accetta di tornare fin lì
const viste = new WeakMap<HTMLElement, Map<string, number>>();

/** Ricalcolo della mossa con le pastiglie rimaste ferme dove si può (vedi sopra). `disponi` è il ricalcolo di etichette.ts. */
export function disponiFermi(mappa: HTMLElement, prima: Prima | null, disponi: (soli?: ReadonlySet<HTMLElement>) => void) {
  const prime = viste.get(mappa);
  fermiDentro(mappa, prima, disponi, prime);
  const settori = [...mappa.querySelectorAll<HTMLElement>('[data-settore]')];
  viste.set(mappa, new Map(settori.map((s) => [s.dataset.settore ?? '', pena(s, settori)])));
}

// D-280 (revisione 2, A): ogni ricalcolo di etichette.ts costa (e12 a 360, CPU ×4: circa 2 s l'uno; erano fino a 5 per mossa, 10,9 s
// contro 3,4 di main): un solo ricalcolo intorno ai gruppi fermi, oltre a quello libero; con qualcosa di male si torna al ricalcolo
// libero fotografato, senza rifarlo (D-281, revisione 3, rilievo 3: tolti i candidati di riserva e i ricalcoli in più, mai raggiunti)
// D-280 (revisione 2, E): quanto può crescere la sovrapposizione coi gruppi fermi, in frazione dell'area di una pastiglia (era 0,5 px²:
// e02 squadre@stazione → curva_ospiti si scioglieva per +17 px² e una pastiglia saltava di 79 px). Misura 36 episodi a 360x640:
// elementi oltre 44 px 442 (0) → 422 (0,1) → 396 (0,25) → 352 (0,5), nessun episodio peggiore; invarianti dopo ogni mossa
// pari o migliori (fuori mappa 0, dischi coperti 0, nomi sovrapposti 0). Guardiano: tools/spostamento-po152b.mjs (tetti D-281)
const TOLLERANZA = 0.5;
type Foto = { s: HTMLElement; attr: (string | null)[]; nome: string[]; stretto: boolean; gruppo: string[]; ordini: string[] };
const ATTR = ['data-unita', 'data-nome', 'data-fermo'], NOME = ['max-width', '--nome-dx', '--nome-dy'], GRUPPO = ['--unita-dx', '--unita-dy'];
const fotografa = (settori: HTMLElement[]): Foto[] => settori.map((s) => { const n = s.querySelector<HTMLElement>('.settore-nome'), g = s.querySelector<HTMLElement>('.settore-unita');
  return { s, attr: ATTR.map((a) => s.getAttribute(a)), nome: NOME.map((k) => n?.style.getPropertyValue(k) ?? ''), stretto: !!n?.classList.contains('stretto'),
    gruppo: GRUPPO.map((k) => g?.style.getPropertyValue(k) ?? ''), ordini: figli(s).map((c) => c.style.getPropertyValue('order')) }; });
const metti = (e: HTMLElement | null, k: string, v = '') => { if (!e) return; if (v) e.style.setProperty(k, v); else e.style.removeProperty(k); };
function ripristina(fs: Foto[]) {
  for (const f of fs) { const n = f.s.querySelector<HTMLElement>('.settore-nome'), g = f.s.querySelector<HTMLElement>('.settore-unita');
    ATTR.forEach((a, i) => { const v = f.attr[i]; if (v == null) f.s.removeAttribute(a); else f.s.setAttribute(a, v); });
    NOME.forEach((k, i) => metti(n, k, f.nome[i])); n?.classList.toggle('stretto', f.stretto); GRUPPO.forEach((k, i) => metti(g, k, f.gruppo[i]));
    figli(f.s).forEach((c, i) => metti(c, 'order', f.ordini[i] ?? '')); }
}

// i settori da rifare intorno ai gruppi fermi: loro stessi e chi ha nome o pastiglie (a una larghezza) dove può finire il gruppo fermo o
// il suo nome, che si rifà negli 8 posti intorno al disco (e26 a 360, steward@tribuna_autorita → curva_larkspire: col solo gruppo il nome
// della tribuna finiva su Piazzale, 358 px², e il gruppo si scioglieva: 30/176 come senza fermi)
function vicini(settori: HTMLElement[], fermi: HTMLElement[], larga: number): Set<HTMLElement> {
  const largo = (r: Rett, x: number, y: number) => ({ left: r.left - x, top: r.top - y, right: r.right + x, bottom: r.bottom + y });
  const zone = fermi.flatMap((s) => { const u = unisci(vis(s)), n = nomeDi(s), d = s.querySelector('.settore-punto')?.getBoundingClientRect();
    return [...(u ? [largo(u, larga, larga)] : []), ...(n && d ? [largo(d, n.right - n.left + larga, n.bottom - n.top + larga)] : [])]; });
  return new Set([...fermi, ...settori.filter((s) => [nomeDi(s), ...vis(s)].some((r) => r && zone.some((z) => area(r, z) > 0)))]);
}

type Posto = { max: number; ordine: number; dx: number; dy: number };
type Gruppo = { g: HTMLElement; unita: string };

/** Il posto migliore del gruppo di s dov'era (lato di chi arriva × scarto dalla traslazione esatta) senza divieti suoi. */
function candidato(s: HTMLElement, gr: Gruppo, prima: Prima, m: DOMRect, settori: HTMLElement[], larga: number): Posto | undefined {
  const nuovi = figli(s).filter((c) => { const k = chiaveUnita(c); return k && !prima.centri.has(k); }), tutti: Posto[] = [];
  const passi = [larga / 4, larga / 2], versi = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]] as const;
  // ordine del DOM (chi arriva è già in coda: Mappa.tsx inFila) e chi arriva in testa; «in coda» era un doppione (D-280 revisione 2, B)
  for (const ordine of nuovi.length ? [0, -1] : [0]) {
    s.setAttribute('data-unita', gr.unita); muovi(gr.g, 0, 0); for (const c of nuovi) c.style.setProperty('order', String(ordine));
    const d = scarto(s, prima, m); if (!d) continue;
    const prima0 = tutti.length, prova = (dx: number, dy: number) => { muovi(gr.g, dx, dy); const dopo = scarto(s, prima, m);
      if (dopo && dopo.max <= larga && !divieto(s, settori, m, true)) tutti.push({ max: dopo.max, ordine, dx, dy }); };
    prova(d.dx, d.dy);
    // fuori dalla mappa: lo scarto che rientra (entro una larghezza); se nemmeno così, gli scarti piccoli intorno alla traslazione esatta
    const u = unisci(vis(s)), q = interno(m);
    if (u && tutti.length === prima0) {
      const ex = u.left < q.left ? q.left - u.left : u.right > q.right ? q.right - u.right : 0, ey = u.top < q.top ? q.top - u.top : u.bottom > q.bottom ? q.bottom - u.bottom : 0;
      if ((ex || ey) && Math.hypot(ex, ey) <= larga) prova(d.dx + verso(ex), d.dy + verso(ey));
    }
    if (tutti.length === prima0) for (const r of passi) for (const [a, b] of versi) prova(d.dx + a * r, d.dy + b * r);
  }
  for (const c of nuovi) c.style.removeProperty('order');
  return tutti.sort((a, b) => a.max - b.max)[0]; // a parità il primo provato (sort stabile)
}

// chi arriva prende l'ordine del posto; le altre tengono il loro (D-281: anche quello di un arrivo di prima nella stessa mossa)
function fissa(s: HTMLElement, gr: Gruppo, p: Posto, prima: Prima) {
  s.setAttribute('data-unita', gr.unita); muovi(gr.g, p.dx, p.dy); s.setAttribute('data-fermo', '');
  for (const c of figli(s)) { const k = chiaveUnita(c); if (k && !prima.centri.has(k)) c.style.setProperty('order', String(p.ordine)); }
}

function fermiDentro(mappa: HTMLElement, prima: Prima | null, disponi: (soli?: ReadonlySet<HTMLElement>) => void, prime: Map<string, number> | undefined) {
  // solo dopo la mossa (data-mossa «fatta»): prima della mossa la disposizione resta quella di sempre (e36 a 360: tenere i gruppi già
  // all'arrivo della risposta cambiava la disposizione di partenza e la mossa poi saltava di più)
  // e solo a mappa della stessa misura: se cambia l'altezza (riquadro radio, costo) i dischi si spostano e tenere i pixel di prima
  // inchioderebbe le pastiglie lontano dal loro disco, che poi saltano di più alla mossa (e03, e07, e19 a 375; e36 a 360)
  const [lw, lh] = prima?.firma.split('#') ?? [], m0 = mappa.getBoundingClientRect();
  const mossa = !!prima && !spento('C279F01') && mappa.querySelector('.radio-mappa [data-mossa]')?.getAttribute('data-mossa') === 'fatta'
    && Number(lw) === Math.round(m0.width) && Number(lh) === Math.round(m0.height);
  sciogli(mappa, mossa); disponi();
  if (!prima || !mossa) return;
  const m = mappa.getBoundingClientRect(), settori = [...mappa.querySelectorAll<HTMLElement>('[data-settore]')];
  let tenuti = 0;
  // una larghezza: quella di un tocco, uguale per tutti i settori (D-280: per i settori senza unità era 0, e il nome di uno di loro
  // che si spostava di 37 px scioglieva il gruppo: a 360×760 in e26 nessun gruppo restava fermo)
  const larga = mappa.querySelector('.settore-unita > *')?.getBoundingClientRect().width ?? 0;
  // le sovrapposizioni del ricalcolo libero o, se più, quelle già viste: coi gruppi fermi non devono crescere (né per fermo né in tutto)
  // e quanto si spostano le rimaste e il nome di ogni settore nel ricalcolo libero: un gruppo fermo non deve farne saltare un altro
  // (e31 a 360: pastiglie di Piazzale, 138 px; e32: nome di Strada Larkspire, 79 px)
  const nomeVia = (s: HTMLElement) => { const q = prima.centri.get(`nome ${s.dataset.settore}`), n = s.querySelector('.settore-nome'); if (!q || !n) return 0;
    const [x, y] = centro(n.getBoundingClientRect()); return Math.hypot(x - m.left - q[0], y - m.top - q[1]); };
  const ferme = (s: HTMLElement) => scarto(s, prima, m)?.max ?? 0, via = (s: HTMLElement) => Math.max(ferme(s), nomeVia(s));
  const via0 = new Map(settori.map((s) => [s, Math.max(via(s), larga)]));
  // e le pastiglie che nel ricalcolo libero restano dove sono restano ferme anche coi gruppi fermi (D-281, CI 1449: e03 a 375,
  // squadre@quartiere → curva_ospiti, le 3 rimaste in Quartiere si spostavano di 6 px nel ricalcolo leggero; rosso C281S01)
  const immobili = new Set(spento('C281S01') ? [] : settori.filter((s) => ferme(s) <= 0.5));
  const pena0 = new Map(settori.map((s) => [s, Math.max(pena(s, settori), prime?.get(s.dataset.settore ?? '') ?? 0)]));
  const tutta = (f: (s: HTMLElement) => number) => settori.reduce((t, s) => t + f(s), 0), libera = fotografa(settori);
  // le coperte del ricalcolo libero, prima di fermare i gruppi: contate dopo `fissa` includevano già l'arrivata messa sotto il suo nome
  // (D-281, revisione 3: 5 rimaste a 360, e03 e21 e28 e29; il rosso C281O01 non le cambiava, l'ordine non c'entra)
  const nomi = !spento('C281N01'), coperte0 = coperte(settori);
  for (const s of settori) {
    const g = s.querySelector<HTMLElement>('.settore-unita'), pp = prima.posti.get(s.dataset.settore ?? ''), ora = g && pp?.unita ? scarto(s, prima, m) : null;
    if (!g || !pp?.unita || !ora || ora.max <= larga) continue;
    const prove = { unita: s.getAttribute('data-unita'), dx: g.style.getPropertyValue('--unita-dx'), dy: g.style.getPropertyValue('--unita-dy') };
    const gr = { g, unita: pp.unita }, primo = candidato(s, gr, prima, m, settori, larga);
    if (primo) { fissa(s, gr, primo, prima); tenuti++; continue; }
    if (prove.unita) s.setAttribute('data-unita', prove.unita); g.style.setProperty('--unita-dx', prove.dx); g.style.setProperty('--unita-dy', prove.dy);
  }
  if (!tenuti) return;
  // il ricalcolo intorno ai gruppi fermi, uno; con qualcosa di male si torna al ricalcolo libero
  const fermi = () => settori.filter((s) => s.hasAttribute('data-fermo')), pa = mappa.querySelector('.settore-unita .pastiglia')?.getBoundingClientRect();
  const toll = Math.max(0.5, spento('C281T01') ? 0 : TOLLERANZA * (pa ? pa.width * pa.height : 0)); // rosso C281T01: 0,5 px² come prima
  // chi era immobile nel ricalcolo libero e il ricalcolo intorno ai fermi ha spostato torna come nel libero, se così niente di vietato
  // e le sovrapposizioni in tutto non crescono oltre la tolleranza (altrimenti resta il ricalcolo)
  // e senza nuove pastiglie sotto un nome (D-281, revisione 3, rilievo 1: con la tolleranza un'arrivata finiva sotto il nome del suo
  // settore, e28 a 360 steward@curva_cinderwick → magazzino_fonderie; rosso C281N01: non si guarda, come prima)
  const riferma = () => { for (const s of immobili) { if (s.hasAttribute('data-fermo') || ferme(s) <= 0.5) continue;
    const ora = fotografa([s]), prima0 = tutta((x) => pena(x, settori)), c0 = nomi ? coperte(settori) : 0; ripristina(libera.filter((f) => f.s === s));
    if ([s, ...fermi()].some((x) => divieto(x, settori, m)) || tutta((x) => pena(x, settori)) > prima0 + toll || (nomi && coperte(settori) > c0)) ripristina(ora); } };
  disponi(vicini(settori, fermi(), larga)); riferma();
  const ora = new Map(settori.map((s) => [s, pena(s, settori)])), cresce = (s: HTMLElement) => (ora.get(s) ?? 0) - (pena0.get(s) ?? 0), quanti = fermi().length;
  const male = fermi().some((s) => divieto(s, settori, m) || cresce(s) > toll)
    || (quanti > 0 && tutta((s) => ora.get(s) ?? 0) > tutta((s) => pena0.get(s) ?? 0) + toll) // in tutto peggio
    || (quanti > 0 && settori.some((s) => (!s.hasAttribute('data-fermo') ? via(s) : nomeVia(s)) > (via0.get(s) ?? 0) + 0.5)) // un settore saltato
    || (nomi && coperte(settori) > coperte0);
  if (male) ripristina(libera); // il ricalcolo libero, senza rifarlo
}
