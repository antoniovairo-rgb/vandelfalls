// Disposizione dei nomi e delle unità sulla mappa (C-008, N01 di C-007): per ogni settore si provano le
// posizioni possibili, misurate nel DOM, e si tiene la prima che non tocca niente. Ostacoli: i punti dei
// settori (44×44), i nomi già messi, le aree di tocco delle unità già messe e i bordi della mappa (margine 5 px).
// Nessun numero di pixel scritto qui: le posizioni stanno in stile.css ([data-nome], [data-unita]).

import { spento } from '../../interruttori.ts';
import { segniVisti } from './segni-visti.ts';

type Rett = { left: number; top: number; right: number; bottom: number };
const MARGINE = 5; // distanza minima dal bordo della mappa (controllo R06 di tools/foto.mjs)
const STACCO = 6;  // distacco minimo fra due nomi: attaccati sembrerebbero un nome solo
const largo = (r: Rett, d: number): Rett => ({ left: r.left - d, top: r.top - d, right: r.right + d, bottom: r.bottom + d });
const VERA = 100; // una sovrapposizione vera pesa molto più di un distacco mancante fra due nomi
const LONTANO = 0; // C23-02: px² di stelline che vale un px di distanza in più dal proprio disco. 0 = nessuna sovrapposizione (nomi fino a 55 px dal disco a 360); 400 = nomi entro 11 px ma 7/36 su stelline altrui. La scelta è del PO (rapporto C23).
const NOMI = ['sotto', 'sopra', 'destra', 'sinistra', 'sotto-sx', 'sotto-dx', 'sopra-sx', 'sopra-dx'] as const;
const UNITA = ['sopra', 'destra', 'sinistra', 'destra-alto', 'sinistra-alto', 'sotto'] as const;
const UNITA_PIU = ['destra-basso', 'sinistra-basso'] as const; // C28-14 / D-136

const area = (a: Rett, b: Rett) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
const fuori = (r: Rett, m: Rett) => {
  const dentro = { left: m.left + MARGINE, top: m.top + MARGINE, right: m.right - MARGINE, bottom: m.bottom - MARGINE };
  return (r.right - r.left) * (r.bottom - r.top) - area(r, dentro);
};
const unione = (els: Element[]): Rett | null => unisci(els.map((e) => e.getBoundingClientRect()));
const unisci = (tutti: DOMRect[]): Rett | null => {
  const rs = tutti.filter((r) => r.width && r.height);
  if (!rs.length) return null;
  return { left: Math.min(...rs.map((r) => r.left)), top: Math.min(...rs.map((r) => r.top)), right: Math.max(...rs.map((r) => r.right)), bottom: Math.max(...rs.map((r) => r.bottom)) };
};

/** Sceglie fra i posti possibili quello con meno sovrapposizioni (i bordi pesano di più); a parità, il primo. */
type Ostacolo = { vero: Rett; largo: Rett };
const ostacolo = (r: Rett, d = 0): Ostacolo => ({ vero: r, largo: largo(r, d) });

function piazza(el: HTMLElement, attributo: string, posti: readonly string[], misura: () => Rett | null, ostacoli: Ostacolo[], mappa: Rett): Rett | null {
  let migliore = { posto: posti[0]!, costo: Infinity };
  for (const posto of posti) {
    el.setAttribute(attributo, posto);
    const r = misura();
    if (!r) return null;
    const costo = ostacoli.reduce((a, o) => a + VERA * area(r, o.vero) + area(r, o.largo) - area(r, o.vero), 0) + VERA * 10 * fuori(r, mappa);
    if (costo < migliore.costo) migliore = { posto, costo };
    if (costo === 0) break;
  }
  el.setAttribute(attributo, migliore.posto);
  return misura();
}

