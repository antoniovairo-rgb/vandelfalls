# D-16 · costo ripetuto nella radio · appunti per la sessione della mappa

Il punto D-16 è uscito dal lotto D-283 (scelta della principale, opzione B).

Il testo del costo sta nel riquadro radio sulla mappa (`App.tsx:247` → `RapportoCosto`, `Ondata.tsx`). Accorciarlo cambia
l'altezza del riquadro e quindi la disposizione delle pastiglie. Per questo D-16 va fatto insieme alla mappa.

## Il difetto (FATTO MISURATO sul ramo, commit 46c2d5d)
- La radio dice il costo due volte: il testo dei dati («Calma la strada, ma ti costa una squadra.») e la frase della regola
  comune `quandoCosta` (`effetti-opzione.tsx`), «Ti costa 1 squadra dalla prossima ondata».
- È una regola di testo condivisa, non un dato di missione. Su 234 risposte con costo in unità nelle missioni, 206 nominano
  già l'unità nel loro testo e poi la regola la ripete. Contando anche gli imprevisti le risposte sono 237.
- L'ultima ondata («Le unità restano impegnate fino a fine serata») non ripete nulla.

## La correzione provata e ritirata
- `quandoRadio(o, ultima)`: se il testo nomina già ogni unità impegnata (forme di `quante(1|2, r)`), la radio dice solo
  «Dalla prossima ondata.» (nuova chiave `costo.da_quando`). Rosso C283R01.
- Ripetizioni: da 206 a 0 su 234.
- Riquadro radio di e01 a 360: da 55 a 38 px (foto `radio-proposta-<larghezza>.jpg`: a sinistra main, a destra la proposta).

## Perché è uscita (FATTO MISURATO, 360×640, 36 episodi, VALMORA_SALTI_TUTTI=1, 4 pagine)

| Build | oltre 44 px | sparizione | massimo |
|---|---|---|---|
| main | 818 | 75 | 199 px |
| ramo con D-16 | 860 (sopra il tetto) | 235 | 199 px |
| ramo con D-16 spento (C283R01) | 818 | 75 | 199 px |

- Peggiora soprattutto e20: 112 elementi contro 28, tutti nella sparizione dei segni ▲/▼.
- Peggiora anche e30: 48 nella sparizione contro 0.
- Altri episodi migliorano: e31 12 contro 33, e07 7 contro 16.

Nella CI 1452 (commit 2e363b3) il braccio `altezze/C271U01` di `tools/bracci-po152b.mjs` (e03, e04) era cieco: 7 problemi
invece di 13. Che la causa sia D-16 è un'IPOTESI, verificata ritirando D-16 (vedi la consegna D-283).
