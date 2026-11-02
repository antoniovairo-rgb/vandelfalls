// Formato del salvataggio e migrazioni retrocompatibili.
// Regola: ogni campo nuovo = SAVE_VERSION + 1 e una migrazione MIGRAZIONI[v] che porta v → v+1.
// Ogni versione vecchia deve avere almeno un salvataggio vero in tests/salvataggi-reali/
// (passo «salvataggi-reali» della catena logica).
import type { Genere } from '../dati/testi.ts';
import type { Registro } from '../logica/episodi.ts';
import type { InCorso } from '../logica/missione.ts';

// 2 – in_corso diventa lo stato della missione a scene (missione.ts, D-053); i v1 ripartono dalla missione;
//     nuovo campo «episodi» = registro della mappa degli episodi (episodi.ts, D-059…D-062);
//     nuovo campo «genere» del protagonista, scelto a inizio partita (D-063);
//     nuovo campo «rapporto_aperto» (C-005 R04).
// 3 – D-241: in_corso.seme, il seme di partita (src/logica/partita.ts), anche in «sconfitta» e nelle «partenze».
// 4 – D-241 idea B: in_corso.mosse, le chiamate dopo cui è stata fatta la mossa (src/logica/mossa.ts), anche in «sconfitta»
//     e nelle «partenze».
export const SAVE_VERSION = 4;

export type ValoreVariabile = boolean | number | string;

export interface Salvataggio {
  save_version: number;
  /** GAME_VERSION che ha scritto il file: solo informativo, non guida la migrazione */
  game_version: string;
  /** seme della partita (D-006: tutto ciò che è riproducibile nasce da qui) */
  seme: number;
  /** stato del generatore casuale (caso.ts), per riprendere la stessa sequenza */
  caso: number;
  /** valori delle variabili narrative dichiarate in data/stato.json */
  variabili: Record<string, ValoreVariabile>;
  /** id delle missioni superate, in ordine (un episodio fallito non c'è finché non lo superi) */
  missioni_concluse: string[];
  /** registro degli episodi: tentativi, risultato migliore, variabili di partenza (D-062) */
  episodi: Registro;
  /** genere del protagonista, per i testi «chiave@f» (D-063) */
  genere: Genere;
  /** ondata il cui rapporto è a schermo, o null: una ricarica torna al rapporto (C-005 R04) */
  rapporto_aperto: number | null;
  /** missione interrotta, salvata dopo ogni passo (schieramento, chiamata, ondata), o null (D-040) */
  in_corso: InCorso | null;
  /** C17-04: stato finale dell'ultimo episodio perso, finché non si sceglie «Riparti» o «Ricomincia» (così il verbale
   *  con «Riparti» sopravvive a una ricarica). Facoltativo: i salvataggi senza restano validi, SAVE_VERSION invariata. */
  sconfitta?: InCorso | null;
  /** C17-16: schieramento non ancora confermato (unità messe sulla mappa), per non perderlo a una ricarica. Facoltativo. */
  bozza?: { missione: string; ondata: number; d: Record<string, Record<string, number>> } | null;
}

type Grezzo = Record<string, unknown>;

export const ESITO_V1 = 'concluso_v1';

