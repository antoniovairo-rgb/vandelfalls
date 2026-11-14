# Collaudo grafico — giro del 14/11/2026

Sessione collaudatrice grafica (sola lettura su `src/`, `data/`, `tools/`). Richiesta del PO: «un giro di verifica grafica e relativi suggerimenti, migliorie ed idee nuove».

- **Build misurata:** `main` a3d420e, GAME_VERSION 0.70.0 (`src/versione.ts:394`), `npm run build`.
- **Campione:** una partita dall'interfaccia su e01 ed e02 (e01 fino al verbale, e02 fino al verbale), a 360×640, 375×667 e 412×915, Chromium headless, movimento ridotto, seme di partita 1. Schieramento del giro: tutte le unità, una per settore a rotazione; risposta: sempre la prima opzione disponibile; una mossa nelle prime due risposte. **Non è il giocatore di `bot.ts`** e non copre gli altri 34 episodi.
- **Stati misurati:** 241 a 360, 243 a 375, 204 a 412 (688 in tutto); 17.498 testi misurati; 0 errori JavaScript.
- **Giri in più a 360×640 (fino al primo rapporto, 61 stati ciascuno):** movimento normale; testo al 130% (anche a 412×915); deuteranopia, protanopia, acromatopsia.
- **Strumenti:** `strumenti/` in questa cartella (Playwright; nessuno strumento del repository è stato modificato). Comandi al §6.

Legenda: **FATTO** = misurato o fotografato su questo campione · **IPOTESI** = non misurato · **GUSTO** = preferenza estetica mia.

---

## Indice — le 5 cose più importanti

