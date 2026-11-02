// D-241 idea C (PO-152): «il nessun costo morde dopo». Un'opzione comoda può avere «effetti_dopo», che mordono alla
// chiusura dell'ondata della scelta + «ondate» (o dell'ultima). Guardiani:
// - ogni effetto ritardato dei 36 episodi si applica esattamente all'ondata dichiarata (chiudiOndata, una per opzione);
// - in una partita intera ogni morso arriva una volta sola, all'ondata giusta, anche con le varianti del seme (D-241);
// - in ogni ondata dei 36 episodi almeno un'opzione comoda (costo immediato lieve) ha un effetto ritardato;
// - salvataggi veri 0.4.0, 0.52.0, 0.38.0: si caricano e i morsi delle scelte fatte dopo arrivano una volta sola;
// - rosso __NO_C241C01: gli effetti ritardati non si applicano (i guardiani lo vedono).
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Chiusura, costoMorso } from '../src/resa/schermate/Ondata.tsx';
import { leggiDati } from '../tools/dati-disco.mjs';
import { variabiliIniziali } from '../src/logica/condizioni.ts';
import { ondataDelMorso } from '../src/logica/dopo.ts';
import { chiamateAperte, chiudiOndata, concludiMissione, iniziaMissione, missioneFinita, opzioniValide, rispondi, schiera, type Giocatore, type InCorso } from '../src/logica/missione.ts';
import { chiamateDellaPartita, semeDa } from '../src/logica/partita.ts';
import { dichiarate, missioni } from '../src/resa/dati.ts';
import { iniziaEpisodio } from '../src/resa/episodi.ts';
import { adattaAiDati } from '../src/resa/archivio.ts';
import { migra } from '../src/salvataggi/salvataggio.ts';
import type { Chiamata, Dichiarazione, EffettoDopo, Missione, Opzione } from '../src/logica/tipi.ts';

const g = globalThis as Record<string, unknown>;
afterEach(() => { delete g.__NO_C241C01; delete g.__NO_C253C02; });
const d = leggiDati() as Record<string, unknown>;
const ms = Object.entries(d).filter(([k]) => /^missioni\/e\d+\.json$/.test(k)).map(([, m]) => m as Missione).sort((a, b) => a.episodio - b.episodio);
const dich = new Map((d['stato.json'] as { variabili: Dichiarazione[] }).variabili.map((x) => [x.id, x]));
const v0 = variabiliIniziali(dich.values());
const vuota = (m: Missione) => Object.fromEntries(Object.keys(m.mappa.risorse).map((r) => [r, {}]));
const lim = (x: number) => Math.max(0, Math.min(10, x));

/** Le opzioni con effetto ritardato, nell'ondata dove si scelgono (chiamate della missione, varianti comprese). */
const conDopo = (m: Missione) => m.ondate.flatMap((o) => (o.chiamate ?? []).flatMap((c) => c.opzioni.filter((x) => x.effetti_dopo).map((x) => ({ n: o.n, c, o: x, dopo: x.effetti_dopo! }))));

/** Errori del guardiano «all'ondata dichiarata»: per ogni opzione, lo stato a fine ondata del morso (schieramento vuoto,
 *  tensioni a zero) contro lo stesso stato senza la scelta; la differenza deve essere esattamente l'effetto. */
