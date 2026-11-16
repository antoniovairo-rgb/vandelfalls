# D-283 · correzioni grafiche piccole fuori dalla mappa (S-28)

Ramo `claude/valmora-grafica-piccole`, da `main`. Codici del rapporto del collaudo grafico
(`docs/collaudo/grafica-fable/RAPPORTO.md` sul ramo `claude/valmora-collaudo-grafico-fable`).
Guardiani agganciati in `tools/passi-grafica.mjs` (passo «altezze» per il verde, «bracci-rossi-grafica» per i rossi, tabella
`BRACCI_D283` in `tools/foto-d283.mjs`); `tools/foto-po152-b.mjs` e `tools/bracci-po152b.mjs` non sono toccati.
Provini `<schermata>-<larghezza>.jpg`: a sinistra PRIMA (main), a destra DOPO; le foto piccole (barra, vassoio) sono
ingrandite 2×. Strumenti: `node tools/foto-d283.mjs <build> <cartella> 360,375,412` (misure e foto), il giro della città di
`tools/foto-po149.mjs`.

| Voce | File | PRIMA (main) | DOPO | Rosso |
|---|---|---|---|---|
| D-12/M-2 parola sotto le icone | `Schieramento.tsx` (barra), `stile-d283.css` | annulla, aiuto, azzera: sola icona, 44 px l'uno | «Annulla» 57, «Aiuto» 45, «Azzera» 52 px; i quattro pulsanti occupano 328/328 (360), 343/343 (375), 380/380 (412); barra alta 67 px prima e dopo; nessun testo tagliato | C283P01: 3 problemi |
| D-13 stato premuto | `stile-d283.css` | Home e «i»: nessun cambio con `:active` (forzato con CDP) | spinta 3 px + ombra corta, come `.pulsante`; il «?» della barra è un `.pulsante` e lo era già. Pastiglie e dischi: alla sessione della mappa (indicazione della principale) | C283A01: 2 problemi |
| D-09/M-3 unità finite e a riposo | `Schieramento.tsx`, `stile-d283.css`, `token.css` (`--righe-esaurita`) | a riposo «2» 4,17:1; finita: nome 1,91:1, «0» 2,48:1 (colori composti con le opacità) | a riposo 18,88:1; finita: nome 14,36:1, «✓ tutte» 13,19:1 (contro la riga più scura); vassoio alto 70 px prima e dopo; «tutte» con la spunta (icona: «✓» non è nei caratteri inclusi, D-257) al posto dell'icona dell'unità; nelle unità fisse solo «tutte» (con la spunta a 360 era tagliato di 3,2 px e a 0 px dal lucchetto; ora 0 px di taglio e 6,4 / 8,3 / 12,9 px dal lucchetto a 360 / 375 / 412); al lettore «tutte schierate» invece di «0 libere» (WCAG 2.5.3) | C283E01: 4; C283E02: 2 a 360 (4 sulle tre larghezze); C283E03: 3 a 360 |
| D-07/M-5 scheda «fallito» | `stile-d283.css` | scheda 22 px sotto e «Rigioca» a −18,2 px dal riquadro interno, a 760 e 915 per 360/375/412 | nessun taglio, margine ≥ 4 px; mappa allo stesso posto in tutti gli stati (279 px dall'alto a 760/915) | C283F01: 4 problemi a 360 |
| D-10/M-8 verbale | `Verbale.tsx`, `App.tsx`, `stile-d283.css` | 360×640 e01 «Contenuto a fatica»: nota a 628-647 su 640 (fuori), fiducia sopra la testata a 640/667/760 | fiducia sotto la testata, verbali falliti alti come su main (D-187); dopo la revisione (R2/R3, opzione A del PO) niente nota sopra i pulsanti: il pulsante della mappa dice «Mappa» sotto l'icona, la frase resta al lettore e nel title. Sui 36 verbali del bot attento a 360×640 e 375×667 «Prossimo» (posizione e px visibili) e «indietro» sono dove su main in 72/72 (con la nota sopra: «Prossimo» peggiore in 5, e08 24 → 11 px; «indietro» 13 px più su in 70/72) | C283V01 (solo icona, come main): 38; C283V02: 3; C283V03 (nota sopra): 114 |
| D-15 versione nei Crediti | `Crediti.tsx`, `stile-d283.css` | versione nell'angolo a 0 px dal bordo di 3 schede (640) e 2 (915) | nell'angolo non c'è; «Versione 0.70.0» in fondo alla pagina | C283C01: 4 problemi |
| D-16 costo in radio | — | uscito dal lotto (scelta della principale): accorciare il testo sposta le pastiglie della mappa; misure in `d16/APPUNTI.md` | — | — |

## Revisione a mente fresca (R1, N1, N3, N4) e provini a tre colonne
Provini `tutte-finite-*.jpg`, `barra-130-*.jpg`, `verbale-e08-360.jpg`, `verbale-e24-360.jpg`: main, 24b3678 (la versione rivista), ora.

| Voce | 24b3678 | Ora | Rosso |
|---|---|---|---|
| R1 vassoio con tutte le unità finite (e01 ondata 1) | 70 → 50 px, «Conferma» sale di 20 px (y 594 → 574 a 360, 609 → 589 a 375, 616 → 596 a 412) | 70 px, barra ferma alle tre larghezze (segnaposto invisibile al posto dello «0») | C283E04: 6 (2 a 360) |
| N1 testo al 130% (token `--testo-*` × 1,3) | «Conferma» esce di 50,5 px a 360 e 35,5 a 375 (main 0) | 0 px su 142 ondate × 3 larghezze; al 100% la barra resta su una riga alta 67 px | C283N01: 2 |
| N3 / N4 | codice morto nel guardiano; premuto letto subito | tolto; premuto letto a transizioni finite | — |

## Limiti dichiarati
- Lo stato premuto è misurato forzando `:active` con CDP, non con un dito vero.
- Il contrasto è calcolato componendo colori e opacità dei fondi pieni e delle righe; il retino a puntini del fondo è ignorato.
- Il testo al 130% è simulato moltiplicando i token `--testo-*` (in px); non è lo zoom dei caratteri di Android.
