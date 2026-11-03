// C56-01 (collaudo C-056): il numero scritto nel testo del costo e nel rapporto del morso è quello dell'effetto.
// In 4 morsi il rapporto diceva «una squadra» e l'effetto era riserva squadre −2 (e02, e26, e31, e32).
// Guardiano: nei testi del costo (contro «effetti») e del rapporto ritardato (contro «effetti_dopo.effetti») ogni
// «una/due/tre… squadra/e», «uno/due… steward» e «un/due… mediatore/i» deve valere quanto la somma della riserva
// (in valore assoluto). Gli articoli non contano: «la squadra» può essere quella in campo, «Il mediatore l'hai lasciato
// in tribuna» (e26, e27) non è un costo. Oggi i 43 costi col mediatore (sempre −1) dicono «il mediatore», senza numero:
// per i mediatori il guardiano vale per i testi nuovi. Le risposte sono racconto, fuori.
// Rosso: coi rapporti di prima (testi C-056) il guardiano segnala i 4 morsi; «due mediatori» su un costo −1 è segnalato.
import { describe, expect, it } from 'vitest';
import { leggiDati } from '../tools/dati-disco.mjs';
import type { EffettoMissione, Missione } from '../src/logica/tipi.ts';

const d = leggiDati() as Record<string, unknown>;
const ms = Object.entries(d).filter(([k]) => /^missioni\/e\d+\.json$/.test(k)).map(([, m]) => m as Missione);
type Testi = Record<string, string>;
const testiDi = (ep: string) => d[`testi/it/${ep}.json`] as Testi;

const NUMERI: Record<string, number> = { un: 1, uno: 1, una: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6 };
const RISERVA: [RegExp, string][] = [[/^squadr/i, 'squadre'], [/^mediator/i, 'mediatore'], [/^steward$/i, 'steward']];
// numero, al più una parola in mezzo («due squadre», «una sola squadra»)
const FRASE = /\b(un|uno|una|due|tre|quattro|cinque|sei|\d+)\s+(?:[\wàèéìòù]+\s+)?(squadr[ae]|mediator[ei]|steward)\b/gi;

/** Le frasi del testo che contano una riserva, col numero scritto. */
export function numeriScritti(testo: string): { frase: string; riserva: string; n: number }[] {
  return [...testo.matchAll(FRASE)].map((g) => {
    const parola = (g[1] ?? '').toLowerCase(), nome = g[2] ?? '';
    return { frase: g[0], riserva: RISERVA.find(([r]) => r.test(nome))![1], n: NUMERI[parola] ?? Number(parola) };
  });
}

const somma = (eff: EffettoMissione[] | undefined, r: string) =>
  (eff ?? []).reduce((s, e) => s + ('riserva' in e && e.riserva === r ? (e as { valore: number }).valore : 0), 0);

/** Errori: per ogni opzione, testo del costo contro effetti, rapporto ritardato contro effetti_dopo. */
export function numeriSbagliati(m: Missione, t: Testi): string[] {
  const tx = (k?: string) => (k?.startsWith('testi:') ? t[k.slice(6)] : k);
  const errori: string[] = [];
  for (const o of m.ondate) for (const c of o.chiamate ?? []) for (const x of c.opzioni) {
    for (const [dove, testo, eff] of [['costo', tx(x.costo), x.effetti], ['rapporto', tx(x.effetti_dopo?.rapporto), x.effetti_dopo?.effetti]] as const) {
      if (!testo) continue;
      for (const { frase, riserva, n } of numeriScritti(testo)) {
        const v = somma(eff as EffettoMissione[] | undefined, riserva);
        if (Math.abs(v) !== n) errori.push(`${m.id} ${c.id}/${x.id}, ${dove}: «${frase}» ma ${riserva} ${v}`);
      }
    }
  }
  return errori;
}

const tutti = (testi: (ep: string) => Testi, missioni = ms) => missioni.flatMap((m) => numeriSbagliati(m, testi(m.id)));
const contati = () => ms.flatMap((m) => { const t = testiDi(m.id); return m.ondate.flatMap((o) => (o.chiamate ?? []).flatMap((c) => c.opzioni.flatMap((x) =>
  [x.costo, x.effetti_dopo?.rapporto].flatMap((k) => (k?.startsWith('testi:') ? numeriScritti(t[k.slice(6)] ?? '') : []))))); });

describe('C56-01: i numeri dei testi sono quelli degli effetti', () => {
  it('nei 36 episodi nessun costo o rapporto dice un numero di squadre, steward o mediatori diverso dall\'effetto', () => {
    expect(ms.length).toBe(36);
    expect(tutti(testiDi)).toEqual([]);
    // il guardiano legge davvero: frasi contate per riserva (misura C56-01: squadre 127, steward 85)
    const per = contati().reduce<Record<string, number>>((a, x) => ({ ...a, [x.riserva]: (a[x.riserva] ?? 0) + 1 }), {});
    expect(per.squadre).toBeGreaterThanOrEqual(120);
    expect(per.steward).toBeGreaterThanOrEqual(80);
  });

  it('rosso: coi rapporti di prima (C-056) i 4 morsi «una squadra» con riserva −2 sono segnalati', () => {
    const PRIMA: [string, string, string][] = [
      ['e02', 'e02.dopo.secondo_treno.normale', 'Il vagone col finestrino rotto va portato in deposito: una squadra è impegnata fino a fine serata.'],
      ['e26', 'e26.dopo.fumogeni_finale.steward_fumogeni', 'Gli steward fischiati chiedono aiuto: una squadra resta in curva ospiti fino a fine serata.'],
      ['e31', 'e31.dopo.costruttore_saluta.manda_vice', 'Varrone non ha gradito il vice e chiede «protezione» per i suoi ospiti: una squadra è in tribuna.'],
      ['e32', 'e32.dopo.fumogeni_cinderwick.sospendi', 'Dopo la pausa per il fumo l\'arbitro vuole un presidio sotto la curva Kiln: una squadra resta lì.'],
    ];
    const vecchi = (ep: string) => ({ ...testiDi(ep), ...Object.fromEntries(PRIMA.filter(([e]) => e === ep).map(([, k, s]) => [k, s])) });
    const errori = tutti(vecchi);
    expect(errori).toHaveLength(5); // e02 anche nella variante secondo_treno_v, che usa lo stesso rapporto
    expect(new Set(errori.map((e) => e.split(' ')[0]))).toEqual(new Set(['e02', 'e26', 'e31', 'e32']));
    expect(errori.every((e) => e.includes('«una squadra» ma squadre -2'))).toBe(true);
  });

  it('rosso: un costo col mediatore −1 che dice «due mediatori» è segnalato (e il numero giusto no)', () => {
    const m = ms.find((x) => x.id === 'e01')!;
    const x = m.ondate.flatMap((o) => (o.chiamate ?? []).flatMap((c) => c.opzioni)).find((y) => y.effetti?.some((e) => 'riserva' in e && e.riserva === 'mediatore'))!;
    const con = (frase: string) => numeriSbagliati(m, { ...testiDi('e01'), [x.costo!.slice(6)]: `Calma la curva, ma ${frase} restano lì.` });
    expect(con('due mediatori').some((e) => e.includes('«due mediatori» ma mediatore -1'))).toBe(true);
    expect(con('un mediatore')).toEqual([]);
  });
});
