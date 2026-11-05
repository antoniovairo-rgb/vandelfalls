// D-270: i bracci rossi po152b girano solo dove il loro rosso si vede (giri di foto-po152-b.mjs ed episodi del giro radio) e sono
// rossi sul serio solo se i problemi col loro segno arrivano almeno al conteggio dichiarato. Conteggi dalla misura sul giro intero
// (main 7e753289, 360×760, VALMORA_LARGHEZZE=360, 5 in parallelo): sugli stessi episodi il giro intero dava proprio quel numero.
// Il giro VERDE resta intero (36 episodi, previsione, fermo): qui si restringono solo i bracci.
export const BRACCI_PO152B = {
  C241B01: { giri: ['e01'], segno: 'seconda mossa possibile (PO-152 B)', almeno: 3 }, // 640, 667, 760
  C241M02: { giri: ['e01'], segno: 'PO-152 B)', almeno: 18 }, // 3 altezze × 3 giri × 2 (indicazione assente, nessuna unità si tocca)
  C255R01: { giri: ['radio'], episodi: ['e01', 'e02'], segno: '(D-255)', almeno: 11 }, // 6 + 5
  C258S01: { giri: ['radio'], episodi: ['e01', 'e02'], segno: 'il costo non si vede (D-258)', almeno: 13 }, // 7 + 6
  C259A01: { giri: ['radio'], episodi: ['e01', 'e02'], segno: '(soglia 68, D-258)', almeno: 12 }, // 7 + 5
  C261H01: { giri: ['radio'], episodi: ['e35'], segno: '(soglia 68, D-258)', almeno: 7 }, // solo e35 perimetro
  C261E01: { giri: ['radio'], episodi: ['e01', 'e02'], segno: '(D-261)', almeno: 11 }, // 6 + 5
  C262R01: { giri: ['e01'], segno: 'la mossa di quella pausa è persa (C56-02)', almeno: 3 }, // giro «ricarica» alle 3 altezze
  C262E01: { giri: ['e01'], segno: 'dopo la mossa manca la previsione (D-262)', almeno: 3 }, // giro «mossa» alle 3 altezze
  C262M01: { giri: ['radio'], episodi: ['e02', 'e03'], segno: '(C56-03)', almeno: 5 }, // 3 + 2
  C262D01: { giri: ['radio'], episodi: ['e02'], segno: '(C56-03)', almeno: 3 }, // solo e02 ritardo
  C268F01: { giri: ['e01'], segno: '(C56-05)', almeno: 1 }, // solo da tastiera, 760
  C268M01: { giri: ['e01'], segno: '(C56-04)', almeno: 54 }, // 3 altezze × 3 giri × 6
  C269M01: { giri: ['radio'], episodi: ['e02', 'e03'], segno: '(C57-01)', almeno: 8 }, // 1 + 7
  C269P01: { giri: ['previsione'], segno: 'la previsione non si vede (C57-02)', almeno: 5 }, // e16 imp_nebbia
  C269I01: { giri: ['radio'], episodi: ['e03', 'e04'], segno: '(D-269 a)', almeno: 12 }, // 7 + 5
  C269A01: { giri: ['radio'], episodi: ['e21'], segno: '(D-269 b)', almeno: 1 }, // solo e21 corteo_dal_cortile nel giro radio
  C269C01: { giri: ['radio'], episodi: ['e02', 'e25', 'e26'], segno: '(D-269 c)', almeno: 3 }, // 1 + 1 + 1 (D-269 c riparato: 8 episodi su 36, segni presenti in 36)
};

/** Il braccio è cieco se i problemi col suo segno sono meno del conteggio dichiarato; ritorna il messaggio o ''. */
export function braccioCieco(r, problemi) {
  const b = BRACCI_PO152B[r], n = problemi.filter((x) => x.includes(b.segno)).length;
  return n >= b.almeno ? '' : `altezze/${r} è cieco: ${n} problemi «${b.segno}», ne servono ${b.almeno} (D-270)`;
}
