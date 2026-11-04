// C56-08 (D-268): il salvataggio scritto dal gioco porta la versione che l'ha scritto (game_version, solo informativo:
// non guida la migrazione). Salvataggio vero della 0.57.0, caricato e risalvato come fa il gioco (archivio.ts).
// Rosso __NO_C268G01: resta la versione di chi l'aveva creato.
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { carica, salva } from '../src/resa/archivio.ts';
import { GAME_VERSION } from '../src/versione.ts';

const g = globalThis as Record<string, unknown>;
let mem: Map<string, string>;
beforeEach(() => {
  mem = new Map();
  g.localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => { mem.set(k, String(v)); }, removeItem: (k: string) => { mem.delete(k); } };
  mem.set('vandelfalls-salvataggio', readFileSync('tests/salvataggi-reali/v3-0.57.0-e01-ondata2-in-corso.json', 'utf8'));
});
afterEach(() => { delete g.localStorage; delete g.__NO_C268G01; });
const scritta = () => JSON.parse(mem.get('vandelfalls-salvataggio')!).game_version;

describe('C56-08: game_version del salvataggio', () => {
  it('salvataggio vero della 0.57.0, ripreso e risalvato: porta la versione di oggi (anche la riserva)', () => {
    expect(scritta()).toBe('0.57.0');
    salva(carica()!);
    expect(scritta()).toBe(GAME_VERSION);
    expect(JSON.parse(mem.get('vandelfalls-salvataggio-riserva')!).game_version).toBe(GAME_VERSION);
  });
  it('rosso C268G01: resta 0.57.0', () => {
    g.__NO_C268G01 = true;
    salva(carica()!);
    expect(scritta()).toBe('0.57.0');
  });
});