export function disponiEtichette(contenitore: HTMLElement) {
  const mappa = contenitore.getBoundingClientRect();
  const settori = [...contenitore.querySelectorAll<HTMLElement>('[data-settore]')];
  // C33-04: si riparte sempre dallo stesso stato (posto delle unità e larghezza dei nomi del giro prima pesavano sul
  // risultato, che cambiava col numero di giri: 2/426 ondate fra due giri uguali). Rosso C102D01: dallo stato di prima.
  if (!spento('C102D01')) for (const s of settori) { s.setAttribute('data-unita', UNITA[0]); s.querySelector<HTMLElement>('.settore-nome')?.style.removeProperty('max-width'); }
  for (const s of settori) { const n = s.querySelector<HTMLElement>('.settore-nome'); n?.style.removeProperty('--nome-dx'); n?.style.removeProperty('--nome-dy'); } // C128-02
  const punti = settori.map((s) => s.querySelector('.settore-punto')!.getBoundingClientRect() as Rett);
  // D-191: con la mappa abbassata (fino a 160 px) i nomi in alto finivano sotto il pulsante «Home» dell'angolo: per i nomi
  // e le unità è un ostacolo come i punti (in coda, così gli indici dei settori restano gli stessi). Rosso C191H01: no.
  const casa = contenitore.querySelector(':scope > .tasto-home');
  if (casa && !spento('C191H01')) punti.push(casa.getBoundingClientRect() as Rett);
  // C33-01: il nome si misura col testo vero (riquadro ∪ righe del testo): stretto al 60% il testo usciva dal riquadro e
  // finiva sotto le pastiglie (10/142 ondate a 360). Rosso C100N01: solo il riquadro, come prima.
  const nomeDi = (s: HTMLElement) => { const n = s.querySelector('.settore-nome'); if (!n) return null; const b = n.getBoundingClientRect();
    if (spento('C100N01')) return b; const r = document.createRange(); r.selectNodeContents(n); return unisci([b, ...r.getClientRects()]) ?? b; };
  const unitaDi = (s: HTMLElement) => { const g = s.querySelector('.settore-unita'); return g ? unione([...g.children]) : null; };
  // 1) i nomi da soli, evitando i punti degli altri settori e i nomi già messi
  const nomi: Rett[] = [];
  for (const s of settori) {
    const nome = s.querySelector('.settore-nome');
    if (!nome) continue;
    const r = piazza(s, 'data-nome', NOMI, () => nome.getBoundingClientRect(), [...punti.filter((_, j) => settori[j] !== s).map((r) => ostacolo(r)), ...nomi.map((n) => ostacolo(n, STACCO))], mappa);
    if (r) nomi.push(r);
  }
  // 1b) C15-04: i nomi insieme, cercando la combinazione migliore fra tutte (la ricerca uno alla volta si ferma
  //     in un minimo locale, e25 a 360). Rosso C34N01: niente, come prima.
  if (!spento('C34N01')) migliorCombinazione(settori, punti, mappa, !contenitore.querySelector('.settore-unita'));
  // con nessuna unità sulla mappa (sala, briefing) la combinazione migliore è già quella finale
  if (!contenitore.querySelector('.settore-unita') && !spento('C34N01')) return;
  // D-187 (S-12): nella chiamata i segni dell'ultima risposta (▲/▼, +⚑) finivano sotto i nomi (fino a 506 px² a 360):
  // per i nomi sono ostacoli. Rosso C187S01: no, come prima.
  // D-269 c: nella risposta con la mossa anche quelli già spariti (segni-visti.ts), così i nomi non si ridispongono senza input
  const segni = spento('C187S01') ? [] : segniVisti(contenitore, 'nomi', [...contenitore.querySelectorAll('.settore .segni-effetto')].map((e) => e.getBoundingClientRect() as Rett));
  // 2) nome e unità insieme (6 × 6 combinazioni; solo il nome per i settori senza unità), si tiene quella che costa meno
  //    (due passate, così anche i primi settori vedono dove sono finiti gli ultimi).
  //    Nome contro: punti, nomi e unità degli altri settori. Unità contro: tutti i punti (anche il proprio),
  //    nomi e unità degli altri, il proprio nome. I bordi pesano 10 volte.
  for (let passata = 0; passata < 2; passata++) for (const [i, s] of settori.entries()) {
    if (!s.querySelector('.settore-nome')) continue;
    const conUnita = !!s.querySelector('.settore-unita');
    const altri = settori.filter((x) => x !== s);
    const presenti = (rs: (Rett | null)[]) => rs.filter((r): r is Rett => !!r);
    const perNome = [...punti.filter((_, j) => j !== i).map((r) => ostacolo(r)), ...presenti(altri.map(nomeDi)).map((n) => ostacolo(n, STACCO)), ...presenti(altri.map(unitaDi)).map((r) => ostacolo(r)), ...segni.map((r) => ostacolo(r))];
    const perUnita = [...punti, ...presenti(altri.map(nomeDi)), ...presenti(altri.map(unitaDi))].map((r) => ostacolo(r));
    const costoDi = (r: Rett, os: Ostacolo[]) => os.reduce((a, o) => a + VERA * area(r, o.vero) + area(r, o.largo) - area(r, o.vero), 0);
    // C26-11: una pastiglia col centro sotto il disco di un altro settore non si può toccare (e06 a 360), e due nomi
    // sovrapposti non si leggono (e13, e16): costano molto più di una sovrapposizione qualunque. Rosso C77E01: no.
    const nuovo = !spento('C77E01');
    // il centro di OGNI pulsante di tocco (almeno 44 px, la pastiglia in basso), non dell'unione
    const sottoDisco = () => (nuovo && [...(s.querySelector('.settore-unita')?.children ?? [])].some((c) => { const u = c.getBoundingClientRect(), x = (u.left + u.right) / 2, y = (u.top + u.bottom) / 2;
      // C28-14: con i posti nuovi il centro poteva finire sotto il tocco di un'altra pastiglia (e31 ondata 2)
      const altriTocchi = !spento('C94N01') ? settori.filter((x) => x !== s).flatMap((x) => [...(x.querySelector('.settore-unita')?.children ?? [])].map((c) => c.getBoundingClientRect())) : [];
      return [...punti.filter((_, j) => j !== i), ...altriTocchi].some((p) => x >= p.left && x <= p.right && y >= p.top && y <= p.bottom); }) ? VERA * 1e6 * (sulDisco() ? 2 : 1) : 0);
    // C33-05 (e06 ondata 1 a 360): quando ogni posto ha un centro coperto, il centro sotto un disco (fisso) costa il doppio
    // del centro sotto il tocco di un'altra unità, che si sposta quando tocca a lei. Rosso C103P01: costano uguale.
    const sulDisco = () => !spento('C103P01') && [...(s.querySelector('.settore-unita')?.children ?? [])].some((c) => { const u = c.getBoundingClientRect(), x = (u.left + u.right) / 2, y = (u.top + u.bottom) / 2;
      return punti.some((p, j) => j !== i && x >= p.left && x <= p.right && y >= p.top && y <= p.bottom); });
    const nomiSopra = (n: Rett) => (nuovo ? presenti(altri.map(nomeDi)).reduce((c, o) => c + VERA * 5 * area(n, o), 0) : 0);
    // C27-06: una pastiglia sopra un nome (il suo o di un altro settore) lo rende illeggibile (e19 «MAGA… DELLE
    // FONDERIE»): costa VERA × 5 in più, e così un nome sotto le pastiglie altrui. Perché questo non sposti i nomi uno
    // sull'altro o fuori dalla mappa (e07, e26 alla prima prova), nome sopra nome e nome fuori diventano quasi vincoli.
    // Il bordo per le unità si conta sulle pastiglie che si vedono, non sul pulsante di tocco da 44 px (trasparente
    // sopra la pastiglia: «sopra» al bordo alto costava più che coprire un nome); il centro del tocco resta nella mappa.
    // Rosso C81P01: tutto come prima.
    const c27 = !spento('C81P01'), pastiglieDi = (x: HTMLElement) => unione([...x.querySelectorAll('.settore-unita .pastiglia')]), pastiglie = () => pastiglieDi(s);
    const suNomi = (u: Rett, n: Rett) => (c27 ? VERA * 5 * (area(u, n) + presenti(altri.map(nomeDi)).reduce((c, o) => c + area(u, o), 0)) : 0);
    const sottoPastiglie = (n: Rett) => (c27 ? VERA * 5 * presenti(altri.map(pastiglieDi)).reduce((c, o) => c + area(n, o), 0) : 0);
    const toccoFuori = () => [...(s.querySelector('.settore-unita')?.children ?? [])].some((c) => { const u = c.getBoundingClientRect(), x = (u.left + u.right) / 2, y = (u.top + u.bottom) / 2;
      return x < mappa.left + MARGINE || x > mappa.right - MARGINE || y < mappa.top + MARGINE || y > mappa.bottom - MARGINE; }) ? VERA * 1e6 : 0;
    const bordoUnita = (u: Rett) => (c27 ? VERA * 10 * fuori(pastiglie() ?? u, mappa) + toccoFuori() : VERA * 10 * fuori(u, mappa));
    // D-271 (C271U01): una pastiglia fuori dai bordi della mappa (margine MARGINE, come i nomi) non si vede né si tocca. Il tocco
    // fuori costava VERA × 1e6, come il centro sotto un disco: con la mappa bassa della risposta ogni posto aveva un quasi vincolo
    // e vinceva un posto fuori (e04 arance a 360 con la 0.65.0: «sinistra», x −30..102 con la mappa da 16; e16 magazzino_sette
    // già con la 0.64.0: «destra-alto», x 299..431 con la mappa fino a 344). Ora è un vincolo: pesa più di ogni altro costo.
    // Rosso C271U01: come prima.
    const pastiglieFuori = () => (spento('C271U01') ? 0 : [...s.querySelectorAll('.settore-unita .pastiglia')].reduce((a, e) => a + fuori(e.getBoundingClientRect() as Rett, mappa), 0) * VERA * 1e12);
    // C28-14 / D-136: con le pastiglie sui nomi rimaste (e05, e13, e16, e35) si provano anche due posti in più per le
    // unità (destra-basso, sinistra-basso) e, se il posto migliore costa ancora, il nome più stretto su più righe (80%,
    // 60% di --nome-max), come nella città. Rosso C94N01: posti e larghezza di prima.
    const d136 = !spento('C94N01'), el = s.querySelector<HTMLElement>('.settore-nome');
    const posti = d136 ? [...UNITA, ...UNITA_PIU] : UNITA;
    // C33-01 (e35 ondata 2 a 360): la pastiglia che si vede sopra un nome costava meno del tocco trasparente sopra il
    // proprio nome nel posto pulito (98 px² → 49 219 contro 1385 px² → 138 516): diventa un quasi vincolo (× 20, sotto
    // il vincolo del disco). Rosso C100N01: peso di prima.
    const c33 = !spento('C100N01');
    // C33-05: con i posti nuovi alcune pastiglie finivano più vicine al disco di un altro settore che al proprio (e31
    // ondata 2: 70 px dal Piazzale, 43 dal Viale della stazione) e non si capiva di chi fossero: costa la differenza,
    // in px × VERA × 10 (meno di qualunque sovrapposizione vera). Rosso C103P01: nessun costo, come prima.
    const centro = (r: Rett) => [(r.left + r.right) / 2, (r.top + r.bottom) / 2] as const, mio = centro(punti[i]!);
    const lontano = (u: Rett) => { if (spento('C103P01')) return 0; const [x, y] = centro(u), d = (q: readonly [number, number]) => Math.hypot(q[0] - x, q[1] - y);
      const altro = Math.min(...punti.filter((_, j) => j !== i).map((r) => d(centro(r)))); return altro < d(mio) ? VERA * 10 * (d(mio) - altro) : 0; };
    // D-145 (C33-01): un'area di tocco può coprire un nome ma non «rubarlo»: toccando il nome (centro di ogni riga del
    // testo) non si deve colpire un tocco, e il centro di un tocco non cade sul nome di un altro settore (e35 ondata 2 a
    // 360: toccando «Perimetro della banca» si ritirava una squadra). Quasi vincolo, sotto il disco. Rosso C106T01: no.
    const righe = (x: Element) => { const n = x.querySelector('.settore-nome'); if (!n) return []; const r = document.createRange(); r.selectNodeContents(n); return [...r.getClientRects()] as Rett[]; };
    const dentro = (p: readonly [number, number], q: Rett) => p[0] >= q.left && p[0] <= q.right && p[1] >= q.top && p[1] <= q.bottom;
    const tocchiDi = (x: Element) => [...(x.querySelector('.settore-unita')?.children ?? [])].map((c) => c.getBoundingClientRect() as Rett);
    const ruba = () => { if (spento('C106T01')) return 0; const miei = tocchiDi(s), tutti = [...miei, ...altri.flatMap(tocchiDi)];
      let k = righe(s).filter((z) => tutti.some((q) => dentro(centro(z), q))).length;
      for (const x of altri) { const rx = righe(x); k += rx.filter((z) => miei.some((q) => dentro(centro(z), q))).length + miei.filter((q) => rx.some((z) => dentro(centro(q), z))).length; }
      return VERA * 1e4 * k; };
    // C128-02 (PO-128, CI rossa su e14 o1 a 360): in Chrome 156 «Biglietteria» è largo 84 px invece di 82,5 e al posto
    // pulito (sopra-sx) entrava 0,31 px nel margine dal bordo: quasi vincolo (5 milioni), e vinceva la pastiglia sopra
    // Tornelli con due nomi rubati (4,2 milioni). Come nella città (C20-03), un nome che entra nel margine di poco (fino a
    // un ottavo di disco) si sposta verso l'interno di quanto basta e il costo si conta già spostato. Rosso C128E01: no.
    const passo = (punti[i]!.right - punti[i]!.left) / 8, c128 = !spento('C128E01');
    const rientra = (a: number, b: number, min: number, max: number) => (a < min ? min - a : b > max ? max - b : 0);
    const spingi = (dx: number, dy: number) => { el?.style.setProperty('--nome-dx', `${dx}px`); el?.style.setProperty('--nome-dy', `${dy}px`); };
    // D-219 (C-047, riepilogo di e36 a 360 e 375: «Home» copriva «Curva Kiln» per 56 px² e nessun posto era libero): allo
    // stesso modo un nome sotto «Home» si sposta di quanto basta per uscirne, fino a un quarto di disco. Rosso C219H01: no.
    const casaR = casa && !spento('C219H01') ? casa.getBoundingClientRect() as Rett : null;
    const sposta = () => { if (!c128 || !el) return [0, 0] as const; spingi(0, 0); const n = nomeDi(s); if (!n) return [0, 0] as const;
      const b = MARGINE + 0.5; let dx = rientra(n.left, n.right, mappa.left + b, mappa.right - b), dy = rientra(n.top, n.bottom, mappa.top + b, mappa.bottom - b);
      if (Math.abs(dx) > passo || Math.abs(dy) > passo) dx = dy = 0;
      const m = { left: n.left + dx, top: n.top + dy, right: n.right + dx, bottom: n.bottom + dy };
      const via = casaR && area(m, casaR) > 0 ? ([[casaR.right - m.left + 0.5, 0], [casaR.left - m.right - 0.5, 0], [0, casaR.bottom - m.top + 0.5], [0, casaR.top - m.bottom - 0.5]] as const)
        .filter(([x, y]) => Math.abs(x + y) <= 2 * passo).sort((p, q) => Math.abs(p[0] + p[1]) - Math.abs(q[0] + q[1]))[0] : undefined;
      if (via) { dx += via[0]; dy += via[1]; }
      if (!dx && !dy) return [0, 0] as const;
      spingi(dx, dy); return [dx, dy] as const; };
    const costoUnita = (n: Rett, u: Rett) => sottoDisco() + costoDi(u, perUnita) + VERA * area(n, u) + bordoUnita(u) + pastiglieFuori() + suNomi(pastiglie() ?? u, n) * (c33 ? 20 : 1) + lontano(pastiglie() ?? u) + ruba();
    const gruppo = s.querySelector<HTMLElement>('.settore-unita'), muovi = (dx: number, dy: number) => { gruppo?.style.setProperty('--unita-dx', `${dx}px`); gruppo?.style.setProperty('--unita-dy', `${dy}px`); };
    gruppo?.style.removeProperty('--unita-dx'); gruppo?.style.removeProperty('--unita-dy');
    let migliore = { nome: NOMI[0] as string, unita: UNITA[0] as string, costo: Infinity, largo: '', dx: 0, dy: 0 };
    cerca: for (const largo of d136 ? ['', 'calc(var(--nome-max) * 0.8)', 'calc(var(--nome-max) * 0.6)'] : ['']) {
    if (largo && migliore.costo === 0) break;
    if (el) el.style.maxWidth = largo;
    if (largo && el && el.scrollWidth > el.clientWidth + 1 && !spento('C100N01')) continue; // C33-01: il testo non ci sta
    for (const nome of NOMI) for (const unita of conUnita ? posti : [UNITA[0]]) {
      s.setAttribute('data-nome', nome); s.setAttribute('data-unita', unita);
      const [dx, dy] = sposta();
      const n = nomeDi(s), u = conUnita ? unitaDi(s) : null;
      if (!n || (conUnita && !u)) continue;
      const costo = costoDi(n, perNome) + nomeLontano(n, punti, i) + VERA * (c27 ? 1e4 : 10) * fuori(n, mappa) + nomiSopra(n) * (c27 ? 2e3 : 1) + sottoPastiglie(n) + (u ? costoUnita(n, u) : 0);
      if (costo < migliore.costo - (largo ? 0.5 : 0)) migliore = { nome, unita, costo, largo, dx, dy };
      if (costo === 0) break cerca;
    }
    }
    if (el) el.style.maxWidth = migliore.largo;
    s.setAttribute('data-nome', migliore.nome); s.setAttribute('data-unita', migliore.unita); if (c128) spingi(migliore.dx, migliore.dy);
    // D-271 (C271U01): con la mappa bassa della risposta può non esserci un posto pulito per le unità (e04 arance a 360: ogni
    // posto dentro la mappa ha il centro di un tocco sotto il disco di un altro settore). Come per i nomi (C128-02), si prova
    // a spostare le unità di poco, a passi di un ottavo di disco fino a mezzo tocco, e si tiene lo spostamento che costa meno.
    // Solo quando il posto scelto ha un quasi vincolo (≥ VERA × 1e6): altrove niente cambia. Rosso C271U01: niente.
    const nn = nomeDi(s);
    if (conUnita && gruppo && nn && !spento('C271U01')) {
      const prova = () => { const u = unitaDi(s); return u ? costoUnita(nn, u) : Infinity; };
      let meglio = { c: prova(), dx: 0, dy: 0 };
      if (meglio.c >= VERA * 1e6) for (let k = 1; k <= 4; k++) for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]] as const) {
        muovi(ax * k * passo, ay * k * passo); const c = prova(); if (c < meglio.c) meglio = { c, dx: ax * k * passo, dy: ay * k * passo }; }
      if (meglio.dx || meglio.dy) muovi(meglio.dx, meglio.dy); else { gruppo.style.removeProperty('--unita-dx'); gruppo.style.removeProperty('--unita-dy'); }
    }
  }
}