/** MIGRAZIONI[v] trasforma un salvataggio v in v+1. */
export const MIGRAZIONI: Record<number, (s: Grezzo) => Grezzo> = {
  // v1 → v2: la missione interrotta del motore 0.1.0 (ondate giocate) non ha equivalente nel motore a
  // scene; si butta e la missione riparte dal briefing. Variabili e missioni concluse restano.
  // Ogni missione conclusa in v1 diventa una voce superata con 1 stella e 1 tentativo: la v1 non
  // salvava né l'esito né le variabili di prima, quindi esito «concluso_v1» e variabili attuali.
  1: (s) => ({
    ...s, in_corso: null,
    genere: 'm', // la 0.1.0 non chiedeva il genere: i suoi testi erano al maschile
    rapporto_aperto: null,
    episodi: Object.fromEntries((Array.isArray(s.missioni_concluse) ? s.missioni_concluse as string[] : []).map((id) => [id, {
      migliore: { esito: ESITO_V1, fallita: false, stelle: 1 }, tentativi: 1, variabili_prima: s.variabili, variabili_dopo: s.variabili,
    }])),
  }),
  // v2 → v3 (D-241): l'episodio in corso (e la sconfitta, e le loro partenze) riceve il seme 0, la partita classica:
  // l'unico seme che ridà la partita di prima (imprevisti al loro posto, nessuna variante), così chi riprende a metà
  // ondata ritrova le stesse chiamate e le risposte già date valgono ancora.
  2: (s) => ({ ...s, in_corso: conSeme(s.in_corso), ...('sconfitta' in s ? { sconfitta: conSeme(s.sconfitta) } : {}) }),
  // v3 → v4 (D-241 idea B): nessuna mossa fatta. Chi riprende a metà ondata può muovere dalla prossima risposta in poi.
  3: (s) => ({ ...s, in_corso: conMosse(s.in_corso), ...('sconfitta' in s ? { sconfitta: conMosse(s.sconfitta) } : {}) }),
};

function conMosse(ic: unknown): unknown {
  if (!oggetto(ic)) return ic;
  const partenze = oggetto(ic.partenze) ? { partenze: Object.fromEntries(Object.entries(ic.partenze).map(([n, p]) => [n, conMosse(p)])) } : {};
  return { ...ic, mosse: Array.isArray(ic.mosse) ? ic.mosse : [], ...partenze };
}

function conSeme(ic: unknown): unknown {
  if (!oggetto(ic)) return ic;
  const partenze = oggetto(ic.partenze) ? { partenze: Object.fromEntries(Object.entries(ic.partenze).map(([n, p]) => [n, conSeme(p)])) } : {};
  return { ...ic, seme: ic.seme ?? 0, ...partenze };
}

const oggetto = (x: unknown): x is Grezzo => typeof x === 'object' && x !== null && !Array.isArray(x);

function controllaInCorso(ic: Grezzo): string[] {
  const p: string[] = [];
  if (typeof ic.missione !== 'string') p.push('in_corso.missione non è un id');
  if (!Number.isInteger(ic.ondata) || (ic.ondata as number) < 1) p.push('in_corso.ondata non è un intero ≥ 1');
  for (const k of ['tensione', 'riserva', 'riposo', 'modifiche', 'risposte', 'variabili']) if (!oggetto(ic[k])) p.push(`in_corso.${k} non è un oggetto`);
  if (ic.disposizione !== null && !oggetto(ic.disposizione)) p.push('in_corso.disposizione non è un oggetto né null');
  for (const k of ['scelte', 'rapporti']) if (!Array.isArray(ic[k])) p.push(`in_corso.${k} non è un elenco`);
  if (!isUint32(ic.seme)) p.push('in_corso.seme non uint32 (D-241)');
  if (!Array.isArray(ic.mosse) || !(ic.mosse as unknown[]).every((x) => typeof x === 'string')) p.push('in_corso.mosse non è un elenco di testi (D-241 idea B)');
  return p;
}

function controllaVoce(id: string, x: unknown): string[] {
  if (!oggetto(x)) return [`episodi.${id} non è un oggetto`];
  const p: string[] = [];
  if (!Number.isInteger(x.tentativi) || (x.tentativi as number) < 0) p.push(`episodi.${id}.tentativi non è un intero ≥ 0`);
  const m = x.migliore;
  if (m !== null && !(oggetto(m) && typeof m.esito === 'string' && typeof m.fallita === 'boolean' && [0, 1, 2, 3].includes(m.stelle as number))) p.push(`episodi.${id}.migliore malformato`);
  if (!oggetto(x.variabili_prima)) p.push(`episodi.${id}.variabili_prima non è un oggetto`);
  if (x.variabili_dopo !== null && !oggetto(x.variabili_dopo)) p.push(`episodi.${id}.variabili_dopo non è un oggetto né null`);
  return p;
}

