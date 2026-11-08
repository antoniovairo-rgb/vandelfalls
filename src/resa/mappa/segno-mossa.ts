// D-272 passo 4: il segno «−1» / «+1» della mossa sta sul proprio disco, ma dove i dischi sono vicini copriva quelli degli altri
// settori e le pastiglie (verifica del principale su a66978a8, 360×640: e02, il «+1» di viale_stazione sopra il disco di
// curva_ospiti per 223-243 px²; e04, il «−1» di mercato sopra la pastiglia squadre@mercato per 48-50 px²). Qui, dopo ogni
// disposizione, ogni segno prova il centro del disco e poi otto posti attorno, a tre quarti di disco, e prende il primo che non
// copre nomi, pastiglie, «Home», dischi altrui, l'altro segno né esce dalla mappa (se nessuno è libero, quello che copre meno).
// Tocca solo lo stile del segno: niente firma, niente ridisposizione, deterministico. Rosso C272D03: fermo al centro del disco.
import { spento } from '../../interruttori.ts';

type R = { left: number; top: number; right: number; bottom: number };
const area = (a: R, b: R) =>
  Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
const PASSI = [[0, 0], [0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]] as const;

export function collocaSegni(mappa: HTMLElement) {
  const segni = [...mappa.querySelectorAll<HTMLElement>('.segno-mossa')];
  if (!segni.length || spento('C272D03') || spento('C272D02')) return; // C272D02: la prima prova, a fianco e sopra tutto
  const m = mappa.getBoundingClientRect(), fatti: R[] = [];
  for (const g of segni) {
    g.style.translate = '';
    const mio = g.closest('[data-settore]'), disco = mio?.querySelector('.settore-punto')?.getBoundingClientRect();
    const r = g.getBoundingClientRect(), passo = (disco?.width ?? r.height) * 0.75;
    const ostacoli = [...mappa.querySelectorAll<HTMLElement>('.settore-nome, .pastiglia, .tasto-home, .settore-punto')]
      .filter((e) => !(e.classList.contains('settore-punto') && e.closest('[data-settore]') === mio)).map((e) => e.getBoundingClientRect());
    let meglio: readonly [number, number] = [0, 0], costo = Infinity;
    for (const [i, j] of PASSI) {
      const dx = i * passo, dy = j * passo, q: R = { left: r.left + dx, top: r.top + dy, right: r.right + dx, bottom: r.bottom + dy };
      const fuori = (r.width * r.height) - area(m, q), c = ostacoli.reduce((t, o) => t + area(o, q), 0) + fatti.reduce((t, o) => t + area(o, q), 0) + fuori * 10;
      if (c < costo) { costo = c; meglio = [dx, dy]; }
      if (c === 0) break;
    }
    if (meglio[0] || meglio[1]) g.style.translate = `calc(-50% + ${meglio[0]}px) calc(-50% + ${meglio[1]}px)`;
    fatti.push({ left: r.left + meglio[0], top: r.top + meglio[1], right: r.right + meglio[0], bottom: r.bottom + meglio[1] });
  }
}
