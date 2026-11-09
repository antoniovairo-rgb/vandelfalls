# D-272 · salti residui · salto alla sparizione dei segni ▲/▼ (consegna per 0.71.0)

Ramo `claude/valmora-salti-residui`, da main `0614b247` (0.70.0). S-11. `src/versione.ts` non toccato (istruzione del principale 9/11).

## Difetto (FATTO MISURATO)

Nello stato «puoi spostare» i segni ▲/▼ della risposta spariscono dopo 1,8 s veri. Da 0.69.0 il ricalcolo che segue spostava
pastiglie che il giocatore non aveva toccato.

Strumento `tools/zz-anello.mjs` (temporaneo, escluso da git), una prova per build salvo dove detto:

| Build | e21 corteo_dal_cortile a 375×667 | e28 voce_magazzino a 360×640 |
|---|---|---|
| 0.67.0 `d4663239` | 0 pastiglie mosse | 0 |
| 0.68.0 `553c26fa` | 0 | 0 |
| 0.69.0 `5bdf0515` | squadre e steward@piazza_fonderie 132 px | 3 pastiglie |
| 0.70.0 `0614b247` | come 0.69.0 | come 0.69.0 |
| 0.69.0 con rosso C272W01 (niente costo di spostamento) | 0 (2 prove) | — |
| 0.69.0 con rosso C272V01 | stesso salto | — |

Causa: il costo di spostamento di D-272 passo 2 (`etichette.ts`) partiva dal «prima» = disposizione fatta coi segni presenti;
quando i segni spariscono la firma cambia (i segni sono ostacoli dei nomi), ma le unità no, e il nuovo calcolo trovava un'altra
disposizione «vicina» a quella coi segni invece di restare dov'era.

## Correzione

`src/resa/mappa/congela.ts` (`primaDi`, `tieni`), `src/resa/mappa/Mappa.tsx:12`: il «prima» diventa la disposizione corrente
solo quando cambia la distribuzione delle unità (la mossa); altrimenti si riusa lo stesso riferimento della disposizione
precedente (`rif`, un livello, senza catene). Rosso **C272W03**: il «prima» è sempre la disposizione corrente, come su 0.70.0.

## Guardiano permanente: giro «sparizione» di po152b

`tools/sparizione-po152b.mjs`, nel giro predefinito di `tools/foto-po152-b.mjs`. In ogni episodio, la prima chiamata con la mossa
fra le prime 4; posizioni delle pastiglie coi segni presenti e 500 ms dopo che sono spariti: 0 pastiglie mosse.
Braccio `C272W03` in `tools/bracci-po152b.mjs` (e28 a 360, almeno 3) e in `tools/passi-grafica.mjs`.

Misure (`tools/zz-spar4.mjs` = giro da solo, build del commit `2305e014`):

| | 360×640 | 375×667 | 412×760 |
|---|---|---|---|
| verde, 36 episodi, tutti coi segni | 206 pastiglie, 0 mosse | 206, 0 | 206, 0 |
| rosso C272W03 | 11 mosse, max 93 px (e03, e06, e28, e29) | — | — |
| durata a 4 pagine (come nel verde) | 53 s | 53 s | 53 s |
| durata a 1 pagina | 158 s | 157 s | 150 s |

Il rosso mostra che il difetto c'era anche oltre i due casi trovati: e03 steward@piazzale 22 px; e06 più pastiglie fino a
93 px; e28 16/16/79 px; e29 squadre@curva_ospiti 22 px.

## I salti dopo la mossa restano dentro i tetti (FATTO MISURATO)

`tools/zz-salti4.mjs` con `VALMORA_SALTI_TUTTI=1`, tutti i 36 episodi, 4 pagine, build `2305e014`, una prova per larghezza:

| | oltre 44 px | tetto | massimo | tetto | e03 stretto |
|---|---|---|---|---|---|
| 360×640 | 57 | 95 | 176 px | 176 | 24 mosse, max 39 px |
| 375×667 | 35 | 47 | 132 px | 176 | max 0 px |
| 412×760 | 28 | 33 | 110 px | 120 | max 0 px |

Tetti invariati.

## Strumento instabile trovato (dichiarato)

412 tutti i 36: un problema «e17 sanzione squadre@strada_cinderwick: mossa 3 non riuscita: page.click timeout 30 s»
(1 su 1 giro intero). Ripetuto da solo su e17: 0 su 3 (42-43 s ciascuno). È quindi instabile, non un difetto del gioco
(IPOTESI: un tocco forzato su un elemento che in quel momento manca, sotto carico). Primo passo di riparazione in questo ramo:
il messaggio dice quale passo è scaduto (apertura, tocco unità, tocco settore), commit `6eda45da`. La riparazione vera va fatta
quando il messaggio dice dove: alla seconda comparsa, sonda.

## Limiti e ipotesi

- Una prova per larghezza nelle misure di tutti i 36 (giri da 41-44 min); i casi e21/e28 su 0.67-0.70 con una prova, salvo dove detto.
- IPOTESI: la durata in CI del giro «sparizione» è dentro +5 min per job (53 s locali); la conferma è nei tempi delle run.
- Il «prima» a un livello (`rif`) basta per i cambi di firma senza mossa visti qui (sparizione dei segni); altri cambi di firma
  senza mossa (misure della pagina) non sono stati provati uno per uno. Non posso confermarlo oltre i 36 episodi a 3 larghezze.