function morsoAllOndata(m: Missione): string[] {
  const errori: string[] = [];
  for (const { n, c, o, dopo } of conDopo(m)) {
    const bersaglio = ondataDelMorso(m, n, dopo.ondate);
    for (let w = n; w <= m.ondate.length; w++) {
      const base = iniziaMissione(m, v0, dich);
      const tutte = Object.fromEntries(chiamateDellaPartita(m, m.ondate[w - 1]!, 0).map((x) => [x.id, x.opzioni[0]!.id]));
      const s: InCorso = { ...base, ondata: w, disposizione: vuota(m), risposte: tutte };
      const senza = chiudiOndata(m, { ...s, scelte: [] }, dich), con = chiudiOndata(m, { ...s, scelte: [{ ondata: n, chiamata: c.id, opzione: o.id }] }, dich);
      const dove = `${m.id} ${c.id}/${o.id} (ondata ${n}, morde alla ${bersaglio}) chiusura ${w}`;
      const esito = (x: InCorso) => JSON.stringify([x.tensione, x.variabili, x.riserva, x.riposo, x.rapporti]); // tutto tranne la scelta stessa
      if (w !== bersaglio) { if (esito(con) !== esito(senza)) errori.push(`${dove}: effetto fuori ondata`); continue; }
      if (JSON.stringify(con.rapporti.at(-1)!.radio) !== JSON.stringify([dopo.rapporto])) errori.push(`${dove}: rapporto radio ${JSON.stringify(con.rapporti.at(-1)!.radio)}`);
      for (const e of dopo.effetti) {
        const k = 'pressione' in e ? e.pressione : 'tensione' in e ? e.tensione : null;
        if (k) { const a = senza.tensione[k]!, b = con.tensione[k]!, v = e.valore as number; if (b - a !== lim(a + v) - a) errori.push(`${dove}: tensione di ${k} ${a} → ${b}, attesa ${lim(a + v)}`); }
        else if ('aggiungi' in e) { const a = senza.variabili[e.aggiungi] as number, b = con.variabili[e.aggiungi] as number; if (b - a !== e.valore) errori.push(`${dove}: ${e.aggiungi} ${a} → ${b}`); }
        else if ('riserva' in e) { if ((con.riserva[e.riserva] ?? 0) === (senza.riserva[e.riserva] ?? 0)) errori.push(`${dove}: riserva ${e.riserva} invariata`); }
      }
    }
  }
  return errori;
}

/** Giocatore goloso: schiera vuoto e sceglie un'opzione con effetto ritardato appena può (anche nelle varianti). */
const golosa: Giocatore = { schiera: (m) => vuota(m), scegli: (m, s, c) => (opzioniValide(c, s, m).find((x) => x.effetti_dopo) ?? opzioniValide(c, s, m)[0]!).id };

/** Gioca da «s» alla fine; errori del guardiano «una volta sola»: ogni scelta con effetto ritardato ha il suo rapporto radio
 *  una volta, all'ondata dichiarata, e nessun altro rapporto radio compare. */
function unaVoltaSola(m: Missione, s: InCorso, gioc: Giocatore = golosa, dd = dich): { errori: string[]; morsi: number; fine: InCorso } {
  let ic = s;
  while (!missioneFinita(m, ic)) {
    if (!ic.disposizione) ic = schiera(m, ic, gioc.schiera(m, ic));
    for (let c = chiamateAperte(m, ic)[0]; c; c = chiamateAperte(m, ic)[0]) ic = rispondi(m, ic, c.id, gioc.scegli(m, ic, c), dd);
    ic = chiudiOndata(m, ic, dd);
  }
  concludiMissione(m, ic, dd);
  const errori: string[] = [], attesi = new Map<number, string[]>();
  const opzione = (n: number, c: string, o: string): Opzione | undefined => m.ondate[n - 1]?.chiamate?.find((x: Chiamata) => x.id === c)?.opzioni.find((x) => x.id === o);
  for (const x of ic.scelte) {
    const dopo: EffettoDopo | undefined = opzione(x.ondata, x.chiamata, x.opzione)?.effetti_dopo;
    if (dopo) { const w = ondataDelMorso(m, x.ondata, dopo.ondate); attesi.set(w, [...(attesi.get(w) ?? []), dopo.rapporto]); }
  }
  for (const r of ic.rapporti) if (JSON.stringify(r.radio ?? []) !== JSON.stringify(attesi.get(r.n) ?? [])) errori.push(`${m.id} ondata ${r.n}: radio ${JSON.stringify(r.radio ?? [])}, attesi ${JSON.stringify(attesi.get(r.n) ?? [])}`);
  return { errori, morsi: [...attesi.values()].flat().length, fine: ic };
}

