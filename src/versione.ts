// GAME_VERSION aumenta a ogni rilascio. Ogni valore porta un commento: causa, misura, guardiano.
//
// Le versioni da 0.1.0 a 0.67.0 sono in docs/RELEASE_HISTORY.md (D-233, D-263, D-283: limite di 400 righe per modulo).
//
// 0.68.0 – mappa: nomi dei settori mai coperti e disposizione più leggera (PO-160, D-272).
//   causa: il riquadro radio copriva i nomi in 116/138/148 stati su 277 (360/375/412); la disposizione dei nomi si ricalcolava 4,1 volte
//   per risposta anche a ingressi uguali (696 ms a CPU ×1, 4342 ms a ×4 su 40 risposte a 360).
//   misura: nomi coperti 0/0/0 (rosso C272N01); memo della disposizione (C272C01): 2,8 chiamate e 470 ms per risposta (−33%), 2663 ms
//   a ×4 (−39%, massimo 9049 → 4203); costo sotto la mappa in testo piccolo (C272S01) e «Previsione: nessun cambiamento.» (C272F01):
//   scorrimento massimo 40/12/0 contro 68/56/0; provini approvati dal PO.
//   guardiano: tools/foto-po152-b.mjs (nomi coperti dal riquadro), tools/costo-nomi.mjs «conta», bracci po152b sugli episodi del codice
//   nuovo (C262M01, C269M01) o abbinati ai rossi D-272 dove il difetto non si vede più (C261H01, C269A01, C269C01).
// 0.69.0 – mappa: le pastiglie rimaste non saltano più dopo la mossa (PO-160, D-272 passo 2).
//   causa: il gruppo .settore-unita va a capo dopo 3 tocchi (stile.css:101); togliendo un'unità le altre cambiavano riga e posto
//   (e03: salto massimo 133/110/98 px a 360/375/412).
//   misura: posto vuoto invisibile al posto dell'unità partita fino alla chiamata dopo (C272V01) e costo di spostamento solo durante la
//   mossa (C272W01, C272W02 per lo schieramento C33-04): partenza 6/0/0 px; nomi dopo la mossa 96/124/88 (prima 83/75/52), compromesso
//   accettato dal PO; vicinanza massima invariata 95/93/93; verifica indipendente su e03, e04, e16, e30.
//   guardiano: salti dopo la mossa ≤ 44 px e vicinanza nel giro po152b; rossi C272V01, C272W01, C272W02.
// 0.70.0 – mappa: segno «−1 / +1» dopo la mossa (PO-160, D-272 passo 4).
//   causa: dopo la mossa non si vedeva da dove a dove era andata l'unità.
//   misura: per circa 2 s «−1» sul settore lasciato e «+1» su quello d'arrivo, in un posto libero (segno-mossa.ts): 108 mosse su 108
//   senza sovrapposizioni né tocchi presi, contrasto verso il proprio fondo ≥ 3,97:1; verifica indipendente: il caso e02/e04 trovato è
//   corretto (rosso C272D03). Guardiano schieramenti che dichiara gli schieramenti non aperti (142/142); strumento anelli che rilegge.
//   guardiano: tools/segno-po152b.mjs, salti con tetto per episodio; rossi C272D01, C272D02, C272D03, C272A01.
// 0.71.0 – correzioni grafiche piccole fuori dalla mappa (PO-165, D-283, collaudo grafico Fable).
//   causa: barra dello schieramento a sole icone (D-12); Home e «i» senza stato premuto (D-13); unità finite e «a riposo» sotto
//   4,5:1 (1,91-4,17:1, D-09); scheda «fallito» della città tagliata di 22 px (D-07); nota del verbale fuori schermo a 360×640 e
//   fiducia sopra la testata (D-10); versione dei Crediti sul bordo delle schede (D-15).
//   misura: parola sotto le icone, barra 328/343/380 px piena e alta 67 come prima; premuto con spinta 4,2 px; contrasti 18,88 /
//   14,36 / 13,19:1, vassoio 70 px, «tutte» intero e ≥ 6,4 px dal lucchetto; scheda 0 tagli, mappa ferma (D-243); nota a 577-590 su
//   640, «Prossimo» 50/51 px, verbali falliti alti come prima (D-187); versione in fondo ai Crediti. D-16 (costo in radio) uscito:
//   spostava le pastiglie (860 > 818). SAVE_VERSION 4 invariata. Provini approvati dal PO; CI 10/10 (run 1462).
//   guardiano: tools/foto-d283.mjs (giro d283 nel passo altezze, bracci a 360) e po149 (fallito); rossi C283P01, C283A01, C283E01,
//   C283E02, C283E03, C283V01, C283V02, C283C01, C283F01.
export const GAME_VERSION = '0.71.0';
