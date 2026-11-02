# Salvataggi reali

Qui vanno copie di salvataggi VERI (scritti dal gioco, non a mano), uno o più per ogni versione
vecchia: `v<SAVE_VERSION>-<descrizione>.json`. Il passo «salvataggi-reali» della catena logica
pretende almeno un file per ogni versione da 1 a SAVE_VERSION-1 e li migra tutti.

SAVE_VERSION = 4 (D-241 idea B: «mosse» in in_corso; v3 = seme di partita in in_corso). Versione 2 = missione a scene. I file v1 sono stati scritti dalla build 0.1.0 (commit 759f0b7)
giocata da Chromium headless a 360 px, copiando `localStorage["valmora-salvataggio"]` così com'era:
- `v1-nuova-partita.json`: subito dopo «Nuova partita» (in_corso null);
- `v1-dopo-ondata-1.json`: dopo l'ondata 1 della plancia (in_corso del motore 0.1.0).

File v2 (dati di gioco della versione pubblicata — collaudo C-014):
- `v2-0.4.0-e02-in-corso.json`: build 0.4.0 (commit 9f969d1) ricostruita e giocata da Chromium headless a
  360 px dall'interfaccia: nuova partita, e01 superato, e02 interrotto a metà dell'ondata 2 (una risposta).
  Ha le sole 5 variabili della 0.4.0 (mancano le 6 del consolidamento) e un in_corso senza «partenze».
  Lo usa tests/aggiornamento.test.ts: caricamento come il gioco (migra → adattaAiDati), episodio in corso
  fino al verbale, poi il prossimo episodio.
- `v2-0.52.0-e01-ondata2-in-corso.json` (D-241): build 0.52.0 (commit 8d26012) ricostruita e giocata da Chromium headless a
  360 px dall'interfaccia, mosse scelte dal bot attento della 0.52.0: nuova partita, guida saltata, e01 fino a metà
  dell'ondata 2 dopo l'imprevisto «imp_buio» (risposte dell'ondata 1 tutte date, «partenze» 1 e 2). Lo usa
  tests/partita-d241.test.ts: migra a v3 col seme 0 (partita classica) e ritrova le chiamate aperte misurate sulla 0.52.0.

File v3:
- `v3-0.57.0-e01-ondata2-in-corso.json` (D-241 idea B): build 0.57.0 (commit 0d60bc9a) ricostruita e giocata da Chromium headless
  a 360 px dall'interfaccia con `tools/salva-reale-057.mjs`, scelte del bot attento della 0.57.0: nuova partita, guida saltata, e01
  fino a metà dell'ondata 2 (risposte «fumogeni» e «porta_servizio», seme 1036838189, «partenze» 1 e 2), copiato da
  `localStorage["vandelfalls-salvataggio"]`. Lo usa tests/mossa-d241.test.ts: migra a v4 con «mosse» vuoto e la mossa si fa.
