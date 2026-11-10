# D-272 · salti residui · salto alla sparizione dei segni ▲/▼ — esito: strada B (nessuna correzione nel codice di gioco)

Ramo `claude/valmora-salti-residui`, da main `0614b247` (0.70.0). S-11. `src/versione.ts` non toccato (istruzione del principale 9/11).

**Esito.** Nessuna delle tre correzioni provate rispetta insieme il guardiano «sparizione» e i tetti dei salti dopo la mossa.
Per decisione del principale (10/11, regola «A entro 4 ore, se no B»), il codice di gioco resta quello di 0.70.0: `congela.ts`,
`Mappa.tsx`, bracci e giri di po152b tornano come su `0614b247`. Rispetto a main resta solo il messaggio del giro «salti» che
dice quale passo è scaduto (`6eda45da`), più questo README. Il salto alla sparizione passa al lotto successivo; tutto il lavoro
è recuperabile dalla storia del ramo (commit sotto).

## Difetto (FATTO MISURATO)

Nello stato «puoi spostare» i segni ▲/▼ della risposta spariscono dopo 1,8 s veri. Da 0.69.0 il ricalcolo che segue sposta
pastiglie che il giocatore non ha toccato. Strumento `tools/zz-anello.mjs` (temporaneo), una prova per build salvo dove detto:

| Build | e21 corteo_dal_cortile a 375×667 | e28 voce_magazzino a 360×640 |
|---|---|---|
| 0.67.0 `d4663239` | 0 pastiglie mosse | 0 |
| 0.68.0 `553c26fa` | 0 | 0 |
| 0.69.0 `5bdf0515` | squadre e steward@piazza_fonderie 132 px | 3 pastiglie |
| 0.70.0 `0614b247` | come 0.69.0 | come 0.69.0 |
| 0.69.0 con rosso C272W01 (niente costo di spostamento) | 0 (2 prove) | — |

Il difetto resta su 0.70.0 e quindi sulla 0.71.0.

## Le tre correzioni provate

### 1. `2305e014` — «prima» a un livello: RITIRATA

Il «prima» del costo di spostamento diventava la disposizione corrente solo quando cambiavano le unità. Sparizione a 0 pastiglie,
ma **dopo la mossa** la CI 1386 ha preso e03 a 360: 39 px (tetto per episodio 6) ed e05 93 px (tetto 79), 2 su 2.

**Causa del ritiro (errore di metodo, mio):** prima del push avevo controllato i salti solo con `VALMORA_SALTI_TUTTI=1`.
In quel modo `tools/salti-po152b.mjs` spegne i tetti per episodio (`const te = !tuttiEp && TETTO_EPISODIO…`) e controlla solo
il totale (57/35/28 contro tetti 95/47/33). Il verde della CI usa invece proprio i tetti per episodio, e su e03/e05 era rosso.
Da allora i salti si misurano in tutti e due i modi.

### 2. `15feaa54` — `tieniAllaSparizione`: RITIRATA

Se nella firma cambiavano solo i segni e sparivano, si rimettevano i posti di prima (rosso C272W03).

- Sparizione: 0 pastiglie mosse su 36 episodi a 360, 375 (3 volte) e 412. Rosso C272W03: 11 mosse a 360, 13 a 375.
- CI set (e03, e05, e26 a 360): 0 problemi, e03 6 px. CI 1388: 9/10 (braccio N01 cieco, riparato in `685988f1`, CI 1390 verde).
- **Tutti i 36 episodi:** 103 a 360 (tetto 95), 65 a 375 (tetto 47). Rosso.
- Per episodio a 375 (`zz-salti-tutti2`), contro il rosso C272W03: e06 palco 10 contro 2, e21 7 contro 1, e23 4 contro 2.
- Linea del tempo e06 375, mediatore@piazza_concerto (`zz-linea.mjs`): 149,157 tenuto → 127,157 al tocco («dove») → 105,179
  dopo la mossa = 49 px dal punto di partenza. Ogni ricalcolo conta lo spostamento dall'ultima disposizione, non da quella di
  partenza, e lo spostamento si accumula.

### 3. `f4a8bf56` — àncora: RITIRATA

Nella mossa («dove», «fatta») il costo si contava dalla disposizione di «puoi» (rosso C272W04). CI 1391 verde 10/10, compreso il
job schieramenti, quindi C33-04 non si rompe.

