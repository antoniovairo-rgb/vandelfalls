# S-11 · PO-152b D-281 revisione 3 (C) · stato alla pausa (2026-11-17 06:28 UTC)

Pausa per ordine del PO, tramite la sessione principale. Tutte le catene e le misure sono ferme. Nessun commit di codice a metà.

## Build
- Ramo `claude/valmora-pastiglie-ferme`, build sotto prova **b5582d56**.
  - Commit: C (a953f676), tetti delle coperte e giro «immediata» (319eda66), braccio C281O01 nella parte po152b (b5582d56).
- Lo strumento ef83b627 / e9720d9d va nella stessa release.

## Fatto (FATTO MISURATO)
- **CI 1496 su b5582d56: verde, 10 job su 10, tutti al primo tentativo.**
  - Nel job «grafica (360 bracci)» il braccio C281O01 ha girato: «mossa immediata; e21», 11/83 contro tetto 8.
- **CI 1495 su 319eda66: rossa** («C281O01 è cieco»).
  - Causa: C281O01 mancava da PARTE_ROSSO in tools/passi-grafica.mjs:15.
  - Corretta in b5582d56.
  - Ritirata l'affermazione «braccio provato»: la prova locale non passava per la strada del braccio.
- **Braccio C281O01 per la strada di passi-grafica.mjs:81** (360x760, e21):
  - verde: 8/83, 0 problemi;
  - rosso: 14/83, 1 problema, non cieco.
  - Il rosso vale 11 in CI e 14 in locale (3 prove su 3). Il tetto 8 regge in entrambi; va scritto nella consegna.
- **Catena grafica a 360, parte g1** (VALMORA_PASSI=token,build,email,foto): VERDE su b5582d56, registrata in STABILITA.json (foto 833 s).
- **main a 412 (r14)**: 246/134, coperte 0 (proprio 0, altri 0). Il tetto 412 [0,0] resta com'è.

## Misure di C (36 episodi, 820 mosse)

| | 360 | 375 | 412 |
|---|---|---|---|
| oltre 44 px / massimo | 329/176 | 347/134 | 90/134 |
| riaperti | 2 | 0 | 1 |
| fasi non chiuse | 0 | 0 | 0 |
| coperte proprio / altri | 10 / 26 | 0 / 20 | 0 / 0 |

- Nessun episodio peggiore di b5293c47.
- TETTO_COPERTE: 360 [10,26], 375 [0,20], 412 [0,0].
- Mossa immediata a 360, e21: verde 8/83 in 3 prove su 3; rosso C281O01 14/83 in 3 prove su 3.

## Difetto residuo da dichiarare nella consegna
Le 10 pastiglie sotto il proprio nome a 360 (stesso valore su b5293c47 e su C; main ne ha 0 proprie e 31 altre). Lotto D-283.
- e03: steward@piazzale
- e10 ×3: piazzale; mediatore, squadre, squadre
- e21: mediatore@piazza_fonderie
- e28 ×2: mediatore e steward @magazzino_fonderie
- e29 ×3: steward@curva_cinderwick

## Non fatto: da dove ripartire, sempre su b5582d56
1. **g2**: `VALMORA_LARGHEZZE=360 VALMORA_PASSI=build,schieramenti,offline,caratteri,altezze node tools/catena.mjs grafica`.
   - Fermata a metà di «altezze» dalla pausa: da rifare da capo.
   - Fino a lì verdi: schieramenti 671 s, offline, caratteri.
2. **g3**: `VALMORA_LARGHEZZE=360 VALMORA_PASSI=build,bracci-rossi-grafica node tools/catena.mjs grafica`.
3. **3 giri** di `node tools/catena.mjs governo` e 3 di `node tools/catena.mjs logica`.
4. Commit di STABILITA.json, push, consegna alla principale (la quarta revisione è sua).
5. Pulizia: tools/zz-*.mjs (non tracciati), dist-* e wt-main nello scratchpad.

## Note
- La catena «completa» a 360 è stata interrotta 4 volte: limite del processo in sottofondo e riavvii del contenitore circa ogni 2-2,5 ore.
  - Per scelta della principale (consegna.md righe 16-18), si sostituisce con la grafica in parti dichiarate.
- Le foto non servono: in e08, e26 ed e34 lo spostamento di C è identico a b5293c47. Da dichiarare.
