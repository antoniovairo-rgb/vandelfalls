# Roadmap

Data di pubblicazione: **da rifissare a fine L1** (D-050: le 36 missioni restano, la data del 2026-11-30 di D-009 slitta in base alla misura). Congelamento dell'ambito: dieci giorni prima della nuova data. Test chiuso Play, se richiesto: avvio entro il 2026-11-09 (Non posso confermarlo che sia richiesto).
Ambito della prima pubblicazione: triade intera, 36 missioni.
Stati dei lotti: PROPOSTO / IN CORSO / CHIUSO.

## L0 – Impianto del governo
- Stato: CHIUSO (2026-10-11: catena governo verde 3/3 giri locali su 7a884b9 + CI GitHub verde su 80a3deb; D-006…D-012 chiuse)
- Obiettivo: documenti di governo, regole, prima catena di prova funzionante, decisioni di partenza.
- Voci: PO-001, PO-002, PO-003, PO-004, PO-005, PO-006, PO-007
- Criterio d'uscita: catena «governo» verde per 3 giri consecutivi sullo stesso commit; D-006…D-010 chiuse; repo GitHub con CI che esegue la stessa catena.

## L1 – Fetta verticale: episodio 1
- Stato: IN CORSO
- Obiettivo: e01 giocabile da capo a fondo (briefing, plancia, ondate, verbale) nel browser e come APK di debug sul telefono del PO.
- Voci: PO-009, PO-010, PO-011, PO-012, PO-013, PO-015, PO-016, PO-017, PO-018, PO-019, PO-020, PO-022, PO-023, PO-024, PO-025
- Collaudo PO C-001 (2026-10-11): e01 0.1.0 senza tensione e passiva; si rifà a scene guidate con conseguenze (D-048, D-049).
- Ore di lavoro (misura del 2026-10-11 11:02 UTC, da `git log`, metodo: somma degli intervalli fra commit consecutivi sotto i 30 minuti): sessione principale 68 commit di L1, 3,5 h attive su 10,6 h di calendario (00:27 → 11:02 UTC, 2 pause lunghe). Sviluppatrice e collaudatrice attive dalle 09:30 UTC: le loro ore non sono separabili dai commit della principale che hanno integrato. LIMITE: misura indiretta, non conta il tempo senza commit (letture, attese delle catene, questionari).
- Avanzamento: impianto Vite + TS + Vitest, schema, validatore e catena «logica» fatti (PO-010…012, sul ramo claude/valmora-l1-setup-schema-xdrbx7); bibbia in scrittura col PO (PO-009: e01 decisa in D-019…D-039); motore della plancia, bot e dati di e01 fatti, bot 0 blocchi su 1000 semi (PO-016). Resa di e01 nel browser con salvataggio e ripresa fatta (PO-017): catena grafica verde a 360/375/412 px. Testi approvati per ora (D-043). APK di debug costruito dalla CI (D-044). Manca: prova dell'APK sul telefono del PO, ore di lavoro misurate.
- Criterio d'uscita: bibbia con indice della triade ed e01 approvati dal PO, con un collaudo del PO che giudica e01 tesa e coinvolgente (C-001 non lo è); e01 completata dal bot con 1000 semi (1…1000), 0 blocchi; catena «logica» verde 3 giri; 0 errori di console sulle schermate di e01 a 360/375/412 px; salvataggio e ripresa provati; ore reali di lavoro misurate e scritte qui.

## L2 – Strumenti e stagione 1
- Stato: PROPOSTO
- Obiettivo: validatore dello schema, controllo del grafo narrativo, bot di partite; 12 missioni della stagione 1.
- Voci: –
- Criterio d'uscita: 12 missioni valide allo schema; bot con 1000 semi × strategie «casuale» e «peggiore» arriva sempre alla fine della stagione; 0 soft-lock e 0 fili orfani; un rapporto di collaudo per missione in COLLAUDI.md senza difetti critici aperti.

