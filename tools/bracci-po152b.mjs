// D-270: i bracci rossi po152b girano solo dove il loro rosso si vede (giri di foto-po152-b.mjs ed episodi del giro radio) e sono
// rossi sul serio solo se i problemi col loro segno arrivano almeno al conteggio dichiarato. Conteggi dalla misura sul giro intero
// (main 7e753289, 360×760, VALMORA_LARGHEZZE=360, 5 in parallelo): sugli stessi episodi il giro intero dava proprio quel numero.
// Il giro VERDE resta intero (36 episodi, previsione, fermo): qui si restringono solo i bracci.
export const BRACCI_PO152B = {
  C241B01: { giri: ['e01'], segno: 'seconda mossa possibile (PO-152 B)', almeno: 3 }, // 640, 667, 760
  C241M02: { giri: ['e01'], segno: 'PO-152 B)', almeno: 18 }, // 3 altezze × 3 giri × 2 (indicazione assente, nessuna unità si tocca)
  C255R01: { giri: ['radio'], episodi: ['e01', 'e02', 'e03'], segno: '(D-255)', almeno: 11 }, // 6 + 4 + 7 (D-272 passo 2: e02 da 5 a 4 col costo di spostamento)
  C258S01: { giri: ['radio'], episodi: ['e01', 'e02'], segno: 'il costo non si vede (D-258)', almeno: 13 }, // 7 + 6
  C259A01: { giri: ['radio'], episodi: ['e01', 'e02'], segno: '(soglia 68, D-258)', almeno: 12 }, // 7 + 5
  'C261H01,C272S01': { giri: ['radio'], episodi: ['e35'], segno: '(soglia 68, D-258)', almeno: 7 }, // solo e35 perimetro
  C261E01: { giri: ['radio'], episodi: ['e01', 'e02'], segno: '(D-261)', almeno: 11 }, // 6 + 5
  C262R01: { giri: ['e01'], segno: 'la mossa di quella pausa è persa (C56-02)', almeno: 3 }, // giro «ricarica» alle 3 altezze
  C262E01: { giri: ['e01'], segno: 'dopo la mossa manca la previsione (D-262)', almeno: 3 }, // giro «mossa» alle 3 altezze
  'C262M01,C271U01': { giri: ['radio'], episodi: ['e02', 'e12', 'e15'], segno: '(C56-03)', almeno: 5 }, // 3 + 2 + 3 (D-272 passo 2: giro radio intero sul codice nuovo, e05 ed e26 a 0)
  C262D01: { giri: ['radio'], episodi: ['e02'], segno: '(C56-03)', almeno: 3 }, // solo e02 ritardo
  C268F01: { giri: ['e01'], segno: '(C56-05)', almeno: 1 }, // solo da tastiera, 760
  C268M01: { giri: ['e01'], segno: '(C56-04)', almeno: 54 }, // 3 altezze × 3 giri × 6
  C269M01: { giri: ['radio'], episodi: ['e01', 'e03', 'e06', 'e07', 'e09', 'e15', 'e17', 'e20', 'e22', 'e24', 'e32', 'e35'], segno: '(C57-01)', almeno: 8 }, // 1 per episodio (D-272)
  C269P01: { giri: ['previsione'], segno: 'la previsione non si vede (C57-02)', almeno: 5 }, // e16 imp_nebbia
  C269I01: { giri: ['radio'], episodi: ['e03', 'e04'], segno: '(D-269 a)', almeno: 12 }, // 7 + 5
  // lotto «altezze» (S-11): su e21 nel giro radio il rosso si vedeva solo coi segni della risposta (1,8 s veri) ancora in pagina,
  // cioè secondo il carico (CI 1295 su main: cieco in 2 tentativi su 3). A segni spariti il giro radio non lo mostra in nessuno
  // dei 36 episodi; il giro previsione sì: e16 imp_nebbia, 5 mosse su 24, 5 su 5 in 9 prove (8 insieme a 8 processi)
  'C269A01,C272S01': { giri: ['previsione'], segno: '(D-269 b)', almeno: 5 },
  'C269C01,C271U01,C272N01': { giri: ['radio'], episodi: ['e08', 'e12', 'e20', 'e25', 'e28'], segno: 'allo sparire dei segni ▲/▼', almeno: 3 }, // 1 per episodio (D-272 passo 2: sul codice nuovo e02 ed e26 a 0; 7 episodi su 35 col segno), il controllo nei fotogrammi (D-270)
  // D-271 (S-27): misure sul merge della 0.66.0 (360×760, giro ristretto come qui). Lo spostamento piccolo delle unità (C271U01)
  // toglie a C262M01 e C269C01 i casi che li rendevano visibili (CI 74eb83f: 1 su 5 e 2 su 3; spento C271U01: 5 e 3): girano con
  // C271U01, come C215L01 con C241A01. Conteggi invariati.
  // D-272 (S-11, CI 1334 su f63453c6: 5 bracci ciechi in 3 tentativi su 3). Col codice nuovo il braccio cerca prima episodi dove il
  // difetto si vede ancora (giro radio intero, 36 episodi, 360×760, senza rossi D-272): C262M01 24 in 15 episodi → e02, e05, e26;
  // C269M01 12 in 12 episodi, 1 ciascuno → quei 12. Dove non basta in nessun episodio il braccio gira col rosso D-272 che gli toglie
  // i casi (un rosso D-272 alla volta, giro ristretto): C261H01 1 in tutto (e35) → 7 con C272S01; C269A01 2 in radio+fermo+e01, 0 in
  // previsione → 24 con C272S01; C269C01 0 → 3 con C272N01. Perché nel README di d187 (D-272). Conteggi invariati.
  C271T01: { giri: ['radio'], episodi: ['e01', 'e02'], segno: 'tratteggio nella mossa', almeno: 11 }, // e01 6 + e02 5 stati con tratteggio
  C271U01: { giri: ['radio'], episodi: ['e03', 'e04'], segno: '(D-271, C271U01)', almeno: 13 }, // e03 8 + e04 arance 7 (D-272 passo 2: e16 magazzino_sette da 6 a 0 col costo di spostamento)
  C271V01: { giri: ['versione'], segno: 'la versione non svanisce (D-271)', almeno: 2 }, // movimento e movimento ridotto
  // D-272 passo 2, giro «salti» (e03, 24 mosse): senza posto vuoto (C272V01) 28 / 28 / 16 problemi a 360 / 375 / 412; senza costo di
  // spostamento (C272W01) 0 / 0 / 9: a 360 il salto massimo resta 42 px, sotto la soglia di 44, quindi quel braccio gira a 412×760
  C272V01: { giri: ['salti'], episodi: ['e03'], segno: '(soglia 44, D-272 salti)', almeno: 20 },
  // D-272 (8/11): coi due rossi, il comportamento di 553c26fa, e05 ed e26 superano il loro tetto (EPISODI_SALTI, TETTO_EPISODIO)
  'C272V01,C272W01': { giri: ['salti'], episodi: ['e05', 'e26'], segno: '(D-272 salti, tetto episodio)', almeno: 2 }, // e05 12 > 4, e26 14 > 6 a 360; gli stessi del verde in CI (decisione 8/11, tempi)
  // D-272 passo 4, giro «segno» (e03, tutte le mosse: 24): senza «−1» / «+1» (C272D01) 24 problemi a 360 (prima 6 su 6 con la sola prima mossa), verde 0
  C272D01: { giri: ['segno'], episodi: ['e03'], segno: '(D-272 segno)', almeno: 20 },
  // e col segno a fianco del disco e sopra tutto (C272D02) 24 mosse su 24 coprono nomi o dischi altrui a 360
  C272D02: { giri: ['segno'], episodi: ['e03'], segno: 'il segno copre', almeno: 20 },
  // e col segno fermo al centro del disco (C272D03) i casi della verifica del principale: e02 «+1» sopra curva_ospiti, e04 «−1» sopra una pastiglia
  C272D03: { giri: ['segno'], episodi: ['e02', 'e04'], segno: 'il segno copre', almeno: 22 }, // 28 a 360 su 40 mosse, verde 0
  C272W01: { giri: ['salti'], episodi: ['e03'], segno: '(soglia 44, D-272 salti)', almeno: 6 },
  // D-272 passo 2, vicinanza (giro radio, soglia 95 / 93 / 93): senza i posti e la larghezza di C28-14 (C94N01) le pastiglie di Magazzino
  // in e16 magazzino_sette finiscono a 108-110 px dal disco, in 6 stati a 360; unico episodio col segno su 36
  C94N01: { giri: ['radio'], episodi: ['e16'], segno: 'D-272 vicinanza)', almeno: 5 },
};

// D-274b: i bracci della parte «chiamate» (D-207) misurano solo gli imprevisti: le chiamate normali (498 su 782) non servono.
// C215L01 (D-215) è la mediana degli imprevisti, che ha senso solo su tutti i 284; C206I01 solo gli imprevisti dei suoi episodi.
export const BRACCI_CHIAMATE = {
  'C215L01,C241A01': { chiamateDi: (c) => c.imprevisto, segno: 'mediana degli imprevisti', almeno: 1 },
  C206I01: { chiamateDi: (c) => c.imprevisto && ['e04', 'e06', 'e09', 'e13'].includes(c.ep), segno: '(soglia 339, D-207)', almeno: 5 }, // e04 ×2, e06, e09, e13
};

/** Il braccio è cieco se i problemi col suo segno sono meno del conteggio dichiarato; ritorna il messaggio o ''. */
export function braccioCieco(r, problemi) {
  const b = BRACCI_PO152B[r] ?? BRACCI_CHIAMATE[r], n = problemi.filter((x) => x.includes(b.segno)).length;
  return n >= b.almeno ? '' : `altezze/${r} è cieco: ${n} problemi «${b.segno}», ne servono ${b.almeno} (D-270)`;
}
