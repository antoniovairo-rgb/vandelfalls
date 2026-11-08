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
