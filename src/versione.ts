// GAME_VERSION aumenta a ogni rilascio. Ogni valore porta un commento: causa, misura, guardiano.
//
// Le versioni da 0.1.0 a 0.10.0 sono in docs/RELEASE_HISTORY.md (D-233: limite di 400 righe per modulo).
//
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
// 0.21.0 – rilascio delle 13:30 del 15/10: D-127, il corteo va nel verso che dicono i testi (C24-07).
//   causa: negli episodi senza partita (e30, e17) il corteo sulla mappa camminava verso lo stadio mentre i testi lo
//   facevano partire dallo stadio («dallo stadio verso il municipio», «tutti devono tornare a casa»).
//   misura: campo facoltativo `verso` sugli eventi in schema e tipi; e30 silenzio_strada/fiaccole ed e17 dopo_corteo
//   «dallo_stadio»; folla.ts: scritto nei dati vince, altrimenti la partita decide; catena completa 3/3.
//   guardiano: tests/corteo-verso.test.ts (rosso C73V01: il corteo torna verso lo stadio).
// 0.22.0 – rilascio anticipato del 15/10 (PO-113): collaudi C-026 e C-027.
//   causa: C27-01 il corteo della chiamata andava verso lo stadio mentre quello dell'ondata ne usciva (e30, e17);
//   C26-02/04/05 testi che contraddicevano la mappa dei quartieri e il calendario; C26-06 la sfida senza curva di casa.
//   misura: esceDinamica in folla.ts legge il verso del corteo dell'ondata (e30 ondate 2 e 4, e17 ondata 4: via dallo
//   stadio anche la chiamata); e17 piazza17b «dallo_stadio»; e32 «quinto derby»; e33 gli Arches tornano a casa a
//   piedi; e08 ed e21 partite di coppa; campo `partita` (D-130) nei dati di e07, e13, e21, e25, e28, e31.
//   guardiano: tests/corteo-verso.test.ts (rossi C73V01 e C74D01); limiti di lunghezza in tests/brevita.test.ts.
// 0.23.0 – rilascio delle 23:00 del 15/10: consegna C-026 della sviluppatrice.
//   causa: C26-01 la sfida «Stasera» mostrava i gemellati come terza squadra (e15, e27); C26-03 a 375×667 il verbale
//   mostrava ancora la vignetta in 30/36 episodi (D-126 d); C26-11 pastiglia sotto il disco del Piazzale (e06) ed
//   etichette sovrapposte (e13, e16); vignetta misurata sul riquadro scalato dalla molla d'entrata (instabile su e25).
//   misura: catena completa 3/3 sul ramo della sviluppatrice (24455d1) e sulla principale; dettagli in
//   coordination/handoffs/sviluppatrice/C26-rapporto.md.
//   guardiano: rossi C26 della sviluppatrice e C78V01 (vignetta dall'impaginazione, prova della molla).
// 0.24.0 – rilascio del 15/10 sera (PO: «rilascia il prima possibile»): seconda consegna C-026/C-027 e C28-04.
//   causa: C26-06 la riga «Stasera» mostrava un solo club dove la squadra di casa non ha curva (e07 e altri 5);
//   C27-03 errore «reading 'on'» in StratoCitta (2/150 aperture); C27-06 pastiglia sopra il nome in e19;
//   C28-04 striscione dello Square (club di Valmora) nella curva del Railhead in e02.
//   misura: catena completa 3/3 sul ramo della sviluppatrice (5bea0c2) e sulla principale; mappe con pastiglie
//   sopra i nomi da 19 a 7 ondate su 142; dettagli in coordination/handoffs/sviluppatrice/C27-rapporto.md.
//   guardiano: rossi C79P01 (partita), C80R01 (renderer), C81P01 (etichette, tetto 7 ondate).
// 0.25.0 – rilascio del 16/10 notte (PO: «rilascia il prima possibile»): D-128 e D-129.
//   causa: D-129 lo spicchio e «Urgente!» comparivano su 415/498 chiamate (bastava un evento qualsiasi sul settore);
//   D-128 simboli degli stemmi scollegati dal nome (calderone, penna) o illeggibili (pigna, campanile).
//   misura: con D-129 le chiamate urgenti sono 235/498 (eventi con pressione ≥ 4); stemmi nuovi per Square (fontana),
//   Garden (albero nel cortile), Pinegrove (pigna), Belltower (campanile), con foto a DPR 1 e 3; id nei dati aggiornati.
//   guardiano: tests/urgente.test.ts (rosso C82U01), guardiano degli stemmi (rosso C83S01).
// 0.26.0 – lotto «tutto il backlog» (D-131), primo pezzo: testi delle stagioni 2–3, cortei e fasi dai testi.
//   causa: PO-084/085 in e13–e36 73 fonti oltre 80 caratteri e 217 chiamate oltre 100; C27-02 senza stadio pieno il
//   viale finiva al centro della mappa e non al municipio (e30); C27-04 fase della partita sbagliata sulla mappa in
//   e07, e21, e23, e27 (dipendeva solo dagli eventi «curva»).
//   misura: 0 testi oltre i limiti in e01–e36; campi `meta` (e30 strada da Kiln → piazza del municipio) e `fase`
//   (e07 o2-3 partita, o4 dopo; e21 o2 partita, o4 dopo; e23 o2 prima; e27 o1 prima, o4 dopo) nei dati.
//   guardiano: tests/brevita.test.ts esteso a e01–e36; tests/meta-fase.test.ts (rossi C85M01, C84F01) col caso sui dati veri.
// 0.27.0 – correzione urgente dal collaudo C-029.
//   causa: C29-01 dalla 0.23.0 la vignetta di sala e verbale appariva e spariva a ogni frame in 13–16 finestre su 128
//   (1366×768, 360×700, 393×720…): pagina che salta, clic a vuoto 5/30. Da nascosta l'altezza veniva letta dal CSS e
//   lo spazio libero risultava doppio. C29-03 la sfida mostrava gli ospiti per primi in e02, e03, e18, e24, e26.
//   misura: sonda c29-sala-tremolio 119 → 0 cambi in 120 frame a 1366×768 e 360×700, 0 a 360×760 (vignetta 78,6 px);
//   giro foto a 360: verde 0 righe, rosso C89V01 19 righe (sala e verbale). Campo `partita` nei 5 episodi.
//   guardiano: foto-c22.mjs conta i cambi in 30 frame a 1366×768 e 360×700 (rosso C89V01); tests/sfida.test.ts C29-03.
// 0.28.0 – correzioni dal collaudo C-030.
//   causa: C30-01 in e30 ondata 2 il corteo «dallo stadio verso il municipio» se ne allontanava: con la meta sul municipio
//   (C27-02) il verso «dallo_stadio» percorreva il viale all'indietro; C30-02 e21 ondata 3 senza fase (spalti che si
//   svuotavano a partita in corso); C30-03 due testi accorciati che avevano cambiato senso (e24 busta, e35 resa).
//   misura: sonda pixel e30 rispetto al municipio, ondata 2 0/69 → 69/69 verso, chiamata 39/39; ondata 4 69/69 via.
//   guardiano: tests/corteo-verso.test.ts aggiornato (rossi C73V01, C74D01 su e30 ondata 4), tests/brevita.test.ts.
// 0.29.0 – tablet e PC, correzioni piccole (D-132), più la rifinitura e07–e09 (D-138).
//   causa: C28-01 la tela della mappa non seguiva il cambio di forma (fascia scura, anche a 360); C28-02 col mouse
//   un'opzione appariva già scelta sotto il puntatore fermo (106/156 chiamate); C28-09 il fuoco della tastiera si perdeva
//   (82/412 azioni); C28-11 versione lontana dalla colonna; C29-05/06 stemmi (rosso C83S01, pigna sotto il pixel);
//   rifinitura col PO: e08 coppa senza vincitore, presidente dello Skyfield in 5 episodi di fila.
//   misura: catena completa 3/3 sul ramo della sviluppatrice (7fd94a5), foto a 1024×768 e 1366×768; e08 «il Kiln passa
//   ai rigori»; presidente in e05, e06, e09.
//   guardiano: rossi C86T01 (tela), C87H01 (evidenza col puntatore fermo), C88F01/C89C01 (fuoco), C90V01 (versione),
//   C92P01 (pigna); limiti di lunghezza dei testi.
// 0.30.0 – due rilievi del collaudo C-031 sulla 0.28.0.
//   causa: C31-01 togliendo `fase` da e21 o3 i test restavano verdi (correzione C30-02 senza guardiano); C31-03 in e35
//   «parenti» contro «familiari».
//   misura: tests/meta-fase.test.ts verde, e rosso togliendo la fase di e21 o3; e35 fine_trattativa «i familiari aspettano».
//   guardiano: tests/meta-fase.test.ts (controllo sui dati veri di e21 o3); limiti di lunghezza dei testi.
// 0.31.0 – due rilievi del collaudo C-029 (sviluppatrice).
//   causa: C29-02 in e04 il corteo delle strade senza meta partiva dal bordo sbagliato del viale (45/69 «via»);
//   C29-04 il cartello «Urgente!» non era spiegato nella guida.
//   misura: catena completa 3/3 sul ramo della sviluppatrice (7e28ab4); viale dal bordo giusto; guida.5 spiega «Urgente!».
//   guardiano: tests/viale.test.ts (rosso C93V01), tests/urgente.test.ts; limiti di lunghezza dei testi.
// 0.32.0 – pastiglie a tetto 0 (D-136), corteo di e30 dal bordo dello stadio (C31-02), tre rilievi del collaudo C-032.
//   causa: C28-14 e 7 casi in cui una pastiglia copriva un nome; C31-02 in e30 il viale con meta partiva dal bordo e il
//   corteo si avvicinava allo stadio (57/69); C32-03 in e07/e08 l'offerta del club firmata «il vice»; C32-05 e08 ai
//   rigori senza supplementari, e il vice che «vince la scommessa» dopo aver detto «stavolta non scommetto».
//   misura: catena completa 3/3 sul ramo della sviluppatrice (1a42d48): pastiglie sopra i nomi 0/142 ondate a 360/375/412
//   (rosso C94N01: 7); e30 ondate 2-4 via dallo stadio 69/0, verso il municipio 62-64; e07/e08 fonte del club.
//   guardiano: rossi C94N01, C95S01; tests/voci-club.test.ts (rosso 2/2); limiti di lunghezza dei testi.
// 0.33.0 – espressioni dalla tensione (PO-059, D-133).
//   causa: le vignette di fine ondata e del verbale avevano sempre la stessa faccia, qualunque fosse la serata.
//   misura: catena completa 3/3 sul ramo della sviluppatrice (f0d6257); tono dalla tensione più alta dell'ondata
//   (fino a 1 calmo, 2-3 teso, da 4 critico), festa a braccia alzate e mano alla nuca nel verbale; foto a 360/412/1024,
//   uomo e donna, DPR 1 e 2.
//   guardiano: tests/espressioni.test.ts (soglie, un'espressione per tono), controllo data-tono ↔ vignetta nel giro foto
//   (rosso C96P01: 29 righe).
// 0.34.0 – «?» nella barra fissa (D-139), fuoco della tastiera (C32-01), versione su tablet e PC (C32-06), e17 (C32-02).
//   causa: C30-04 il «?» finiva sotto la barra fissa a 375×667 e 1366×768; C32-01 il fuoco recuperato andava in cima alla
//   scena (18 Tab per conferma-passo invece di 2); C32-06 su tablet e PC la versione toccava i pulsanti (8/21 scene);
//   C32-02 in e17 la strada di Kiln senza meta: «me_lo_dovete» 23 verso / 16 via lo stadio.
//   misura: catena completa 3/3 sul ramo della sviluppatrice (56f8fe2); «?» libero a 360/375/412/1366, «Conferma» ≥ 44 px;
//   e17 me_lo_dovete 28-29 via / 10-11 verso lo stadio, ondata 4 51-52/17-18 (rosso C95S01 69/0 via dal municipio).
//   guardiano: rossi C96A01 («?»), C97F01 (fuoco), C98V01 (versione); guardiano C17 rifatto; tests/meta-fase.test.ts (e17).
// 0.35.0 – dati e testi coerenti con le scelte del giocatore (rilievi del collaudo C-034).
//   causa: C34-03 in e35 la barca bloccata in ondata 1 risultava «tornata» in ondata 3 e nel verbale; C34-02 in e21 i
//   costi di pullman21 dicevano il contrario degli effetti; C34-06 verbali di fallimento di e13/e17 con fatti non accaduti;
//   C34-09 la «i» dell'ondata 1 di e21 smentiva la fonte del comune; C34-10 in e02 un'opzione spariva senza spiegazione.
//   misura: tests/c34-dati.test.ts 11/11 verdi, 8/11 rossi coi dati della 0.34.0; 252/252 test; catena logica verde.
//   guardiano: tests/c34-dati.test.ts (racconto della barca nei due rami, costi ↔ effetti, verbali di fallimento).
// 0.36.0 – C35-01: salvataggio vecchio dentro e35 non riapre la chiamata opposta sulla barca.
//   causa: un salvataggio della 0.34.0 fermo dopo blocca_barca e già risposto a barca_ritorno, ripreso nella 0.35.0,
//   riceveva anche barca_ormeggiata: due chiamate che si smentiscono ed effetti contati due volte.
//   misura: tests/c34-dati.test.ts 12/12 verdi, 11/12 senza la correzione; catena logica verde.
//   guardiano: tests/c34-dati.test.ts (barca_ormeggiata esclude chi ha risposto a barca_ritorno).
// 0.37.0 – tastiera nei riepiloghi e fra le scene (C34-01, C34-08 / D-142), fiaccolata di e30 (C33-02 / D-141),
//   etichette sulla mappa stabili e vicine al proprio disco (C33-03…05).
//   causa: C34-01 Invio su «Conferma» portava il fuoco su «Sì, conferma» fuori finestra e il secondo Invio confermava senza
//   riepilogo (6/6); C34-08 entrando in una scena nuova servivano 10 Tab invece di 2; C33-02 in e30 o4 la fiaccolata tornava
//   al municipio; C33-03 tocco coperto in e06 posando le unità una alla volta; C33-04 etichette diverse fra due giri
//   (2/426); C33-05 pastiglie più vicine al disco di un altro settore (44 contro 36).
//   misura: catena completa 3/3 sul ramo della sviluppatrice (a72fdd3); riepilogo 6/6 col fuoco sul titolo; Tab stagione 1
//   da 10 a 2; e30 o4 69/69 lontano dal municipio; C33-04 0 righe (rosso 95); C33-05 30/18/8.
//   guardiano: rossi C104R01, C105S01, C99M01, C102D01, C103P01; guardiano C32-01 ristretto al fuoco perso dentro la scena
//   (rosso C97F01 290 righe).
// 0.38.0 – nomi sulla mappa mai coperti (C33-01 / D-145), settori copribili (D-146) e dati coerenti (C35-02/04/05),
//   finale di e14 legato alla scelta (D-158).
//   causa: C33-01 pastiglie sopra i nomi e tocchi che «rubano» il nome di un altro settore (e35 o2 a 360: toccando
//   «Perimetro della banca» si ritirava un'unità); C34-04/C35-03 e17 piazza e e21 quartiere scoperti per forza
//   (1000/1000 in o4); C35-02 risposte sparite senza spiegazione in e26/e27; C35-04 verbale di e35 col porto (88/734);
//   C35-05 «curva agitata» sul piazzale di e13; C-036 finale di e14 troppo neutro.
//   misura: catena completa 3/3 sul ramo della sviluppatrice (8ab0f2e): nomi rubati 0/0/0 a 360/375/412 (rosso C106T01),
//   pastiglie sui nomi 0 (rosso C100N01: 3 ondate); dati S-02 catena 3/3 su e261e8c: e21 quartiere scoperto 1000→364
//   (attento), fallite casuale e17 61,4→58,1%, e21 66,9→59,7%; finale e14: indagini → verbale proprio, tipografia → base.
//   guardiano: rossi C100N01, C106T01; tests/settori-copribili.test.ts, tests/opzioni-spiegate.test.ts,
//   tests/finale-e14.test.ts (rosso __NO_PO086); esiti con «dopo».
//   aggiunte prima dell'uscita (prima verifica fermata, CI grafica rossa su e14 o1): coerenza delle scelte D-153/D-159
//   (S-03: chiamate che smentivano le scelte, risposta esaurita disattivata con l'unità nominata), fonti false senza costo
//   D-152, curva D-154 senza cali nelle 3 stagioni e C35-06 (S-02), testi C36-03…07 e C37-04/07/09; guardiano degli
//   schieramenti che aspetta i caratteri (rosso VALMORA_SENZA_FONT=1). RITIRATO: non era la causa del rosso CI.
//   seconda verifica fermata dopo le aggiunte: fiducia coerente col risultato D-160/D-163 (S-05, primo giro;
//   il secondo giro D-169 entra in un rilascio successivo), testi generici D-162 (S-02), stabilità della CI PO-128 (S-08):
//   C128-02 vera causa di e14 o1 – nomi 1-2 px più larghi in Chrome 156 superavano una soglia di costo (D-169);
//   C128-01 città ruotata durante l'animazione d'ingresso; job della CI saltati sui push di soli documenti
//   (meno e-mail «Run failed»). misura: CI su 9e892c29 7 job su 7 verdi al primo tentativo; catena completa 3/3 di
//   S-08 (02:08→02:56). guardiano: foto-c128, tests/fiducia-verso.test.ts, grafica in matrice per larghezza.
//
// 0.39.0 – finale in tre tempi ed epilogo (D-161, D-164, D-165, D-171), annullare una risposta toccata per sbaglio
//   (PO-121), fiducia coerente col risultato secondo giro (D-169, D-170), versione nel margine sinistro (D-168).
//   causa: PO-129/PO-130 (dopo e36 solo «Alla mappa della città», da e12 dritti a e13, finale poco epico); PO-121
//   tocchi involontari sulle risposte; C38-04 opzioni che muovono la fiducia contro il risultato; C37-01/03/08.
//   misura: S-09 catena 3/3 su 3186061 e CI verde (epilogo, Fine stagione a e12/e24, fischio e tavole coi busti
//   della seconda bozza PO-119); S-05 opzioni nel verso sbagliato 19/371 → 9/361, fallite del casuale identiche
//   36/36, curva D-154 0 cadute; S-01 catena 3/3 su 4d98e9e e CI 7/7 su 11e7e8b. Correzione del commento 0.38.0
//   (C38-06): i testi generici sono D-151, D-162 è la curva crescente fra le stagioni.
//   guardiano: rossi C161E01, C164F01, C165F01, C165T01 (epilogo e tavole), C107A01 (annullamento), C113V01
//   (versione), C111E01 e C112R01 (C37-03/08), guardiano fiducia a 165 voci.
//
// 0.40.0 – correzioni dei collaudi C-038 e C-039, fiducia terzo giro, verbale che confronta le risposte, scena del tono.
//   causa: C38-01/C39-01 «nessuna unità a coprirlo» col mediatore schierato; C39-02 unità impegnate in un'ondata
//   precedente non contate; C38-02/C39-04 «non deve passare il giallo: è arrivata al giallo»; C38-03/C39-05 «Cosa ti
//   ha penalizzato» contro la misura; C38-04/C39-03 fiducia ancora contro il risultato in 6 episodi; C39-06 furgone
//   «mai annotato»; C39-07 settore degenerato senza nome; C39-08 squadra «sul nastro» mai mandata; C33-06/07/09.
//   misura: C38-02 72/72 → 0/72 (rosso __NO_C38G01); C38-01 rosso C115M01 2/2 → verde 2/2 («presidiato, ma il
//   mediatore qui non basta», D-173); C39-02 e25 0 → 2 steward impegnati (rosso __NO_C116R01); C38-03 voci
//   contraddette 366/4051 → 0/2745, tabelle precalcolate (verbale 498 ms → 0,021 ms in mediana; pacchetto +63 kB);
//   C38-04 episodi con correlazione fiducia/fallita ≥ 0: 6 → 0, fallite del casuale identiche 36/36; protagonisti
//   nella seconda bozza PO-119 (la quarta, approvata con D-176, arriva in un rilascio successivo).
//   guardiano: tests/fiducia-verso.test.ts (per episodio, rosso __NO_C16001), tests/confronto.test.ts (freschezza
//   delle tabelle), tests/c39-dati.test.ts, rossi __NO_C38B01, __NO_C39R07, C114P01, guardiano foto-po119.
//
// 0.41.0 – protagonisti della quarta prova nel gioco, correzioni del collaudo C-040, terza stella ricalibrata.
//   causa: PO-119/PO-133/PO-135 (protagonista femminile poco riconoscibile, braccia incollate al busto: quarta prova
//   approvata con D-176); PO-136 braccio mancante nella mano alla nuca (C117B01); PO-137 spigoli delle braccia (D-178);
//   C40-01 il confronto smentiva la partita giocata; C40-02 fiducia in salita nelle partite fallite; C40-03 «le tue
//   risposte» ripetuto; C40-04 mediatore con unità impegnate senza spiegazione; C40-05 busta consegnata detta «chiusa».
//   misura: D-180 episodi con Δ fiducia media > 0 nelle fallite 13 → 0, voci del confronto contraddette 598 → 0;
//   D-181 terza stella con fiducia ≥ 8 in e02/e10/e18/e26/e33 (episodi con 3★ alla strategia attenta 19 → 17);
//   quarta prova in ogni vignetta (guardiano persona-ovunque); governo+logica 3/3 verdi sulle consegne (D-177).
//   guardiano: tests/persona-ovunque.test.ts, tests/braccia.test.ts (rosso C117B01), guardiano degli spigoli (rosso
//   C118S01), foto-po119, tests/fiducia-verso.test.ts per episodio, rossi C119R01 e C120U01 (C40-03/04).
//
// 0.42.0 – correzioni del collaudo C-041 (bilancio del verbale, costo delle unità, testi dello schieramento).
//   causa: C41-01 «Cosa ti ha penalizzato» con risposte su settori rimasti sotto controllo e la risposta decisiva
//   esclusa dal limite di 3; C41-02 «Cosa ti ha aiutato» con risposte senza effetti e righe vuote «Ondata N ·»;
//   C41-03 risposte con costo in unità offerte con tutte le unità schierate (D-183: si dichiara il costo, l'equilibrio
//   non cambia); C41-04 testi che smentivano lo schieramento.
//   misura: su 828 partite pesi su settori sotto controllo 222 → 0, righe vuote 199 → 0, pesi decisivi esclusi 37 → 0,
//   voci contraddette 0/2114; risposte con costo che dicono «dalla prossima ondata» 0/230 → 230/230; testi che
//   smentiscono lo schieramento nei 5 casi del collaudo 5 → 0.
//   guardiano: tests/confronto.test.ts (rossi __NO_C41B01, __NO_C41B02), tests/costo-quando.test.ts (rossi C183Q01,
//   C183P01), tests/testi-schieramento.test.ts (rosso C41T01).
// 0.43.0 – home rinnovata, correzioni del collaudo C-042 e C41-05…08, rifinitura dei testi di tutti i 36 episodi.
//   causa: PO-140 fase 1 (home, D-179); C-042 (aiuti su settori scoperti, «dalla prossima ondata» all'ultima ondata,
//   testi sullo schieramento cercati per chiave e non per formula); C41-05…08 (verbale fallito senza spazio, D-185);
//   schede di rifinitura e10–e36 (D-186, D-189: costi promessi applicati, patti −1, doppioni tolti, testi che
//   smentivano le scelte resi neutri; D-190: dove tocca D-160 si correggono i testi, non la fiducia).
//   misura: scorrimento a 360 px (S-12 su 0.42.0 → ora) home 122 → 0, sala 538 → 0, briefing 817 → 0, verbale
//   1395 → 0; formule di schieramento su tutti i testi → 0; 28/28 risposte con costo all'ultima ondata dicono
//   «fino a fine serata»; vitest 375/375.
//   guardiano: tests/testi-schieramento.test.ts (rossi C41T01, C42T01), tests/costo-quando.test.ts (rosso C42U01),
//   tests/coerenza-d153.test.ts (testi neutri D-189), guardiani di altezza della catena grafica in CI.
// 0.44.0 – imprevisti senza timer su tutti i 36 episodi, correzioni del collaudo C-043, schermi bassi, «Annulla» a 3 s.
//   causa: PO-022 (D-190, D-194, D-195: un imprevisto per ondata da risolvere subito, senza conto alla rovescia);
//   C-043 (D-196, D-197: tavola «carte» e riga della pista della cattura nell'epilogo, testi neutri sullo schieramento,
//   prima stella nel verbale fallito, «il comando approva» senza fiducia, «Chiudi un occhio» −2 pressione +1 tensione,
//   virgolette annidate, e13 e e36 coerenti con i dati); PO-052/058 (D-187, D-191, D-193, D-197: mappa solo se entra
//   nel rapporto, blocco unico nella risposta con mappa piena, città compatta, «Fine stagione» e home senza scorrimento);
//   PO-142 (D-198: «Annulla» da 5 a 3 s).
//   misura: 142 imprevisti, 0 blocchi, 3★ del bot attento 17 → 17, perse del casuale per stagione +2 punti circa, margine
//   D-162 fra stagione 1 e 2 da 0,38 a 1,52; testi «resta coperto/calmo» 44 → 0, citazioni annidate 74 → 0, «comando
//   approva» senza fiducia 11 → 0; scorrimento a 360×760: «Fine stagione» 250 → 0 px, home con salvataggio 764 → 760;
//   risposta a 360×640 116 px (mappa piena, D-197); vitest 393/393.
//   guardiano: tests/imprevisti.test.ts (rossi S14I01, C190I01), tests/testi-c43.test.ts (rossi C4301P, C4305),
//   tests/testi-schieramento.test.ts (formule C43-02), tools/sonda-altezze.mjs (rosso C197R01), tools/foto-epilogo.mjs
//   (rosso C196V01), tools/foto-home.mjs (rosso C187C01), tools/foto-po121.mjs (rosso C198A01).
// 0.45.0 – correzioni del collaudo C-044: imprevisti di e01–e06 col modello degli altri episodi, testi, schermi a 760.
//   causa: C44-01 (e01–e06 tenevano unità impegnate e «lascia correre» con effetto, D-201; e02 D-202), C44-03/04/05/07
//   (scadenze nel testo, settore sbagliato in e31, «il comando apprezza» senza fiducia, costi ripetuti), C44-08/09
//   (risposta a 375/412×760 e città con 36 episodi che scorrevano).
//   misura: unità impegnate dagli imprevisti 16 → 0, «lascia correre» con effetto 13 → 0, stelle dei bot invariate in
//   e01–e06, D-180 su e02 −0,266, D-160 21 → 20 (soglia 30); costi di «lascia correre» ripetuti 43 → 0; risposta a
//   412×760 24 → 0 px, a 360×640 116 → 68 px; città con 36 episodi 3 → 0 px; vitest 398/398.
//   guardiano: modelloImprevisto (src/dati/imprevisti.ts, rosso C4401), rossi C4403, C4404, C4405, C4407,
//   tools/sonda-altezze.mjs a 375/412×760 e città36 (rossi C201R01, C201C01).
// 0.46.0 – correzioni del collaudo C-045: etichette degli imprevisti, guida, verbale, e36; rapporti senza scorrimento.
//   causa: C45-01 (9 etichette di imprevisto che nominavano steward o mediatore senza impegnarli; il guardiano C37-05 non
//   le vedeva), C45-02 (la guida parlava di transenne, che esistono solo in e03), C45-03 (nel verbale una scelta che alza la
//   pressione compariva fra gli aiuti senza spiegazione: dicitura «con le altre risposte andava peggio» quando tutti gli
//   effetti vanno contro, D-205), C45-04 (e36: l'imprevisto della cassa ripeteva «musica spenta»), C45-06 (rapporti senza
//   mappa che scorrevano fino a 34 px a 360×760).
//   misura: etichette smentite 9 → 0; dicitura in 4.775 voci su 36.108 verbali, 0 senza; rapporti costruiti a 360×760 che
//   scorrono 7 → 0 su 740; vitest 407/407.
//   guardiano: tests/c45.test.ts (rossi C4501, C4502, C4503, C4504), C37-05 esteso agli imprevisti, tools/sonda-altezze.mjs
//   con i 7 rapporti costruiti (rosso C203R01).
// 0.47.0 – home fase 2, imprevisti più bassi, rifinitura e01–e03, correzioni del collaudo C-046, build AAB.
//   causa: PO-140 fase 2 (D-208/D-210: la striscia coi personaggi prende il posto della testata della città, vignetta al
//   primo passo della guida); C45-05 (chiamate d'imprevisto alte fino a 545 px a 360×760: via vignetta e riga, D-206/D-207);
//   PO-035 (rifinitura e01–e03, D-209); C46-01/02/05 (testi di e36 ed e05), e22/e27 (mezzo ripetuto nelle etichette);
//   mediana degli imprevisti salita a 286 con le etichette neutre (D-215); PO-144 (AAB di rilascio, D-212/D-214).
//   misura: imprevisti a 360×760 massimo 545 → 331, mediana 466 → 278 (soglie 339/285); città senza scorrimento a
//   360/375/412×760, con 36 episodi compresi; CI «catene» 10/10 job (con «aab», versionCode 47000).
//   guardiano: rossi C206I01, C210C01, C210G01, C215L01; tests/d211.test.ts (D211-01/02/05/06); job CI «aab».
// 0.48.0 – correzioni del collaudo C-047 e privacy policy per il Play Store.
//   causa: C47-01 (in e36 il vice parlava di «tre interim, tre buste» mentre e01, e34 e la guida fanno del protagonista il
//   quarto), C47-02 (il riepilogo dello schieramento scorreva a 360/375/412×760: margini di .azioni .pulsante), C47-03 (le
//   stelle coprivano i dischi degli altri episodi sulla città con 36 episodi); PO-145 (il Play Store chiede la privacy
//   policy dentro l'app e su un URL pubblico, D-217; contatto korward.devteam (chiocciola) gmail.com, D-220 e D-222).
//   misura: riepilogo e36/e22 19/11 → 0 px; stelle sui dischi altrui 1460 → 0 px² a 360 (282/270 → 0 a 375/412);
//   richieste di rete esterne in una partita e01–e03: 0 su 3152 (Chromium); home a 0 px di scorrimento a 360/375/412×760.
//   guardiano: rossi C218R01, C218S01; parte «riepilogo» di tools/sonda-altezze.mjs; C17-12 esteso a stelle e stagione 3;
//   C145H01, C145T01, C145W01 e segnaposto del contatto (tools/aab.mjs, tests/privacy.test.ts).
//   Inoltre D-219 (nel riepilogo di e36 il tasto «Home» copriva un nome: 56 → 0 px², rosso C219H01) e D-221 (riepilogo che
//   scorreva sotto i 760 px: 360×640 115 → 0 px, 375×667 88 → 0, rosso C221R01; scorrimento bloccante a ogni altezza).
// 0.49.0 – menu «Altro» senza scorrimento a ogni altezza e due correzioni di testo in e36.
//   causa: C48-02 (il menu «Altro» aperto faceva scorrere il titolo a 360×640 fino a 265 px, voci sotto la piega, D-224);
//   rilievi di S-24 (D-227): nel finale «sostituito» il bar diceva «hai perso il posto, non la scommessa» mentre il verbale
//   fa dire a Malvasi «L'ho vinta io»; «il questore», titolo dell'ordinamento reale, compariva 7 volte in e36.
//   misura: scorrimento col menu aperto 0 px a 360/375/412×640, 375×667, 360/375/412×760, con e senza salvataggio (prima
//   fino a 265); «questore» 7 → 0 nei testi; chiamate di e36 entro 100 caratteri (PO-085).
//   guardiano: controllaAltro a ogni altezza con SOGLIA_ALTRO 0 e rosso C224A01 (tools/foto-home.mjs); tests/brevita.test.ts.
// 0.50.0 – titolo con salvataggio e città con 36 episodi senza scorrimento anche sugli schermi bassi.
//   causa: C49-01 (titolo con una partita salvata: 29/10/10 px di scorrimento a 360/375/412×640) e C49-02 (città con 36
//   episodi in stagione 3: 99/80/76 px a 640, 53 a 375×667), anteriori a D-210; i guardiani misuravano la città solo a 760 e
//   il titolo solo senza salvataggio (D-230).
//   misura: 0 px a 360/375/412×640, 375×667 e 360/375/412×760 su titolo con salvataggio e città nelle tre stagioni, con
//   ognuno dei 36 episodi scelto. Strumento: il braccio C187V01 non è più cieco sotto carico (0 su 20, prima 2 su 15).
//   guardiano: parte città36 di tools/sonda-altezze.mjs a ogni altezza e stagione, titolo anche con salvataggio, soglia 0,
//   rosso C230C01; bracci a coppia C201C01,C230C01 e C187C01,C230C01; campionaVersione a ogni fotogramma.
// 0.51.0 – «Annulla» e «Conferma» al posto del conto alla rovescia di 3 s sulle risposte (PO-148, D-236); verbale sugli schermi
//   bassi (D-234).
//   causa: richiesta del PO: la risposta partiva da sola dopo 3 s se non si annullava (PO-121/PO-142); D-234 verbale fallito a 360×640.
//   misura: dopo il tocco nessun effetto prima di «Conferma» (anche dopo 3,6 s a 360×640); pulsanti nella finestra e tocco ≥44 px
//   a 360/375/412×640/667/760 e 1366×768; scorrimento della chiamata e01 prima del tocco invariato, dopo il tocco −8 px.
//   guardiano: controllaAnnulla in tools/foto-po121.mjs, rossi C236C01, C236A01, C236T01, C107A01; ritirati ANNULLA_SECONDI e
//   C198A01.
// 0.52.0 – città: scena in testa più alta, mappa più alta e pulsanti dentro la scheda (PO-149, D-237).
//   causa: foto del PO a 412×915: personaggi a 14-16 px dal bordo, ~130 px di giallo vuoto in fondo, «Avvia l'episodio» con
//   l'ombra a −5 px dal riquadro interno della scheda.
//   misura: striscia 96 → 193-197 px, sopra i personaggi 14-16 → 101-110 px, mappa 415 → 431 a 915 e 260 → 276 a 760,
//   pulsanti (Avvia, Tripla, Prossimo) a +4 px per lato; 640/667 invariati, scorrimento 0 in ogni stato a 360/375/412.
//   guardiano: tools/foto-po149.mjs dalla sonda delle altezze a 640/667/760/915; rossi C237S01 e C237P01.
// 0.53.0 – debito: App.tsx e stile.css spezzati prima delle idee del tester (D-241).
//   causa: App.tsx 334 righe e stile.css 400/400, al limite dei moduli, prima di aggiungere le idee A e B.
//   misura: App.tsx 334 → 265 (fasi dell'ondata in app-ondata.tsx), stile.css 400 → 201 + stile-schermate.css 201; CSS costruito
//   identico al byte (md5 uguale, verificato dalla principale); foto 375/412 identiche, 360 entro il rumore di tempo.
//   guardiano: confini (≤400 righe) nel pre-push; nessun rosso nuovo, solo struttura.
// 0.54.0 – ogni partita diversa (idea D, PO-152, D-241): seme di partita, mazzo di imprevisti, varianti di chiamata.
//   causa: il tester «dopo un po' si stufa»; missione.ts non usava il seme e l'imprevisto aveva posto fisso.
//   misura: partite diverse fra due semi per episodio 0% → min 94%, mediana 99% (100 coppie); bot 0 blocchi su 43.200 partite;
//   vittorie del casuale entro ±6 punti per episodio; SAVE_VERSION 3 (seme 0 = partita classica), salvataggi reali migrati.
//   guardiano: tools/misura-d241.mjs (soglia 90%), rosso C241D01 (0% riprodotto dalla principale).
// 0.55.0 – nuovo nome: «Varcalda – Cortina di fumo» (PO-153, D-244/D-245).
//   causa: «Valmora» è già usato (acqua minerale, un'app sul Play Store); V e A restano per tenere il logo.
//   misura: 37 «Valmora» → «Varcalda» nei testi; titolo, store, privacy e app io.github.antoniovairo.varcalda; chiavi del
//   salvataggio spostate senza perdite sui salvataggi reali 0.4.0/0.38.0/0.52.0; nel bundle «Valmora» resta solo in nomi tecnici,
//   chiavi vecchie da migrare e indirizzo del sito (cambia dopo la rinomina del repository).
//   guardiano: tests/nome-d244.test.ts + tools/nome-d244.mjs (passo email), rossi C244N01 e C244S01.
// 0.56.0 – il «nessun costo» morde dopo (idea C, PO-152, D-241): effetti ritardati sulle opzioni comode.
//   causa: il tester sceglieva sempre l'opzione «senza costo»; le scelte comode non avevano conseguenze.
//   misura: un morso per ondata in tutte le 142 ondate (167 opzioni con le varianti), arriva alla chiusura dell'ondata dichiarata
//   e la centrale lo dice nella chiusura; 138 morsi tolgono fiducia −1, 4 restano sul campo; bot 0 blocchi su 86.400 partite;
//   equilibrata 3★ 89,2% → 68,1%; SAVE_VERSION invariata (lo stato in attesa sta nelle scelte), salvataggi reali ripresi.
//   guardiano: tests/morde-dopo.test.ts e tools/misura-d241c.mjs, rosso C241C01 (167 → 0 morsi).
//   Nella stessa versione: C53-01 (D-246), la carta di imprevisto non arriva più per ultima (attenta 5,1% → 0, casuale 5,6% → 0
//   su 300 semi × 36 episodi; guardiano tests/imprevisto-d246.test.ts, rosso C246I01); indirizzo del sito …/varcalda/ dopo la
//   rinomina del repository (src/resa/collegamenti.ts).
// 0.57.0 – nome definitivo: «Vandel Falls – Cortina di fumo» (PO-155, D-249/D-250), al posto di Varcalda.
//   causa: scelta del PO dopo la verifica dei nomi (PO-154): nessuna app o gioco «Vandel Falls» sul Play Store né sul web.
//   misura: 37 «Varcalda» → «Vandel Falls» nei testi (due chiamate accorciate entro 100 caratteri); titolo, store, privacy e app
//   io.github.antoniovairo.vandelfalls; salvataggi spostati da varcalda-… e da valmora-… senza perdite sui salvataggi reali;
//   indirizzo del sito …/vandelfalls/ (repository rinominato dal PO); nel bundle i nomi vecchi restano solo come chiavi da migrare
//   e nomi tecnici.
//   guardiano: tests/nome-d244.test.ts + tools/nome-d244.mjs estesi a «Varcalda», rossi C249N01, C249S01, C244N01, C244S01.
// 0.58.0 – la mappa è la fonte (idea A, PO-152, D-241) e mappa della città ferma con scheda compatta (C52-01/02/03, D-243).
//   causa: il tester leggeva la riga di costo e sceglieva l'opzione «senza costo»; in chiamata la mappa non si toccava; la mappa
//   della città saltava fino a 110 px al tocco di un episodio.
//   misura: prima di «Conferma» 0 costi sotto le opzioni, dopo il costo per radio; settori toccabili in chiamata (bersagli 44 px);
//   mappa ferma a 279 px in 6 stati, sopra le teste ≥ 104 px e mappa 431 a 915; bundle +4,9 KB; bot 0 blocchi.
//   guardiano: tools/foto-po152-a.mjs (rossi C241A01, C241M01), foto-po149 (rosso C242M01), C241N01 per i nomi a 412.
// 0.59.0 – una mossa per chiamata (idea B, PO-152, D-241): fra una chiamata e l'altra si sposta una squadra sulla mappa.
//   causa: il tester: «il gioco si sviluppa solo nella parte sotto»; la mappa in ondata si guardava soltanto.
//   misura: una mossa per pausa (seconda rifiutata), salvata (SAVE_VERSION 4, migrazione 3→4 provata su un salvataggio vero 0.57);
//   bot su 300 semi: 0 blocchi, esiti identici, l'attento muove 69 volte su 4.179 occasioni; scorrimento della risposta invariato.
//   guardiano: tests/mossa-d241.test.ts e tools/foto-po152-b.mjs, rossi C241B01 (6) e C241M02.
//   Nella stessa versione il bilanciamento della varietà (D-252): 951 risposte di carte e varianti misurate, oltre soglia 348 → 0 a
//   360×640 (max 108 → 66), 241 → 0 a 375×667, 61 → 0 a 412×760; D-108 col seme 7 coppie rosse → 0; e24 «contenuto» raggiungibile
//   (1 su 1000, casuale). Guardiani: parte «risposte» di sonda-altezze (rosso C193R01) e passo bot col seme (rosso C252B01).
export const GAME_VERSION = '0.59.0';