## L2b – Risposta al primo tester: mappa, scelte, varietà (PO-152, D-241)
- Stato: IN CORSO (dal 2026-10-27; il test chiuso di L3 aspetta la chiusura di questo lotto: «Prima le idee, poi il Play»)
- Obiettivo: rispondere al primo tester esterno, che sulla 0.52.0 ha detto: «dopo un po' si stufa»; «il gioco sta solo nella parte sotto»; «la riga di costo ti dice subito l'opzione senza rischio».
- Cause misurate sul codice:
  - in chiamata la mappa è disabilitata (src/resa/App.tsx:282, src/resa/mappa/Mappa.tsx:124);
  - la riga di costo è obbligatoria e si legge prima dell'opzione (src/resa/schermate/Ondata.tsx:118, D-078);
  - src/logica/missione.ts non usa il seme e l'imprevisto ha un posto fisso.
- Voci: PO-152 (idee), PO-151 (ripartenza), rilievi C52-01…C52-05 (D-242).
- Attività, in ordine:

  | # | Attività | Chi | Versione | Stato |
  |---|---|---|---|---|
  | 0 | Fermare la catena per il Play su e3cac34b (S-25) | principale | – | fatto (giro interrotto, non conta) |
  | 1 | C52-01/02: la mappa della città non salta al tocco di un episodio (fino a 110 px) e resta lo spazio sopra le teste, con scheda compatta (D-243); rosso C242M01 | S-11 | 0.58.0 | fatto |
  | 2 | Debito: spezzare src/resa/App.tsx (334 righe) e src/resa/stile.css (400/400), foto identiche | S-11 | 0.53.0 | fatto |
  | 3 | **A · La mappa è la fonte.** Niente costo né chip prima della scelta; settori toccabili in chiamata con scheda di stato; il costo arriva dopo «Conferma» come rapporto radio; dentro anche C52-03; rosso C241A01 | S-11 | 0.58.0 | fatto |
  | 4 | **D · Ogni partita diversa.** Seme di partita salvato; mazzo di imprevisti e punto di comparsa; varianti di chiamata; rosso C241D01; soglia di varietà fissata dopo la prima misura | S-26 | 0.54.0 | fatto |
  | 5 | **C · Il «nessun costo» morde dopo.** Campo `effetti_dopo` validato da schema, applicato alla chiusura dell'ondata dichiarata; scrittura sui 36 episodi | S-27 | 0.56.0 | fatto (morsi da variare al passo 7, D-247) |
  | 6 | **B · Una mossa per chiamata.** Azione pura `sposta` in missione.ts, trascinamento sulla mappa, una per chiamata, il bot la usa; SAVE_VERSION con migrazione se serve; rosso C241B01 | S-11 | 0.59.0 | in corsa (rilascio) |
  | 7 | Bilanciamento: vittorie per episodio col bot (300 semi, 0 blocchi) dopo A+C; si ritoccano i dati, non le soglie; dentro: D-108 col seme (7 coppie rosse, esito «contenuto» di e24 irraggiungibile) e 129 risposte di imprevisti classici che scorrono oltre 68 px a 360×640; morsi dell'idea C resi vari, non solo fiducia −1 (D-247); C53-02 (sonda su tutte le risposte delle carte, testi accorciati) e C53-03…07 (testi ripetuti, «Lì» senza antecedente, game_version, fonte delle varianti) | S-11 / S-26 | – | da scrivere |
  | 8 | Accessibilità: testo al 130% a 360/375 (C52-04/05) | S-11 | – | da scrivere |
  | 8c | C53-01: l'imprevisto della carta nuova non arriva più per ultimo nell'ondata (10,5% → 0); finestre validate sulle chiamate senza condizioni; rosso | S-26 | 0.56.0 | fatto |
| 8b | **Nuovo nome «Varcalda – Cortina di fumo» (PO-153, D-244).** Testi, store, privacy, identificativo dell'app, chiavi del salvataggio con migrazione, repository e Pages; guardiano «nessun Valmora visibile» e rosso | S-26 + PO (rinomina del repository) | 0.55.0 + 0.56.0 | fatto (repository rinominato dal PO il 28/10, sito su …/varcalda/) |
| 8d | Caratteri (D-254 rivista da D-257: Inter è già incluso): peso 500 mancante, woff doppi, simboli fuori dal sottoinsieme latin, guardiano senza Inter di sistema | S-26 | – | in corsa (pausa D-256) |
| 9 | Prova del tester: link al PO per il collega; collaudo con «Partita da giocatore» e la domanda «leggi le opzioni? la mappa la usi?» | principale + collaudatrice | – | da scrivere |

