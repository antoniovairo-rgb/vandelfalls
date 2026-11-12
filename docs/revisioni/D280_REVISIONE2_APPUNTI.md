# D-280, seconda revisione di fermi.ts: appunti alla pausa (2026-11-12)

Ramo `claude/valmora-pastiglie-ferme`. La pausa è stata chiesta dal PO tramite la sessione principale.

ATTENZIONE: il commit 5f5859a9 è codice «in prova». Contiene B e il tetto RICALCOLI = 1, misurato qui sotto: non regge sul costo. Non va promosso così com'è.

## A. Costo per mossa

**Strumento:** tools/zz-costo.mjs (temporaneo, ignorato da git). Per ogni mossa misura il task più lungo dopo il tocco del settore (PerformanceObserver «longtask») e conta i ricalcoli di etichette.ts. Il conteggio usa un contatore aggiunto solo nelle build di misura.

**Condizioni:** 360×640, CPU rallentata 4 volte, ogni build misurata da sola, 3 prove, episodi e12, e32 ed e34 (76 mosse per prova).

| Build | Differenza mediana dalla stessa mossa su main | 90° percentile | Mosse oltre +1 s | Caso peggiore | Ricalcoli per mossa |
|---|---|---|---|---|---|
| ramo d7054d5f (prima del tetto) | +614 ms | +2697 ms | 87 su 228 | +7,1 s | fino a 6 |
| RICALCOLI = 1 (5f5859a9) | +587 ms | +1740 ms | 71 su 228 | +2,3 s | fino a 2 |
| RICALCOLI = 0 | +39 ms | +469 ms | 4 su 228 | +1,34 s | sempre 1 |

- **Main da solo:** la stessa mossa varia fino a 955 ms da una prova all'altra (mediana 307 ms).
- **Valori di riferimento su main:** e12 media 1929 ms, massimo 2707 ms; e32 2145 / 3049 ms; e34 702 / 1575 ms.
- **Mossa segnalata dalla revisione** (e12, steward@piazza_comune → strada_cinderwick, 1 prova): main 3,4 s con 1 ricalcolo, d7054d5f 10,9 s con 5 ricalcoli. Il rilievo è confermato.

**Qualità di RICALCOLI = 0** (36 episodi a 360, 3 pagine, 1 prova; elementi oltre 44 px / massimo):

| Build | Totale |
|---|---|
| main | 818 / 199 |
| ramo d7054d5f | 384 / 176 |
| RICALCOLI = 0 | 692 / 176 |

Rispetto a d7054d5f, 26 episodi peggiorano e 1 migliora; e26 torna a 30/176, come senza le pastiglie ferme. Costa come main, ma perde quasi tutto il guadagno.

**Qualità di RICALCOLI = 1:** non misurata. La misura è stata interrotta dalla pausa.

**Conclusione:**
- Nessuna variante misurata soddisfa insieme il costo (≤ ~1 s su main) e la qualità.
- Ogni ricalcolo costa circa 2 s a CPU ×4 su e12, per cui un ricalcolo in più supera già la soglia.
- È una decisione da prendere, oppure serve un ricalcolo meno caro con i gruppi fermi (non studiato).

## B. Candidato doppio

Fatto in 5f5859a9: in fermi.ts restano gli ordini [0, -1]. Chi arriva è già in coda nel DOM (Mappa.tsx, inFila). Non ho una misura separata.

## C. Gruppi persi al ricalcolo successivo

**Stato:** non corretto; lo considero latente.

**Analisi (IPOTESI, non misurata):**
- Dopo la mossa, tieni() memorizza la disposizione con chi è arrivato.
- Al ricalcolo successivo, chi è arrivato non è più «nuovo» e sciogli() toglie `order`.
- La revisione ha visto 0 casi su 1029 mosse nel gioco normale.

## D. Tetti del guardiano

Non fatto. I valori dipendono dalla variante di A che si sceglie.

## E. Tolleranza delle sovrapposizioni

Non fatto, per lo stesso motivo.

## F. Elementi che peggiorano rispetto al rosso

Non verificato.

## G. «Fermi a più gruppi»

Stima non ancora scritta.

## Da dove ripartire

1. Decidere A tra queste strade:
   - RICALCOLI = 0: costo come main, qualità quasi persa;
   - RICALCOLI = 1: misurare prima la qualità (36 episodi a 360, circa 1 ora con 3 pagine);
   - studiare un ricalcolo più leggero intorno ai gruppi fermi.
2. Poi E, poi D: guardiano vero (giraAltezze) a 375 e 412, almeno 2 prove; e21 stretto alle misure.
3. Poi la stima di G e il rapporto unico.

Le build di misura (dist-mi, dist-ni, dist-c0, dist-c1) e i log restano nella cartella di lavoro della sessione. Non sono nel ramo.
