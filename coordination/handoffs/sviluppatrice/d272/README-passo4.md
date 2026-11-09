# D-272 passo 4 · segno «−1 / +1» dopo la mossa, e i punti da riprendere dopo la 0.69.0

Ramo `claude/valmora-segno-mossa`, da main 5bdf0515 (0.69.0).

## 1. Guardiano schieramenti: niente controlli saltati in silenzio (ce8dfea2)

`tools/foto-schieramenti.mjs`, giri «con le unità» e «coi tocchi»: uno schieramento che non si apriva in 5 s finiva in un
`return` / `continue` senza messaggio. Il verificatore ha visto 139 controlli contro 142 a 360×760.

Ora:
- l'attesa è di 15 s, come nel giro a mappa vuota;
- il mancante è rosso, con il messaggio «controllo mancante»;
- il giro dichiara «N schieramenti aperti su 142».

**FATTO MISURATO** (`tools/zz-schier.mjs`, temporaneo, build fissa, a macchina libera):

| Braccio | Risultato |
|---|---|
| Verde | 142 su 142 a 360×760, 375×812, 412×915; 1930 controlli, 0 falliti |
| Rosso locale (copia dello strumento con e05 a 1 ms d'attesa) | 4 mancanti dichiarati per larghezza, più 1 coi tocchi: 16 problemi |

Il 139 su 142 non l'ho riprodotto: con questo codice, a macchina libera, gli schieramenti aperti sono 142. Quale schieramento
mancasse nella verifica non posso confermarlo.

## 2. Segno «−1 / +1» (073e3ba6, 45198a58, 484c1ade, a66978a8)

Per 2 s veri dopo la mossa (come i segni ▲/▼ della risposta, 1,8 s), «−1» sta sul disco del settore lasciato e «+1» su quello
d'arrivo. Colori ciano e magenta, bordo nero.

- **Dove sta**: al centro del proprio disco, sotto i nomi (z-index 1, i nomi 2) e sotto il riquadro radio (3).
- **Tocchi**: pointer-events none.
- **Riduzione del movimento**: nessuna animazione.
- **Disposizione**: è fuori dalla firma della disposizione e dagli ostacoli dei nomi (né `segni-effetto` né `data-segno`), quindi
  comparendo e sparendo non ridispone niente.
- **Lettore di schermo**: `role="status"`, con «Quartiere: un'unità in meno» e «Piazzale: un'unità in più».

File: `src/resa/mossa-ui.tsx`, `src/resa/mappa/Mappa.tsx`, `src/resa/stile-idee.css`, `src/resa/App.tsx` (ROSSI_CSS) e
`data/testi/it/comune.json`.

Rossi:
- C272D01: nessun segno;
- C272D02: segno a fianco del disco e sopra tutto, come la prima prova.

**Prove scartate** (FATTO, provini e guardiano):

| Prova | Cosa non andava |
|---|---|
| A fianco del disco, con l'icona | A 360 copriva «Curva ospiti» e una pastiglia di Piazzale |
| Al centro, sopra | Copriva il nome di Piazzale, che sta sul disco di Parcheggi (160 px²) |
| Nomi e gruppi delle unità a z-index 2 | I gruppi, che prendono i tocchi, finivano sopra i dischi vicini: C56-03 «curva_ospiti sotto settore-unita» in e03 a 360. Catena 360 rossa 3 volte su 3 su 484c1ade, CI 1365 rossa |

Ora sopra il segno stanno solo i nomi, che non prendono tocchi.

**Guardiano**: giro «segno» di po152b (`tools/segno-po152b.mjs`), e03 auto_in_sosta, ogni unità spostabile verso il primo settore
ammesso (6 mosse). Controlla:
- un solo «−1» e un solo «+1» nei settori giusti;
- contrasto di testo e bordo con il fondo ≥ 3:1;
- nessun centro di disco o pastiglia preso;
- nessuno scorrimento in più;
- non copre nomi, pastiglie, «Home» o dischi altrui (conta solo dove il segno è disegnato sopra: per la prova le due parti
  diventano toccabili un attimo, perché elementFromPoint salta gli elementi con pointer-events none);
- niente animazione;
- sparito dopo 2,5 s.

| | 360 / 375 / 412 |
|---|---|
| Verde | 6 su 6 col segno giusto, contrasto minimo 3,97:1, 0 tocchi presi, 0 sovrapposizioni, 0 rimasti |
| C272D01 | 6 problemi su 6 |
| C272D02 | 6 mosse su 6 coprono (16 sovrapposizioni a 360) |

Bracci a 360×760: C272D01 almeno 6, C272D02 almeno 6 («il segno copre»).

Provini: `provini-passo4-{360x640,375x667,412x915}.png` (script `provini-passo4.mjs`). Colonne: PRIMA 0,3 s, DOPO 0,3 s,
DOPO 2,5 s.

## 3. Punti della verifica sul passo 2

### Punto 1: salti nella partenza fuori da e03

Il guardiano «salti» guarda solo e03. Misura su tutti gli episodi, con la prima chiamata con mossa di ognuno, tutte le mosse
(`tools/zz-salti-tutti.mjs`, temporaneo, che usa `controllaSalti`). Per ogni build:
- «episodi con salto» = episodi con almeno un salto > 0 px;
- «oltre 44» = somma degli elementi sopra soglia.

| Build | 360×640 | 375×667 | 412×760 |
|---|---|---|---|
| prima del passo 2 (553c26fa): episodi con salto / oltre 44 / max | 33 / 252 / 176 | 33 / 264 / 176 | 27 / 99 / 132 |
| 0.69.0 (con il codice del segno, a66978a8) | 23 / 95 / 176 | 17 / 47 / 176 | 12 / 33 / 120 |

Peggiori con la 0.69.0:
- a 360: e26 pullman_sparsi 176, e34 mercato_spostato 176, e14 doppioni 139, e33 ordini_segnati 139;
- a 375: e26 176, e21 corteo_dal_cortile 132;
- a 412: e35 perimetro 120, e05 sindacato 93.

e16 magazzino_sette a 375 ha massimo 23 px, come ha visto il verificatore.

**IPOTESI**: non ho ancora cercato la causa dei salti residui. Non posso confermare che sia la stessa del gruppo che si
sposta tutto insieme.

Il passo 2 riduce i salti ma non li toglie. Un guardiano su tutti gli episodi oggi sarebbe rosso: decide il principale.

### Punto 3: posto vuoto sopra parte del riquadro dei dischi vicini

Il segnaposto è `visibility: hidden` e `pointer-events: none`. Il guardiano dei tocchi (C56-03, centro dei dischi toccabile)
è verde nella catena grafica a 360 su a66978a8 e nella CI 1366. Non cambio niente: l'effetto è solo sull'ingombro usato dalla
disposizione.

## 4. Dopo la verifica a mente fresca su a66978a8 (8/11)

### Segno spostato dove non copre (cbcdeb24, 9f76c47e, 383bd995)

La verifica ha trovato due casi fuori da e03, a 360×640, 6 mosse su 6:
- e02: il «+1» stava sopra il disco di curva_ospiti, 223-243 px²;
- e04: il «−1» stava sopra la pastiglia squadre@mercato, 48-50 px².

Inoltre l'ombra sporgeva oltre il riquadro misurato. Mettere il segno sotto anche a pastiglie e dischi non si può: i dischi
(`.settore-punto::after`) e i gruppi stanno nell'ordine del DOM, e il proprio disco lo coprirebbe. In più, i gruppi a z-index 2
rompevano C56-03 (CI 1365).

Soluzione: `src/resa/mappa/segno-mossa.ts`, chiamato dopo ogni disposizione.
- Il segno prova il centro del proprio disco, poi 64 posti: 16 direzioni a 0,75, 1,1, 1,5 e 2 dischi.
- Prende il primo che non copre nomi, pastiglie, «Home», dischi altrui o l'altro segno, con 1 px di margine. Non esce mai
  dalla mappa.
- Tocca solo lo stile del segno: nessuna ridisposizione, deterministico.
- Niente ombra.
- Rosso C272D03: segno fermo al centro.

Prove intermedie (FATTO):

| Prova | Esito a 360 |
|---|---|
| 9 posti a 0,75 dischi | e02 scende a circa 20 px², restano 28 sovrapposizioni |
| 48 posti | e05 esce dalla mappa: la pagina scorre di 16 px |
| Fuori mappa vietato | e13: nessun posto libero fino a 1,5 dischi, 3 px² su una pastiglia |
| Anello a 2 dischi | 0 sovrapposizioni |

### Contrasto del segno

Verso il proprio fondo il contrasto è 4,76-9,21:1: il guardiano chiede ≥ 3:1 e il minimo misurato è 3,97:1, sul bordo nero
contro il fondo. Verso la mappa resta sotto 3:1. Il principale lo accetta (8/11): il segno è un indicatore di 2 s, non un comando.

### Guardiano «segno»

Ogni mossa della prima chiamata con la mossa, per episodio. Lo scorrimento si confronta con la stessa pagina senza segno: a 360
e05 la mossa da sola allunga la pagina di 16 px, anche col rosso C272D01.

| Dove | Episodi |
|---|---|
| Verde in CI, 360 | e02, e04 |
| Verde in CI, 375 e 412 | e03 |
| Catena «completa» e consegna locale | e02, e03, e04, e05, e13 (e05 ed e13 hanno i dischi più vicini dopo e02 nei dati) |
| Bracci | C272D01 e C272D02 su e03 (24 e 24, almeno 20); C272D03 su e02 ed e04 (28, almeno 22) |

FATTO, sulla build finale: e02, e03, e04, e05 ed e13 a 360, 375 e 412, 108 mosse su 108 col segno giusto. 0 sovrapposizioni,
0 tocchi presi, 0 segni rimasti.

### Guardiano «salti» esteso (decisioni del principale 8/11)

| Dove | Episodi e tetto |
|---|---|
| Verde in CI, 360 | e03 stretto, più e05 ed e26 con tetto per episodio (oltre 44 px / massimo: e05 4 / 79, e26 6 / 176) e sul totale |
| Verde in CI, 375 e 412 | solo e03 |
| Catena «completa» e consegna locale | tutti i 36, tetto 95 / 47 / 33 oltre 44 px, massimo 176 / 176 / 120 |
| Bracci | C272V01 e C272W01 su e03; C272V01,C272W01 su e05 ed e26 (2 problemi a 360, almeno 2) |

FATTO, verde con tutti i 36 a 360: 95 su 95 di tetto, massimo 176. Rosso C272V01,C272W01: 252, cioè 553c26fa.

Una mossa non riuscita (pagina chiusa) ora è un problema dichiarato e non ferma più il giro: prima il rosso finiva in eccezione.

### Tempi

| Misura | Tempo |
|---|---|
| Giro su tutti i 36 a 360, 1 pagina | 6117 s |
| Giro su tutti i 36 a 360, 4 pagine | 2556 s |
| CI 1373, 375 / 412 | +22 / +17 min su 1366 |
| CI 1374, 412 | 48,1 min contro 49,6 |
| CI 1374, 360 bracci | 22,4 min contro 28,0 |
| CI 1374, 360 schieramenti | 45,9 min contro 63,6 |
| CI 1374, 375 | 100,8 min, due tentativi (vedi sotto) |
| CI 1374, 375, un tentativo | altezze 2741 s contro 2062 di 1366; foto +38% e schieramenti +20% senza cambi: la macchina era più lenta |

Su 1373 i 6 episodi giravano anche a 375 e 412. Dentro il job 375 di 1374, i giri salti e segno aggiungono circa 76 s.

In locale a 360 la catena grafica intera supera il limite di 2 h del terminale. È girata in giri separati, tutti verdi su
9c35a3b8: token…caratteri e altezze, poi bracci. Altezze 2892 s (era 2570), bracci 1591 s (era 1244).

### Strumento instabile: anelli (216468c5)

CI 1374, 375×667, e21 corteo_dal_cortile «puoi spostare»: due unità «senza anello pieno», contrasto 0,00. Al tentativo 2 era
verde. Non l'ho riprodotto in 9 giri locali, 3 processi insieme.

IPOTESI: le posizioni si leggevano prima della foto, e la pagina si muoveva in mezzo. Lo strumento ora legge le posizioni, fa
la foto e rilegge, finché le due letture coincidono (al più 5 volte). Il giro radio conta le «foto riprese a pagina non ferma»:
0 nel giro locale a 375.

Senza riproduzione non posso confermare che la causa sia questa.

### Causa comune degli «anello 0,00» e rosso deterministico (c86fb95a)

I due casi, e28 voce_magazzino a 360 (7/11) ed e21 corteo_dal_cortile a 375 (CI 1374), hanno la stessa causa. Nello stato
«puoi» i segni ▲/▼ della risposta durano 1,8 s veri; quando spariscono la disposizione cambia, perché i segni stanno nella firma
e fanno da ostacolo ai nomi. Lo strumento leggeva le posizioni prima della foto.

Sonda `tools/zz-anello.mjs` (temporanea), con le pastiglie misurate coi segni e 500 ms dopo che sono spariti:

| Caso | Pastiglie che si spostano |
|---|---|
| e21 a 375 | squadre e steward@piazza_fonderie, 132 px |
| e28 a 360 | steward e mediatore@curva_cinderwick, 11 px |

Sono le stesse unità «senza anello pieno» dei due casi.

I nomi a z-index 2 sono esclusi: il caso e28 è comparso su 4b285c28 e 8329ef4b, dove quella regola non c'era.

Rosso C272A01 (strumento): posizioni coi segni, foto dopo che spariscono, senza rilettura. Riproduce testualmente i due messaggi,
3 volte su 3 ciascuno; senza rosso dà 0. Il braccio è su e28 a 360×760, almeno 1.

In CI 1377 il giro radio a 375 ha ripreso la foto 3 volte, su 277 stati, «a pagina non ferma».

Il salto delle pastiglie a 1,8 s dalla risposta è un difetto del gioco, non riparato qui. Va nel lotto «salti residui» dopo la
0.70.0: prima la misura su 0.67.0 (d4663239), 0.68.0 (553c26fa) e 0.69.0 (5bdf0515); se su 0.67.0 non c'era, è una regressione del
memo (D-272 passo 3) e ha la precedenza.

### Tempi CI dopo la restrizione: due run

Durata del passo `catena grafica` in minuti.

| Job | 1366 (a66978a8) | 1375 (216468c5) | 1377 (c86fb95a) | Media 1375-1377 | Differenza |
|---|---|---|---|---|---|
| 375 | 41,4 | 33,7 | 54,4 | 44,0 | +2,6 |
| 412 | 49,6 | 56,7 | 50,0 | 53,4 | +3,8 |
| 360 bracci | 28,0 | 25,4 | 19,4 | 22,4 | −5,6 |
| 360 schieramenti | 63,6 | 67,1 | 68,3 | 67,7 | +4,1 |

Tutte le run sono 10/10 verdi, senza tentativi ripetuti.

Dentro i job, dai log, il giro segno su e03 (24 mosse) costa circa 81-87 s contro 21 s della 1366 (6 mosse); il giro salti è
invariato a 375 e 412. La dispersione fra due run sullo stesso codice arriva a 20 min (375: 33,7 contro 54,4): il giro radio, non
toccato, va da 31 a 40 min.