- Criterio d'uscita:
  - le quattro idee pubblicate, ognuna col suo guardiano e un braccio rosso che fallisce davvero;
  - bot su 300 semi con 0 blocchi e vittorie per episodio dentro le soglie;
  - salvataggi vecchi reali migrati e giocabili;
  - un secondo giudizio del tester raccolto dal PO.
- Poi L3: catena completa 3/3 sulla versione finale (D-228) e test chiuso.

## L3 – Prima pubblicazione
- Stato: PROPOSTO
- Obiettivo: triade intera (36 missioni, D-009), test chiuso su Play, richiesta di produzione.
- Voci: –
- Criterio d'uscita: controllo copyright a 0; build offline verificata; 0 errori di console nelle schermate principali; AAB caricato dal PO nel test chiuso; requisiti Play letti e datati in docs/RILASCIO.md.

---

## Registro delle release
La più recente in alto. Hash = commit di main dopo la promozione (catena completa 3/3 + CI «catene» verde, D-115). Dettaglio di causa/misura/guardiano nel commento di GAME_VERSION (src/versione.ts).

| Versione | Data (UTC) | Hash main | Contenuto | Misura principale | Stato |
|---|---|---|---|---|---|
| 0.59.0 | 2026-10-30 | – | Una mossa per chiamata (idea B, L2b): si sposta una squadra fra una chiamata e l'altra; SAVE_VERSION 4. Bilanciamento della varietà (D-252): risposte delle carte senza scorrimento, D-108 col seme, e24 «contenuto» | Seconda mossa rifiutata; salvataggio vero 0.57 migrato; bot 0 blocchi, esiti identici; rossi C241B01 (6) riprodotto dalla principale; risposte oltre soglia 348 → 0 a 360×640, rosso C193R01 (9 su 120) riprodotto dalla principale | sul ramo, rituali in corsa |
| 0.58.0 | 2026-10-30 | 8e1fd248 | La mappa è la fonte (idea A, L2b): costo solo dopo «Conferma», settori toccabili in chiamata; mappa della città ferma con scheda compatta (C52-01/02/03, D-243) | 0 costi prima di Conferma; mappa ferma a 279 px; sopra le teste ≥104 a 915; rossi C241A01 (8) e C242M01 (7) riprodotti dalla principale; passo email verde; governo+logica 3/3 su 8e1fd248, CI 10/10 | pubblicato |
| 0.57.0 | 2026-10-29 | 7c2943d6 | Nome definitivo «Vandel Falls – Cortina di fumo» (PO-155, D-249): testi, titolo, store, privacy, app, salvataggi migrati, indirizzo …/vandelfalls/ | 37 testi; salvataggi reali ripresi da entrambi i prefissi; rossi C249N01/C249S01; passo email verde; tempo del guardiano C241D01 portato a 400 s (D-251); governo+logica 3/3 su 7c2943d6 (primo tentativo perso per un riavvio del container), CI 10/10 | pubblicato |
| 0.56.0 | 2026-10-28 | 8ee0d870 | Il «nessun costo» morde dopo (idea C, L2b): un effetto ritardato per ondata, annunciato dalla centrale alla chiusura; C53-01 (imprevisto mai per ultimo, D-246); indirizzo …/varcalda/ | 167 opzioni con morso; 0 blocchi su 86.400 partite; equilibrata 3★ 89,2% → 68,1%; rosso C241C01 167 → 0; C53-01 5,1% → 0 (rosso C246I01); passo email verde; governo+logica 3/3 su 8ee0d870 (primo tentativo interrotto da un riavvio del container), CI 10/10 | pubblicato |
| 0.55.0 | 2026-10-28 | aa0b4e9f | Nuovo nome «Varcalda – Cortina di fumo» (PO-153, D-244): testi, titolo, store, privacy, identificativo dell'app, chiavi del salvataggio migrate | 37 testi cambiati; salvataggi reali ripresi senza perdite; guardiano nome-d244 con rossi C244N01/C244S01; passo email verde; governo+logica 3/3 su aa0b4e9f, CI 10/10 | pubblicato |
| 0.54.0 | 2026-10-28 | 1d018d57 | Ogni partita diversa (idea D, L2b): seme di partita, mazzo di imprevisti (142 carte nuove), varianti di chiamata in stagione 1; SAVE_VERSION 3 | Partite diverse fra due semi 0% → mediana 99% (min 94%); bot 0 blocchi su 43.200; casuale ±6 punti; rosso C241D01 riprodotto (0%); passo email verde; governo+logica 3/3 su 1d018d57, CI 10/10 | pubblicato |
| 0.53.0 | 2026-10-28 | 9103a5a9 | Debito prima delle idee del tester (L2b, D-241): App.tsx e stile.css spezzati | App.tsx 334→265, stile.css 400→201+201; CSS costruito identico (md5); foto 375/412 identiche; governo+logica 3/3 su 9103a5a9, CI 10/10 | pubblicato |
| 0.52.0 | 2026-10-27 | 01f68a32 | Città: scena in testa più alta, mappa più alta, «Avvia l'episodio» e gli altri pulsanti dentro la scheda (PO-149, D-237) | Striscia 96→193-197 px, sopra i personaggi 14-16→101-110, mappa 415→431 a 915 e 260→276 a 760, giallo vuoto 130→4, pulsanti −5→+4 px; 640/667 invariati, scorrimento 0; rossi C237S01/C237P01 riprodotti dalla principale (24 misure, 0 difetti in verde); governo+logica 3/3 su 01f68a32, CI 10/10 | pubblicato |
| 0.51.0 | 2026-10-27 | 965ce422 | «Annulla» e «Conferma» al posto del conto alla rovescia di 3 s sulle risposte (PO-148, D-236); verbale a 360×640 (D-234) | Nessun effetto prima di «Conferma» (anche dopo 3,6 s); pulsanti nella finestra e ≥44 px a 360/375/412×640/667/760 e 1366×768; scorrimento chiamata prima del tocco invariato, dopo −8 px; rossi C236C01/C236A01 riprodotti dalla principale (92 verifiche, 0 fallite in verde); governo+logica 3/3 su 965ce422 (giro 3 rifatto dopo un riavvio del container), CI 10/10 | pubblicato |
| 0.50.0 | 2026-10-26 | e336d854 | Titolo con una partita salvata e città con 36 episodi senza scorrimento anche a 640/667 di altezza (C49-01, C49-02, D-230); strumento C187V01 indipendente dal carico; commenti di versione 0.1.0–0.10.0 spostati in RELEASE_HISTORY (D-233) | Città 36 episodi stagione 3: 99/80/76→0 px a 640, 53→0 a 375×667; titolo con salvataggio 29/10/10→0; C187V01 ciechi sotto carico 2/15→0/20; governo+logica 3/3 su f33436a0, CI 10/10 | pubblicato |
| 0.49.0 | 2026-10-22 | 25a8cd82 | Menu «Altro» della schermata del titolo senza scorrimento a ogni altezza (C48-02, D-224); due correzioni di testo in e36 (D-227): bar del finale «sostituito» coerente col verbale, «il questore» sostituito | Scorrimento col menu aperto 0 px a 7 formati con e senza salvataggio (prima fino a 265 px a 360×640); «questore» 7→0; governo+logica 3/3 su 82127ae6, CI 10/10 | pubblicato |
| 0.48.0 | 2026-10-21 | 6449af94 | Correzioni C-047 (battuta delle buste in e36, riepilogo dello schieramento senza scorrere, stelle che non coprono i dischi), D-219 (nome coperto da «Home» nel riepilogo), D-221 (riepilogo senza scorrere a ogni altezza); privacy policy nel gioco (menu «Altro») e su …/valmora/privacy, contatto korward.devteam (chiocciola) gmail.com (PO-145, D-217/D-220/D-222) | Riepilogo e36 a 360×640 115→0 px, a 760 19→0; stelle sui dischi altrui 1460→0 px²; 0 richieste esterne su 3152 (Chromium); governo+logica 3/3 su 9708ad96, CI 10/10. Saltata alle 13:30 (CI rossa, D-222), uscita in anticipo sulle 23:00 su richiesta del PO | pubblicato |
| 0.47.0 | 2026-10-21 | 5106cc9f | Home fase 2 (D-208/D-210: striscia coi personaggi al posto della testata della città, vignetta al primo passo della guida); imprevisti senza vignetta e riga, fumetto più stretto (D-206/D-207/D-215); rifinitura e01–e03 (D-209); correzioni C-046 (e36, e05, e22/e27, D-211); build AAB non firmata in CI e docs/RILASCIO.md (D-212/D-214) | Imprevisti a 360×760: massimo 545→331, mediana 466→278; città senza scorrimento a 360/375/412×760; CI 10/10 job; governo+logica 3/3 verdi su 9e55f92f | pubblicato |
| 0.46.0 | 2026-10-20 | aa11054b | Correzioni C-045: etichette degli imprevisti (C45-01), guida senza transenne (C45-02), dicitura del confronto nel verbale (C45-03, D-205), e36 cassa (C45-04), rapporti senza scorrimento (C45-06) | Etichette smentite 9→0; rapporti costruiti che scorrono 7→0 su 740; vitest 407/407 | Pubblicata: governo+logica 3/3 verdi su ee8a4909, CI «catene» 9/9 verde, Pages servita con aa11054 |
| 0.45.0 | 2026-10-20 | 90889f60 | Correzioni C-044: imprevisti di e01–e06 col modello degli altri episodi (D-201, D-202), testi (scadenze, settori, «comando apprezza», costi ripetuti), schermi a 760 (C44-08/09) | Unità impegnate dagli imprevisti 16→0; «lascia correre» con effetto 13→0; risposta 412×760 24→0 px; vitest 398/398 | Pubblicata: governo+logica 3/3 verdi su 2cb5846d, CI «catene» 7/7 verde, Pages servita con 90889f6 |
| 0.44.0 | 2026-10-20 | 413e326b | Imprevisti senza timer su 36 episodi (PO-022, D-190/194/195); correzioni C-043 (D-196/197); schermi bassi (PO-052/058, D-187/191/193/197); «Annulla» a 3 s (PO-142, D-198) | 142 imprevisti, 0 blocchi, 3★ del bot attento 17→17; testi «resta coperto» 44→0; «Fine stagione» a 360×760 250→0 px; vitest 393/393 | Pubblicata: governo+logica 3/3 verdi su 2b5af420, CI «catene» 7/7 verde, Pages servita con 413e326 |
| 0.43.0 | 2026-10-19 | a5bc688a | Home rinnovata (PO-140 fase 1, D-179); correzioni C-042 (C42-01…06) e C41-05…08 (D-185); rifinitura dei testi e10–e36 (D-186, D-189, D-190) | Scorrimento a 360 px: home 122→0, sala 538→0, briefing 817→0, verbale 1395→0; formule di schieramento su tutti i testi → 0; vitest 375/375 | Pubblicata: governo+logica 3/3 verdi su ab2765ac, CI «catene» 7/7 verde, Pages servita con a5bc688 |
| 0.42.0 | 19/10 | 7286c6c1 | Correzioni del collaudo C-041: bilancio del verbale («penalizzato» e «aiutato» coerenti con la partita, niente righe vuote), costo delle unità dichiarato «dalla prossima ondata» (D-183), testi coerenti con lo schieramento | governo+logica 3/3 verde su 39b2b686 (D-177); CI «catene» 7/7 verde su 39b2b686; pesi su settori sotto controllo 222 → 0, righe vuote 199 → 0, costo dichiarato 230/230 | Pubblicata (rilascio delle 13:30 uscito alle 14:50: sessione riavviata). C41-05…08 (S-09) non inclusi: CI rossa |
| 0.41.0 | 19/10 | 0674567a | Protagonisti della quarta prova in tutto il gioco (D-176: figura femminile, braccia), braccio della mano alla nuca (PO-136, C117B01), braccia smussate (PO-137, D-178), correzioni del collaudo C-040 (confronto e fiducia D-180, «le tue risposte», mediatore, busta consegnata), terza stella con fiducia ≥ 8 in cinque episodi (D-181) | governo+logica 3/3 verde su 22a0f553 (D-177; giro 3 rifatto da capo dopo un'interruzione del processo, non un rosso); CI «catene» 7/7 verde su 22a0f553; fiducia nelle fallite 13 → 0 episodi, voci contraddette 598 → 0 | Pubblicata. Home (PO-140) in attesa dell'ok del PO |
| 0.40.0 | 18/10 | e1c0d73a | Correzioni dei collaudi C-038/C-039 (mediatore D-173, unità impegnate C39-02, «giallo» C38-02, furgone, settore degenerato, squadra sul nastro), fiducia terzo giro (6 episodi → 0 contro il risultato), verbale che confronta le risposte (366 → 0 voci contraddette), scena del tono, seconda bozza dei protagonisti | governo+logica 3/3 verde su 769f927b (D-177); CI 7/7 verde su ed68c824 | Pubblicata. Prima versione con la verifica veloce di D-177 |
| 0.39.0 | 18/10 | 89bfbd9d | Finale in tre tempi ed epilogo (D-161, D-164, D-165, D-171: tavole coi busti della seconda bozza), annullamento delle risposte entro 5 s (PO-121), fiducia coerente secondo giro (D-169, D-170), versione nel margine sinistro (D-168), C37-01/03/08 | catena completa 3/3 verde su 1517c083; CI verde su 1517c083 | Pubblicata. PO-131/PO-132 (braccia, figura femminile) restano alla terza prova dei protagonisti |
| 0.38.0 | 18/10 | 1188bcc | Nomi sulla mappa (C33-01 / D-145), settori copribili e dati C35 (D-146, D-150), finale di e14 (D-158); coerenza delle scelte (D-153/D-159), curva D-154, fiducia coerente col risultato (D-160/D-163, primo giro), testi generici D-162, stabilità CI (PO-128: C128-01 città, C128-02 e14 o1, D-169) | catena completa 3/3 verde su 0975f18; CI 7/7 verde su 0975f18 (grafica 360/375/412) | Pubblicata. Due verifiche precedenti fermate per la CI rossa su e14 o1: la causa vera (nomi 1-2 px più larghi in Chrome 156) l'ha misurata S-08; quella del carattere di riserva è ritirata |
| 0.37.0 | 2026-10-17 14:46 | d2fdf88 | Tastiera nei riepiloghi e fra le scene (C34-01, C34-08 / D-142), fiaccolata e30 (C33-02 / D-141), etichette mappa (C33-03…05) | riepilogo 6/6 col fuoco sul titolo; Tab stagione 1 da 10 a 2; e30 o4 69/69 lontano dal municipio | pubblicata; collaudo C-037 |
| 0.36.0 | 2026-10-17 08:43 | fdad627 | C35-01: salvataggio vecchio in e35 non riapre la chiamata opposta sulla barca | c34-dati 12/12 (11/12 senza correzione) | pubblicata; collaudo C-036 |
| 0.35.0 | 2026-10-17 05:21 | e7f00cc | Dati e testi coerenti con le scelte (C34-02/03/06/09/10) | c34-dati 11/11 (8/11 coi dati 0.34.0) | pubblicata; collaudo C-035 |
| 0.34.0 | 2026-10-16 21:51 | acf1151 | «?» nella barra (D-139), fuoco tastiera (C32-01), versione tablet/PC (C32-06), e17 (C32-02) | «Conferma» ≥ 44 px a 360…1366; e17 28-29 via / 10-11 verso | pubblicata; collaudo C-034 |
| 0.33.0 | 2026-10-16 17:52 | 57229a4 | Espressioni dalla tensione (PO-059, D-133) | rosso C96P01: 29 righe | pubblicata; collaudo C-033 |
| 0.32.0 | 2026-10-16 16:10 | c15c617 | Pastiglie a tetto 0 (D-136), corteo e30 (C31-02), C32-03/05 | pastiglie sopra i nomi 0/142 (rosso 7) | pubblicata; collaudo C-032 |
| 0.31.0 | 2026-10-16 13:55 | 8eb495e | Corteo e04 dal bordo giusto (C29-02), «Urgente!» nella guida (C29-04) | catena 3/3 su 7e28ab4 | pubblicata |
| 0.30.0 | 2026-10-16 11:58 | 98f6109 | C31-01 guardiano fase e21, C31-03 «familiari» in e35 | meta-fase verde, rosso senza fase | pubblicata |

Le release precedenti alla 0.30.0 sono registrate nei commit «STABILITA: … (rilascio x.y.z)» di main e in docs/RELEASE_HISTORY.md.
