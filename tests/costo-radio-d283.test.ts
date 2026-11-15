// D-283 (D-16, collaudo grafico): nella radio dopo «Conferma» il costo non si ripete. Prima: «Calma la strada, ma ti costa una
// squadra. Ti costa 1 squadra dalla prossima ondata» (e01 scorta). Su tutte le risposte con costo in unità dei 36 episodi
// nessuna frase della radio nomina due volte l'unità; resta «da quando» vale. Rosso __NO_C283R01: la frase intera, ripetuta.
import { afterEach, describe, expect, it } from 'vitest';
import { leggiDati } from '../tools/dati-disco.mjs';
import { quandoRadio } from '../src/resa/effetti-opzione.tsx';
import { quante, t } from '../src/resa/dati.ts';
import type { Missione } from '../src/logica/tipi.ts';

const g = globalThis as Record<string, unknown>;
afterEach(() => { delete g.__NO_C283R01; });
const d = leggiDati() as Record<string, unknown>;
const missioni = Object.entries(d).filter(([k]) => /^missioni\/e\d+\.json$/.test(k)).map(([, m]) => m as Missione);
const conCosto = missioni.flatMap((m) => m.ondate.flatMap((o, i) => (o.chiamate ?? []).flatMap((c) => c.opzioni
  .filter((x) => x.costo && x.effetti.some((e) => 'riserva' in e && e.valore < 0))
  .map((x) => ({ id: `${m.id} ${c.id}/${x.id}`, o: x, ultima: i === m.ondate.length - 1 })))));
// quante volte la frase della radio (testo del costo + regola) nomina l'unità impegnata, per forma singolare o plurale
const volte = (frase: string, r: string) => [quante(1, r), quante(2, r)].map((x) => x.replace(/^\d+ /, ''))
  .filter((f, i, xs) => xs.indexOf(f) === i).reduce((n, f) => n + (frase.match(new RegExp(`(^|[^\\p{L}])${f}(?=[^\\p{L}]|$)`, 'giu')) ?? []).length, 0);
const ripetute = () => conCosto.filter(({ o, ultima }) => { const frase = `${t(o.costo!)} ${quandoRadio(o, ultima) ?? ''}`;
  return o.effetti.some((e) => 'riserva' in e && e.valore < 0 && volte(frase, e.riserva) > 1); }).map((x) => x.id);

describe('D-283 D-16 il costo in radio non si ripete', () => {
  it('verde: nessuna risposta ripete l\'unità e ognuna dice da quando vale', () => {
    if (process.env.MOSTRA) console.log(`risposte: ${conCosto.length}, ripetute col rosso: ${(g.__NO_C283R01 = true, ripetute().length)}`), delete g.__NO_C283R01;
    expect(conCosto.length).toBeGreaterThan(200);
    expect(ripetute()).toEqual([]);
    for (const { o, ultima } of conCosto) expect(quandoRadio(o, ultima)).toMatch(/prossima ondata|fine serata/i);
  });
  it('e01 scorta: «Calma la strada, ma ti costa una squadra. Dalla prossima ondata.»', () => {
    const x = conCosto.find((c) => c.id.startsWith('e01 ') && c.o.id === 'scorta')!;
    expect(`${t(x.o.costo!)} ${quandoRadio(x.o, x.ultima)}`).toBe('Calma la strada, ma ti costa una squadra. Dalla prossima ondata.');
  });
  it('rosso C283R01: le risposte non dell\'ultima ondata ripetono l\'unità, come prima', () => {
    g.__NO_C283R01 = true; expect(ripetute().length).toBeGreaterThanOrEqual(conCosto.filter((x) => !x.ultima).length * 0.9);
  });
});
