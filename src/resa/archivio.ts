// Salvataggio nel telefono (localStorage). Il formato e le migrazioni stanno in src/salvataggi.
// S-20 (PO-073): copia di riserva dell'ultimo salvataggio buono sotto una seconda chiave; se il principale è
// illeggibile si riprende dalla copia (e la home lo dice); esporta e importa la partita come file .json.
import { spento } from '../interruttori.ts';
import { completaPartita, riparaInCorso } from '../logica/aggiornamento.ts';
import { migra, type Salvataggio } from '../salvataggi/salvataggio.ts';
import { dichiarate, missioni } from './dati.ts';
import { GAME_VERSION } from '../versione.ts';

const CHIAVE = 'vandelfalls-salvataggio';
const RISERVA = 'vandelfalls-salvataggio-riserva';
const GUIDA = 'vandelfalls-guida-vista';
// D-244 (PO-153), D-249 (PO-155): il gioco si è chiamato Valmora (fino alla 0.54) e Varcalda (0.55-0.56), con chiavi sue.
// Alla prima lettura ogni chiave si sposta sulla nuova: se la nuova manca, si copia la prima vecchia che c'è (prima varcalda-,
// poi valmora-) e poi si toglie quella copiata (stessa origine github.io, quindi lo stesso localStorage). Se la nuova c'è già
// non si tocca niente. Rossi: __NO_C249S01 nessuno spostamento da varcalda-, __NO_C244S01 nessuno spostamento da valmora-.
const VECCHIE: [string, string[]][] = [
  [CHIAVE, ['varcalda-salvataggio', 'valmora-salvataggio']],
  [RISERVA, ['varcalda-salvataggio-riserva', 'valmora-salvataggio-riserva']],
  [GUIDA, ['varcalda-guida-vista', 'valmora-guida-vista']],
];
export function spostaChiaviVecchie(): void {
  for (const [nuova, vecchie] of VECCHIE) {
    try {
      if (localStorage.getItem(nuova) !== null) continue;
      for (const [i, vecchia] of vecchie.entries()) {
        if (spento(['C249S01', 'C244S01'][i]!)) continue; // vecchie[0]: 0.55-0.56, vecchie[1]: fino alla 0.54
        const v = localStorage.getItem(vecchia);
        if (v === null) continue;
        localStorage.setItem(nuova, v);
        if (localStorage.getItem(nuova) === v) localStorage.removeItem(vecchia); // la vecchia sparisce solo se la copia c'è
        break;
      }
    } catch (e) { console.warn(`chiave ${nuova} non spostata: ${(e as Error).message}`); }
  }
}

/** Vero se l'ultimo carica() ha dovuto usare la copia di riserva (avviso in home). */
export let dallaRiserva = false;
/** C15-09: c'era un salvataggio ma né lui né la copia di riserva si leggono: la partita è persa (la home lo dice). */
export let persa = false;

export const AVVISO_RIPARTE = 'Il gioco è stato aggiornato: l\'episodio riparte dall\'inizio.';
export const AVVISO_SPARITO = 'Il gioco è stato aggiornato: l\'episodio interrotto non c\'è più, si riparte dalla città.';

/**
 * Adatta un salvataggio ai dati di gioco attuali (C-014): completa le variabili dichiarate dopo (C14-03) e
 * fa ripartire un episodio in corso che nomina cose sparite (C14-02). Mai un'eccezione verso la resa: se
 * l'adattamento fallisce, l'episodio in corso si lascia e si torna alla città.
 */
export function adattaAiDati(s: Salvataggio): { salvataggio: Salvataggio; avviso: string | null } {
  try {
    const { salvataggio, motivi } = riparaInCorso(completaPartita(s, dichiarate.values()), missioni, dichiarate);
    if (!motivi.length) return { salvataggio, avviso: null };
    console.warn(`episodio in corso incompatibile coi dati attuali: ${motivi.join('; ')}`);
    return { salvataggio, avviso: salvataggio.in_corso ? AVVISO_RIPARTE : AVVISO_SPARITO };
  } catch (e) {
    console.warn(`adattamento non riuscito, episodio in corso lasciato: ${(e as Error).message}`);
    return { salvataggio: { ...s, in_corso: null, rapporto_aperto: null }, avviso: AVVISO_SPARITO };
  }
}

