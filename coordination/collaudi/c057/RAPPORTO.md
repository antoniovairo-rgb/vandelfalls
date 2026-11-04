# Collaudo C-057 · 0.63.0 (main b497d62) · 2026-11-04

Collaudatrice C-057, sola lettura sul codice. Build: `npm ci` + `vite build` su b497d62 (GAME_VERSION 0.63.0, src/versione.ts:341).
Chromium /opt/pw-browsers (nessun browser installato). Sonde in questa cartella; dati grezzi in `dati/`.

## Esito: 0 bloccanti, 0 alti, 1 media, 4 basse

Le sei verifiche richieste (FATTO MISURATO salvo dove marcato IPOTESI):

| # | Punto | Esito |
|---|---|---|
| 1 | Scheda del settore (C55-01) | **OK a testo 100%**: 540 tocchi veri (180 per larghezza, una chiamata per ognuno dei 36 episodi, tutti i settori toccabili), 0 schede che coprono il centro, 0 fuori mappa, 0 scorrimenti in più. A testo 130% (simulato): 6/180 a 360×640 coprono il centro → C57-03 |
| 2 | Costo visibile; mappa si abbassa e resta ferma | Costo visibile in 648/648 risposte (3 larghezze × 2 testi × 108). **Mappa NON ferma**: scende a gradini e di nuovo al tocco sull'unità → **C57-01 (media)** |
| 3 | «Home» nella testata | In 648/648 stati una sola «Home» visibile. In testata solo in 3/108 stati a 360×640 (100%): e27/imp_cancello_inceppato, e35/curiosi_notte, e35/imp_gru. OK |
| 4 | Previsione coerente con ciò che accade | 0 opposte su 403.536 confronti; coincide nel 91,62% (attenta 88,70%, equilibrata 89,90%, casuale 93,15%, peggiore 96,63%). Resta una quota di segni che non si realizza → C57-05; riga tagliata → C57-02 |
| 5 | Ricarica | OK: 115/115 pause con la mossa tornano dalla ricarica; «Avanti»+ricarica → chiamata (115/115); risposta senza mossa + ricarica → chiamata (8/8); mossa fatta + ricarica → chiamata successiva (438/438, 219 per testo). Salvataggi veri vecchi (tests/salvataggi-reali, v2 0.4.0, v2 0.52.0, v3 0.57.0) ripresi dalla chiamata (360×640 e 412×915), nessun errore di pagina |
| 6 | Bersagli della mossa al tocco | OK: tocco vero sul centro di ogni unità (prima) e dell'ultimo settore ammesso, 219 stati per testo × 2 testi: 0 che non rispondono, 0 lati < 44 px, centro coperto 0 su 101 casi sospetti riesaminati. A 130% 0/219 non rispondono |

## Rilievi

### C57-01 · MEDIA · la mappa della risposta con la mossa non resta ferma · NUOVO con la 0.63.0
- **Cosa**: dopo «Conferma» la mappa scende a gradini separati da 0,3-0,5 s invece di una volta sola, e al primo tocco su un'unità scende ancora, rilayoutando settori e badge prima del secondo tocco.
- **Passi**: 360×640, e35 → salvataggio costruito alla chiamata `curiosi_notte` → prima opzione → Conferma → osservare la mappa (ResizeObserver); poi toccare una unità.
- **Misura** (4 prove identiche per caso, deterministico): e35/curiosi_notte 328→302→247→231 px (tre passi a ~0,63, 1,0, 1,3 s); e16/imp_buca 328→266→200; e19/imp_cane 328→278→200. Al tocco sull'unità: e03/laser 302→247 (4/4), e10/imp_cantiere 282→227 (4/4). Su 219 stati con la mossa a testo 100%: la mappa si abbassa al tocco dell'unità in 69 (23/73 a 360×640, 46/73 a 375×667, 0/73 a 412×915), di 31-95 px. 3 stati su 648 sono instabili nei primi 1,4 s (e35/curiosi_notte 360; e28/imp_tabellone 375; e22/stadio_sicuro 375 a 130%).
- **Confronto**: sulla 0.61.0 (6c7d81d) gli stessi 5 casi: mappa 328 fissa, 0 variazioni (la risposta scorreva, motivo di D-259). Quindi nuovo con D-259/D-261.
- **Foto**: `360x640-e03-laser-salto-2-ferma.png` (prima) e `-3-unita.png` (dopo il tocco: mappa 55 px più bassa, settori spostati); `360x640-e35-curiosi_notte-gradini-1-subito.png` / `-2-ferma.png`; `375x667-e03-laser-salto-*`.
- **Causa probabile (IPOTESI, non misurata)**: src/resa/mappa/adatta.ts:69-91 rifà la misura a ogni cambio di `main` (ResizeObserver, adatta.ts:125) e la riga di indicazione diventa `compatto` col tocco dell'unità (radio-mappa.tsx:23), quindi la «tenuta» (adatta.ts:67) si riabbassa a ogni nuova altezza di ciò che sta fuori dalla mappa.
- **Non posso confermare** che un giocatore sbagli un tocco per questo salto: nelle sonde il secondo tocco rimisura la posizione.