- e06 375: 8 salti → 0; e34 375: 6 → 0. Set CI a 360: 0 problemi, e03 0 px.
- e06 375 da solo: massimo 31 px, contro un tetto per episodio di 22 (due prove uguali). Per il principale è un rosso, non un margine.
- **Tutti i 36:** 50 a 375 (tetto 47), 119 a 360 (tetto 95). Rosso.
- e21 375: il salto di 132 px che su 0.70.0 avviene alla sparizione qui avviene al tocco dell'unità, perché i dischi accesi diventano
  ostacoli (linea del tempo: 236,19 → 104,19 al tocco). È lo stesso spostamento, solo in un altro momento; il guardiano dei salti lo
  conta, perché legge le posizioni dopo la sparizione.

## Guardiano «tutti i 36»: dispersione (richiesta del principale)

Main `0614b247`, 375×667, 3 prove di fila (`zz-salti-tutti2`, 4 pagine): **47, 47, 47**, nessun episodio diverso fra le prove.
Il guardiano è deterministico su main; il tetto 47 coincide con la misura. Il 49 del rosso C272W03 non è rumore: quel rosso non
è identico a main (macchina diversa del «prima»). Il ±2 visto su e06 fra giro intero e giro da solo resta senza spiegazione:
Non posso confermarne la causa.

## Bracci (fatto durante il lotto, ora tornati come su main)

I casi di C271U01 (7/13), C272A01 (0/1) e `C269C01,C271U01,C272N01` (2/3) nascevano dal ricalcolo alla sparizione: con le correzioni
2 e 3 diventavano ciechi e giravano con C272W03 (15, 1 e 5, soglie invariate). Col codice di 0.70.0 il ricalcolo c'è di nuovo e i
bracci tornano come su main `0614b247`.

## Strumento «sparizione» (per il lotto successivo)

`tools/sparizione-po152b.mjs` (in `15feaa54`) è tolto da questo ramo, perché sul codice di 0.70.0 sarebbe rosso nel verde.
Riparazioni già fatte e da riprendere:
- posti rispetto alla mappa: e22/e08 a 375, la mappa intera sale di 2 px;
- fino a 3 riaperture se i segni sono già spariti alla lettura. In CI il braccio era 1 su 3, poi 3/3 anche a CPU 4×;
- lettura «ultima coi segni» ogni 50 ms. A 300 ms fissi su e21 375 cadeva prima del cambio di misura della mappa (343 → 200 px a
  453 ms): falso positivo di 132 px.

## Rilievi fuori lotto

- **Mappa che a 375 sale di 2 px** (e22, e08) durante la sparizione: rilievo a parte, annotato dal principale.
- **Timeout di e17 a 412** nel giro salti: 1 su 1 nel giro dei 36, 0 su 3 da solo. Il messaggio ora dice il passo
  (apertura / tocco unità / tocco settore). Se ricompare si tratta come instabile (decisione del principale).

## IPOTESI per il lotto successivo (non misurate)

- Le correzioni 2 e 3 non sono sbagliate per il giocatore: spostano il salto dal momento della sparizione a quello del tocco o della
  mossa. Il guardiano dei salti però vede solo il secondo, perché legge «prima» a sparizione avvenuta. Un confronto giusto conterebbe
  i salti visibili in tutto il ciclo puoi → sparizione → dove → fatta, contro la mappa mostrata un attimo prima. Cambiare il guardiano
  così è una decisione del principale o del PO, non mia.
- La radice comune: i segni ▲/▼ fanno da ostacolo alla disposizione. Finché la fanno, la loro sparizione o lascia una disposizione
  costruita attorno a ostacoli che non ci sono più, o la ridispone.

## Tempi e limiti

- Il container si è riavviato 2 volte durante le misure: le misure lunghe sono state riprese da dove erano (`DA=eNN`), e i file di
  log sono continui.
- Misure a macchina carica (carico 12 su 4 CPU): i conteggi sono uguali alle prove ripetute (e06, main ×3), mentre i tempi non valgono.
- Una prova per lato su tutti i 36 per le correzioni 2 e 3 (circa 45-90 min ciascuna): dispersione misurata solo su main.

## Commit del ramo

`2305e014` (corr. 1) · `2c9f0624` (giro sparizione, braccio W03) · `6eda45da` (passo nel messaggio, resta) · `b9cf3dea` (bozza) ·
`de8e2e9e` (bracci, strumento) · `15feaa54` (corr. 2) · `685988f1` (braccio N01) · `f4a8bf56` (corr. 3) · ritiro: commit che porta
questo README.
