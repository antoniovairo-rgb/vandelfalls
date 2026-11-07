# D-272 passo 2 · posto vuoto e costo di spostamento (ramo `claude/valmora-vicinanza`, da main 553c26fa)

Scelta del PO: «Sì, posto vuoto» (opzione 1). Taratura in un solo giro con criteri fissati prima: non rispettati, quindi resta
l'opzione 1 senza ulteriori ritocchi e i numeri dei nomi vanno nei provini, accanto a quelli della taratura «nomi 30».

## Cosa cambia

| Parte | File | Rosso |
|---|---|---|
| Il posto dell'unità partita resta vuoto (invisibile, non prende tocchi) fino alla chiamata dopo; l'unità che arriva va in coda nel gruppo di arrivo | `src/resa/mappa/Mappa.tsx`, `src/resa/stile-idee.css` (`.tocco-vuoto`) | C272V01 |
| Il ricalcolo della disposizione conta lo spostamento di nomi e pastiglie dal posto di prima | `src/resa/mappa/congela.ts` (`primaDi`), `src/resa/mappa/etichette.ts` (`SPOSTO`) | C272W01 |
| Il «prima» vale solo nella mossa e alla stessa larghezza (C33-04) | `src/resa/mappa/congela.ts` (`primaDi`) | C272W02 |

## Guardiani nuovi

- **Giro «salti» di po152b** (`tools/salti-po152b.mjs`): in e03 auto_in_sosta, ogni unità spostabile verso ogni settore ammesso
  (24 mosse); nessuna pastiglia rimasta nel settore di partenza si sposta più di 44 px (`--tocco-min`).
  Bracci: C272V01 a 360×760 (28, almeno 20), C272W01 a 412×760 (9, almeno 6; a 360 il salto massimo col solo posto vuoto
  è 42 px, sotto soglia: per questo il braccio sta a 412).
- **Vicinanza** (giro radio di po152b, `tools/foto-po152-b.mjs`): nessuna pastiglia più lontana dal proprio disco di 95 / 93 / 93 px
  a 360 / 375 / 412 (il massimo misurato, uguale a main). Braccio C94N01 su e16 a 360×760 (6, almeno 5).
- **C33-04** (`tools/foto-schieramenti.mjs`, già esistente) vede anche C272W02: 132 problemi su 1044 controlli a 360; verde 0.
  Come C102D01, si accende a mano (`VALMORA_ROSSI=C272W02`), non sta fra i bracci automatici.

## Bracci spostati (26337409)

Col costo di spostamento 4 bracci po152b erano ciechi (2 tentativi su 2 in locale). Regola del principale: prima cercare episodi
dove il difetto si vede ancora col codice nuovo (`tools/zz-cerca2.mjs`, un episodio alla volta), soglie «almeno» invariate.

| Braccio | Episodi prima → dopo | Conteggio | Almeno |
|---|---|---|---|
| C255R01 | e01, e02 → e01, e02, e03 | 6 + 4 + 7 | 11 |
| C262M01,C271U01 | e02, e05, e26 → e02, e12, e15 | 3 + 2 + 3 | 5 |
| C269C01,C271U01,C272N01 | e02, e25, e26 → e08, e12, e20, e25, e28 | 1 per episodio | 3 |
| C271U01 | e04, e16 → e03, e04 | 8 + 7 | 13 |

## Misure (FATTO MISURATO)

**Salti dopo la mossa**: salto massimo in px, e03 auto_in_sosta, 24 mosse, `tools/zz-salti2.mjs`. La misura è deterministica
(seme fisso, `__VALMORA_SECONDO_MS=1`), con 1 prova per build. Le viewport sono 360×640, 375×667 e 412×915.

| Build | unità partenza | unità arrivo | unità altri | nomi |
|---|---|---|---|---|
| main 553c26fa | 133 / 110 / 98 | 93 / 98 / 88 | 91 / 91 / 22 | 83 / 75 / 52 |
| questo ramo c456106b | 5 / 0 / 0 | 70 / 70 / 98 | 88 / 88 / 0 | 96 / 123 / 88 |
| «nomi 30» (scartata) | 5 / 117 / 0 | 70 / 70 / 31 | 0 / 117 / 0 | 0 / 0 / 0 |

**Vicinanza**: px fra la pastiglia e il disco del proprio settore, giro radio a 360 / 375 / 412. Ci sono 3021 pastiglie per
larghezza, contate una volta per ogni stato. Lo strumento è `PO152B=./zz-po152b-vic.mjs TUTTI=1 node tools/zz-radio.mjs <w> radio VICINO`.