/** C17-12: nella città il nome dell'episodio scelto va al posto che non copre gli altri dischi né le loro stelle.
 *  Vicino al bordo nessun posto sta dentro la mappa (e01 in alto a sinistra): il nome si sposta verso l'interno
 *  quanto basta (--nome-dx/--nome-dy, misurati qui, non scritti a mano) e il costo si conta già spostato.
 *  C20-03: con tutti gli episodi conclusi a 360/375 nessuno degli 8 posti è libero; si provano anche piccoli
 *  spostamenti (griglia di passo pari a un ottavo del disco, fino a un disco) e vince il posto libero col minimo
 *  spostamento. Rosso C44N01: solo gli 8 posti, come prima. */
export function disponiNomeCitta(contenitore: HTMLElement) {
  const s = contenitore.querySelector<HTMLElement>('[data-episodio].acceso'), nome = s?.querySelector<HTMLElement>('.settore-nome');
  if (!s || !nome) return;
  // Instabile in CI (412, «Il mercato del sabato» a 3 px dal bordo): il calcolo girava mentre la scena entrava con
  // l'animazione (scala in corso), e getBoundingClientRect misura coi trasformati. Si lavora in coordinate di
  // impaginazione: rettangoli relativi alla mappa divisi per la scala attuale; mezzo pixel in più di margine contro
  // gli arrotondamenti. Rosso C47N01: misure trasformate, come prima.
  const vista = contenitore.getBoundingClientRect(), vecchio = spento('C47N01');
  const k = vecchio || !contenitore.offsetWidth ? 1 : vista.width / contenitore.offsetWidth;
  const ox0 = vecchio ? 0 : vista.left, oy0 = vecchio ? 0 : vista.top;
  const rel = (r: Rett): Rett => ({ left: (r.left - ox0) / k, right: (r.right - ox0) / k, top: (r.top - oy0) / k, bottom: (r.bottom - oy0) / k });
  const m = vecchio ? vista : { left: 0, top: 0, right: contenitore.offsetWidth, bottom: contenitore.offsetHeight };
  const bordo = MARGINE + (vecchio ? 0 : 0.5);
  // i dischi pesano dieci volte le stelline: se proprio non c'è un posto libero, il nome copre stelline, non dischi
  const altri = [...contenitore.querySelectorAll('[data-episodio]')].filter((x) => x !== s)
    .flatMap((x) => [...x.querySelectorAll('.settore-punto, .settore-unita')]).map((e) => ({ ...ostacolo(rel(e.getBoundingClientRect()), STACCO), peso: e.classList.contains('settore-punto') && !spento('C44N01') ? 10 : 1 }));
  // C23-02: anche il disco e le stelline del SUO episodio (coprivano «La finale» al 100% a 360). Disco esatto, senza
  // distacco: i posti del nome gli stanno accanto per costruzione. Rosso C53N01: solo gli altri episodi, come prima.
  if (!spento('C53N01')) for (const e of [...s.querySelectorAll('.settore-punto, .settore-unita')]) {
    const r = rel(e.getBoundingClientRect()), disco = e.classList.contains('settore-punto');
    altri.push({ ...ostacolo(disco ? { left: r.left + 1, top: r.top + 1, right: r.right - 1, bottom: r.bottom - 1 } : r, disco ? 0 : STACCO), peso: disco ? 10 : 1 });
  }
  const sposta = (dx: number, dy: number) => { nome.style.setProperty('--nome-dx', `${dx}px`); nome.style.setProperty('--nome-dy', `${dy}px`); };
  const dentro = (a: number, b: number, min: number, max: number) => (a < min ? min - a : b > max ? max - b : 0);
  const disco = (s.querySelector('.settore-punto')?.getBoundingClientRect().width ?? 0) / k;
  const mio = rel(s.querySelector('.settore-punto')!.getBoundingClientRect());
  const passo = disco / 8, giri = spento('C44N01') || !passo ? 0 : 10;
  const scarti = Array.from({ length: 2 * giri + 1 }, (_, k) => (k - giri) * passo).sort((a, b) => Math.abs(a) - Math.abs(b));
  // anche più stretto (va a capo su più righe): larghezza massima intera, 80% e 65% di --nome-max
  const larghezze = spento('C44N01') ? [''] : ['', 'calc(var(--nome-max) * 0.8)', 'calc(var(--nome-max) * 0.65)', 'calc(var(--nome-max) * 0.5)', 'calc(var(--nome-max) * 0.4)'];
  // D-119: se non basta, il riquadro del nome si stringe (interlinea e margini interni), mai il carattere: è già alla
  // misura minima leggibile (--testo-mini). Rosso C48N01: niente riquadro stretto.
  const stretti = spento('C48N01') ? [false] : [false, true];
  let migliore = { posto: NOMI[0] as string, dx: 0, dy: 0, costo: Infinity, largo: '', stretto: false };
  sposta(0, 0);
  for (const stretto of stretti) for (const largo of larghezze) for (const posto of NOMI) {
    nome.classList.toggle('stretto', stretto);
    nome.style.maxWidth = largo;
    s.setAttribute('data-nome', posto);
    const r = rel(nome.getBoundingClientRect());
    for (const ox of scarti) for (const oy of scarti) {
      const a = { left: r.left + ox, right: r.right + ox, top: r.top + oy, bottom: r.bottom + oy };
      const dx = ox + dentro(a.left, a.right, m.left + bordo, m.right - bordo), dy = oy + dentro(a.top, a.bottom, m.top + bordo, m.bottom - bordo);
      const q = { left: r.left + dx, right: r.right + dx, top: r.top + dy, bottom: r.bottom + dy };
      // C23-02: il nome resta vicino al suo disco: oltre un quarto di disco di distanza costa come coprire stelline
      const gx = Math.max(0, mio.left - q.right, q.left - mio.right), gy = Math.max(0, mio.top - q.bottom, q.top - mio.bottom);
      const lontano = spento('C53N01') ? 0 : Math.max(0, Math.hypot(gx, gy) - disco / 4) * VERA * LONTANO;
      const costo = altri.reduce((c, o) => c + o.peso * VERA * area(q, o.vero) + area(q, o.largo) - area(q, o.vero), 0) + Math.abs(dx) + Math.abs(dy) + lontano;
      if (costo < migliore.costo - (stretto ? 0.5 : 0)) migliore = { posto, dx, dy, costo, largo, stretto };
    }
  }
  nome.classList.toggle('stretto', migliore.stretto); nome.style.maxWidth = migliore.largo; s.setAttribute('data-nome', migliore.posto); sposta(migliore.dx, migliore.dy);
}

