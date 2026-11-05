// D-265 (PO-158, «12 sul prato»): dove sta il parco nella mappa della città, in frazioni della mappa [x, y, larghezza, altezza].
// Lo disegna sfondo.ts e la mappa lo scrive in data-parco, così il guardiano (tools/foto-po158.mjs) misura il disegno vero.
// Il parco sta nella fascia libera fra la seconda e la terza fila di episodi (luogo y 50 e 96 nei dati), libera da 260 a
// 460 px di altezza della mappa. Rosso C265B01: dove stava (y 64-80 %), sotto e11 ed e12.
import { spento } from '../../interruttori.ts';

export const parcoCitta = (): [number, number, number, number] => (spento('C265B01') ? [0.57, 0.64, 0.36, 0.16] : [0.57, 0.54, 0.36, 0.11]);
