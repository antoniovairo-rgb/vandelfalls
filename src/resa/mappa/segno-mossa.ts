// D-272 passo 4: il segno «−1» / «+1» della mossa sta sul proprio disco, ma dove i dischi sono vicini copriva quelli degli altri
// settori e le pastiglie (verifica del principale su a66978a8, 360×640: e02, il «+1» di viale_stazione sopra il disco di
// curva_ospiti per 223-243 px²; e04, il «−1» di mercato sopra la pastiglia squadre@mercato per 48-50 px²). Qui, dopo ogni
// disposizione, ogni segno prova il centro del disco e poi 64 posti attorno (16 direzioni, fino a due dischi), e prende il primo che non
// copre nomi, pastiglie, «Home», dischi altrui, l'altro segno né esce dalla mappa (se nessuno è libero, quello che copre meno).
// Tocca solo lo stile del segno: niente firma, niente ridisposizione, deterministico. Rosso C272D03: fermo al centro del disco.
import { spento } from '../../interruttori.ts';

type R = { left: number; top: number; right: number; bottom: number };
const area = (a: R, b: R) =>
  Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
// il centro, poi 16 direzioni a 0,75, 1,1, 1,5 e 2 dischi (e13 a 360: fino a 1,5 nessun posto libero) (a 360 e 375, con i dischi di e02 a 15 punti su 100, 9 posti non bastavano)
const PASSI: readonly (readonly [number, number])[] = [[0, 0], ...[0.75, 1.1, 1.5, 2].flatMap((d) => Array.from({ length: 16 }, (_, k) => [d * Math.sin((k * Math.PI) / 8), -d * Math.cos((k * Math.PI) / 8)] as const))];

export function collocaSegni(mappa: HTMLElement) {
  const segni = [...mappa.querySelectorAll<HTMLElement>('.segno-mossa')];
  if (!segni.length || spento('C272D03') || spento('C272D02')) return; // C272D02: la prima prova, a fianco e sopra tutto
  const m = mappa.getBoundingClientRect(), fatti: R[] = [];
  for (const g of segni) {
    g.style.translate = '';
    const mio = g.closest('[data-settore]'), disco = mio?.querySelector('.settore-punto')?.getBoundingClientRect();
    const r = g.getBoundingClientRect(), passo = disco?.width ?? r.height;
    const ostacoli = [...mappa.querySelectorAll<HTMLElement>('.settore-nome, .pastiglia, .tasto-home, .settore-punto')]
      .filter((e) => !(e.classList.contains('settore-punto') && e.closest('[data-settore]') === mio)).map((e) => e.getBoundingClientRect());
    let meglio: readonly [number, number] = [0, 0], costo = Infinity;
    for (const [i, j] of PASSI) {
      const dx = Math.round(i * passo), dy = Math.round(j * passo), q: R = { left: r.left + dx - 1, top: r.top + dy - 1, right: r.right + dx + 1, bottom: r.bottom + dy + 1 }; // 1 px di margine: l'arrotondamento al pixel lasciava 3 px² su una pastiglia (e13 a 360)
      const fuori = ((r.width + 2) * (r.height + 2)) - area(m, q), c = ostacoli.reduce((t, o) => t + area(o, q), 0) + fatti.reduce((t, o) => t + area(o, q), 0) + (fuori > 0.5 ? 1e9 : 0); // fuori dalla mappa mai: a 360 e05 la pagina scorreva di 16 px
      if (c < costo) { costo = c; meglio = [dx, dy]; }
      if (c === 0) break;
    }
    if (meglio[0] || meglio[1]) g.style.translate = `calc(-50% + ${meglio[0]}px) calc(-50% + ${meglio[1]}px)`;
    fatti.push({ left: r.left + meglio[0], top: r.top + meglio[1], right: r.right + meglio[0], bottom: r.bottom + meglio[1] });
  }
}