/** Costo di una disposizione dei soli nomi: sovrapposizioni con nomi (col distacco) e punti degli altri, bordi. */
export function costoNomi(r: Rett[], punti: Rett[], mappa: Rett): number {
  let c = 0;
  for (let i = 0; i < r.length; i++) {
    c += VERA * 10 * fuori(r[i]!, mappa);
    for (let j = 0; j < punti.length; j++) if (j !== i) c += VERA * area(r[i]!, punti[j]!);
    for (let j = 0; j < i; j++) { const v = area(r[i]!, r[j]!); c += VERA * v + area(r[i]!, largo(r[j]!, STACCO)) - v; }
  }
  return c;
}

/** C37-03: il nome (bordo più vicino) più vicino al disco di un altro settore che al proprio (e19 a mappa vuota: «Magazzino
 *  delle fonderie» a 16 px dalla Strada da Kiln e a 22 dal proprio disco) costa la differenza × VERA × 10, come le
 *  pastiglie di C33-05. Rosso C111E01: nessun costo, come prima. */
export function nomeLontano(r: Rett, punti: Rett[], i: number): number {
  if (spento('C111E01')) return 0;
  const d = (p: Rett) => { const x = (p.left + p.right) / 2, y = (p.top + p.bottom) / 2; return Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom)); };
  const mio = d(punti[i]!), altro = Math.min(...punti.filter((_, j) => j !== i).map(d));
  return altro < mio ? VERA * 100 * (mio - altro) : 0;
}