1. **Dopo la mossa, a 360 e 375 px il riquadro «Mossa fatta…» copre le unità appena spostate** (D-01, alta). 2 mosse su 2 a 360, 1 su 2 a 375, 0 su 2 a 412. Il giocatore non vede dove è finita l'unità. Correzione piccola.
2. **La tensione dei settori sulla mappa è solo colore** (D-02, alta, accessibilità). In protanopia simulata i livelli 1 e 2 sono indistinguibili (ΔE 1,0); in scala di grigi tre coppie di livelli vicini stanno sotto ΔE 5. È una scelta di D-055: serve una decisione del PO.
3. **A 360 px toccando una pastiglia che si vede si può prendere un'altra unità** (D-03, media): 10 stati su 212, anche durante la mossa. A 375 e 412: 0.
4. **A 360×640 e 375×667 la chiamata arriva sotto la piega** (D-06, media): il testo comincia a 561–615 px su 640 in 36 chiamate su 36; le opzioni non si vedono senza scorrere o toccare «Rispondi». A 412×915 sta tutto in una schermata.
5. **Quello che regge bene** (FATTO): nessun testo sotto i 12 px, nessuno scorrimento orizzontale al 100%, 0 testi a piena opacità sotto la soglia di contrasto WCAG su 17.498 misure, tutte le aree di tocco ≥ 44 px (la «i» da 32 px ha l'area allargata), animazioni continue solo tre e ferme col movimento ridotto.

**Conteggio:** 16 difetti — 2 alti, 7 medi, 7 bassi. 9 migliorie. 8 idee nuove.

---

## 1. Schermate fotografate

| Foto | Contenuto |
|---|---|
| `foto/01-titolo.png` … `foto/10-chiusura.png` | titolo, città, schieramento pieno, chiamata, risposta, mossa con unità in mano, dopo la mossa, rapporto, verbale, chiusura — ognuna a 360×640, 375×667, 412×915 affiancate |
| `foto/11`–`14` | la mossa a 360, ingrandita ×2: prima, unità in mano, subito dopo, dopo 2,3 s |
| `foto/15`, `16` | ondata e rapporto in visione normale, deuteranopia, protanopia, acromatopsia |
| `foto/17` | chiamata a 360×640: a scorrimento zero, in fondo, dopo la scelta |
| `foto/18`, `19` | ritagli: scheda «fallito» della città a 412; vassoio con unità esaurite |
| `foto/20`–`22` | testo al 130% (simulato) a 360 e a 412 |
| `foto/23` | verbale a 360: primo passo, ultimo passo, fondo pagina |
| `foto/24`–`28` | le altre schermate a 360: «Altro», genere, guida, sala, briefing, schieramento vuoto, aiuto, unità scelta, avviso, info dell'ondata, scheda del settore, opzione scelta, crediti, privacy, titolo con «Riprendi», riepilogo dello schieramento |
| `foto/29-idee-bozzetti.png` | i bozzetti delle idee (`idee/mock.html`) |

Non esiste una schermata Impostazioni (confermato anche da D-271-T in `docs/governo/DECISIONI.md:304`): le voci stanno in «Altro» nel titolo (`src/resa/schermate/Titolo.tsx:30-36`, foto 24).

---

## 2. Difetti

### Alti

**D-01 · Dopo la mossa il riquadro radio copre le unità** — risposta, 360 e 375 px
- FATTO (foto 13, 14, 07): a 360×640, e01 ondata 1, dopo la mossa «squadre: Curva Kiln → Curva Skyfield» il riquadro «Mossa fatta. Previsione: nessun cambiamento.» sta sopra le pastiglie dei due settori coinvolti. Misura geometrica (rettangolo del riquadro contro rettangolo della pastiglia, copertura ≥ 25%): 360 → 4 pastiglie su 9 alla prima mossa (peggiore 79%), 3 su 8 alla seconda; 375 → 4 pastiglie alla prima mossa (peggiore 54%), 0 alla seconda; 412 → 0 su 2 mosse. Tutte le pastiglie coperte risultano `disabled`.
- FATTO sul codice: gli ostacoli del riquadro sono `[data-presenza]:not(:disabled), .settore-punto:not(:disabled), .tasto-home, .settore-nome` (`src/resa/mappa/radio-mappa.tsx:45`). Dopo la mossa le unità non sono più toccabili, quindi escono dagli ostacoli.
- IPOTESI: è questa la causa (non ho provato il braccio con la riga cambiata: non posso toccare `src/`).
- Stesso effetto, più raro, nelle risposte senza mossa: 5 stati su 36 a 360 (fino al 100% di una pastiglia), 3 a 375, 3 a 412; il riquadro copre anche nomi di settore in 2–3 stati per larghezza.
- Proposta: dopo la mossa (stato «fatta») contare tutte le pastiglie come ostacoli, anche disabilitate; se non c'è posto, usare la riga sotto la mappa che esiste già (`.istruzione-sotto`, `src/resa/stile-idee.css:55`). Guardiano: «riquadro sopra una pastiglia dopo la mossa» nella sonda po152b, con braccio rosso.
- Costo: **piccolo**. Tocca la zona mappa di D-272/D-281: da coordinare con chi ci sta lavorando.

**D-02 · Tensione dei settori: informazione affidata al solo colore** — mappa, tutte le larghezze
- FATTO sul codice: il livello cambia solo il fondo del disco (`src/resa/stile.css:127-132`, token `--tensione-0…5` in `src/resa/token.css:28-33`); D-055 lo vuole «solo colore, mai il numero» (`token.css:27`).
- FATTO (simulazione di Chromium, `strumenti/dalto.mjs`, differenza di colore ΔE76 fra livelli vicini; sotto 5 circa due tinte si confondono):

| Visione | 0-1 | 1-2 | 2-3 | 3-4 | 4-5 |
|---|---|---|---|---|---|
| normale | 42,8 | 44,3 | 36,3 | 45,5 | 34,8 |
| deuteranopia | 36,3 | 15,3 | 16,4 | 21,2 | 28,6 |
| protanopia | 37,0 | **1,0** | 21,3 | 39,5 | 37,8 |
| tritanopia | 32,5 | 39,6 | 31,4 | 39,8 | **2,3** |
| acromatopsia | **4,0** | **3,2** | 13,8 | 13,9 | **3,1** |

- Foto 15: i dischi verdi e gialli dell'ondata diventano quasi uguali in deuteranopia e protanopia.
- Nel rapporto l'informazione è anche in parole («SOTTO CONTROLLO» / «SCOPERTO», foto 16): lì il difetto non c'è. In acromatopsia le due scritte hanno quasi la stessa tinta (ΔE 2,8) ma si leggono.
- Limite: è una simulazione, non una prova con persone daltoniche.
- Riferimento: WCAG 2.2, criterio 1.4.1 «Uso del colore» — https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html
- Proposta: aggiungere una forma al colore, senza numeri (idea 1, foto 29). Costo: **medio**. **Serve la decisione del PO** perché ritocca D-055.

### Medi

**D-03 · A 360 px il tocco su una pastiglia visibile prende un'altra unità**
- FATTO (griglia 5×5 di punti sulla pastiglia disegnata, `document.elementFromPoint`): in 10 stati su 212 a 360 almeno metà dei punti di una pastiglia risponde a un altro bersaglio. Casi: `mediatore@curva Kiln` preso da `squadre@piazzale` per il 60% (schieramento, risposta, unità in mano, dopo la mossa — e01); `squadre@stazione` presa da `steward@curva_ospiti` per il 100% e `steward@stazione` per il 60–80% (e02, schieramento). A 375 e 412: 0 stati.
- FATTO: le aree di tocco da 44 px di gruppi vicini si sovrappongono fino a 655 px² (15×44).
- IPOTESI: la causa è l'ordine di disegno delle aree da 44 px, più larghe della pastiglia da 24 px.
- Proposta: quando due aree si sovrappongono, vince la pastiglia il cui centro è più vicino al dito (un solo gestore sul contenitore della mappa). Guardiano: «pastiglia visibile rubata» accanto a quello di D-145 sui nomi.
- Costo: **medio**.

**D-04 · A 360 e 375 px i nomi dei settori coprono pastiglie e dischi**
- FATTO (foto 11, 03): a 360 il nome «Piazzale dello stadio» copre metà della pastiglia degli steward di Strada da Skyfield (si legge solo «2»). Misure: nome sopra pastiglia ≥ 25% → 10 casi in 9 stati a 360 (peggiore 44%), 0 a 375 e 412; nome sopra i 22 px centrali di un disco ≥ 25% → 26 casi in 23 stati a 360 (peggiore 73%), 10 in 10 a 375 (peggiore 45%), 0 a 412.
- Il costo che dovrebbe evitarlo esiste (`suNomi`, `src/resa/mappa/etichette.ts:181`).
- IPOTESI: con 11 unità su 5 settori a 360 non c'è un posto libero e vince il male minore.
- Proposta: a 360, quando un settore ha tre o più pastiglie, raggrupparle in una sola «pila» che si apre al tocco (miglioria M-4). Costo: **medio**, zona D-279/D-281.

**D-05 · «Home» sulla mappa: tocco condiviso con un'unità, uscita senza conferma, mossa persa**
- FATTO: a 360 e 375 l'area di «Home» si sovrappone a quella di una pastiglia per 6×34 px in 28 stati (38×11 px in uno); in foto 11 e 12 il pulsante copre parte della pastiglia in alto a sinistra.
- FATTO (3 prove su 3, una per larghezza): toccando «Home» nella risposta si torna al titolo senza conferma; «Riprendi» riapre la chiamata successiva (da risposta 1 a «chiamata 2/5»), saltando la pausa in cui si poteva fare la mossa.
- Non posso confermare se il salto alla chiamata successiva sia voluto.
- Proposta: «Riprendi» torna alla risposta se la mossa di quel turno è ancora possibile. Costo: **piccolo–medio** (tocca i salvataggi: serve SAVE_VERSION se cambia il formato).

**D-06 · La chiamata arriva sotto la piega sugli schermi corti**
- FATTO: a 360×640 la prima riga del testo della chiamata sta a 561–615 px (mediana 593) su 640, in 36 chiamate su 36; la pagina è alta 916 px in mediana. A 375×667: 576–628 px, pagina 926. A 412×915: 561–613 px, pagina 915, tutto in vista. Foto 17.
- Esiste già l'indicatore «Rispondi» che porta alle opzioni: non è un blocco, è una scomodità ripetuta 5–6 volte per ondata.
- Proposta: idea 4 (mappa che si stringe quando arriva la chiamata). Costo: **medio**.

**D-07 · Città, episodio fallito a 412×915: il pulsante «Rigioca l'episodio» è tagliato**
- FATTO (foto 18): la scheda ha altezza fissa 177 px (`--citta-scheda-altezza`, `src/resa/token.css:215`, applicata con `overflow: hidden` in `src/resa/stile-home.css:61`); con la riga magenta «Fallito: va rigiocato…» il contenuto misura 193 px in 171: il bordo basso e l'ombra del pulsante spariscono. Il pulsante resta toccabile.
- A 360×640 e 375×667, nello stesso stato «fallito», la misura non trova contenuto oltre il riquadro della scheda.
- Proposta: nello stato «fallito» usare `min-height` invece di `height`, oppure portare «Fallito» sulla riga di «1 tentativo». Costo: **piccolo**. Ritocca D-243 (mappa ferma fra gli stati).

**D-08 · Testo al 130%: etichette troncate e schede tagliate** (simulazione)
- Come ho simulato: i token `--testo-*` moltiplicati per 1,3. Non è il meccanismo vero di Android.
- FATTO a 360 (foto 20, 21): l'etichetta della testata viene troncata con «…» («ONDATA 1/3 · SCHIERAME…», 234 px in 217; `src/resa/stile.css:24`): nelle chiamate sparisce il contatore «chiamata n/m». In città la linguetta «Stagione 3» esce dallo schermo (contenuto 381 px su 360). I pulsanti fissi in basso coprono righe di testo in briefing e rapporto (la pagina scorre).
- FATTO a 412 (foto 22): il titolo dell'episodio in città è troncato («PRIMO GIORNO, PRIMO DER…», 353 px in 350) e la scheda è tagliata (196 px in 171).
- Non posso confermare che l'app scali davvero il testo con l'impostazione di sistema: non ho provato il pacchetto su un telefono. Le fonti dicono che la WebView di Android lo fa (https://groups.google.com/a/chromium.org/g/blink-dev/c/rTNCw0lHmZk) e che in Capacitor lo zoom del testo si legge e si imposta con un plugin (https://capacitorjs.com/docs/v4/apis/text-zoom). In `android/app/src` e `capacitor.config.json` non ho trovato `textZoom`.
- Proposta: prima una prova sul telefono con il carattere di sistema grande; poi scegliere fra «il gioco segue il sistema» (e si sistemano i tre punti sopra) o «il gioco fissa il 100%». Costo: **piccolo** la prova, **medio** la correzione.

**D-09 · Unità esaurite e unità a riposo poco leggibili** — schieramento
- FATTO (foto 19): `.unita:disabled` ha opacità 0,4 (`src/resa/stile.css:146`): il nome scende a 2,33–2,62:1 e lo «0» a 3,0:1, a 12 px. Il contatore «a riposo» (`.unita-extra`, opacità 0,55, `src/resa/stile-schermate.css:113`; `src/resa/schermate/Schieramento.tsx:132`) sta a 3,39–4,17:1 a 12 px su un'unità ancora attiva: sotto il 4,5:1.
- Nota: WCAG 1.4.3 esenta i controlli inattivi, quindi il primo caso è leggibilità, non norma; il secondo no, perché l'unità è attiva. https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- Proposta: idea 5 (fondo a righe e «✓ tutte» a pieno contrasto); contatore a riposo a colore pieno. Costo: **piccolo**.

### Bassi

**D-10 · Verbale a 360 e 375: la nota finale finisce sotto la barra fissa.** FATTO: pagina alta 687–731 px su 640 (687–731 su 667 a 375); a scorrimento zero «Mappa: rigioca gli episodi passati.» è coperta dalla barra (foto 23). In più nel verbale la barra della fiducia sta sopra la testata, altrove sotto (foto 23 contro foto 08). Proposta: nota sopra i pulsanti; stesso ordine ovunque. Costo: piccolo.

**D-11 · Aiuto dello schieramento a 360×640: aprendolo la testata esce.** FATTO: la pagina cresce di 48 px (21 a 375, 0 a 412), foto 26 a sinistra. Proposta: aiuto sovrapposto alla mappa, come la scheda del settore. Costo: piccolo.

**D-12 · Tre pulsanti con la sola icona nello schieramento.** FATTO: «annulla l'ultima», «aiuto», «ritira tutte» hanno `aria-label` e `title` (`src/resa/schermate/Schieramento.tsx:150-152`) ma nessuna parola a schermo; `title` non compare al tocco. GUSTO: le frecce ↶ e ⟲ si somigliano. Proposta: idea 5. Costo: piccolo.

**D-13 · Manca lo stato «premuto» su Home, «i», pastiglie e dischi.** FATTO: `:active` c'è solo per `.pulsante, .opzione, .unita` (`src/resa/stile.css:34`). Proposta: stessa spinta di 3 px o un cambio di fondo. Costo: piccolo.

**D-14 · Colori dei segni «−1 / +1» della mossa.** FATTO: «−1» ciano, «+1» magenta (`src/resa/stile-idee.css:108-109`); nel resto del gioco magenta è `--colore-male` (`src/resa/token.css:24`). GUSTO: un arrivo in magenta sembra un allarme. Proposta: «+1» ciano, «−1» bianco con bordo. Costo: piccolo.

**D-15 · La versione nell'angolo sta sopra il bordo delle schede nei Crediti.** FATTO: elemento fisso a x 0, largo 16 px, alto 55 (foto 28 a sinistra); nei Crediti non svanisce (`src/resa/stile-schermate.css:195`). Proposta: nei Crediti metterla in fondo alla pagina come nel titolo. Costo: piccolo.

**D-16 · Radio: il costo è detto due volte.** FATTO (foto 05): «Calma la strada, ma ti costa una squadra. Ti costa 1 squadra dalla prossima ondata». È un testo, non grafica; lo segnalo perché allunga il riquadro che a 360 è già stretto. Costo: piccolo.

### Controllato e a posto (FATTO, su questo campione)

- Contrasto: 0 testi a piena opacità sotto 4,5:1 (3:1 per i testi grandi) su 17.498 misure. Limite: sui nomi dei settori il fondo è quello del loro riquadro nero, non la mappa sotto.
- Dimensioni del testo usate: 12, 13, 16, 20, 26, 34 px. Niente sotto 12. A 12 px ci sono 66 testi lunghi 25 caratteri o più (etichette di testata, motivi del rapporto, «Le risposte che costano unità…»).
- Aree di tocco: tutte ≥ 44×44 tranne «i» dell'ondata, 32×32 disegnati con area allargata (i 4 punti a ±21 px dal centro rispondono).
- Larghezza: nessuno scorrimento orizzontale al 100% del testo.
- Animazioni con movimento normale: continue solo `anello-pulsa` (1,8 s, unità spostabili), `anello-pulsa-punto` (1,8 s, settori d'arrivo), `spicchio` (8 s, orologio della chiamata). Col movimento ridotto: nessuna continua. GUSTO: nessuna disturba.
- Token: non ho rifatto il controllo dei valori scritti a mano; lo fa già il passo «token» della catena grafica, che non ho lanciato.

---

## 3. Migliorie (dal miglior rapporto valore/costo)

| # | Miglioria | Perché | Costo |
|---|---|---|---|
| M-1 | Riquadro «Mossa fatta» mai sopra le unità (D-01) | il risultato della mossa si vede | piccolo |
| M-2 | Parola sotto i tre pulsanti a icona e stato «premuto» ovunque (D-12, D-13) | meno tentativi a vuoto | piccolo |
| M-3 | Unità esaurite e a riposo a pieno contrasto (D-09) | il vassoio si legge al sole | piccolo |
| M-4 | A 360, tre o più pastiglie di un settore diventano una pila («3 unità») che si apre al tocco | toglie D-03 e D-04 alla radice | medio |
| M-5 | Scheda della città che cresce nello stato «fallito» (D-07) | pulsante intero | piccolo |
| M-6 | Il riquadro radio dice la mossa in parole («Squadra: Curva Kiln → Curva Skyfield») | conferma leggibile anche da lettore di schermo | piccolo |
| M-7 | «Riprendi» torna alla risposta se la mossa è ancora possibile (D-05) | un tocco sbagliato su Home non costa la mossa | piccolo–medio |
| M-8 | Verbale: nota sopra i pulsanti, fiducia sotto la testata (D-10) | coerenza fra schermate | piccolo |
| M-9 | Prova col carattere di sistema grande su un telefono (D-08) | sapere se il 130% è un caso vero | piccolo |

---

## 4. Idee nuove

Bozzetti in `idee/mock.html` (HTML statico, non è codice di gioco), foto 29. Nessuna idea introduce persone, luoghi, marchi o forze di polizia reali.

**Idea 1 · Tensione con una forma, oltre al colore.** Perché: D-02. Come: il disco verde resta pieno; dal livello 1 uno spicchio che cresce in senso orario; al massimo una croce. Nessun numero, quindi lo spirito di D-055 resta. Rischi: dischi da 26 px, lo spicchio più piccolo va provato sulla mappa vera; tocca il guardiano dei colori. Costo: medio.

**Idea 2 · Freccia piena «da → a» dopo la mossa.** Perché: i segni −1/+1 durano 2 s e stanno su due punti lontani. Come: una freccia magenta con bordo bianco dal settore lasciato a quello d'arrivo, per 2 s, ferma col movimento ridotto; la pastiglia arrivata con l'anello. Era fra le proposte non decise di D-271. Rischi: sopra i nomi a 360; non deve sembrare il tratteggio che il PO ha tolto (è a tinta piena). Costo: medio.

**Idea 3 · Striscia dell'ondata.** Perché: «Ondata 1/3 · chiamata 2/5» è a 12 px e al 130% si tronca (D-08). Come: una riga di segni — quadrato per lo schieramento, cerchi per le chiamate (fatta con spunta, in corso più grande, da fare vuota), rombo per il rapporto. Rischi: il numero di chiamate cambia durante l'ondata (ho visto «4/6» dopo «3/5»): la striscia deve poter crescere senza saltare. Costo: medio.

**Idea 4 · Chiamata «a cassetto» sugli schermi corti.** Perché: D-06. Come: sotto i 700 px di altezza, quando arriva la chiamata la mappa si stringe a una fascia di circa 100 px centrata sul settore che chiama; un pulsante «Mappa» la riapre. Rischi: si perde il colpo d'occhio sugli altri settori proprio mentre si decide; va provata con il PO su 2–3 episodi. Costo: grande (ritocca la disposizione dei nomi a mappa bassa).

**Idea 5 · Vassoio più chiaro.** Perché: D-09, D-12. Come: unità finita con fondo a righe e «✓ tutte»; i pulsanti «annulla», «aiuto», «azzera» con la parola sotto l'icona. Rischi: a 360 la barra ha 328 px: tre pulsanti con parola più «Conferma» vanno misurati. Costo: piccolo.

**Idea 6 · Nel rapporto, le unità che c'erano.** Perché: il rapporto dice «unità non abbastanza» ma non quante c'erano. Come: sotto ogni settore scoperto, le pastiglie presenti a fine ondata. Rischi: nel bozzetto ho messo anche «serviva 1», che è un numero sul costo: può contraddire D-078/D-241; va tolto o deciso dal PO. Costo: piccolo senza «serviva», medio con.

**Idea 7 · Legenda al tocco lungo.** Perché: le tre icone delle unità compaiono col nome solo nel vassoio; nella risposta e nel rapporto non c'è. Come: tocco lungo su una pastiglia → fumetto «2 squadre · Curva Kiln». Era fra le proposte non decise di D-272 («legenda delle icone»). Rischi: il tocco lungo su Android apre il menu di sistema se non gestito; conflitto col trascinamento nello schieramento. Costo: medio.

**Idea 8 · Vibrazione breve alla mossa e alla conferma.** Perché: un riscontro che non occupa schermo. Come: 10–20 ms alla presa dell'unità, due colpi all'arrivo. Rischi: serve un plugin o l'API del browser, da verificare sull'AAB; va spenta col movimento ridotto e serve un interruttore in «Altro». Non posso confermare che funzioni nella WebView dell'app. Costo: medio.

---

## 5. Cosa non ho potuto verificare — «Non posso confermarlo»

- Gli altri 34 episodi (mappe diverse, imprevisti, notte): misurati solo e01 ed e02.
- Un telefono vero: resa dei colori, dito al posto del mouse, carattere di sistema, vibrazione.
- Il testo al 130% col meccanismo vero di Android (ho moltiplicato i token).
- Il daltonismo con persone: solo la simulazione di Chromium.
- Gli stati «errore» (`src/resa/errore.tsx`), «importa salvataggio», «epilogo», «archivio» e le conferme a tre passi: non raggiunti dal giro.
- L'orientamento orizzontale e i tablet.
- La causa di D-01, D-03 e D-04: letta nel codice, non provata con un braccio rosso.
- Il costo sul telefono delle correzioni che toccano la disposizione della mappa (D-281 ricorda che i tempi sul telefono non sono misurati).

---

## 6. Comandi

Dalla radice del repository, dopo `npm ci` e `npm run build`:

```
node docs/collaudo/grafica-fable/strumenti/giro.mjs 360 640 g360
node docs/collaudo/grafica-fable/strumenti/giro.mjs 375 667 g375
node docs/collaudo/grafica-fable/strumenti/giro.mjs 412 915 g412
FERMA=rapporto node docs/collaudo/grafica-fable/strumenti/giro.mjs 360 640 m360 no-preference
FERMA=rapporto node docs/collaudo/grafica-fable/strumenti/giro.mjs 360 640 t360 reduce 1.3
FERMA=rapporto node docs/collaudo/grafica-fable/strumenti/giro.mjs 412 915 t412 reduce 1.3
VISIONE=deuteranopia FERMA=rapporto node docs/collaudo/grafica-fable/strumenti/giro.mjs 360 640 vd360
node docs/collaudo/grafica-fable/strumenti/analisi.mjs g      # contrasto, tocco, tagli, altezze
node docs/collaudo/grafica-fable/strumenti/geo.mjs            # riquadro, nomi, pastiglie, dischi
node docs/collaudo/grafica-fable/strumenti/dalto.mjs          # tabella di D-02
```

Ogni giro scrive foto e `<larghezza>-misure.json` nella cartella indicata (non nel repository). `foglio.mjs` e `ritaglia.mjs` compongono le foto di questa cartella. Una prova per larghezza: il giro è deterministico (seme 1, movimento ridotto), ma non ho ripetuto le misure per verificarlo; fra il primo e il secondo giro a 375 il numero di stati è cambiato (185 → 240 → 243) per una corsa nel mio strumento sul cambio di scena, corretta con una riprova.