/** D-247: tipi di morso di ogni episodio (tensione, pressione su un settore, riserva di unità, fiducia); episodi sotto MIN_TIPI. */
export const MIN_TIPI = 3;
const tipoMorso = (e: Record<string, unknown>) => ('tensione' in e ? 'tensione' : 'pressione' in e ? 'pressione' : 'riserva' in e ? 'riserva' : 'fiducia');
export const pocoVari = (missioni: Missione[]) => missioni.flatMap((m) => {
  const tipi = new Set(conDopo(m).filter((x) => !x.c.variante_di).flatMap((x) => x.dopo.effetti.map((e) => tipoMorso(e as Record<string, unknown>))));
  return tipi.size >= MIN_TIPI ? [] : [`${m.id}: ${tipi.size} tipi di morso (${[...tipi].join(', ')})`];
});

describe('il morso dice cosa è costato (C54-04, D-253)', () => {
  it('ogni effetto ritardato dei 36 episodi ha la sua etichetta: tipo, segno e, per tensione e pressione, il settore', () => {
    const male = ms.flatMap((m) => conDopo(m).flatMap((x) => x.dopo.effetti.map((e) => [m.id, x.o.id, costoMorso(e as never)] as const)))
      .filter(([, , l]) => !/^(Fiducia [−+]\d+|(Tensione|Pressione) [−+]\d+, [^[]+|[A-Z][a-z]+ [−+]\d+)$/.test(l));
    expect(male).toEqual([]);
  });
  it('la chiusura mostra il costo in testa al messaggio; rosso __NO_C253C02: solo il racconto', () => {
    const m = ms.find((x) => x.id === 'e01')!, base = iniziaMissione(m, v0, dich);
    const ic: InCorso = { ...base, ondata: 2, scelte: [{ ondata: 1, chiamata: 'corteo_partito', opzione: 'osserva' }] };
    const html = () => renderToStaticMarkup(createElement(Chiusura, { m, ic, chiudi: () => {} }));
    expect(html()).toMatch(/data-costo-morso[^>]*>Squadre −1\. </);
    g.__NO_C253C02 = true; expect(html()).not.toMatch(/data-costo-morso/);
  });
});

describe('morsi vari (D-247)', () => {
  it(`in ogni episodio i morsi usano almeno ${MIN_TIPI} tipi di effetto diversi`, () => {
    expect(pocoVari(ms)).toEqual([]);
  });
  it('braccio rosso: tutti i morsi di fiducia, come in 0.56.0, e il guardiano segnala tutti i 36 episodi', () => {
    const tuttiFiducia = ms.map((m) => ({ ...m, ondate: m.ondate.map((o) => ({ ...o, chiamate: (o.chiamate ?? []).map((c) => ({ ...c, opzioni: c.opzioni.map((x) => (x.effetti_dopo ? { ...x, effetti_dopo: { ...x.effetti_dopo, effetti: [{ aggiungi: 'credito', valore: -1 }] } } : x)) })) })) }));
    expect(pocoVari(tuttiFiducia as Missione[])).toHaveLength(36);
  });
});

describe('il nessun costo morde dopo (D-241 idea C)', () => {
  it('ogni effetto ritardato dei 36 episodi si applica esattamente all\'ondata dichiarata (e in nessun\'altra)', () => {
    expect(ms.reduce((t, m) => t + conDopo(m).length, 0)).toBeGreaterThanOrEqual(142);
    expect(ms.flatMap(morsoAllOndata)).toEqual([]);
  });
  it('partite intere (seme 0 e 3 semi per episodio): ogni morso una volta sola, all\'ondata giusta', () => {
    let morsi = 0;
    for (const m of ms) for (const seme of [0, semeDa(`morso:${m.id}:1`), semeDa(`morso:${m.id}:2`), semeDa(`morso:${m.id}:3`)]) {
      const r = unaVoltaSola(m, iniziaMissione(m, v0, dich, seme));
      expect(r.errori, m.id).toEqual([]);
      morsi += r.morsi;
    }
    expect(morsi).toBeGreaterThanOrEqual(36 * 4 * 3); // almeno tre morsi a partita (il goloso li prende tutti)
  });
  it('in ogni ondata almeno un\'opzione comoda (costo immediato lieve, nessuna condizione) morde dopo', () => {
    // costo immediato: tensione +1 = 1, pressione +1 = 0,5, unità impegnata = 2, fiducia −1 = 1,5; «lieve» = al massimo 2
    const costo = (x: Opzione) => x.effetti.reduce((t, e) => t + ('tensione' in e ? Math.max(0, e.valore) : 'pressione' in e ? Math.max(0, e.valore) / 2
      : 'riserva' in e ? Math.max(0, -e.valore) * 2 : 'aggiungi' in e && e.aggiungi === 'credito' ? Math.max(0, -e.valore) * 1.5 : 0), 0);
    const mancano = ms.flatMap((m) => m.ondate.filter((o) => !(o.chiamate ?? []).some((c) => !c.se && !c.dopo && !c.senza && !c.imprevisto && !c.variante_di
      && c.opzioni.some((x) => x.effetti_dopo && !x.se && !x.dopo && costo(x) <= 2))).map((o) => `${m.id} ondata ${o.n}`));
    expect(mancano).toEqual([]);
  });
  it('le varianti ereditano gli effetti ritardati dell\'originale (stessa chiamata, altro racconto)', () => {
    for (const m of ms) for (const o of m.ondate) for (const v of (o.chiamate ?? []).filter((c) => c.variante_di)) {
      const orig = o.chiamate!.find((c) => c.id === v.variante_di)!;
      expect(v.opzioni.map((x) => x.effetti_dopo ?? null), `${m.id} ${v.id}`).toEqual(orig.opzioni.map((x) => x.effetti_dopo ?? null));
    }
  });
  it('braccio rosso __NO_C241C01: nessun effetto ritardato, i due guardiani lo segnalano', () => {
    g.__NO_C241C01 = true;
    expect(morsoAllOndata(ms[0]!).length).toBeGreaterThan(0);
    const r = unaVoltaSola(ms[0]!, iniziaMissione(ms[0]!, v0, dich));
    expect(r.morsi).toBeGreaterThan(0);
    expect(r.errori.length).toBeGreaterThan(0);
    expect(r.fine.rapporti.every((x) => !x.radio)).toBe(true);
  });
});

describe('salvataggi veri: le scelte di prima non mordono, quelle dopo una volta sola (formato invariato, SAVE_VERSION 3)', () => {
  const carica = (f: string) => adattaAiDati(migra(JSON.parse(readFileSync(`tests/salvataggi-reali/${f}.json`, 'utf8')))).salvataggio;
  it('0.52.0 (e01 a metà ondata 2): nessuna scelta salvata ha effetti ritardati; il resto si gioca e morde una volta', () => {
    const s = carica('v2-0.52.0-e01-ondata2-in-corso'), m = missioni.find((x) => x.id === 'e01')!;
    expect(s.in_corso!.scelte.filter((x) => m.ondate[x.ondata - 1]!.chiamate!.find((c) => c.id === x.chiamata)!.opzioni.find((o) => o.id === x.opzione)!.effetti_dopo)).toEqual([]);
    const r = unaVoltaSola(m, s.in_corso!, golosa, dichiarate);
    expect(r.errori).toEqual([]);
    expect(r.morsi).toBeGreaterThanOrEqual(2); // presidente/aspetti (ondata 2 → 3) e troupe/niente (ondata 3)
  });
  it('0.4.0 (e02 a metà ondata 2, senza «partenze»): si gioca fino all\'esito, morsi una volta sola', () => {
    const s = carica('v2-0.4.0-e02-in-corso'), m = missioni.find((x) => x.id === 'e02')!;
    const r = unaVoltaSola(m, s.in_corso!, golosa, dichiarate);
    expect(r.errori).toEqual([]);
    expect(r.morsi).toBeGreaterThanOrEqual(2);
  });
  it('0.38.0 (fine campagna): primo e ultimo episodio rigiocati col loro seme, morsi una volta sola', () => {
    const s = carica('v2-0.38.0-fine-campagna');
    for (const m of [missioni[0]!, missioni.at(-1)!]) {
      const r = unaVoltaSola(m, iniziaEpisodio(s, m), golosa, dichiarate);
      expect(r.errori, m.id).toEqual([]);
      expect(r.morsi, m.id).toBeGreaterThanOrEqual(3);
    }
  });
});