/** Ricerca con taglio (al più 200 000 nodi): per ogni settore la posizione del nome, misurata una volta nel DOM. */
function migliorCombinazione(settori: HTMLElement[], punti: Rett[], mappa: Rett, vuota: boolean) {
  const conNome = settori.map((s, i) => [s, i] as const).filter(([s]) => s.querySelector('.settore-nome'));
  // C37-03: anche i nomi più stretti (80 %, 60 % di --nome-max, come nel passo con le unità), se il testo ci sta: a mappa
  // vuota il nome a tutta larghezza di un settore sul bordo non trovava un posto dentro la mappa. Rosso C111E01: solo
  // la larghezza piena, come prima.
  // Solo a mappa vuota: con le unità le larghezze le sceglie il passo 2 (lasciate qui, cambiavano il passo 2: e19 o1).
  const larghi = spento('C111E01') || !vuota ? [''] : ['', 'calc(var(--nome-max) * 0.8)', 'calc(var(--nome-max) * 0.6)'];
  const opz = conNome.map(([s]) => { const el = s.querySelector<HTMLElement>('.settore-nome')!, prima = s.getAttribute('data-nome'), pw = el.style.maxWidth, rs: { nome: string; largo: string; r: Rett }[] = [];
    for (const largo of larghi) { el.style.maxWidth = largo; if (largo && el.scrollWidth > el.clientWidth + 1) continue;
      for (const n of NOMI) { s.setAttribute('data-nome', n); rs.push({ nome: n, largo, r: el.getBoundingClientRect() as Rett }); } }
    el.style.maxWidth = pw; if (prima) s.setAttribute('data-nome', prima); return rs; });
  const solo = conNome.map(([, i], a) => opz[a]!.map(({ r }) => VERA * 10 * fuori(r, mappa) + punti.reduce((c, p, j) => c + (j === i ? 0 : VERA * area(r, p)), 0) + nomeLontano(r, punti, i)));
  const attuale = conNome.map(([s], a) => Math.max(0, opz[a]!.findIndex((o) => o.nome === s.getAttribute('data-nome') && o.largo === '')));
  const coppia = (x: Rett, y: Rett) => { const v = area(x, y); return VERA * v + area(x, largo(y, STACCO)) - v; };
  const costoDi = (sc: number[]) => sc.reduce((c, k, a) => c + solo[a]![k]! + sc.slice(0, a).reduce((d, kk, b) => d + coppia(opz[a]![k]!.r, opz[b]![kk]!.r), 0), 0);
  let migliore = { c: costoDi(attuale), s: attuale }, nodi = 0;
  const scelta: number[] = [];
  const giu = (a: number, c: number) => {
    if (c >= migliore.c || ++nodi > 200000) return;
    if (a === conNome.length) { migliore = { c, s: [...scelta] }; return; }
    for (let k = 0; k < opz[a]!.length; k++) {
      let d = solo[a]![k]!;
      for (let b = 0; b < a; b++) d += coppia(opz[a]![k]!.r, opz[b]![scelta[b]!]!.r);
      scelta[a] = k; giu(a + 1, c + d);
    }
  };
  giu(0, 0);
  conNome.forEach(([s], a) => { const o = opz[a]![migliore.s[a]!]!; s.setAttribute('data-nome', o.nome); s.querySelector<HTMLElement>('.settore-nome')!.style.maxWidth = o.largo; });
}