/** Avviso dell'ultimo caricamento (da mostrare in home), o null. */
let avvisoCaricamento: string | null = null;
export const ultimoAvviso = () => avvisoCaricamento;

/** Legge e adatta un salvataggio grezzo; l'avviso dell'adattamento resta per la home. */
function leggi(grezzo: string): Salvataggio {
  const { salvataggio, avviso } = adattaAiDati(migra(JSON.parse(grezzo)));
  avvisoCaricamento = avviso;
  if (avviso) salva(salvataggio); // l'avviso compare una volta sola: il salvataggio riparato è già scritto
  return salvataggio;
}

export function carica(): Salvataggio | null {
  dallaRiserva = false; persa = false;
  spostaChiaviVecchie();
  try {
    const grezzo = localStorage.getItem(CHIAVE);
    return grezzo ? leggi(grezzo) : null;
  } catch (e) {
    console.warn(`salvataggio illeggibile: ${(e as Error).message}`);
  }
  // Rosso C19S01: come prima, si riparte da capo.
  if (spento('C19S01')) return null;
  try {
    const copia = localStorage.getItem(RISERVA);
    if (!copia) { persa = !spento('C34S01'); return null; }
    const s = leggi(copia);
    dallaRiserva = true;
    localStorage.setItem(CHIAVE, JSON.stringify(s)); // il principale torna buono
    return s;
  } catch (e) {
    console.warn(`anche la copia di riserva è illeggibile, si riparte: ${(e as Error).message}`);
    persa = !spento('C34S01'); // Rosso C34S01: nessun avviso, come prima
    return null;
  }
}

export function salva(s: Salvataggio): void {
  try {
    // C56-08 (D-268): «game_version» dice la versione che ha scritto il file; prima restava quella di chi l'aveva creato
    // (un salvataggio della 0.58.0 finito sulla 0.59.0 diceva ancora 0.58.0). Rosso C268G01: come prima.
    const testo = JSON.stringify(spento('C268G01') ? s : { ...s, game_version: GAME_VERSION });
    localStorage.setItem(CHIAVE, testo);
    localStorage.setItem(RISERVA, testo); // s viene dal gioco: è buono per costruzione
  } catch (e) { console.warn(`salvataggio non riuscito: ${(e as Error).message}`); }
}

const oggi = () => new Date().toISOString().slice(0, 10);
export const nomeFile = () => `vandelfalls-${oggi()}.json`;

/** Scarica il salvataggio come file .json (nessuna dipendenza: un link «download» su un Blob). */
export function esporta(s: Salvataggio): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(s, null, 1)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = nomeFile(); a.rel = 'noopener';
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Legge un file di salvataggio, lo fa passare da migra() e lo adatta ai dati attuali; se non è valido, errore. */
export async function importa(file: File): Promise<Salvataggio> {
  const testo = await file.text();
  let dati: unknown;
  try { dati = JSON.parse(testo); } catch { throw new Error('non è un file di salvataggio (JSON non leggibile)'); }
  return adattaAiDati(migra(dati)).salvataggio;
}

// S-18: la guida introduttiva si vede alla prima partita su questo telefono (non nel salvataggio: una nuova
// partita non la ripropone).
export const guidaVista = () => { try { spostaChiaviVecchie(); return localStorage.getItem(GUIDA) === 'si'; } catch { return true; } };
export const segnaGuidaVista = () => { try { localStorage.setItem(GUIDA, 'si'); } catch { /* niente */ } };

export function nuovoSeme(): number {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a); // il seme nasce qui una volta; da lì in poi tutto è deterministico
  return a[0]!;
}
