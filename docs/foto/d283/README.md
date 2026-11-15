# D-283 · correzioni grafiche piccole fuori dalla mappa (S-28)

Ramo `claude/valmora-grafica-piccole`, da `main`. Codici del rapporto del collaudo grafico
(`docs/collaudo/grafica-fable/RAPPORTO.md` sul ramo `claude/valmora-collaudo-grafico-fable`).
Guardiani agganciati in `tools/passi-grafica.mjs` (passo «altezze» per il verde, «bracci-rossi-grafica» per i rossi, tabella
`BRACCI_D283` in `tools/foto-d283.mjs`); `tools/foto-po152-b.mjs` e `tools/bracci-po152b.mjs` non sono toccati.
Provini `<schermata>-<larghezza>.jpg`: a sinistra PRIMA (main), a destra DOPO; le foto piccole (barra, vassoio, radio) sono
ingrandite 2×. Strumenti: `node tools/foto-d283.mjs <build> <cartella> 360,375,412` (misure e foto), il giro della città di
`tools/foto-po149.mjs`, `tests/costo-radio-d283.test.ts`.

| Voce | File | PRIMA (main) | DOPO | Rosso |
|---|---|---|---|---|
| D-12/M-2 parola sotto le icone | `Schieramento.tsx` (barra), `stile-d283.css` | annulla, aiuto, azzera: sola icona, 44 px l'uno | «Annulla» 57, «Aiuto» 45, «Azzera» 52 px; i quattro pulsanti occupano 328/328 (360), 343/343 (375), 380/380 (412); barra alta 67 px prima e dopo; nessun testo tagliato | C283P01: 3 problemi |
| D-13 stato premuto | `stile-d283.css` | Home e «i»: nessun cambio con `:active` (forzato con CDP) | spinta 3 px + ombra corta, come `.pulsante`; il «?» della barra è un `.pulsante` e lo era già. Pastiglie e dischi: alla sessione della mappa (indicazione della principale) | C283A01: 2 problemi |
| D-09/M-3 unità finite e a riposo | `Schieramento.tsx`, `stile-d283.css`, `token.css` (`--righe-esaurita`) | a riposo «2» 4,17:1; finita: nome 1,91:1, «0» 2,48:1 (colori composti con le opacità) | a riposo 18,88:1; finita: nome 14,36:1, «✓ tutte» 13,19:1 (contro la riga più scura); vassoio alto 70 px prima e dopo; «✓ tutte» al posto dell'icona dell'unità | C283E01: 4 problemi |
| D-07/M-5 scheda «fallito» | `stile-d283.css` | scheda 22 px sotto e «Rigioca» a −18,2 px dal riquadro interno, a 760 e 915 per 360/375/412 | nessun taglio, margine ≥ 4 px; mappa allo stesso posto in tutti gli stati (279 px dall'alto a 760/915) | C283F01: 4 problemi a 360 |
| D-10/M-8 verbale | `Verbale.tsx`, `App.tsx`, `stile-d283.css` | 360×640 e01 «Contenuto a fatica»: nota a 628-647 su 640 (fuori), fiducia sopra la testata a 640/667/760 | nota a 581-594, sopra i pulsanti, senza toccare l'ombra della scheda; fiducia sotto la testata; «Prossimo episodio» visibile 46 px su 51 a scorrimento zero (prima 51) | C283V01: 1; C283V02: 3 |
| D-15 versione nei Crediti | `Crediti.tsx`, `stile-d283.css` | versione nell'angolo a 0 px dal bordo di 3 schede (640) e 2 (915) | nell'angolo non c'è; «Versione 0.70.0» in fondo alla pagina | C283C01: 4 problemi |
| D-16 costo in radio | `effetti-opzione.tsx` (`quandoRadio`), `Ondata.tsx` (`RapportoCosto`), `data/testi/it/comune.json` | 206 risposte su 234 ripetono l'unità («ti costa una squadra. Ti costa 1 squadra dalla prossima ondata»); riquadro radio e01 alto 55 px a 360 | 0 su 234; «… ti costa una squadra. Dalla prossima ondata.»; riquadro 38 px | C283R01: 206 |

D-16 è una regola di testo condivisa: tutte le 237 risposte con costo in unità (missioni e imprevisti) nominano già l'unità nel
loro testo; i dati di missione non sono stati toccati. L'ultima ondata («Le unità restano impegnate fino a fine serata») resta
com'era.

## Limiti dichiarati
- Il verbale a 360×640 scorre di 45 px (prima 47); con la nota sopra, «Prossimo episodio» è tagliato di 5 px in basso a
  scorrimento zero (46 su 51 visibili, sopra i 44 del tocco minimo).
- Lo stato premuto è misurato forzando `:active` con CDP, non con un dito vero.
- Il controllo «✓ tutte» sotto il lucchetto delle unità fisse è stato visto rosso solo sulla foto della prima versione, non con
  un interruttore.
- Il contrasto è calcolato componendo colori e opacità dei fondi pieni e delle righe; il retino a puntini del fondo è ignorato.
