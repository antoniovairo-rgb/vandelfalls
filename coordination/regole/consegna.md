# Regole di consegna delle sessioni (D-277, PO-161)

Valgono per ogni sessione sviluppatrice o di rilascio che manda alla principale un hash da integrare.
Nascono da tre idee di everything-claude-code (https://github.com/affaan-m/everything-claude-code), adattate a mano
e approvate dal PO il 07/11/2026. Non si installa niente di quel progetto.

## 1. Lista di consegna (obbligatoria, nel messaggio e nel README del lotto)

Il messaggio di consegna contiene questa lista, compilata. Una riga mancante blocca l'integrazione.

| Voce | Cosa scrivere |
|---|---|
| Commit col codice | hash dell'ultimo commit che cambia `src/`, `data/`, `tools/` o `tests/` |
| Pre-push | verde, con la durata dei test |
| Verde locale | i guardiani dell'area toccata, a 360, 375 e 412 px, con il numero di problemi |
| Rossi locali | ogni rosso nuovo e i bracci della larghezza 360 (`VALMORA_LARGHEZZE=360 VALMORA_PASSI=build,bracci-rossi-grafica node tools/catena.mjs grafica`), nessun cieco |
| Catena grafica a 360 | `VALMORA_LARGHEZZE=360 node tools/catena.mjs grafica`, tutti i passi, verde; le altre larghezze le copre la CI (aggiunta 07/11: lo schieramento C33-04 era rimasto fuori) |
| CI | numero del run sul commit col codice, 10 job su 10 eseguiti e verdi (D-270); un run con i job saltati non vale |
| Foto | per ogni modifica visibile, provini PRIMA/DOPO a 360, 375 e 412 px |
| Misure | prima e dopo, con strumento, campione e numero di prove |
| Ipotesi e limiti | cosa non è misurato, dichiarato come tale |

## 2. Revisione a mente fresca

Ogni consegna che tocca la mappa o l'interfaccia (`src/resa/`, CSS, testi a schermo) viene verificata dalla principale con un
agente che non ha visto il lavoro. L'agente riceve solo:
- il commit da verificare e quello di confronto;
- i difetti che la consegna dichiara di correggere e le sue dichiarazioni;
- gli strumenti di misura esistenti.

Rifà le misure sugli stessi casi e dice, dichiarazione per dichiarazione, «mantenuta» o «non mantenuta». Una dichiarazione
non mantenuta torna alla sessione prima dei giri finali. Precedente: C57-01/C57-02 (D-269), dove la verifica ha trovato due
problemi che i guardiani non vedevano.

## 3. Controllo sicurezza prima del Play

Prima della versione destinata al Play Store (lotto L3) si compila e si verifica, sul pacchetto AAB vero:
- permessi Android dichiarati: solo quelli che servono, ognuno motivato;
- nessun segreto nel pacchetto (chiavi, token, password, file `.env`), cercato sul contenuto dell'AAB;
- nessuna connessione di rete non dichiarata (il gioco è offline);
- privacy: la pagina e il modulo Play coerenti con quello che il pacchetto fa davvero;
- dipendenze: elenco e licenze.
Il controllo automatico si aggiunge a `tools/aab.mjs`, con un rosso per ogni voce.
