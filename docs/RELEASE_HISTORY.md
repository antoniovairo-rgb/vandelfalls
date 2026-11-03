# Storia delle release

La più recente in alto. Per ogni release: versione, data, cosa contiene, numeri misurati, catene eseguite.

Nessuna release.

## Commenti di GAME_VERSION da 0.1.0 a 0.10.0

Spostati qui da src/versione.ts il 2026-10-26 (D-233), testo invariato, perché il modulo aveva superato le 400 righe. Le versioni successive restano in src/versione.ts.

```
0.1.0 – impianto di L1 (PO-010/011/012), NON pubblicato.
  causa: serve lo scheletro Vite + TypeScript + Vitest per scrivere e01 (D-006).
  misura: catena «logica» verde su 3 giri, vedi STABILITA.json.
  guardiano: catena «logica» (tipi, confini, schema, test, salvataggi-reali, bracci-rossi-logica).

0.2.0 – primo rilascio numerato su main (PO-032): stile C (D-066/067), R01-R07, e02 su mappa e città,
  accenni di costo (D-078), N01 e C-008 corretti.
  causa: la versione restava 0.1.0 a ogni pubblicazione, il PO non poteva sapere quale build collaudava.
  misura: catena completa 3/3 verde su d589e18; sonde c06 (N01 nessuna a 360, rossa con C05N01) e c07 (nessuna sovrapposizione 360/375).
  guardiano: catena «governo» – ogni GAME_VERSION ha la sua riga di commento; la home mostra versione e build.

0.3.0 – e03 «Notte di coppa» giocabile (D-081…D-084): partita di notte, quartiere, transenne fisse (D-082).
  Nella logica (resa in arrivo): bilancio di fine episodio (D-085), picco di tensione nel rapporto (C09-01),
  colori e stemmi dei club (D-088). Abbozzi e04–e36 presenti ma nascosti (D-087, D-090: ?bozze=1).
  causa: PO-035, PO-036, PO-038/040, PO-039.
  misura: catena completa 3/3 verde sulla build del rilascio; bot e03 casuale 67,7% fallite, posizione delle transenne 1★…3★.
  guardiano: tests/transenne.test.ts, tools/fisse.mjs, tests/picco.test.ts, tests/bilancio.test.ts, tests/bot-deterministiche.test.ts.

0.4.0 – rilascio di giorno su richiesta del PO (PO-051, deroga a D-093): icona del gioco (PO-048), gioco installabile e
  offline dal browser + APK servito dal sito (PO-049), «Sostieni il progetto» e «Idee e segnalazioni» (PO-050),
  città leggibile una stagione alla volta (PO-044), pulsante sempre visibile / «scoperto» / avviso unità finite (C09-02/03/04),
  abbozzi con i sette grandi eventi (D-091, nascosti: ?bozze=1).
  causa: PO-044, PO-048…PO-051. misura: completa 3/3 sulla build del rilascio; Chromium 0 errori di installabilità
  (oltre all'incognito della prova), ricarica offline verde; email non in chiaro nel bundle.
  guardiano: passo «email» della catena grafica, tests/collegamenti.test.ts, __NO_C13M01 (città).

0.5.0 – rilascio notturno (D-093): sala, briefing e verbale a passi (PO-045), folla che segue l'ondata (PO-046),
  bilancio di fine episodio con «Cosa ti ha penalizzato» (PO-036/057), colori e stemmi dei club (PO-038/040),
  home con logo e guida «La città e il gioco» (PO-063/065), «fiducia» al posto di «credito» (PO-067), città per
  stagione con tutti i 36 episodi e segno «bozza» (S-09), ripartenza dall'ondata persa nella logica (PO-060).
  causa: PO-036…PO-067. misura: completa 3/3 sulla build del rilascio.
  guardiano: controllaFolla, passi ≤760 px (S-10), D-097 nel validatore, tests/ripartenza.test.ts.

0.6.0 – i 36 episodi consolidati (PO-068): testi brevi (D-101), sei scelte che cambiano la storia (D-100), talpa,
  costruttore e finale agrodolce (D-098/099), Tano Ferrigno «il Fabbro» (D-102), ritmo città/stadio (D-092); verbale
  con «Prossimo episodio» e «Condividi» (PO-072/074); tensione a colori anche nel bilancio (C12-01); salvataggi delle
  versioni pubblicate adattati ai dati nuovi (C14-02/03); curva del club anche negli episodi di città (e13, e25).
  causa: PO-068, PO-072, PO-074, collaudo C-014. misura: completa 3/3 sulla build del rilascio.
  guardiano: passo «storia» della catena logica (consolidamento + ritmo, tre bracci rossi), foto-verbale.mjs
  (rossi C18V01/C20C01), tests/aggiornamento.test.ts + salvataggio reale 0.4.0 (rossi C14V01/C14I01), C22K01.

0.7.0 – primo dei tre rilasci al giorno (D-109): barra della fiducia (S-19, PO-067), doppia conferma dello
  schieramento con avviso delle unità non usate (S-12, PO-061/054), esporta/importa e copia di riserva (S-20, PO-073),
  triplice conferma per ripartire (S-16, PO-066), finale di e36 per fascicolo (D-106) col tono giusto, fiducia minima 2
  a inizio episodio (D-105), e02/e03 ammorbiditi (D-108).
  causa: PO-054…PO-073, D-105…D-108. misura: completa 3/3 sulla build del rilascio.
  guardiano: controllaFiducia, controllaArchivio (rosso C19S01), Tripla (C20T01), controllaFiduciaMinima (C23F01),
  controllaDifficolta, bot per versione di esito (D106BOT), tests/tono.test.ts (C24T01).

0.8.0 – rilascio delle 13:30 (D-109): pagina bianca offline corretta (S-22, C14-01), guida alla prima partita (S-18),
  «Riparti dall'ondata N» a episodio perso (S-17, PO-060), logo a sinistra (PO-077), testimone di e18 coerente
  (C15-03), steward che segnalano invece di sequestrare (C15-10), «il Fabbro» nei dialoghi (C15-11, D-110),
  fiducia minima 3 (D-110).
  causa: C-014, C-015, PO-060, PO-077, D-110. misura: completa 3/3 sulla build del rilascio.
  guardiano: passo «offline» della catena grafica (rossi C14O01-03), C21R01, C22G01, C25L01, tests/testimone.test.ts,
  controllaFiduciaMinima (C23F01).

0.9.0 – rilascio anticipato su richiesta del PO (deroga all'orario di D-109): schieramento compatto (S-24, PO-079),
  vignette a fumetto in guida, sala ed esito del verbale (S-23), ripartenza solo da un'ondata da cui si può ancora
  vincere (C16-01, PO-083, D-111), spiegazione dell'installazione su Android e nei browser interni (PO-082),
  tasto indietro che rilegge senza annullare (S-21), «In mano» dice dove rende l'unità (C14-11).
  causa: C-016, PO-079, PO-082, PO-083. misura: completa 3/3 sulla build del rilascio; ripartenze sotto 1/3 36→0 su 455.
  guardiano: tests/ripartenza-po083.test.ts (PO083), tests/ripartenza.test.ts (C16R02), C27S01, C26V01, C30I01, C25I01, C22R01.

0.10.0 – rilascio delle 23:00 (D-109): aggiornamento con la scheda aperta che usa la cache invece di dire «manca la
  rete» (C16-03), guida segnata vista solo a «Salta» o «Iniziamo» (C16-04), «Riparti dall'ondata N» senza numero
  a capo (C16-06), indicatore «Rispondi ↓» calcolato senza IntersectionObserver.
  causa: collaudo C-016. misura: completa 3/3 sulla build del rilascio; offline O5 verde e rosso.
  guardiano: tools/offline.mjs O5 (C28W01), guida passo 3 (C28G01), controllaRipartiTesto (C28R01), C10S03.
```