| Build | max | p95 | oltre 20 px |
|---|---|---|---|
| main 553c26fa | 95 / 93 / 93 | 49 / 49 / 21 | 451 / 366 / 167 |
| questo ramo | 95 / 93 / 93 | 49 / 49 / 49 | 495 / 400 / 292 |

Misura ritirata: i p95 dati prima, cioè base 53 / 51 / 49 e nuovo 61 / 53 / 52 su «1636 pastiglie», non li ritrovo con nessuna
definizione dai log. Li sostituisce la tabella qui sopra.

**Costo dei nomi**: ms per risposta, `tools/costo-nomi.mjs 40 360x640 1,4 conta`, 40 risposte per prova, 2 prove per build
alternate sulla stessa macchina (7/11). Chiamate per risposta 2,8 in tutte.

| Build | ×1 media | ×1 mediana | ×1 sd | ×4 media | ×4 mediana | ×4 sd |
|---|---|---|---|---|---|---|
| main 553c26fa | 474 / 459 | 507 / 486 | 203 / 184 | 2581 / 2446 | 3024 / 2775 | 1142 / 1040 |
| questo ramo c456106b | 451 / 450 | 531 / 520 | 213 / 219 | 2672 / 2653 | 3186 / 3267 | 1336 / 1220 |

Mediana: +5,8 % a ×1 e +11 % a ×4. Media: −3 % a ×1 e +6 % a ×4. Con dispersione di 200 / 1200 ms su 40 risposte
le differenze stanno entro circa 1,5 errori standard: non posso confermare né che sia peggiorato né che sia uguale.

## Limiti e ipotesi

- I nomi saltano di più dopo la mossa: 96 / 123 / 88 contro 83 / 75 / 52 px. Con la taratura «nomi 30» i nomi restano fermi,
  ma a 375 tornano i salti delle pastiglie fino a 117 px, nelle mosse verso curva_ospiti. I criteri fissati non sono rispettati,
  quindi la taratura è scartata e la scelta resta al PO, con i provini.
- Vicinanza: il massimo è invariato, ma le pastiglie oltre 20 px aumentano a tutte le larghezze e il p95 a 412 passa da 21 a 49 px.
- Nella colonna «Puoi spostare» dei provini la disposizione DOPO è già diversa da PRIMA, perché il «prima» vale anche entrando
  nello stato della mossa.
- e28: un rosso del giro anelli una volta su 9 sotto carico. Non riprodotto, quindi non posso confermare la causa. Se ricompare
  va trattato come strumento instabile.
- e06 sotto C271U01: `zz-cerca` si fermava perché l'unità era fuori dalla viewport. È un limite dello strumento di ricerca
  temporaneo, non dei guardiani.
- Bracci locali su 8329ef4b: il clic su «continua» è rimasto fermo 60 s una volta, con «element is not stable» e poi «detached»;
  al tentativo 2 era verde. Non ho trovato chi si muoveva. Da c456106b `sonda-altezze` lo stampa, se ricapita. La catena intera a
  360 su fb2f3c62 (= c456106b meno 3 righe di commento) è verde al primo tentativo.

## Provini

`provini-passo2-360x640.png`, `-375x667.png`, `-412x915.png` (script `provini-passo2.mjs`, numeri in `misure-passo2.json`).

## Da riprendere dopo la 0.69.0 (verifica a mente fresca del principale su c456106b)

Sono IPOTESI del verificatore, non misurate da questa sessione.

1. e16 magazzino_sette a 375: dopo la mossa le pastiglie della partenza saltano ancora di 23 px (4 elementi su 24), perché il
   gruppo si sposta tutto insieme. È sotto la soglia di 44 px; il giro «salti» guarda solo e03.
2. foto-schieramenti a 360×760 fa 139 controlli sul ramo verde, contro i 142 di main e del rosso. IPOTESI: uno schieramento che
   non si apre entro 5 s viene saltato in silenzio. Un guardiano che salta in silenzio va riparato: deve contare i controlli
   mancanti e dichiararli.
3. Il posto vuoto (`.tocco-vuoto`) si sovrappone in parte al riquadro dei dischi vicini in 4 situazioni (per esempio e03 a 375
   su curva_ospiti, 15×21 px). Non intercetta i tocchi: elementFromPoint dà il disco in 61 punti su 88.
