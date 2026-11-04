// D-269 c: nella risposta con la mossa, spariti i segni ▲/▼ (1,8 s di gioco), i nomi dei settori si ridisponevano (per loro i
// segni sono ostacoli, D-187 S-12), le unità si spostavano con i nomi e il riquadro radio si ricollocava, senza nessun input
// (po152b: e35 perimetro a 412×760, un'unità da y 170 a 258; e08 dessi_chiama a 375×667, riquadro da «posto» a «muto»).
// Ora, nella stessa risposta e con la stessa misura della mappa, i segni già visti restano ostacoli finché la risposta resta:
// la disposizione non cambia quando spariscono. Rosso C269C01: solo i segni presenti, come prima.
import { spento } from '../../interruttori.ts';

export type Rett = { left: number; top: number; right: number; bottom: number };

const visti = new WeakMap<Element, Map<string, { dim: string; r: Rett[] }>>(); // per riquadro radio della risposta

/** I segni presenti e, nella stessa risposta con la mossa e con la stessa misura della mappa, quelli già visti (coordinate della finestra). */
export function segniVisti(mappa: HTMLElement, chi: string, ora: Rett[]): Rett[] {
  // chiave: il riquadro con la mossa, che c'è già al primo disegno. Prima era il messaggio della risposta, che arriva qualche
  // centinaio di ms dopo: a 412×915 (verifica della principale su ede76c72) nomi e riquadro si disponevano prima, i segni non
  // restavano e allo sparire si ridisponevano (e10 imp_cantiere: riquadro in alto 11 → «posto» 262, unità 151 → 63); a 360 e 375
  // reggeva solo perché adatta ridisegna quando arriva la risposta.
  const risposta = mappa.querySelector('.radio-mappa [data-mossa]')?.closest('.radio-mappa');
  if (!risposta || spento('C269C01')) return ora;
  const m = mappa.getBoundingClientRect(), dim = `${Math.round(m.width)}x${Math.round(m.height)}`;
  let per = visti.get(risposta);
  if (!per) visti.set(risposta, (per = new Map()));
  const prima = per.get(chi), rel = ora.map((b) => ({ left: b.left - m.left, right: b.right - m.left, top: b.top - m.top, bottom: b.bottom - m.top }));
  const chiave = (b: Rett) => [b.left, b.top, b.right, b.bottom].map(Math.round).join(',');
  const tutti = [...(prima?.dim === dim ? prima.r : []), ...rel].filter((b, i, a) => a.findIndex((x) => chiave(x) === chiave(b)) === i);
  per.set(chi, { dim, r: tutti });
  return tutti.map((b) => ({ left: b.left + m.left, right: b.right + m.left, top: b.top + m.top, bottom: b.bottom + m.top }));
}