const isUint32 = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 0 && (n as number) <= 0xffffffff;

export function controllaSalvataggio(s: Grezzo): string[] {
  const p: string[] = [];
  if (s.save_version !== SAVE_VERSION) p.push(`save_version ${String(s.save_version)} invece di ${SAVE_VERSION}`);
  if (typeof s.game_version !== 'string') p.push('game_version mancante');
  if (!isUint32(s.seme)) p.push('seme non uint32');
  if (!isUint32(s.caso)) p.push('caso non uint32');
  const v = s.variabili;
  if (typeof v !== 'object' || v === null || Array.isArray(v)) p.push('variabili non è un oggetto');
  else for (const [k, x] of Object.entries(v)) if (!['boolean', 'number', 'string'].includes(typeof x)) p.push(`variabile ${k}: tipo ${typeof x}`);
  if (!Array.isArray(s.missioni_concluse) || s.missioni_concluse.some((m) => typeof m !== 'string')) p.push('missioni_concluse non è un elenco di id');
  if (s.rapporto_aperto !== null && !(Number.isInteger(s.rapporto_aperto) && (s.rapporto_aperto as number) >= 1)) p.push('rapporto_aperto non è null né un intero ≥ 1');
  if (s.genere !== 'm' && s.genere !== 'f') p.push(`genere ${String(s.genere)} non è «m» né «f»`);
  if (!oggetto(s.episodi)) p.push('episodi non è un oggetto');
  else for (const [id, x] of Object.entries(s.episodi)) p.push(...controllaVoce(id, x));
  const ic = s.in_corso as Grezzo | null | undefined;
  if (ic === undefined) p.push('in_corso mancante');
  else if (ic !== null) {
    const q = oggetto(ic) ? controllaInCorso(ic) : ['in_corso non è un oggetto'];
    if (q.length) p.push(`in_corso malformato (${q.join(', ')})`);
  }
  const sc = s.sconfitta as Grezzo | null | undefined;
  if (sc !== undefined && sc !== null) {
    const q = oggetto(sc) ? controllaInCorso(sc) : ['sconfitta non è un oggetto'];
    if (q.length) p.push(`sconfitta malformata (${q.join(', ')})`);
  }
  const b = s.bozza as Grezzo | null | undefined;
  if (b !== undefined && b !== null && !(oggetto(b) && typeof b.missione === 'string' && Number.isInteger(b.ondata) && oggetto(b.d)
    && Object.values(b.d as Grezzo).every((x) => oggetto(x) && Object.values(x as Grezzo).every((n) => Number.isInteger(n) && (n as number) >= 0)))) p.push('bozza malformata');
  return p;
}

/** Porta un salvataggio di qualunque versione nota alla versione corrente, o lancia un errore. */
export function migra(dati: unknown): Salvataggio {
  if (typeof dati !== 'object' || dati === null || Array.isArray(dati)) throw new Error('salvataggio non è un oggetto');
  let s = { ...(dati as Grezzo) };
  const v0 = s.save_version;
  if (!Number.isInteger(v0) || (v0 as number) < 1) throw new Error(`save_version non valida: ${String(v0)}`);
  if ((v0 as number) > SAVE_VERSION) throw new Error(`salvataggio di una versione futura (${String(v0)} > ${SAVE_VERSION})`);
  for (let v = v0 as number; v < SAVE_VERSION; v++) {
    const m = MIGRAZIONI[v];
    if (!m) throw new Error(`manca la migrazione ${v} → ${v + 1}`);
    s = { ...m(s), save_version: v + 1 };
  }
  const problemi = controllaSalvataggio(s);
  if (problemi.length) throw new Error(`salvataggio non valido: ${problemi.join('; ')}`);
  return s as unknown as Salvataggio;
}