## Commenti di GAME_VERSION da 0.11.0 a 0.20.0 (spostati da src/versione.ts, D-263)

```
// 0.11.0 – rilascio delle 08:00 (D-109): fiducia che premia il risultato dell'ondata (PO-094, D-113), perché di ogni
//   settore scoperto nel rapporto (PO-087), lampeggia solo il settore della chiamata (PO-088, PO-093), corteo e squadre
//   in movimento con vignetta nella chiamata (PO-089, parte A), mappa ridisegnata al ritorno dal background (S-26,
//   PO-081), stadio accanto al piazzale (S-25, PO-080), stagione chiusa spiegata (PO-091), C15-04…09.
//   causa: collaudo del PO del 12/10 e C-015. misura: completa 3/3 sulla build del rilascio; peggiore sopra equilibrata
//   26→0/36; 1161 scoperti, 0 senza causa. guardiano: tests/fiducia-risultato.test.ts (PO094), tests/causa-scoperto.test.ts
//   (PO087), C31M01, C32D01, C31W01/W02, C29P01/P02, C33C01, C34N01…C34S01, C34P01.
//
// 0.12.0 – rilascio anticipato su richiesta del PO (deroga all'orario di D-109): scelte che cambiano il seguito (PO-086,
//   campo «dopo»: e04 mercato, e06 bis, e09, e10, e03, mediatore e02/e07), chiamate «non c'è nessuno» solo se il settore
//   è davvero sguarnito (PO-095), fiducia che scende solo per settori scoperti (C17-05), Riparti più leggero (C17-06) e
//   che resiste al ricarico (C17-04), città a 360/375 (C17-12), bozza dello schieramento salvata (C17-16), in sala pulsa
//   solo il settore del passo (C17-17), sala con margine per la CI (D-115).
//   causa: collaudo C-017 e foto del PO del 13/10. misura: completa 3/3 e CI verde sulla build del rilascio; contraddizioni
//   0 su 461 scelte forzate. guardiano: tests/dopo-scelte.test.ts (PO086, C17R03), tests/senza-presidio.test.ts (PO095),
//   tests/fiducia-risultato.test.ts (C17R05), tests/ripartenza-po083.test.ts (C17R06), C35R01, C35C01, C35B01, C35S01.
//
// 0.13.0 – rilascio anticipato su richiesta del PO (deroga all'orario di D-109): vignette nello stile C «pop retinato»
//   in sala, verbale e chiamate (PO-092, D-114), aiuto del «?» leggibile per intero (PO-096), numero di versione in basso
//   a destra su ogni schermata (PO-097), «Rispondi» porta sempre alla prima opzione (C17-15), riepilogo dello schieramento
//   non coperto dai pulsanti (C17-22).
//   causa: PO-092, PO-096, PO-097, collaudo C-017. misura: completa 3/3 e CI verde sulla build del rilascio.
//   guardiano: C26V01, C36V01, C38A01, C38V01 e i controlli di C17-15/C17-22 nella catena grafica.
//
// 0.14.0 – rilascio anticipato su richiesta del PO (deroga all'orario di D-109): fonti (≤ 80 caratteri) e chiamate in stile
//   radio (≤ 100) della stagione 1 (PO-084, PO-085), testi coerenti con le scelte fatte (collaudo C-018: C18-01/02/03/04,
//   C17-09/10/19), tetto ai rientri di unità (C17-14), contrasto di testi e riquadri sul giallo (PO-098), via il
//   suggerimento «Rende di più» (PO-099, D-116), versione sempre visibile in basso a destra (C18-10).
//   causa: PO-084/085/098/099, collaudo C-018. misura: completa 3/3 e CI verde sulla build del rilascio.
//   guardiano: tests/brevita.test.ts, tests/riserva-tetto.test.ts (C17R14), tests/dopo-scelte.test.ts esteso, C40C01,
//   C40C02, C41R01; controllo pre-push tools/prima-del-push.mjs (PO-100, D-117).
//
// 0.15.0 – rilascio delle 23:00: icona «i» accanto al titolo dell'ondata con una riga che spiega il momento (PO-101,
//   142 righe), contrasto di ogni testo su ogni fondo e verde più scuro (C19-04), segno della conseguenza sul settore
//   dopo una risposta e icone dell'effetto sotto le opzioni (PO-085), correzioni grafiche C-018 (C18-05/07/08/09, C17-05,
//   C17-12, C17-22), coerenza C-019 (C19-01/02/03/05), controllo pre-push con «bot» quando cambiano dati o logica.
//   causa: PO-101, PO-085, collaudi C-018 e C-019. misura: completa 3/3 e CI verde sulla build del rilascio.
//   guardiano: tests/ondata-info.test.ts, C43I01, C40C01, C39E01, C39I01, C42*, tests/dopo-scelte.test.ts esteso.
//
// 0.16.0 – rilascio delle 08:00: colori dei cortei coerenti con la strada e con chi c'è (PO-102: club su 11 settori,
//   altrimenti neutri), vignetta di ogni chiamata con la sagoma dell'evento e scontro solo fuori scena (D-112 punto 5),
//   correzioni del collaudo C-020 (C20-01/02/03/04/05/06/07/08).
//   causa: PO-102, D-112 punto 5, collaudo C-020. misura: completa 3/3 e CI verde sulla build del rilascio.
//   guardiano: C44S03 e i controlli della catena grafica sulle vignette, tests/ondata-info.test.ts, bot D-108.
//
// 0.17.0 – rilascio delle 13:30: ritiro di una sola unità invece di tutte (PO-054), persone a pallini piatti nelle vignette
//   (PO-103), nomi in città più piccoli a 360/375 e posto del nome stabile (D-119, C20-03, controllo instabile della CI),
//   cortei neutri grigi e non più arancio (C21-01), club dei tifosi anche sul singolo evento e sulle strade dove i testi
//   dicono chi c'è (C21-02, C21-03).
//   causa: PO-054, PO-103, D-119, collaudo C-021. misura: completa 3/3 e CI verde sulla build del rilascio.
//   guardiano: C46R01, C47N01/N02, C48P01, C48N01, C49C01, C49E01, tests/corteo-club.test.ts, controllaColoriCortei.
//
// 0.18.0 – rilascio anticipato su richiesta del PO (PO-107, deroga all'orario di D-109): vignetta del luogo 42×42 al posto
//   dell'avatar nel briefing (PO-078, D-118, D-122), spicchio d'orologio dell'urgenza come bollino (PO-085, D-120), cerimonie,
//   minacce e liti disegnate come gente e «scontro» solo per le risse (C21-05/06), spalti di e15 fra le due squadre (C21-04),
//   eventi condizionati solo quando la condizione è vera (C21-09), club Cinderwick sui cortei della curva in e30 ed e17 (C23-03),
//   corteo della chiamata col club dell'evento (C23-01), nome dell'episodio in città fuori dalle proprie stelline (C23-02).
//   causa: PO-078, PO-085, collaudi C-021 e C-023, PO-107. misura: completa 3/3 e CI verde sulla build del rilascio.
//   guardiano: C51A01, C51O01, C50G01, C50C01, C50S01, C53D01, C53N01, controllaColoriCortei.
//
// 0.19.0 – rilascio delle 23:00: nomi delle squadre più semplici ispirati a Roma Sud (PO-108, D-124: Kiln United, Skyfield
//   Athletic, Square Rovers, Arches Town, Studio Town, Garden Albion, Stoneway Wanderers; id invariati), icona HTML leggibile di
//   chi chiama accanto alla vignetta (C22-01, PO-106), pallini delle vignette più grandi e con contorno (C22-02);
//   109 articoli corretti dopo il cambio dei nomi («dello Skyfield», «dell'Arches», «degli Stoneway», «lo Studio»).
//   causa: PO-108, PO-106, collaudo C-022. misura: completa 3/3 e CI verde sulla build del rilascio.
//   guardiano: C54C01 e controllaChiIcona, C55P01, test e bot sui testi rinominati.
//
// 0.20.0 – rilascio delle 08:00: 13 club di Valmora e 3 di fuori città raccontati negli episodi (PO-109, D-125: 9 club nuovi,
//   23 episodi ritoccati, BIBBIA con «Quartieri e club»), 12 stemmi nuovi; nome dell'episodio in città nascosto a 360/375 (D-123);
//   persone sulla mappa, icone a 16-20 px, contorno degli stemmi, splash Android col logo (C22-03…10, PO-106); avatar nel briefing,
//   urgenza solo con un evento sul settore, vignette nascoste a 375×667 (D-126); primo tocco sulla mappa con la «i» aperta (C25-02),
//   lettura protetta di app.screen (C24-03), nome di e36 stabile (C24-06), ultimo nome vecchio nei testi (C25-01).
//   causa: PO-109, PO-106, D-123, D-126, collaudi C-024 e C-025. misura: completa 3/3 e CI verde sulla build del rilascio.
//   guardiano: tests/nomi-club.test.ts (C63N01), tools/foto-stemmi.mjs (C62S01), C61N01, C56P01, C58I01, C64U01, C66V01, C69I01.
```
