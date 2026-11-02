# D-187 · scorrimenti e sovrapposizioni (PO-052, PO-058) — S-11

Nota: le foto «dopo» sono della prova senza il controllo di «Home» (mappa fino a 200 px, 8 px più bassa della versione finale dove la casa toccava la curva). Le misure della tabella sono quelle finali (due giri uguali).

Ramo `claude/valmora-home`, merge (non rebase) della principale `0908c2fa`. Build 0.42.0.
Metodo: riproduci (sonda di S-12), patch minima, rosso, guardiano. Misure con `tools/sonda-altezze.mjs` (nuova, dalla sonda
`coordination/sonde/s12-altezze.mjs` di S-12): partita e01 intera col piano del bot attento, a ogni scena eccedenza della
pagina sullo schermo (px). Prima = build di `0908c2fa` (worktree), dopo = build di questo ramo. Un giro per altezza:
l'impaginazione è deterministica, ma i campioni per schermata cambiano un po' fra un giro e l'altro (la sonda conta gli
stati che vede): per questo le soglie sono il massimo misurato.

## 1. Scorrimenti (FATTO MISURATO, massimo per schermata, px)

| schermata | 360×640 | 360×760 | 375×667 | 375×812 | 412×830 |
|---|---|---|---|---|---|
| titolo (home) | 4 → **0** | 0 → 0 | 4 → **0** | 0 → 0 | 0 → 0 |
| città | 133 → 117 | 13 → **0** | 106 → 90 | 13 → **0** | 1 → **0** |
| sala | 82 → 44 | 0 → 0 | 66 → 17 | 0 → 0 | 0 → 0 |
| briefing | 80 → 42 | 0 → 0 | 64 → 15 | 0 → 0 | 0 → 0 |
| schieramento | 53 → **0** | 0 → 0 | 41 → **0** | 0 → 0 | 0 → 0 |
| risposta | 241 → 113 | 104 → **0** | 212 → 77 | 67 → **0** | 86 → **0** |
| chiusura | 95 → **0** | 0 → 0 | 83 → **0** | 0 → 0 | 0 → 0 |
| rapporto | 366 → 246 | 246 → 126 | 330 → 195 | 185 → **0** | 166 → **0** |
| chiamata (D-114) | invariata: mappa 328/343/380 px come prima | | | | |
| crediti | possono scorrere (invariati) | | | | |

Cosa è cambiato:
- `src/resa/mappa/adatta.ts` (nuovo) + `Mappa.tsx`: nelle schermate di gioco la mappa si abbassa quanto basta perché la
  pagina non scorra, fino a `--mappa-altezza-min` (200 px) e mai sotto l'altezza a cui il pulsante «Home» tocca un punto o un nome dei settori (si rialza di 8 px alla volta; S-21: senza, la CI era rossa a 375, «Home» sopra la curva di Kiln). In e01 questo porta la mappa a 208 px dove serve.
  La chiamata è esclusa (D-114). Le vignette nascondibili (D-126 d) cedono per prime. Rosso `__NO_C187M01`.
- Città: `--citta-riserva` 500 → 516 e `--citta-altezza-min` 260 → 244 (la scheda è cresciuta di 13 px). Rosso `C187C01`.
- Home: il margine dell'ultimo paragrafo usciva da `main` e la vignetta lo ignorava (4 px). Rosso `C187C01`.

Resta da decidere (oltre il ridimensionamento cambierebbe l'aspetto): vedi «Opzioni».

## 2. Pulsante fisso sopra le righe del rapporto
Dove il rapporto non scorre più (375×812, 412×830) il pulsante non copre niente. Dove scorre ancora (360×640, 360×760,
375×667) il pulsante fisso (`stile.css:186`) copre per forza le righe sotto: è il comportamento di C09-03. Vedi «Opzioni».

## 3. «v0.42.0» sopra le lettere delle opzioni
Causa (FATTO MISURATO): con `reducedMotion` la scena che esce salta subito a x −40 px (`Scena.tsx:55`) e resta visibile
mentre sfuma: la lettera arriva a x −16, sotto la versione fissa (z-index 3); 450 px² misurati. A riposo nessuna
sovrapposizione. Correzione: la versione sta sotto la scena che si muove (`z-index: auto`, `stile-c18.css`). Rosso
`C187V01`. Guardiano: nel cambio di scena, al centro della versione dev'esserci la scena (rosso: rosso; verde: verde).

## 4. Nomi della mappa sopra i segni (chiamata e risposta)
`etichette.ts`: i segni dell'ultima risposta sono ostacoli per i nomi. Rosso `C187S01`. Misura: col rosso 506 px², col
verde 183 px² in un giro e 350 px² in un altro con la stessa build (la misura è rumorosa): NON è un guardiano bloccante,
la sonda la stampa. I segni stanno già sopra i nomi (z-index 4): la sovrapposizione è geometrica, il segno resta leggibile.

## 5. C28-02 (opzione accesa sotto il puntatore fermo)
FATTO MISURATO (sonda col mouse, build 0908c2fa): a 1024×768, 1280×800 e 1366×768 l'opzione è sotto la piega alla ripresa,
quindi si porta sotto il puntatore con la rotellina: spenta (data-fermo); dopo una mossa del mouse si accende. A 1920×1080
spenta col puntatore fermo, accesa dopo una mossa. Il «resta bianca» di S-12 è una lettura 150 ms dopo la mossa: a 1280
a 150 ms ho letto ancora bianco con `data-fermo` già tolto, a 300 ms ciano in tutti i casi (render + transizione di
80 ms). Nessun difetto del gioco: nessuna correzione.

## 6. rev-schermate.mjs
Sostituita come guardiano da `tools/sonda-altezze.mjs`, nella catena grafica (passo `altezze`, per larghezza:
360 → 360×640 e 360×760, 375 → 375×667, 412 → 412×830), con le soglie misurate e i rossi C187M01 e C187V01 nei bracci
rossi (a 360×760). Controlla anche che il pulsante «Home» della mappa abbassata non copra settori (S-21), e imposta
`__VALMORA_SECONDO_MS = 1` come foto.mjs (senza, in CI a 412 «bloccato su chiamata» nella finestra «Annulla»).

## Opzioni (decide il PO, tramite la principale)
- Rapporto (246/126/195 px a 360×640, 360×760, 375×667):
  A) a schermo basso il rapporto mostra la mappa piccola sopra la scheda solo se ci sta, altrimenti la scheda dei settori
     da sola (i colori dei settori dicono già lo stato) — 0 px a 360×760, ~24 px a 360×640; costo basso; cambia l'aspetto.
  B) pulsante «Prossima ondata» non fisso nel rapporto: niente copertura, ma per arrivarci si scorre.
  C) com'è (scorre, il pulsante copre le righe finché non si scorre).
- Risposta a 360×640 e 375×667 (113/77 px), sala e briefing a 360×640 (44/42 px) e 375×667 (17/15 px): mappa più bassa (160 px) nelle schermate
  senza tocchi sulla mappa; i nomi in alto rischiano il tasto casa. Da provare con foto.
- Città a 360×640 e 375×667 (117/90 px): sotto 244 px i dischi degli episodi si coprono (C17-12): serve una scheda più
  compatta o a comparsa. Cambia l'aspetto.

## Non verificato
Telefono vero; episodi diversi da e01; passi del verbale oltre il primo; sovrapposizioni a metà scorrimento; lettore di
schermo; la scheda della città con episodi già giocati (stelle, tentativi) a 360×760.

## Foto
`prima-<vp>-<schermata>.png` e `dopo-<vp>-<schermata>.png` per 360×640, 360×760, 375×667, 375×812, 412×830 (titolo,
città, sala, briefing, schierato, risposta, rapporto). Il primo campione di ogni schermata: prima e dopo possono essere
ondate diverse (es. rapporto dell'ondata 1 prima, dell'ondata 2 dopo).

---

# D-191 (decisione del PO sull'opzione consigliata) · S-11

Merge (non rebase) dalla principale `e8bf9c6` (S-13, S-15). FATTO MISURATO con `tools/sonda-altezze.mjs`, due giri uguali.

| schermata | 360×640 | 360×760 | 375×667 | 375×812 | 412×830 |
|---|---|---|---|---|---|
| città | 117 → **0** | 0 | 90 → **0** | 0 | 0 |
| sala / briefing | 44/42 → 16/16 | 0 | 17/15 → **0** | 0 | 0 |
| risposta | 113 → 104 | 0 | 77 → 77 | 0 | 0 |
| rapporto | 246 → **0** | 126 → **0** | 195 → **0** | 0 | 0 |
(prima = dopo D-187; chiamata invariata per D-114; crediti liberi; le altre schermate 0)