### C57-02 · BASSA · la riga di previsione dopo la mossa può essere tagliata · NUOVO
- **Passi**: 360×640, e16, chiamata `imp_nebbia`, prima opzione, Conferma, tocco su un'unità, tocco su un settore ammesso.
- **Misura**: riquadro radio alto 14 px (`scrollHeight > clientHeight`), la riga «Previsione alla chiusura…» non si legge; resta il solo segno ▼ che copre il nome «MAGAZZINO DELLE FONDERIE» (foto). 1/219 stati a 100%; 4/219 a 130% (e04/imp_tendone, e11/chi_paga, e16/imp_nebbia a 360×640; e16/imp_nebbia a 375×667).
- **Foto**: `360x640-e16-imp_nebbia-previsione-4-fatta.png`.
- **Causa probabile (IPOTESI)**: radio-mappa.tsx:47-49, il riquadro non trova posto libero per la riga; il guardiano C262E01 guarda solo e01.

### C57-03 · BASSA · a testo 130% la scheda del settore copre il centro del settore toccato · preesistente (il caso non era misurato)
- 360×640, testo 130% (SIMULATO: i token --testo-mini/-piccolo/-base ×1,3; IPOTESI: non è il textZoom di Android). 6/180: e04/imp_tendone mercato; e10/al_contrario piazzale; e11/chi_paga viale_stazione; e12/salvi piazzale; e20/senza_guida piazzale; e36/cantiere_notte piazzale. 0/360 a 375 e 412.
- Causa probabile (IPOTESI): la scelta alto/basso della scheda (src/resa/stile-idee.css:4-5) non tiene conto dell'altezza della scheda col testo grande. Riga di roadmap «Accessibilità: testo al 130%» ancora «da scrivere» (docs/governo/ROADMAP.md:48).

### C57-04 · BASSA · a testo 130% la risposta con la mossa scorre molto · preesistente (non coperto)
- Stati con mossa che scorrono a 130% (simulato): 68/73 a 360×640 (fino a 163 px, soglia 68), 59/73 a 375×667 (fino a 106, soglia 56), 0/73 a 412×915. A 100% nessuno oltre soglia. Stesso tema di ROADMAP.md:48.

### C57-05 · BASSA (osservazione) · una parte dei segni ▲/▼ non si realizza
- Su 127.159 segni ▲/▼ previsti, 25.110 (19,7%) a chiusura non cambiano; il 3,1% dei «non cambia» (8.698/276.377) in realtà cambia. 0 opposti. Altri settori oltre ai due toccati cambiano in 70 mosse su 201.768. Il guardiano della 0.63.0 (tests/previsione-d262.test.ts) accetta ≥85,7% e conta solo «attenta» semi 1-3; con 4 strategie e semi 1-6 il valore è 91,62%. La differenza è dichiarata nel test (le risposte che vengono dopo non sono conosciute), quindi non è un difetto: se il PO vuole il «▲» come promessa, il testo «previsione» è già prudente.

## Ritirato dalla collaudatrice
- «Dopo la ricarica la mappa cambia altezza» (11/115) misurato a 0,5-0,6 s dalla ricarica: era presa durante la discesa di C57-01, non è un rilievo. Non posso confermare se a regime l'altezza prima e dopo la ricarica coincida.
- Il controllo a 5 punti segnalava bersagli «coperti» in 29 stati: il centro non è mai coperto (0/101); erano sovrapposizioni parziali fra bersagli vicini. Non è un rilievo.

## Guardiani esistenti (supporto)
- po152a + po152b (sonda-altezze, 360×640, 375×667, 412×830): VERDE (`dati/guardiani.txt`). Non vedono C57-01 né C57-02: provano e01 e misurano l'altezza a risposta finita.

## Non verificato
- Telefono vero, textZoom di Android vero, lettori di schermo; sito online; salvataggi veri su 375×667 (provati 360 e 412); campione di 3 chiamate per episodio (108), non tutte; D-259 «l'evidenziazione delle unità spostabili deve bastare da sola» a 360×640 (indicazione muta): non ho fatto un giudizio percettivo con utenti.

## Strumenti (questa cartella)
sonda-previsione.mjs · sonda-mossa.mjs · sonda-scheda.mjs · sonda-ricarica.mjs · sonda-stabilita.mjs · foto-rilievi.mjs · guardiani.mjs · analisi.mjs · dati/