1. Rapporto (`adatta.ts`, rosso `C191R01`): se con la mappa al minimo la pagina scorre ancora, la mappa non si mostra; resta
   la scheda dei settori (righe un po' più strette) e «Home» passa nella testata (`App.tsx`, `Testata home`). Senza mappa
   si nasconde anche la vignetta di fine ondata (già vista nella scena del tono, D-143): prendeva il posto della mappa e
   sforava di 12 px a 375×812.
2. Risposta, sala, briefing: la mappa scende fino a `--mappa-altezza-min-lettura` 160 px (rosso `C191L01`); i nomi dei
   settori evitano il pulsante «Home» come i punti (`etichette.ts`, rosso `C191H01`). A 360×640 sala e briefing restano a
   16 px: sotto 176 px «Home» tocca la curva di Kiln (S-21) e la mappa si ferma lì. La risposta a 360×640 (104 px) e
   375×667 (77 px) non ci sta neanche a 160 px: servirebbe un'altra decisione (per esempio i due messaggi in uno).
3. Città: scheda dell'episodio più compatta (stemmi piccoli accanto ai nomi, margini ridotti; rosso `C191C01`).

Guardiano: `tools/sonda-altezze.mjs` con le soglie nuove; bracci rossi C191R01, C191L01, C191C01, C191H01 verificati
(rapporto 118 px, sala 36, città 117, sala 40 col rispettivo rosso).

Foto D-191: `d191/<vp>-<schermata>-<n>.png`.

Non verificato: telefono vero; episodi diversi da e01 (in altri episodi i settori in alto possono fermare la mappa più in
alto); passi del verbale oltre il primo; lettore di schermo (la testata con «Home» nel rapporto senza mappa).

---

# D-193 (risposta in un solo blocco) e chiusura di D-191 · S-11

FATTO MISURATO (`tools/sonda-altezze.mjs`, build finale): **0 px di scorrimento su tutte le schermate a 360×640, 360×760,
375×667 e 412×830**, tranne la chiamata (D-114, invariata) e i crediti (liberi).

| schermata | 360×640 | 375×667 |
|---|---|---|
| risposta | 104 → **0** | 77 → **0** |
| sala / briefing | 16 → **0** (mappa ≥ 176 px) | 0 |

1. Risposta (`Ondata.tsx`, rosso `C193R01`): esito e conseguenza in un solo fumetto: la scelta in testa come striscia
   ciano, poi «☕ Intanto…» in linea col testo della conseguenza. La mappa resta.
2. Sala e briefing (rosso `C193S01`): 8 px in meno sopra il passo e 4+4 attorno ai pulsanti dei passi; la mappa non scende
   sotto i 176 px (S-21).
3. Controllo di «Home» (`adatta.ts`): prima i punti (fermi), poi i nomi ridisposti solo quando i punti sono liberi; una
   ridisposizione per passo rallentava ogni disegno (IPOTESI sulla CI rossa a 375, segni della risposta spariti prima del
   controllo PO-085: non riprodotta in locale).
4. Guardiano R06 di `tools/foto.mjs`: col rapporto senza mappa misurava i nomi contro una mappa nascosta (rettangolo 0×0):
   ora salta la mappa nascosta (CI locale a 375, 20 rossi falsi).

Bracci rossi verificati rossi (360×640 o 360×760): C187M01, C187V01, C191R01, C191L01, C191C01, C191H01, C193R01, C193S01.
Guardiani di brevità e C42-02 (testi): non toccati, i testi sono gli stessi (Non verificato in catena finché non passa la CI).

Foto dopo: `d193/dopo-<vp>-<schermata>.png`; prima: le foto `prima-*` in cima a questa cartella.

---

# D-197 (opzione A del PO), job grafica 360, C43-06, C43-07 · S-11

Merge (non rebase) dalla principale `5d57e29` (imprevisti di S-14, D-190).

## D-197: nella risposta la mappa resta piena
- Perché (FATTO MISURATO, Chrome 156 della CI in locale): con la mappa abbassata solo nella risposta, a ogni risposta la
  mappa cambiava altezza due volte; la scena di Pixi e i nomi si rifacevano (lavori lunghi sul thread principale: a CPU 4×
  1,6–4,6 s in più senza WebGL) e i segni di PO-085, che durano 1,8 s di tempo vero, potevano scadere prima del controllo
  (CI rossa a 375 e 360 su ae4545f).
- Correzione: `adatta.ts` non adatta la risposta (rosso `C197R01`). Il blocco unico di D-193 resta.
- Scorrimento della risposta (FATTO MISURATO, `tools/sonda-altezze.mjs`): **116 px a 360×640, 104 px a 375×667**; 0 a
  360×760, 375×812 e 412×830. Soglie del guardiano solo per queste due; le altre invariate.
- Guardiano nuovo: nella risposta la mappa è alta come nella chiamata prima (col rosso C197R01: 218–242 px contro 328).
- Segni PO-085 su Chrome 156: sonda a 375×800, 32 risposte (16 a CPU normale, 16 a CPU 4×): 0 senza segni al momento del
  controllo. Guardiano `foto` con Chrome 156: vedi la consegna (due giri a 375, uno a 360).

## Job grafica 360 (35–38 minuti)
- Misura (Chrome 156 in locale, passo «foto» a 360 = 2830 s): `controllaSchieramenti` 1626 s, `apriTutte` 391,
  `controllaRipartiTesto` 153, `controllaRipartenza` 147.
- Causa: `controllaSchieramenti` stava solo nel giro a 360 ma faceva anche 375 e 412; e a 360 ricarica ogni ondata di ogni
  episodio col carattere rallentato di 1,5 s (CARATTERE_LENTO) e 500 ms di quiete: quasi tutto attesa.
- Correzioni: ogni job fa la sua larghezza (`sola`); gli stati con le unità su 3 pagine insieme (contesti separati).
  Soglie invariate (PASTIGLIE_SU_NOMI resta 0). In locale: `controllaSchieramenti` 1626 → 778 s, «foto» 2830 → 1969 s,
  verde. CI su 057502a (solo la divisione): «foto» 2045 → 1891 s.

## C43-06: passo «Fine stagione»
- Riprodotto (Chrome 156): e24 a 360×760 scorre 250 px, «Prossimo episodio» top 896; e12 51 px.
- Correzione: passo più compatto (filo «nome — esito» in un paragrafo, spaziature strette; i pulsanti restano sotto il
  testo per C17-22). Rosso `C196V01`. Dopo: 0 px a 360×760, 375×812, 412×915 (e24 passo 744 → 460, «Prossimo» top 592).
- Guardiano in `foto-epilogo.mjs` (verde; rosso: e24 210 px, «Prossimo» 147 px sotto la piega). Foto `c43/`.

## C43-07: home 764 su 760
- Già corretto da D-187 (margine dell'ultima nota che usciva da main): 764 → 760 a 360, 375 e 412 (Chrome 156).
- Guardiano `foto-home.mjs`: scrollHeight a 760, rosso `C187C01` nei bracci rossi. Dichiarato: a 640 px d'altezza con un
  salvataggio la home scorre 29/10/10 px (vignetta già al minimo di 96 px). Foto `c43/`.

## Altro trovato dalla CI
- Città: col minimo a 244 px (D-187) i dischi degli episodi si sovrapponevano per 587 px² a 360×760 (C17-12): tornato a
  260 px; a 360×640 i pulsanti delle stagioni più vicini alla mappa (0 px).

## C44-08 e C44-09 (D-201) — S-11, 20/10

Base: merge del ramo della principale fino a 16ecffb2 (contiene 335e7059). Misure con Chrome Headless Shell 156 (`tools/chrome-ci.mjs`).

FATTO MISURATO, `tools/sonda-altezze.mjs` (e01, bot attento), scorrimento massimo in px, prima → dopo:

| schermata | 360×760 | 375×760 | 412×760 | 360×640 | 375×667 | 412×830 |
|---|---|---|---|---|---|---|
| risposta | 0 → 0 | 11 → **0** | 24 → **0** | 116 → 68 | 104 → 56 | 0 → 0 |
| città, 36 episodi conclusi | 3 → **0** | 0 → 0 | 0 → 0 | — | — | — |

Imprevisti: `coordination/sonde/c44-giocatore.mjs` su e12 ed e14 (bot attento) a 360, 375 e 412×760: 102 risposte (24 imprevisti),
tutte a 0 px dopo la correzione. Altri episodi: non misurati.

Cosa è cambiato (`src/resa/stile-c18.css`, solo token):
- Risposta (rosso `C201R01`): testata e margine sotto la mappa come nella chiamata, «Avanti» a `--spazio-2` dal blocco,
  margine in fondo alla pagina `--spazio-3` invece di `--spazio-6`. La mappa resta piena (D-197): stessa altezza della chiamata.
- Città (rosso `C201C01`): «Rileggi l'epilogo» a `--spazio-2` dalla scheda e senza margine sotto.

Guardiano: `tools/sonda-altezze.mjs` gira anche a 375×760 (giro 375) e 412×760 (giro 412), e a ogni altezza 760 apre la città
con tutti gli episodi conclusi (`citta36`, soglia 0). Soglie della risposta abbassate al nuovo massimo misurato: 360×640 116 → 68,
375×667 104 → 56; chiamata a 375×760 512 e a 412×760 473 (D-114, il massimo misurato). Bracci rossi nella catena grafica:
`C201R01` a 412×760 (24 px, rosso visto), `C201C01` a 360×760 (città 3 px, rosso visto).

Foto in `c44/`: `prima-`/`dopo-<w>x760-risposta.png` (360, 375, 412), `prima-360x760-citta36.png`, `dopo-<w>x760-citta36.png`.

Non verificato: telefono vero; risposte e imprevisti degli episodi diversi da e01, e12, e14; città con un salvataggio vero a 36 episodi.

## D-202: job «grafica (360)» sotto i 20 minuti — S-11, 20/10

Base: ramo della principale fino a 84245887 (64707305 non era su origin al momento del merge).

FATTO MISURATO, CI (log dei job), tempi per passo del job 360:

| passo | c7085118 (33:34) | d36f26cd (41:22) | 730697db | d2f77f37 (3 job) |
|---|---|---|---|---|
| foto | 1328 s | 1537 s | 1387 s | 731 s (job «360 foto», 13:21) |
| schieramenti (dentro foto fino a 730697db) | — | — | — | 637 s (job «360 schieramenti», 12:53) |
| offline + altezze | 9 + 76 s | 9 + 102 s | 9 + 104 s | 9 + 80 s (job «360 schieramenti») |
| bracci-rossi-grafica | 559 s | 790 s | 530 s | 398 s (job «360 bracci», 7:28) |

I minuti in più (33:34 → 41:22): foto +209 s, altezze +26 s, bracci rossi +231 s (bracci C201R01 e C201C01 e passi arrivati con 0.44.0).
Dentro foto a 360 (locale, Chrome 156, carico misto): giro e01-e03 392 s, schieramenti 800, apriTutte 279, ripartiTesto 106,
ripartenza 100, Annulla 16, tono 16. Ogni braccio delle altezze gioca e01 intera: 71–94 s, 11 bracci.

Cosa è cambiato (stesse verifiche, stesse soglie, nessun controllo tolto):
- `passi-grafica.mjs`: bracci rossi indipendenti, 5 insieme (`VALMORA_PARALLELI`), rossi passati come parametro a `giraOffline`,
  `giraEpilogo`, `giraC41` (prima `process.env.VALMORA_ROSSI` globale) e cartelle separate; passo foto: giro, epilogo e C41 insieme;
  nuovo passo `schieramenti` (prima dentro il giro foto).
- `foto-bozze.mjs` (apriTutte): episodi su 3 pagine; gli episodi che giocano una partita restano sulla pagina del giro; ogni
  pagina conta i suoi errori di console (e li aggiunge al giro).
- `catena.mjs`: `VALMORA_PASSI` sceglie un sottoinsieme dei passi (un passo estraneo ferma la catena); il giro lo registra in
  `passi_scelti`, così non passa per completo.
- `.github/workflows/catene.yml`: la 360 su tre job (foto / schieramenti, offline, altezze / bracci rossi); 375 e 412 interi.
  La CI ha 9 job invece di 7. IPOTESI (non misurata con un profilo): il runner è limitato dalla CPU (mappe WebGL disegnate in
  software), per questo più pagine nello stesso job rendevano poco (foto 1537 → 1387 s) e più job sì.

Bracci rossi: tutti visti rossi in CI (passo verde = nessun braccio cieco), locale verde due volte (1712 s e 1832 s di catena 360).

## C45-06 (D-203): rapporto che scorre a 360×760 — S-11, 20/10

Base: 0.45.0 (merge c1685a62). FATTO MISURATO con Chrome 156, 360×760: 742 rapporti costruiti col motore (tutti gli episodi,
strategie attenta, equilibrata, peggiore, casuale semi 1-4, variabili della partita attenta), aperti da salvataggio
(`rapporto_aperto`). Aperti sul rapporto: 740 (42 oltre i 5 s d'attesa, macchina carica; 1 si è fermato sulla scena del tono, 1 sul titolo:
non misurati). Prima: 7 scorrevano (e35 casuale4 o3 34 px, e30 casuale1 o3 32, e35 casuale1 o3 21, e22 casuale3 o2 11,
e36 peggiore o3 10, e36 casuale1 o3 7, e16 casuale1 o3 2). Dopo: 0 px in tutti quelli aperti.
Correzione (`stile-c18.css`, solo token, rosso `C203R01`): nel rapporto senza mappa la scheda, «A riposo», «Disponibili» e
«Prossima ondata» più vicini, margine sotto la pagina `--spazio-3`.
Guardiano: `tools/sonda-altezze.mjs` apre i 7 rapporti a 360×760 (soglia 0); col rosso C203R01 tornano 34/32/21/11/10/7/2 px
(visto); braccio rosso nella catena grafica. Foto: `c45/prima-360x760-rapporto-e35.png`, `c45/dopo-<w>x760-rapporto-e35.png`.
Non verificato: il caso esatto del collaudo (e31 o3 con le sue scelte, che il file del collaudo non registra come comandi).

## C45-05 (D-203): opzioni misurate per la chiamata d'imprevisto (NON applicate, sceglie la principale o il PO)

FATTO MISURATO, Chrome 156, 360×760: 594 chiamate di tutti gli episodi aperte da salvataggio sulla partita attenta (142
imprevisti, 452 normali); varianti applicate dalla sonda con un foglio di stile sulla sola chiamata d'imprevisto. Scorrimento px:

| variante | imprevisti max | mediana | media | cosa cambia |
|---|---|---|---|---|
| oggi | 545 | 466 | 464 | — (normali: max 664, mediana 271, media 287) |
| A vignetta nascosta | 488 | 412 | 414 | niente vignetta piccola nel fumetto dell'imprevisto (PO-089 la vuole in ogni chiamata) |
| B avviso tolto | 473 | 394 | 392 | niente riga magenta «Imprevisto: interrompe le chiamate» (D-190), resta «Urgente!» nel fumetto |
| C opzioni strette | 513 | 434 | 432 | padding e spazio fra le opzioni a 4 px (solo stile) |
| A+B+C | 384 | 308 | 310 | le tre insieme: mediana come le chiamate normali |

Peggiori in tutte le varianti: e06 `imp_corrente`, e13 `imp_sedie` (545 oggi). Foto: `c45/c4505/<variante>-360x760-e06-imp_corrente.png`.
Nota: oggi 545 px (e06, e13) supera di 1 px la soglia della chiamata a 360×760 (544), che il guardiano misura solo su e01; le
chiamate normali di altri episodi arrivano a 664. D-114 accetta lo scorrimento della chiamata: segnalo, non tocco la soglia.
A e B cambiano il prodotto (PO-089, D-190); C è solo spaziatura.

## D-206 + D-207 (C45-05): chiamata d'imprevisto più corta — S-11, 20/10

Base: ramo della principale fino a 701045f3 (merge 382bb11c). Scelta del PO A+B+C (D-206) più strette di solo stile (D-207,
la principale; «Rispondi ↓» resta). Correzione dichiarata: avevo scritto che A+B+C portava la mediana «come le normali»: 308 contro 271, ritirata.
- `Ondata.tsx`: nell'imprevisto niente vignetta nel fumetto e niente riga «Imprevisto: interrompe le chiamate» (rosso `C206I01`).
- `stile-c18.css` (solo token, stesso rosso): opzioni con `--spazio-1` di padding e spazio, effetti a `--spazio-px`, testo
  delle opzioni a `--linea-stretta`, fumetto dell'imprevisto a `--spazio-2`. Prove della sonda con 2 px: 346/291; coi token: 339/285.

FATTO MISURATO, Chrome 156, 360×760, tutte le 594 chiamate (142 imprevisti) aperte da salvataggio sulla partita attenta:

| | imprevisti max | imprevisti mediana | normali max / mediana |
|---|---|---|---|
| prima (rosso C206I01) | 545 (e06 imp_corrente, e13 imp_sedie) | 466 | 664 / 271 |
| A+B+C | 384 | 308 | 664 / 271 |
| A+B+C + D-207 (applicato) | 339 | 285 | 664 / 271 |

Guardiano (`tools/sonda-altezze.mjs`, a 360×760): imprevisti ≤ 339 e mediana ≤ 285 (valori misurati, D-207), soglia storica
544 invariata, normali ≤ 664 (massimo misurato, D-114). Verde sulle sei misure; col rosso C206I01: 5+ imprevisti oltre 339
(e01 imp_tram 489 px). Braccio rosso C206I01 nella catena grafica.
Foto: `c45/d206/prima` (rosso C206I01) e `c45/d206/dopo`, e01 imp_ambulanza, e17 imp_lampioni, e30 imp_mercatino a 360, 375, 412
(`tools/foto-imprevisti.mjs`, adeguato: controlla il fumetto dell'imprevisto; PRIMA=1 per le foto di prima).

## D-208 + D-210 (PO-140 fase 2, opzione 1 del PO): striscia della home nella città, vignetta della home nella guida — S-11, 20/10

- `Citta.tsx`: in testa la vignetta della home (96 px, `fissa`) con «La città · stasera si gioca» al posto della testata
  («S1 · Stagione 1 · mappa della città / Valmora»); il titolo resta per il lettore di schermo (`h1.solo-lettore`
  «Valmora · stagione N · mappa della città»). Rosso `C210C01`: la testata di prima. Sotto `--vignetta-finestra-min` (700 px,
  la stessa soglia delle vignette di sala e verbale) resta la testata di prima: a 360×640 la striscia faceva scorrere la città
  con 0 episodi di 21 px (scelta tecnica, dichiarata).
- `Guida.tsx`: al primo passo la vignetta della home con «La città e il gioco» al posto della vignetta del passo. Rosso `C210G01`.
- La mappa della città resta a 260 px. Correzione dichiarata: avevo proposto 252 px; in CI (run 39486684643, «360 foto») a 252
  i dischi degli episodi si coprivano per 255 px² a 360×760 (C17-12). Lo spazio viene invece da: sotto la striscia
  `--spazio-1`; con la striscia «Rileggi l'epilogo» e la scheda sopra a `--spazio-1`; margine sotto la pagina `--spazio-3`
  (era `--spazio-6`, come per la risposta in D-201).
- Altra correzione dichiarata: avevo stimato 0 px a 360 con 96 px di striscia e mappa a 252; la misura dava 11 px (e 4 con 0
  episodi, per la vignetta che si allungava: ora `fissa`).

FATTO MISURATO, Chrome 156, scorrimento px (`tools/sonda-altezze.mjs` e sonda della città con 0 episodi):

| | 360×760 | 375×760 | 412×760 | 360×640 |
|---|---|---|---|---|
| città, partita e01 | 0 | 0 | 0 | 0 (testata) |
| città, 36 episodi | 0 | 0 | 0 | — |
| guida, passo 1 | 0 | 0 | 0 | 0 |

Lettore di schermo (albero di accessibilità di Chromium, città a 360×760): «heading Valmora · stagione 3 · mappa della città
[level 1]», poi la figura, «Torna alla home», «Stagione 1», «Stagione 2», «Stagione 3 [pressed]»; dopo il tocco su Stagione 2
il titolo dice «stagione 2» e «Stagione 2 [pressed]». I tasti dicono la stagione anche senza la testata.
Guardiani: `tools/sonda-altezze.mjs` (a ogni 760: città36 con la striscia ≥ 96 px e senza scorrere; passo 1 della guida con la
vignetta della home e senza scorrere), bracci rossi C210C01 e C210G01 visti; nel giro foto PO-092 esclude la striscia fissa
e S-23 accetta al passo 1 la vignetta della home.
Foto: `home/d210/prima-*` (rossi) e `home/d210/dopo-*`, città con 0 e 36 episodi e guida, a 360, 375 e 412 × 760.

## D-215: mediana degli imprevisti 286 su 285 (guardiano D-207 rosso) — S-11, 21/10

Base: ramo della principale 6d72de7d. FATTO MISURATO, Chrome 156, 142 imprevisti a 360×760 (`tools/sonda-altezze.mjs`,
parte «chiamate»): base 286 in 4 giri su 4 (dispersione 0, misura deterministica), massimo 339; su da78df04 (dove D-207 fissò
la soglia) 285, massimo 339: la soglia non era sbagliata. Confronto chiamata per chiamata, da78df04 → 6d72de7d: crescono
e02 imp_binario 267 → 286, e02 imp_soppresso 248 → 305, e03 imp_bus_notte 267 → 305, e04 imp_ghiaccio 264 → 283,
e05 imp_tabellone 229 → 248, e06 imp_allarme 264 → 283, e36 imp_cassa 304 → 323 (+19 o +38: una o due righe in più).
Causa: titoli delle opzioni più lunghi con le etichette neutre (C-045, S-18) e la rifinitura e01–e03 (D-209), per esempio
«Steward nel sottopasso» → «Fai indicare la scala giusta nel sottopasso», che a 360 px va su due righe.
Correzione (resa, non soglia né testi): fumetto dell'imprevisto con padding sopra e sotto `--spazio-1` (era `--spazio-2`).
Rosso `C215L01`. Prove scartate: interlinea del titolo delle opzioni (era già `--linea-stretta`, 286), margini del fumetto
(collassano coi vicini, 286). Dopo: mediana 278 in 3 giri su 3, massimo 331. Guardiano verde; col rosso C215L01 «mediana
degli imprevisti 286 px (soglia 285)»; braccio C215L01 nella catena grafica (parte «chiamate»).
Foto: `c45/d215/prima` (rosso C215L01) e `c45/d215/dopo`, e01, e17, e30 a 360, 375 e 412 (`tools/foto-imprevisti.mjs`, PRIMA=C215L01).

## D-218: rilievi del collaudo C-047 (C47-01, C47-02, C47-03) — S-11, 21/10

Base: ebbf277b (avanzamento rapido, nessun rebase). FATTO MISURATO con Chrome 156 (Headless Shell, `tools/chrome-ci.mjs`).

**C47-01 (solo testo).** `data/testi/it/e36.json:117` ora dice «Quattro interim, quattro buste. Le prime tre non le ho mai
aperte davanti a nessuno.»: coerente con e01 «Sei il quarto ad interim», e34 «Tre interim prima di te» e la guida «Il vice ha
visto passare tre come te»; la busta del protagonista è la quarta, l'ultima. Nessuna variante @f per questa chiave; le righe
vicine del filo (e36.intro1 «una busta col tuo nome», verbali «Hai durato più di tutti») sono già coerenti. Meccanica intatta.

**C47-02 (riepilogo dello schieramento).** Riprodotto con le disposizioni della collaudatrice (6–7 unità su 5 settori, con
l'avviso «Ti restano…»), aperte da salvataggio all'ondata 1 dopo la partita attenta fino all'episodio prima. Senza avviso
(piano attento: 4 settori, oppure 5 settori con tutte le unità) non scorreva già: 0 px.

| scorrimento (px) | 360×760 | 375×760 | 412×760 |
|---|---|---|---|
| e36 ondata 1, prima | 19 | 19 | 11 |
| e22 ondata 1, prima | 11 | 11 | 11 |
| e36 e e22, dopo | 0 | 0 | 0 |

Causa: i due pulsanti del riepilogo avevano i margini delle azioni (`.azioni .pulsante`, `--spazio-3` sopra e sotto, 24 px).
Correzione con token: `margin-block: 0` sui pulsanti del riepilogo (lo stacco dall'avviso resta il suo margine `--spazio-2`).
Rosso `C218R01`. Il posto liberato lo riprende la mappa, che è a altezza variabile (foto).
Guardiano: `tools/sonda-altezze.mjs`, parte «riepilogo» a ogni 760 (`RIEPILOGHI`, `riepiloghiCostruiti`): controlla 5
settori e l'avviso, soglia 0. Col rosso C218R01: 19 e 11 px, rosso; braccio C218R01 nella catena grafica.

**C47-03 (stelle della città).** Riprodotto sulla città con 36 episodi (1 stella ciascuno): dischi 0 px² ma stelle (55×15 px,
sopra il disco) sui dischi vicini. Le tre stagioni hanno la stessa disposizione, quindi gli stessi numeri:

| stelle sui dischi di altri episodi (px²) | 360×760 | 375×760 | 412×760 |
|---|---|---|---|
| prima, coppia peggiore | 288 (33 sul 29) | 282 | 270 |
| prima, 31 sul 28 / 32 sul 31 | 75 / 158 | 39 / 122 | 0 / 33 |
| prima, somma | 1460 | — | — |
| dopo, tutte le stagioni | 0 | 0 | 0 |

Prova scartata: solo uno spostamento verticale delle stelle (da −10 a +60 px) non arriva mai a 0 (minimo 96 px² a 360).
Correzione con token: stelle strette a 41 px (`gap: 0`, `padding: var(--spazio-px)`), dentro il riquadro del proprio disco,
in basso (`bottom: calc(var(--settore) / -2)`); il numero sale di metà `--spazio-3` (`padding-bottom` sui dischi con stelle) e
resta leggibile; il nome dell'episodio scelto sta sopra le stelle (`z-index: 1`). Rosso `C218S01`.
Guardiano: C17-12 (`tools/foto-c17.mjs`, `controllaCitta`) misura anche le stelle contro i dischi degli altri, con soglia 0. Gira
nel giro foto anche sulla stagione 3 con i 36 episodi (`tools/foto-bozze.mjs`) e nella parte «città36» di
`tools/sonda-altezze.mjs`, che ospita il braccio rosso. Col rosso C218S01: 1460 px², rosso.

**Rilievo nuovo (non corretto, alla principale).** Il guardiano nuovo ha trovato un altro difetto nel riepilogo di e36 a 360 e 375.
Il tasto «Home» della mappa copre il nome di curva_cinderwick per 56 px², e si legge «URVA KILN» (S-21). Il difetto c'è già su
ebbf277b: lo vedo anche coi rossi C218R01 e C218S01. Il posizionatore dei nomi (`src/resa/mappa/etichette.ts:57-59`) considera
già «Home» un ostacolo, ma qui nessun posto è libero. Correggerlo vuol dire toccare l'algoritmo delle etichette, che è fuori
dall'ambito di D-218. Per ora la parte «riepilogo» misura e stampa questo valore (`casaRiepilogo`) ma non blocca.

Foto: `c47/d218/prima` (build prima della correzione) e `c47/d218/dopo`: riepilogo e36 e e22, città con 36 episodi in
stagione 3, a 360, 375 e 412 × 760.

Non verificato: telefono reale (tutto in Chromium); il riepilogo a 640/667 di altezza (non richiesto, non misurato); lettore
di schermo sulle stelle spostate (l'etichetta del disco dice già «N stelle su 3», `MappaCitta.tsx:110`, non cambiata).

## D-219: «Home» sopra il nome di un settore nel riepilogo (S-21) — S-11, 21/10

FATTO MISURATO, Chrome 156. Nel riepilogo di e36 ondata 1, a 360 e a 375×760, il tasto «Home» della mappa copriva il nome
di curva_cinderwick per 56 px²; sulla mappa si leggeva «URVA KILN». Strumentando il posizionatore (temporaneo, poi tolto),
il posto migliore costava 5553, quasi tutto per la sovrapposizione con «Home» (circa 54 px²). Le altre scelte costavano di più:
il nome stretto a due righe 37 762, gli altri posti oltre 80 000. Per uscire da sotto «Home» bastava spostare il nome di 6,5 px a destra.
Correzione nel posizionatore (`src/resa/mappa/etichette.ts`, `sposta`): come per i bordi (C128-02) e nella città (C20-03),
un nome sotto «Home» si sposta di quanto basta per uscirne, in orizzontale o in verticale (il minimo), fino a un quarto di
disco, e il costo si conta già spostato. Rosso `C219H01`. Si è scelto il posizionatore e non lo spostamento del tasto:
la correzione vale per ogni mappa tattica e lascia «Home» dove sta su tutte le schermate.

| «Home» sopra punti o nomi | 360×760 | 375×760 | 412×760 |
|---|---|---|---|
| riepilogo e36, prima (rosso C219H01) | 1 (56 px²) | 1 | 0 |
| riepilogo e36 e e22, dopo | 0 | 0 | 0 |
| riepiloghi della partita e01 (3 ondate), dopo | 0 | 0 | 0 |

Ai riepiloghi della partita e01 la stessa misura è stata fatta anche a 360×640, 375×667 e 412×830: 0 in tutti e tre.

Guardiano: S-21 è bloccante (soglia 0) anche nella parte «riepilogo» di `tools/sonda-altezze.mjs`. La partita e01 della sonda
ora misura anche il riepilogo di ogni ondata (S-21 e scorrimento), a tutte le misure di schermo. Braccio C219H01 nella catena
grafica: col rosso 1 elemento coperto a 360 e 375, quindi rosso.

**Rilievo nuovo (alla principale).** Misurando i riepiloghi di e01 è emerso che a 360×640 il riepilogo dell'ondata 3 scorre di
26 px. Prima non si misurava, quindi **Non posso confermarlo** come difetto recente o vecchio. A 375×667 scorre 0 px in locale
ma 1 px in CI (bc10c57c, «grafica (375)», 3 tentativi su 3). Per questo il primo push era rosso: ritiro la soglia di 26 px che
avevo messo, perché misurava una cosa non richiesta e con una soglia a 0 a 375×667 sarebbe rossa in CI. Ora lo scorrimento del
riepilogo blocca da 760 px di altezza in su (soglia 0, come in D-218); sotto si misura e si stampa senza bloccare. S-21 blocca a
tutte le altezze. A 360×760, 375×760, 412×760 e 412×830 scorre 0. La correzione sotto i 760 px resta da decidere.

Foto: `c47/d219/prima` (rosso C219H01) e `c47/d219/dopo`, riepiloghi di e36 ed e22 a 360, 375 e 412 × 760.
Non verificato: telefono reale; le 426 ondate degli schieramenti col posizionatore nuovo le misura il passo «schieramenti»
della catena grafica (in CI), non una mia prova a parte.

## D-221: il riepilogo dello schieramento non scorre a nessuna altezza — S-11, 21/10

Base: merge di e6ba5de5 (conflitti solo in `STABILITA.json`, giri dei due lati uniti, e `docs/governo/governo.html`, rigenerato).
FATTO MISURATO, Chrome 156, scorrimento del riepilogo in px (`tools/sonda-altezze.mjs`, parte «riepilogo» ora a ogni altezza):

| | 360×640 | 375×667 | 412×830 | 360/375/412×760 |
|---|---|---|---|---|
| e36 ondata 1, 5 settori + avviso, prima (rosso C221R01) | 115 | 88 | 0 | 0 |
| e22 ondata 1, prima | 107 | 80 | 0 | 0 |
| e36 e e22, dopo | 0 | 0 | 0 | 0 |

Correzione solo con token, rosso `C221R01`:
- scheda del riepilogo con margini e spazio interno più stretti (`--spazio-2`/`--spazio-3`), titolo con `--spazio-1`;
- elenco dei settori senza spazio fra le righe e con `--linea-stretta`;
- avviso con `--testo-piccolo`, `--linea-stretta` e spazio interno `--spazio-1`;
- pulsanti con `--testo-piccolo` e spazio interno `--spazio-1`;
- sotto la pagina il margine piccolo (`--spazio-3`). Quello grande serve alla barra fissa dello schieramento, che nel riepilogo non c'è.

Il posto liberato lo prende la mappa, che a 360×640 sale a 225 px e lascia margine. Ho provato anche a far scendere la mappa
fino al minimo di lettura (160 px, come in D-191), ma non serviva: in e36 il controllo di «Home» (S-21) la tiene comunque
a 205 px. Quella modifica l'ho tolta.

Guardiano: lo scorrimento del riepilogo blocca a soglia 0 a ogni altezza (640, 667, 760, 830). Questo vale per i riepiloghi
costruiti (e36, e22) e per quelli della partita e01. Bracci nella catena grafica:
- `C221R01` a 360×640 (115 px, rosso);
- `C218R01,C221R01` a 360×760 (19 e 11 px, rosso). C218R01 da solo ora è cieco (0 px), perché il riepilogo più stretto non
  scorre neanche coi margini di prima: per questo il braccio è passato alla coppia.
- `C219H01,C221R01` a 360×760 (D-219: «Home» sopra il nome, 1 coperto, rosso). C219H01 da solo a 760 ora è cieco, perché la
  mappa del riepilogo è più alta (328 px invece di 213) e il nome non arriva sotto «Home». A 360×640, senza D-219, la mappa si
  rialza a 241 px per S-21 e la pagina scorre di 16 px: D-219 serve ancora.
- `PARTE_ROSSO` accetta coppie (`r.split(',')`).
- La sonda completa delle altezze è verde a 360×640, 360×760, 375×667, 375×760, 412×830 e 412×760, compresi i riepiloghi della
  partita e01. Le chiamate costruite ora sono 593 (451 normali più 142 imprevisti) invece di 594: il conteggio cambia col merge di
  e6ba5de5, non con le mie modifiche; **Non verificato** quale commit lo cambi.

Foto: `c47/d221/prima` (rosso C221R01) e `c47/d221/dopo`, riepiloghi di e36 ed e22 a 360×640, 375×667, 412×830 e a 360,
375 e 412 × 760.
Non verificato: telefono reale.

## D-224 (C48-02): il menu «Altro» della home aperto sta tutto nello schermo — S-11, 21/10

Base: merge di 920b6faf. FATTO MISURATO, Chrome 156, scorrimento della pagina col menu aperto (`scrollHeight − innerHeight`),
senza / con salvataggio:

| | 360×640 | 375×640 | 412×640 | 375×667 | 360×760 | 375×760 | 412×760 |
|---|---|---|---|---|---|---|---|
| prima (rosso C224A01) | 202 / 265 | 150 / 213 | 131 / 194 | 123 / 186 | 82 / 145 | 30 / 93 | 11 / 74 |
| dopo | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |

Prima, a 360×640 con salvataggio, restavano sotto la piega Sostieni, Esporta, Importa, Idee e la versione. Due misure di prima
non coincidono con quelle della principale su 99cf0e93: a 375×667 senza salvataggio misuro 123 px (lei 104) e a 412×760 con
salvataggio 74 px (lei 55). **Non verificato** il perché; le mie sono su 920b6faf, con la sonda temporanea che apre il menu dopo
`document.fonts.ready`. Le altre misure coincidono.

Correzione solo con token, rosso `C224A01` (`src/resa/stile-home.css`):
- col menu aperto, vignetta, frase-obiettivo e premessa lasciano il posto e tornano alla chiusura; restano logo, Riprendi,
  Nuova partita, «La città e il gioco» + «Altro», il menu e l'avviso di finzione;
- le voci del menu stanno tre per riga (`flex-basis` 30%, spazio laterale `--spazio-1`);
- sotto la pagina c'è il margine piccolo (`--spazio-3`), perché nella home non c'è la barra fissa.

A 360×640 con salvataggio restano circa 80 px liberi. Prova scartata: con la frase-obiettivo visibile restavano 7 px.

Guardiano: `controllaAltro` (`tools/foto-home.mjs`) ora gira a ogni altezza del giro (760 e 640, prima solo a 760), con e senza
salvataggio (senza: niente «Esporta», 4 voci). Misura lo scorrimento col menu aperto a soglia 0 (`SOGLIA_ALTRO`, fissata dalla
regola). Braccio rosso C224A01 in `homeRossaVista` (catena grafica): col rosso 12 rossi su 12 (3 larghezze × 2 altezze ×
con/senza salvataggio).

Foto: `c48/d224/prima` (rosso C224A01) e `c48/d224/dopo`, menu aperto con e senza salvataggio a 360/375/412×640, 375×667 e
360/375/412×760.
Non verificato: telefono reale; lettore di schermo col menu aperto (gli elementi nascosti hanno `display: none` e quindi
escono anche dall'albero di accessibilità finché il menu è aperto: lo dichiaro, non l'ho misurato).

## Strumento: braccio altezze/C187V01 cieco sotto carico — S-11, 22/10

Rilievo di S-23: il braccio è uscito cieco una volta in 1256 giri, con 3 catene in parallelo su 4 core.
FATTO MISURATO, Chrome 156, 4 core, braccio C187V01 a 360×760 (parte e01):

| condizione | misura vecchia (campione ogni 20 ms) | misura nuova (nella pagina) |
|---|---|---|
| 3 core occupati (`node -e "for(;;){}"` × 3), giri in sequenza | 0 ciechi su 12 | — |
| 3 core occupati + 5 bracci in contemporanea (come `PARALLELI=5`) | **2 ciechi su 15** (serie 3: 2 su 5) | **0 ciechi su 20** (4 serie da 5), 0 errori |
| senza carico, verde e rosso | — | verde: nessuna segnalazione, 0 errori; rosso C187V01: visto |

Causa: il vecchio ciclo (`tools/sonda-altezze.mjs`, campione dal processo di prova ogni 20 ms per circa 300 giri) faceva due
chiamate di andata e ritorno a ogni campione. Sotto carico i campioni si diradavano e potevano saltare i fotogrammi in cui la
scena che esce passa sotto la versione. La misura, inoltre, prevedeva «due scene insieme», che non c'erano mai. Il cambio di
scena è una sola scena spostata (`transform`): il ciclo quindi campionava solo per il tempo fisso, senza mai vedere la fine.

Rimedio: `campionaVersione` si installa nella pagina prima del tocco e campiona a ogni fotogramma (`requestAnimationFrame`) e a
ogni cambio del DOM (MutationObserver). Segna la fine quando, visto il movimento (due scene o una scena con `transform`), tutto è
fermo. La prova attende questa condizione (`waitForFunction`, limite 15 s), non un tempo, e se il cambio di scena non si vede
lo dice come errore.

Misura ritirata: un primo «0 su 20» era stato preso su una versione intermedia che contava ancora le «due scene». Quella
versione non chiudeva mai la misura e campionava fino al limite di 15 s; nella prova contavo solo `sopra` e non gli errori.
La misura valida è la seconda (0 su 20, con gli errori contati). Una prova intermedia si è fermata per un clic in timeout nella
partita e01 (`c()`, attesa di navigazione di Playwright). In quel momento il carico era più alto del previsto, perché
giravano anche le mie sonde di D-230. **Non verificato** se si ripresenti col solo carico della prova: nella prova pulita no.

## D-230 (C49-01, C49-02): titolo con salvataggio e città con 36 episodi senza scorrere a 640 e 667 — S-11, 22/10

Base: merge di 12b3d9df. FATTO MISURATO, Chrome 156, scorrimento in px, prima (rosso C230C01) → dopo:

| | 360×640 | 375×640 | 412×640 | 375×667 | 360/375/412×760 |
|---|---|---|---|---|---|
| titolo con salvataggio | 29 → 0 | 29 → 0 | 10 → 0 | 2 → 0 | 0 → 0 |
| città 36 episodi, stagione 3 | 99 → 0 | 80 → 0 | 76 → 0 | 53 → 0 | 0 → 0 |
| città 36 episodi, stagioni 1 e 2 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| città, ognuno dei 36 episodi scelto, massimo | — | — | — | — | dopo: 0 a tutti i 7 formati |

Due misure di prima differiscono da quelle della principale: titolo a 375×640 29 px (lei 10) e a 375×667 2 px (lei 0).
Le mie sono su 12b3d9df, dopo `fonts.ready`. **Non verificato** il perché.

Causa: in stagione 3 l'episodio 36 è già scelto e la sua scheda (sfida, stelle, descrizione, «Rigioca») è più alta del
messaggio «Tocca un episodio». Sotto i 700 px la città mostra la testata (la striscia di D-210 non ci sta). La mappa resta a
260 px (C17-12).

Correzione solo con token, rosso `C230C01` (`src/resa/stile-home.css`):
- città: la testata resta solo per il lettore di schermo, con lo stile solo-lettore (contiene l'`h1`). La stagione la dicono i
  tasti Stagione N, come già in D-210;
- città: pulsanti della scheda e «Rileggi l'epilogo» con spazio interno `--spazio-2`, stelle della scheda a `--testo-grande`;
- titolo: frase-obiettivo con margine sopra `--spazio-2`, pulsanti dopo la premessa con `--spazio-2`;
- in entrambe le schermate sotto la pagina c'è il margine piccolo, perché non c'è la barra fissa.

Guardiani (`tools/sonda-altezze.mjs`, parte «città36»):
- gira a ogni altezza (prima solo a 760);
- misura il titolo con salvataggio e le tre stagioni («citta36», «citta36 stagione 2», «citta36 stagione 3»), a soglia 0;
- la striscia di D-210 si controlla da 700 px in su; stelle (D-218) e guida (D-210) restano a 760.
Braccio C230C01 a 360×640 nella catena grafica (`PARTE_ROSSO`: «citta36»): col rosso 3 rossi (titolo 29 px, città 99 px).
Braccio C201C01 (C44-09, D-201): da solo ora è CIECO a 360×760, perché le regole di D-230 liberano spazio anche a 760. Diventa
la coppia `C201C01,C230C01` a 360×760: 3 px, rosso. C210C01 e C210G01 restano rossi da soli. Anche C187C01 (C43-07, home 764 su 760) da solo è diventato cieco col titolo più
stretto. La CI su f990d58a è stata rossa per questo: «foto/home … è cieco» nei job 375, 412 e 360 bracci. In `homeRossaVista`
il braccio diventa la coppia `C187C01,C230C01` (la home scorre di 4 px, rosso); gli altri due bracci della home restano soli.
Sonda completa delle altezze verde a 360×640, 360×760, 375×667, 375×760, 412×830 e 412×760.

Commento di `tools/sonda-altezze.mjs:59` corretto: 593 chiamate dopo D-209, che toglie e02 fumogeni_ospiti.

Foto: `c49/d230/prima` (build prima della correzione) e `c49/d230/dopo`: titolo con salvataggio e città con 36 episodi nelle
tre stagioni, a 360/375/412×640, 375×667 e 360/375/412×760.
Non verificato: telefono reale; lettore di schermo sulla città a 640 (la testata è nel DOM con l'`h1`, nascosta solo alla vista).

Nota sui giri di questa consegna: i giri su f990d58a li ho fermati dopo la CI rossa. Avevo fermato i processi `node` ma non
il ciclo che li lanciava, che ha fatto girare ancora governo e logica del giro 3, registrati su f990d58a in STABILITA.json
(una volta «con modifiche non committate»). Quelle righe non contano per la consegna. I 3 giri validi sono su acdfe1dc, tutti
verdi; il primo, probabilmente, in parte insieme alla logica vecchia.

## Correzione di metodo: righe di STABILITA.json scartate e ricostruite — S-11, 22/10

Su richiesta della principale («le righe dei giri non si cancellano, nemmeno per i giri interrotti»): in tre occasioni avevo
scartato con `git checkout -- STABILITA.json` le righe scritte da giri che poi non usavo.
- 6a0532d9 (D-219), 21/10: giro 1 governo, verde. Avevo fermato i giri dopo la CI rossa del solo strumento.
- c5c13719 (D-221), 21/10: catena grafica parziale (VALMORA_PASSI=token,build,email), verde, fatta per controllare il passo email.
- f990d58a (C187V01 + D-230), 22/10: giro 1 governo, giro 1 logica e giro 2 governo, tutti verdi; anche qui li avevo fermati
  dopo la CI rossa del solo strumento.

Ricostruzione (5 righe aggiunte, tutte con il campo `ricostruita` che dice da dove vengono; nessuna riga esistente toccata, 1288
→ 1293):
- le 3 righe di f990d58a: passi, esiti e secondi presi dai log conservati (g230-1-governo, g230-1-logica, g230-2-governo);
  data = fine del log meno la durata dei passi;
- 6a0532d9 governo: solo l'esito (verde), senza passi e con data approssimata, perché il log è stato sovrascritto;
- c5c13719 grafica: build ed email verdi (il passo token non era nell'uscita mostrata), data approssimata.
Non ricostruiti: i giri fermati a metà (logica del giro 2 su f990d58a, esito 143; i giri fermati su 6a0532d9 dopo il governo 1).
Lo strumento scrive la riga solo a fine giro, quindi quei giri non avevano mai scritto una riga.
D'ora in poi non scarto più STABILITA.json: le righe di ogni giro restano, anche se il giro non serve alla consegna.

## D-234 (C-050): il verbale non scorre neanche a 640, vinto o fallito, con o senza «Riparti dall'ondata N» — S-11, 26/10

Base: merge di 62b3819c. FATTO MISURATO, Chrome 156. Sonda temporanea: 167 verbali costruiti col motore, aperti da salvataggio
all'ultimo rapporto (36 episodi giocati da attenta, più le partite fallite di peggiore e casuale con semi 1-4: 131 falliti, 104
col pulsante). Scorrimento massimo in px, prima (rosso C234V01) → dopo:

| | 360×640 | 375×640 | 412×640 | 375×667 | 360/375/412×760 |
|---|---|---|---|---|---|
| falliti col pulsante | 27 → 0 | 27 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| falliti senza pulsante | 13 → 0 | 13 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| vinti | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |

A 360×640, prima: 63 verbali a 3 px (fra cui e01, e12 ed e22, come nelle misure della principale), 5 a 27 px (e18 casuale 1 e 4,
e21 casuale 1 e 3, e21 peggiore 1), 1 a 13 px senza pulsante (e18 peggiore 1).

Residuo senza pulsante (IPOTESI, ricavata dalle misure): a 640 la vignetta del verbale fallito è già nascosta, quindi niente
cede altro spazio; con i testi del verbale più lunghi (e18: 139 px) testata, testo, avviso, «Condividi», ripartenza e «Avanti»
superano l'altezza. Il caso e12 col peggiore e senza pulsante della principale viene da un salvataggio diverso dal mio (variabili
della partita A-Z, come in `foto-c41.mjs`): con le variabili della partita attenta, e12 peggiore ha il pulsante.
**Non verificato** sul salvataggio della principale.

Correzione solo con token, rosso `C234V01` (`src/resa/stile-c18.css`), solo nel verbale:
- avviso «Episodio fallito…» a `--testo-piccolo` con `--linea-stretta`, spazio interno `--spazio-1`;
- pulsanti di ripartenza con margine `--spazio-1` e spazio laterale `--spazio-1`. «Riparti dall'ondata N» sta su una riga e la
  riga scende da 64 a 58 px;
- «Condividi» con margine sotto `--spazio-1`; barra «Avanti» con margini `--spazio-2`, come sala e briefing (D-193).

Guardiano: parte «verbali» di `tools/sonda-altezze.mjs` (`VERBALI_COSTRUITI`), a ogni altezza, soglia 0. Usa 4 verbali falliti,
i peggiori del campione:
- e18 casuale 1 ed e21 peggiore 1, col pulsante, 27 px;
- e12 casuale 2, col pulsante, 3 px;
- e18 peggiore 1, senza pulsante, 13 px.
Controlla anche che il pulsante ci sia o manchi come atteso. Verde a 360/375/412×640, 375×667, 360/375/412×760 e 412×830; col
rosso C234V01 8 rossi. Braccio C234V01 a 360×640 nella catena grafica. Il verbale vinto resta misurato nella partita e01.
Bracci di C41 (`giraC41`): C41V06, C185V01 e C185V01,C66V01 da soli ora sono CIECHI, perché il verbale fallito più stretto
lascia spazio alla vignetta anche coi difetti di prima. Passano a `C41V06,C234V01`, `C185V01,C234V01` e
`C185V01,C66V01,C234V01`, tutti rossi; C41G08 resta solo, rosso. I bracci dell'epilogo (C161E01, C164F01, C165F01, C165T01,
C196V01) restano rossi da soli.

Foto: `c50/d234/prima` (rosso C234V01) e `c50/d234/dopo`, i 4 verbali del guardiano a 360/375/412×640, 375×667,
360/375/412×760 e 412×830.
Non verificato: telefono reale; il salvataggio della principale per e12 peggiore.

**Stato di D-234 alla pausa del PO (D-235, 26/10):** codice su ea883712, CI 40364905091 verde (success). Giri governo+logica su
ea883712: giro 1 governo e logica verdi, giro 2 governo verde. Ho interrotto la logica del giro 2 per la pausa: non ha scritto
righe, perché lo strumento le scrive solo a giro chiuso, e STABILITA non è stato toccato a mano. Manca il giro 3. Alla ripresa
servono la logica del giro 2 e il giro 3 sullo stesso hash, rifatti da capo.

## PO-148 (D-236): «Annulla» e «Conferma» al posto del conto alla rovescia — S-11, 26/10

Richiesta del PO: «Al posto dell'annulla azione con timer di 3 secondi, prevedi i pulsanti annulla e conferma». Base: merge di
19bebda3 (D-236), sopra D-234 chiusa (4eb7a77a).

Cosa cambia (`src/resa/schermate/Ondata.tsx`):
- dopo il tocco su una risposta la scelta resta evidenziata e sotto le opzioni compaiono «Annulla» (toglie la scelta,
  `decidi('annullata')`) e «Conferma» (applica la risposta, `decidi('confermata')`);
- niente conto alla rovescia, niente effetto prima di «Conferma». La logica (`src/logica/sospesa.ts`) non cambia: la risposta in
  sospeso non entra nello stato né nel salvataggio;
- il fuoco resta sull'opzione scelta, così un Invio involontario non decide; la pagina scorre fino ai due pulsanti;
- si ritirano `ANNULLA_SECONDI`, il timer e il rosso C198A01. Resta `secondoMs`, che serve a Scena e Tono;
- testi `risposta.decidi`, `risposta.annulla` e `risposta.conferma` in `data/testi/it/comune.json`; stile solo con token
  (`.decidi-risposta`, riga nel flusso della pagina, non fissa: fissa copriva l'opzione C a 360×640).

FATTO MISURATO, Chrome 156, chiamata di e01 ondata 1 (stato del bot attento), prima (build 7f8b430a) → dopo:

| | prima del tocco | dopo il tocco | riga dei pulsanti | pulsanti nella finestra |
|---|---|---|---|---|
| 360×640 | 563 → 563 | 646 → 638 | 83 → 75 | sì |
| 375×667 | 535 → 535 | 618 → 610 | 83 → 75 | sì |
| 412×640 | 542 → 542 | 625 → 617 | 83 → 75 | sì |
| 360/375/412×760 | 443/442/422, invariato | 526/525/505 → 518/517/497 | 83 → 75 | sì |

Lo scorrimento delle chiamate prima del tocco, cioè quello misurato dalle soglie D-114/D-207, non cambia. Dopo il tocco è 8 px
in meno di prima.

Guardiano (`tools/foto-po121.mjs`, `controllaAnnulla`, nel giro foto): a 360/375/412 × 640/667/760 e a 1366×768 controlla:
- i due pulsanti ci sono, stanno nella finestra, non sono coperti, tocco ≥ 44 px, il fuoco non ci va da solo;
- nessun effetto prima di «Conferma»; a 360×640 nemmeno dopo 3,6 s, quindi niente conto alla rovescia;
- un secondo Invio non cambia niente; «Annulla» ripristina la chiamata com'era; «Conferma» salva la risposta;
- a 360×640, chiudendo il gioco prima della conferma su un salvataggio vero (0.4.0), alla ripresa niente è salvato.
Verde. Rossi, uno per proprietà:
- C236C01, la risposta vale al tocco: 10 rossi;
- C236A01, «Annulla» conferma: 10 rossi, «dopo Annulla non è com'era»;
- C236T01 (CSS), pulsanti a 32 px: 20 rossi, «tocco 32 px»;
- C107A01, senza pulsanti, già esistente: 10 rossi.

Strumenti che aspettavano lo scadere del timer, ora toccano «Conferma»: `tools/foto.mjs` (partita del giro foto, anche il
doppio tocco di C-005 R01) e `tools/sonda-altezze.mjs` (partita e01; il braccio C187V01 vede ancora il cambio di scena,
rosso). Il bot del motore non passa dall'interfaccia. Sonda delle altezze e01 a 360×640 e 360×760: verde.
Le sonde delle collaudatrici in `coordination/sonde` (c44-annulla, c4x-giocatore, c49/c50-pilota e altre) aspettano ancora il
conto alla rovescia: non le ho toccate, perché sono strumenti dei collaudi passati e non entrano nella CI. **Non verificato** il
loro funzionamento con PO-148.

Passo foto del giro grafico a 360 (con token, build ed email) in locale: verde, compresi il guardiano e la partita con «Conferma»
(riga in STABILITA.json su 7f8b430a «con modifiche non committate»).
Foto: `po148/prima` (build 7f8b430a, «Annulla 3») e `po148/dopo`, la chiamata dopo il tocco a 360/375/412 × 640 e 760 e a
375×667, più le foto del guardiano (`po121-<w>x<h>.png`).
Non verificato: telefono reale; lettore di schermo sui due pulsanti (gruppo con etichetta «Confermi la risposta?»).
Giri di PO-148 su 9e993c7d: giro 1 governo e logica e giro 2 governo verdi. La logica del giro 2 si è fermata per un riavvio del
container: senza riga, perché lo strumento scrive solo a giro chiuso. L'ho rifatta da capo, poi il giro 3: tutto verde.
CI 40421641316 su 9e993c7d: verde.

## PO-149 (D-237): striscia più alta verso l'alto, mappa più alta, pulsanti dentro la scheda — S-11, 27/10

Foto del PO: `coordination/handoffs/po/po149-citta-telefono.jpg` (0.51.0, città in stagione 2 con e19, circa 412×915).
Base: merge di 186a4bf1. FATTO MISURATO, Chrome 156, città con e01-e18 superati ed e19 scelto (lo stato della foto):

| | striscia | spazio sopra i personaggi | mappa | spazio libero in fondo | «Avvia», margine dal riquadro interno con l'ombra |
|---|---|---|---|---|---|
| 360×915, prima → dopo | 96 → 193 | 14 → 110 | 415 → 431 | 126 → 4 | −5 → 4 per lato |
| 412×915, prima → dopo | 96 → 197 | 16 → 101 | 415 → 431 | 130 → 4 | −5 → 4 per lato |
| 360/375/412×760, prima → dopo | 96 → 193/193/197 | 14/14/16 → 110/106/101 | 260 → 276 | 126/126/130 → 4 | −5 → 4 per lato |
| 360/375/412×640 e 667 | testata (D-210), invariata | — | 260, invariata | 0 di scorrimento prima e dopo | −5 → 4 per lato |

Scorrimento 0 a 360/375/412 × 640/667/760/915 in tutti gli stati misurati: e19 da giocare, e18 superato, nessun episodio scelto,
36 episodi in stagione 3. Nel caso più pieno (36 episodi, 360×760) la striscia resta a 100 px e ci sono ancora 4 px liberi; a
360×640 con 36 episodi lo spazio libero scende da 15 a 6 px per il margine dei pulsanti.

Correzione (rossi `C237S01` per striscia e mappa, `C237P01` per i pulsanti):
- striscia (`Citta.tsx`, `vignette-home.tsx`, `vignetta.tsx`): la striscia prende lo spazio libero come la vignetta della home
  (PO-092), fra `--home-vignetta-min` (96) e `--home-vignetta-max` (210). Il disegno ha 122 unità di cielo notturno in più, con
  stelle, ed è inquadrato dal basso (y 96: si vedono i menti), così l'altezza in più va sopra le teste. Prima (y 88) i volti
  erano tagliati sotto, quindi ho spostato l'ancora;
- mappa: con la striscia (finestra ≥ 700 px) l'altezza è `clamp(--citta-altezza-min, 100dvh − --citta-riserva-striscia,
  --citta-altezza-max)`, con riserva 484 px invece di 500: +16 px. Prima ho provato 476 (+24 px), ma a 360×760 con 36 episodi
  restavano 0 px liberi, troppo vicino alla soglia;
- sotto i 700 px (640, 667) non cambia niente: c'è la testata, la mappa resta a 260;
- il margine sotto dell'ultimo elemento della scena usciva da `main` per il collasso dei margini. La striscia, che misura `main`,
  cresceva così 4-8 px di troppo e la pagina scorreva: nella città con striscia l'ultimo elemento non ha margine sotto;
- pulsanti delle schede della città, compresi Tripla e «Prossimo»: margine `--spazio-1` a sinistra, `--spazio-1` più
  `--ombra-1-scarto` a destra e in basso. `--ombra-1-scarto` è il token nuovo (5 px), su cui ora si basa `--ombra-1`.

Guardiano: `tools/foto-po149.mjs`, dalla sonda delle altezze (parte «po149», una volta per larghezza, a 640/667/760/915).
- Stati: e19, Tripla «Rigioca» su e18, stagione 2 chiusa con «Prossimo».
- Con la striscia: spazio sopra i personaggi ≥ `--spazio-5` e mappa ≥ `min(--citta-altezza-max, altezza − --citta-riserva-striscia)`.
- Ogni pulsante di scheda, ombra compresa, dentro il riquadro interno con margine ≥ `--spazio-1`.
- Scorrimento 0, tranne la Tripla aperta, che scorreva già prima (360×760: 154 px) e resta fuori da questo lavoro.
Verde a 360, 375 e 412. Rossi:
- C237S01: 4 rossi a 360, «sopra i personaggi 14 px, serve ≥ 24» e «mappa 260, serve ≥ 276»;
- C237P01: 16 rossi a 360, ombra a −5 px dal riquadro interno per «Avvia», i pulsanti della Tripla e «Prossimo».
Bracci C237S01 e C237P01 a 360×760 nella catena grafica. Gli altri bracci della città restano rossi: C201C01+C230C01,
C210C01, C210G01, C230C01 e C218S01.

Foto: `po149/prima` (build del merge prima delle modifiche) e `po149/dopo`, città con e19 a 360/375/412 × 640 e 915.
Non verificato: telefono reale. Il telefono del PO ha una finestra utile minore di 915 per le barre del browser e di sistema:
ho misurato a 915 e a 760, non alla sua altezza esatta, che non conosco.
**IPOTESI:** la Tripla aperta scorre già oggi; non l'ho cambiata.

Catene: grafica completa verde su 662f7aab (codice); governo e logica, 3 giri verdi, su 5e65afaa. Fra i due c'è solo la
correzione del tipo di PO-149 in BACKLOG, nessun cambio di codice. In STABILITA c'è anche una riga governo su 662f7aab:
l'ho lanciata a mano mentre girava la grafica, con modifiche non committate, e resta. Il giro 3 di logica è stato fermato
dal limite di tempo del terminale prima della fine; non aveva scritto la riga, l'ho rifatto da capo ed è verde.
Nessuna riga toccata o tolta.
CI: 40473109781 su 662f7aab verde su ogni job tranne governo (BACKLOG); 40476723358 su 5e65afaa verde (solo documenti).

## D-241 debito (0.53.0): App.tsx e stile.css spezzati, solo struttura — S-11, 27/10

Base: avanzamento rapido a 8d26012d. Commit d945af01. FATTO MISURATO:
- `src/resa/App.tsx` 334 → 265 righe: il ramo delle fasi dell'ondata (schieramento, chiamata, chiusura) passa a
  `src/resa/app-ondata.tsx` (104 righe) a codice invariato; lo stato resta in App e arriva come contesto (`scenaOndata`).
- `src/resa/stile.css` 400 → 201 righe: il seguito (stemmi, passi, verbale, fiducia, schieramento, vignette, versione) in
  `src/resa/stile-schermate.css` (201 righe), importato subito dopo in `avvio.tsx`: l'ordine delle regole non cambia.
  `tools/foto-stemmi.mjs` legge anche il file nuovo.
- CSS costruito (`dist/assets/index-Dh5jAxbg.css`) identico byte per byte prima e dopo (`cmp`).
- Foto: `node tools/foto.mjs` sulla build prima e dopo, 380 file ciascuna. 375 e 412: identiche byte per byte. 360: 30 diverse,
  confrontate pixel per pixel (fra 323 e 1058 px ciascuna): etichetta della versione (fissa nella vista: dipende dallo
  scorrimento al momento della foto), «−3» della fiducia che svanisce, segno ▲ sulla mappa che scade dopo 1,8 s. Controprova:
  la base rifatta a 360 contro se stessa dà 50 foto diverse su 201, dello stesso tipo. Ritagli in `debito/`.
- Controlli prima del push verdi (tipi, confini, schema, storia, test, bot).
  Ritagli prima (sinistra) e dopo (destra): `r26.png` e `r123.png` (versione), `r129.png` (fiducia), `r106.png` (segno).
Catene su d945af01: grafica completa verde; governo+logica 3 giri verdi. Il riavvio del container ha interrotto il giro 2 di
logica prima della riga (nessuna riga scritta): rifatto da capo, verde. Nessuna riga toccata o tolta.
CI 40582805152 su d945af01: verde su tutti i 10 job.

## PO-152 idea A (D-241) e C52-01/02/03 (D-242): 0.54.0 — S-11, 28/10

Base: merge della 0.53.0 (84fd51f5). Codice: 769542ad; 3641482b alza solo il limite di tempo di un test (sotto).

### Idea A, «la mappa è la fonte»
- Prima della scelta, sotto le opzioni c'è solo il testo: niente accenno di costo, «Ti costa…», icone degli effetti
  (`Ondata.tsx`, rosso C241A01: tornano come prima). L'opzione esaurita mantiene il motivo («Squadre finite»): dice perché non si
  può scegliere, non il costo.
- In chiamata i settori della mappa si toccano (`app-ondata.tsx` → `schede: true`; rosso C241M01: mappa spenta come prima): il tocco
  apre la scheda di stato (`mappa/scheda-settore.tsx`), sopra la mappa in basso: situazione (la parola del colore), unità sul posto
  (anche montate), folla solo dove la mappa la disegna (spalti delle curve, corteo delle strade), se la chiamata viene da lì. Non
  cambia il salvataggio. Si chiude con un tocco sulla scheda, col pulsante (44 px, `--tocco-min`) o con Esc; il fuoco va su «Chiudi»
  e, da tastiera, torna al settore. `role="dialog"` con nome dal titolo; i settori hanno `aria-haspopup`/`aria-expanded`.
- Dopo «Conferma» il costo arriva per radio (`RapportoCosto`), **sopra la mappa** della risposta (`mappa/radio-mappa.tsx`), nella
  fascia lontana dai segni ▲/▼ (che restano sopra), lasciando libero il lato di «Home». Scelta tecnica: sotto «Intanto…» la risposta
  si sarebbe allungata, e a 360×640 restavano 6 px prima della soglia di sonda-altezze (62 su 68); a 375×640 e 412×640 scorreva già
  77-90 px. Misurato: con il rapporto la risposta scorre quanto senza (62/77/71-90 a 640, 0 a 760).
- Testi nuovi in `comune.json` (16 chiavi `scheda.*`, `radio.costo`). Stili solo da token (`stile-idee.css`).
- D-078 rivisto: il costo resta obbligatorio nei dati (schema invariato); `foto.mjs` ora controlla che prima di «Conferma» non ci
  sia nessun costo e che dopo, nella risposta, il costo per radio ci sia e sia senza numeri. `foto-c17.mjs`: il controllo PO-085
  (icone sotto le opzioni uguali ai dati) diventa «nessuna icona prima di Conferma».
- Guardiano `tools/foto-po152-a.mjs` (sonda-altezze, parte «po152a», 360/375/412 × 640/760, due chiamate di e01): nessun costo
  prima, scheda che si apre/chiude (tocco, Esc, fuoco), bersagli ≥ 44, non esce dalla mappa, non fa scorrere, salvataggio invariato,
  rapporto radio dopo (senza numeri, con «Ti costa…» se impegna unità, dentro la mappa, non tagliato, non sotto i segni, risposta
  non più lunga). Rossi a 360: C241A01 8 problemi, C241M01 8 problemi.
- Bot: `giraBot(dati, 300)` su base e idea A: 196 righe, 0 blocchi, impronta degli esiti identica (ede5bf050f3bc2b5).
- Foto: `po152a/prima` e `po152a/dopo` (chiamata, scheda, risposta a 360/375/412 × 640/760).

### C52-01/02: la mappa della città non salta più
FATTO MISURATO (`foto-po149.mjs`, posizione verticale della mappa, identica a 760 e 915; px):

| larghezza | e19 | superato (e18) | nessuno | tutti36 | dopo, ogni stato |
|---|---|---|---|---|---|
| 360 | 275,2 | 230,1 | 292 | 182,1 | 191,1 |
| 375 | 275,2 | 249 | 292 | 201 | 202,4 |
| 412 | 275,2 | 249 | 288 | 201 | 210 |

Sopra le teste: prima fino a 17 px (360, tutti36); dopo 26/33/35 px in ogni stato. 640 e 667: identici a prima, scorrimento 0.
- La striscia sottrae allo spazio libero la differenza fra il blocco più alto possibile sotto la mappa e quello di adesso
  (`schermate/citta-riserva.ts`): varianti di tutti i 36 episodi in ogni stato, inviti di ogni stagione, «Rileggi l'epilogo» solo
  con schede superate o l'invito (combinazione possibile). Misurate in un contenitore creato e tolto nella stessa chiamata, coi
  caratteri caricati, col margine sopra fuso come nella pagina. Più alto: 270 px a 360 (e01 superato con l'epilogo), 264 a 375,
  255 a 412.
- `--citta-riserva-striscia` 484 → 500: con 498 a 360 restavano 24 px esatti sopra le teste. Effetto: la mappa sugli schermi alti
  torna come prima di PO-149 (760: 276 → 260; 915: 431 → 415).
- `react-dom/server` per misurare le varianti: JS +204 KB (2 486 292 → 2 690 328 byte).
- Rosso C242M01 (conta la scheda di adesso): a 360 la mappa si sposta di 94 px fra gli stati (2 problemi).
- Foto: `c52/prima` (f173fd2a) e `c52/dopo`.

### C52-03: il nome dell'episodio a 412
Il riquadro del nome non è mai più stretto della parola più lunga (`min-width: min-content`, rosso CSS C241N01). Guardiano
`tools/foto-c52-nomi.mjs` (testo misurato con Range, 36 episodi, 412 × 760/800/915): verde 0 su 108; rosso 6 (e12 37,5 px fuori,
e24 17,5 px fuori, e13 e e18 sul proprio disco).

### Bracci diventati ciechi e riparati (precedente: C218R01 con C221R01)
- C215L01: con le opzioni senza costo la mediana degli imprevisti a 360×760 scende da 277 a 93 px; gira con C241A01. La sonda
  non misura più una chiamata che non si apre (prima misurava la pagina sbagliata e la mediana si spostava).
- C201C01+C230C01: con la riserva 500 i 12 px del rosso finiscono nella striscia; gira con C237S01 (0 col solo C237S01, 12 px di
  scorrimento con tutti e tre).
- C128N01 (città senza WebGL, 412): con la mappa ferma il nome resta a 13 px dal bordo anche col rosso; gira con C242M01
  (C128N01+C242M01: −0,5 px, 3 stati sul bordo; C242M01 da solo: 21,2 px, 0).

### Strumenti e codice resi stabili
- C52-01: la riserva si misura senza la trasformazione d'ingresso della scena (tolta e rimessa nella stessa chiamata) e si tiene
  solo coi caratteri delle varianti pronti (`document.fonts.check`, altrimenti si caricano e la striscia si ricalcola a
  «loadingdone»). Prima, in alcuni giri, la mappa saltava di 3-18 px (375×915 «nessuno» 220 contro 202,4). Dopo: 4 giri di
  `foto-po149` a 360/375/412, 0 problemi.
- `foto-schieramenti.mjs`: attesa della barra 5 → 15 s (sotto carico «lo schieramento non si apre», verde al secondo tentativo).
- `tests/fiducia-verso.test.ts`: limite di tempo 180 → 400 s (204 s sotto carico, verde al secondo tentativo); soglia invariata.

### STABILITA (nessuna riga tolta)
- grafica rossa su 3962c539 (PO-085, corretto in e9a40bf5); grafica su e9a40bf5 interrotta a mano (riga rossa); 3 giri
  governo+logica verdi su e9a40bf5; governo verde su f9d00865 (poi giri fermati); 3 giri verdi su ec666e64; grafica su ec666e64
  interrotta dal limite di tempo del terminale (riga rossa); su c068b887 grafica rossa (C128N01 cieco; schieramenti e altezze
  instabili) e governo, logica, governo verdi (poi fermati); su 769542ad grafica completa verde e 3 giri governo+logica (il primo
  «instabile» per il test qui sopra); su 3641482b 3 giri governo+logica (sotto).
- Su 3641482b: 3 giri governo+logica verdi. Grafica completa verde su 769542ad (3641482b cambia solo il limite di tempo di un
  test, che la grafica non usa). CI: 40658834711 su 769542ad e 40673481555 su 3641482b, verdi su tutti i 10 job.
- Il primo push di 769542ad è stato rifiutato dal pre-push (passo non registrato: avevo tenuto solo l'ultima riga); il secondo
  aveva tutti i passi verdi.

Non verificato: telefono reale (tocco sulla mappa in chiamata, TalkBack sulla scheda del settore); tastiera fisica oltre Esc;
la Tripla aperta scorreva già prima (O-1 di C-052); C52-04/05 (testo al 130 %) restano al lotto accessibilità.

## D-243 (C52-01/02 rifatta): scheda della città ad altezza fissa — 0.58.0 — S-11, 28-30/10

La sezione C52-01/02 qui sopra (riserva del blocco più alto, `--citta-riserva-striscia` 500, react-dom/server) è **superata**
da D-243 (PO, «Mappa ferma e scheda compatta»). Base: merge di main fino alla 0.57.0 (c80bac30, Vandel Falls).

- Con la striscia (finestra ≥ 700 px) la scheda dell'episodio e l'invito hanno la stessa altezza in ogni stato:
  `--citta-scheda-altezza` 177 px (quella di «Da giocare», 181, meno 4 px tolti sopra i pulsanti). Titolo, descrizione, nomi
  della sfida e testo dei pulsanti su una riga con l'ellissi; il testo intero resta nella pagina (lo legge il lettore di schermo).
  Stelle nella riga in alto accanto ai tentativi; «Rileggi l'epilogo» accanto al pulsante principale, dentro la scheda; «Prossimo»
  dell'invito su una riga. Con la Tripla aperta la scheda torna all'altezza del contenuto (scorreva già prima, O-1 di C-052).
- La striscia prende lo spazio libero come in PO-149: con il blocco sotto la mappa sempre uguale, la mappa non si sposta.
- Tolti `schermate/citta-riserva.ts` e `react-dom/server`; `vignetta.tsx` torna com'era; `--citta-riserva-striscia` di nuovo 484.
- Bundle JS: 2 842 454 byte contro 2 837 544 di main abd5f489 (+4 910: idea A e C52); senza `react-dom/server` (0 riferimenti).
- Rosso C242M01 (CSS e JS): la scheda cresce col contenuto e l'epilogo sta sotto, come prima.

FATTO MISURATO (`foto-po149.mjs`, a ogni larghezza la posizione della mappa è identica nei 6 stati e19, superato e18, nessuno,
prossimo, tutti36, tutti36 con e35 scelto):

| larghezza | mappa (y) 760 e 915 | striscia | sopra le teste | mappa alta |
|---|---|---|---|---|
| 360 | 279 | 197 | 114 | 276 a 760, 431 a 915 |
| 375 | 279 | 197 | 110 | 276 a 760, 431 a 915 |
| 412 | 279 | 201 | 104 | 276 a 760, 431 a 915 |

Prima (0.52.0, main abd5f489), a 360: mappa 275 / 230 / 292 / 210 / 182 / 214 negli stessi stati; sopra le teste da 17 a 127.
640 e 667: identici a prima, scorrimento 0 (confronto riga per riga col giro della base).

Guardiano `foto-po149.mjs` (D-243): mappa ferma fra gli stati (≤ 1 px); sopra le teste ≥ 100 a 915 (e ≥ `--spazio-5`
ovunque); mappa ≥ 431 a 915 e ≥ 276 a 760; nessun testo della scheda tagliato senza ellissi e niente tagliato in basso.
Rossi a 360: C242M01 7 problemi; C237S01 24; C237P01 18.

Bracci: C201C01+C230C01 ora gira con C242M01 (con la scheda compatta i 12 px del rosso ci stanno; da solo 0, insieme 12 px);
C128N01 torna com'era (da solo rosso: «Il mercato del sabato» a 3,2 px dal bordo, 2 stati).

Foto: `d243/prima` (main abd5f489) e `d243/dopo`, 360/375/412 × 640/760/915, stati e19, superato, nessuno, prossimo, tutti36.

Strumenti: `foto-po152-a.mjs` e `foto-c52-nomi.mjs` usano la chiave nuova `varcalda-salvataggio` (con la vecchia il controllo
«salvataggio invariato» di foto-po152-a sarebbe stato cieco: leggeva una chiave vuota prima e dopo).

### Consegna 0.58.0 (979d1530)
- Strumento instabile riparato: bracci epilogo e c41, clic su «avanti» e attesa della scena fino a 60 s (fermi 30 s sotto
  carico ~20 su 4 core); nessuna soglia cambiata. Limite di tempo di partita-d241: la riga di D-251 (400 s).
- Chiave di salvataggio nei guardiani nuovi: `vandelfalls-salvataggio`. Nomi: tests/nome-d244.test.ts 12/12.
- Su 979d1530: grafica completa verde; 3 giri governo+logica verdi; CI 40955861303 verde su tutti i 10 job.

## PO-152 idea B (D-241): una mossa per chiamata — S-11, 30/10

Base: main 0.58.0 (72fafced). Scelte tecniche (dichiarate):
- Logica in un modulo nuovo, `src/logica/mossa.ts` (missione.ts era a 320 righe, ora 328): `turnoMossa`, `mossaPossibile`,
  `spostabili`, `sposta`. La mossa si fa fra una chiamata e l'altra: dopo almeno una risposta dell'ondata e solo se resta una
  chiamata aperta (non dopo l'ultima, prima della chiusura). Si spostano unità dello schieramento dell'ondata non fisse (le
  transenne no, D-082; quelle a riposo non sono schierate), verso un settore ammesso per quella risorsa (`settoriAmmessi`).
- Una per chiamata: la mossa si segna in `in_corso.mosse` come «ondata:chiamata» dell'ultima risposta. SAVE_VERSION 4 con la
  migrazione 3 → 4 (`mosse` vuoto anche in sconfitta e partenze) e controllo del campo (`src/salvataggi/salvataggio.ts`).
  Salvataggio vero nuovo: `tests/salvataggi-reali/v3-0.57.0-e01-ondata2-in-corso.json` (build 0.57.0, `tools/salva-reale-057.mjs`).
- La mossa entra nella disposizione: conta per «senza» delle chiamate dopo e per la chiusura dell'ondata.
- Interfaccia: nella risposta (dopo «Conferma», prima della chiamata dopo) la mappa si tocca: tocco sull'unità (badge), poi
  sul settore; con la tastiera Invio sui due pulsanti; Esc lascia l'unità; «Avanti» senza mossa resta il default. Il
  trascinamento NON l'ho fatto: tocco-tocco basta anche per tastiera e lettore di schermo. L'indicazione («Puoi spostare una
  squadra…», «Ora tocca il settore…», «Mossa fatta.») sta nel riquadro radio sopra la mappa (la pagina non si allunga): il
  riquadro copre la fascia alta o bassa della mappa (vedi le foto). Etichette: «sposta squadre da …», «porta qui: …»,
  `aria-pressed` sull'unità in mano. Testi nuovi in comune.json (`mossa.*`), stili solo da token (`stile-idee.css`).
- Bot: `Giocatore.muovi` facoltativo, usato da `giocaMissione`; la strategia attenta muove solo se la prossima chiamata riguarda
  un settore scoperto (nessuna unità, fisse comprese) e una mossa che porta lì un'unità abbassa la tensione stimata.

FATTO MISURATO:
- `tests/mossa-d241.test.ts` (7 prove): migrazione v3 → v4 del salvataggio vero della 0.57.0; la mossa cambia disposizione e
  `mosse`; la seconda nella stessa pausa è rifiutata (rosso C241B01: passa); salvata e ripresa la mossa usata resta usata; non
  prima della prima risposta né dopo l'ultima chiamata; le transenne non si spostano; il bot attento muove e finisce i 36 episodi.
- Bot su 300 semi (`giraBot`), prima e dopo: casuale 3 473 su 10 800 vinte (32,2 %), attenta 10 800 (100 %, 3★ 2 700),
  equilibrata 10 800 (100 %, 3★ 7 200), peggiore 0; 0 blocchi; identico prima e dopo in tutte le 56 righe (partenze comprese).
  Il bot attento muove davvero: 69 mosse su 4 179 occasioni in 360 partite (36 episodi × 10 semi), senza cambiare gli esiti.
- `tools/foto-po152-b.mjs` (sonda-altezze, parte «po152b», 360/375/412 × 640/667/760): verde; la risposta scorre quanto
  senza il riquadro (62/35/0 a 360, 77/50/0 a 375, 71/44/0 a 412 per 640/667/760). Rossi a 360: C241B01 6 problemi (seconda
  mossa possibile, niente «Mossa fatta»), C241M02 12 (niente indicazione, nessuna unità toccabile).
- `foto-po152-a.mjs` resta verde a 360/375/412 col riquadro più alto.
- Foto: `po152b/prima` (72fafced) e `po152b/dopo` (risposta, unità in mano, mossa fatta) a 360/375/412 × 640/760.

Non verificato: telefono reale (tocco sui badge vicini, TalkBack), trascinamento (non fatto).
- Su c2b3a38e: grafica completa verde (bracci C241B01 e C241M02 compresi); 3 giri governo+logica verdi; CI 40984991278 verde.
