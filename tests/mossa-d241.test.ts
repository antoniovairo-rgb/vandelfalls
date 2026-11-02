// D-241 idea B, «una mossa per chiamata» (src/logica/mossa.ts): al massimo una mossa per chiamata, solo fra una chiamata e
// l'altra, solo unità non fisse verso settori ammessi; la mossa cambia la disposizione e il salvataggio; dopo una ripresa la
// mossa usata resta usata (SAVE_VERSION 4, salvataggio vero della 0.57.0). Rosso __NO_C241B01: mosse illimitate.
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { leggiDati } from '../tools/dati-disco.mjs';
import { attenta } from '../src/logica/bot.ts';
import { creaCaso } from '../src/logica/caso.ts';
import { variabiliIniziali } from '../src/logica/condizioni.ts';
import { chiamateAperte, giocaMissione, iniziaMissione, missioneFinita, rispondi, schiera, settoriAmmessi, type InCorso } from '../src/logica/missione.ts';
import { mossaPossibile, sposta, spostabili } from '../src/logica/mossa.ts';
import { controllaSalvataggio, migra, SAVE_VERSION } from '../src/salvataggi/salvataggio.ts';
import type { Dichiarazione, Missione } from '../src/logica/tipi.ts';

const g = globalThis as Record<string, unknown>;
afterEach(() => { delete g.__NO_C241B01; });
const d = leggiDati() as Record<string, unknown>;
const ms = Object.entries(d).filter(([k]) => /^missioni\/e\d+\.json$/.test(k)).map(([, m]) => m as Missione).sort((a, b) => a.episodio - b.episodio);
const dich = new Map((d['stato.json'] as { variabili: Dichiarazione[] }).variabili.map((x) => [x.id, x]));
const v0 = variabiliIniziali(dich.values());
const e01 = ms[0]!, e03 = ms.find((m) => m.id === 'e03')!;
const vero = () => migra(JSON.parse(readFileSync('tests/salvataggi-reali/v3-0.57.0-e01-ondata2-in-corso.json', 'utf8')));
const unaMossa = (m: Missione, s: InCorso) => {
  const x = spostabili(m, s)[0]!, a = settoriAmmessi(m, x.risorsa).find((k) => k !== x.settore)!;
  return { risorsa: x.risorsa, da: x.settore, a };
};
const bot = attenta(creaCaso(1), dich);

describe('SAVE_VERSION 4: salvataggio vero della 0.57.0 (e01 a metà ondata 2)', () => {
  it('migra con «mosse» vuoto, anche nelle partenze, ed è valido', () => {
    const s = vero();
    expect(s.save_version).toBe(SAVE_VERSION);
    expect(SAVE_VERSION).toBe(4);
    expect(s.in_corso!.mosse).toEqual([]);
    expect(Object.values(s.in_corso!.partenze ?? {}).map((p) => p.mosse)).toEqual([[], []]);
    expect(controllaSalvataggio(s as unknown as Record<string, unknown>)).toEqual([]);
  });
});

describe('una mossa per chiamata', () => {
  it('dopo una risposta la mossa sposta un\'unità: cambia la disposizione e si segna', () => {
    const ic = vero().in_corso!;
    expect(mossaPossibile(e01, ic)).toBe(true);
    const x = unaMossa(e01, ic), dopo = sposta(e01, ic, x);
    expect(dopo.disposizione![x.risorsa]![x.da]).toBe(ic.disposizione![x.risorsa]![x.da]! - 1);
    expect(dopo.disposizione![x.risorsa]![x.a]).toBe((ic.disposizione![x.risorsa]![x.a] ?? 0) + 1);
    expect(dopo.mosse).toHaveLength(1);
    expect(mossaPossibile(e01, dopo)).toBe(false);
  });
  it('la seconda mossa nella stessa pausa è rifiutata; rosso C241B01: passa', () => {
    const ic = vero().in_corso!, uno = sposta(e01, ic, unaMossa(e01, ic));
    expect(() => sposta(e01, uno, unaMossa(e01, { ...uno, mosse: [] }))).toThrow(/già fatta/);
    g.__NO_C241B01 = true;
    expect(mossaPossibile(e01, uno)).toBe(true);
    expect(() => sposta(e01, uno, unaMossa(e01, uno))).not.toThrow();
  });
  it('salvata e ripresa, la mossa usata resta usata; dopo la risposta seguente si può di nuovo', () => {
    const s = vero(), mosso = sposta(e01, s.in_corso!, unaMossa(e01, s.in_corso!));
    const ripreso = migra(JSON.parse(JSON.stringify({ ...s, in_corso: mosso }))).in_corso!;
    expect(ripreso.disposizione).toEqual(mosso.disposizione);
    expect(mossaPossibile(e01, ripreso)).toBe(false);
    const c = chiamateAperte(e01, ripreso)[0]!, poi = rispondi(e01, ripreso, c.id, bot.scegli(e01, ripreso, c), dich);
    expect(mossaPossibile(e01, poi)).toBe(chiamateAperte(e01, poi).length > 0);
  });
  it('non prima della prima risposta dell\'ondata, non dopo l\'ultima chiamata', () => {
    let s = schiera(e01, iniziaMissione(e01, v0, dich), bot.schiera(e01, iniziaMissione(e01, v0, dich)));
    expect(mossaPossibile(e01, s)).toBe(false);
    for (let c = chiamateAperte(e01, s)[0]; c; c = chiamateAperte(e01, s)[0]) s = rispondi(e01, s, c.id, bot.scegli(e01, s, c), dich);
    expect(mossaPossibile(e01, s)).toBe(false);
    expect(() => sposta(e01, s, { risorsa: 'squadre', da: 'x', a: 'y' })).toThrow(/fra una chiamata/);
  });
  it('le unità fisse (transenne, D-082) non si spostano', () => {
    let s = iniziaMissione(e03, v0, dich);
    const dd = bot.schiera(e03, s);
    expect(Object.values(dd.transenne ?? {}).some((n) => n > 0)).toBe(true);
    s = schiera(e03, s, dd);
    const c = chiamateAperte(e03, s)[0]!; s = rispondi(e03, s, c.id, bot.scegli(e03, s, c), dich);
    expect(spostabili(e03, s).some((x) => x.risorsa === 'transenne')).toBe(false);
    const da = Object.entries(dd.transenne!).find(([, n]) => n > 0)![0];
    expect(() => sposta(e03, s, { risorsa: 'transenne', da, a: settoriAmmessi(e03, 'transenne').find((k) => k !== da)! })).toThrow(/fisse/);
  });
  it('il bot attento usa la mossa e finisce sempre l\'episodio (36 episodi)', () => {
    let mosse = 0;
    for (const m of ms) { const b = attenta(creaCaso(1), dich), muovi = b.muovi!.bind(b);
      b.muovi = (mm, s) => { const x = muovi(mm, s); if (x) mosse++; return x; };
      expect(() => giocaMissione(m, v0, dich, b)).not.toThrow(); }
    expect(mosse).toBeGreaterThan(0);
    expect(missioneFinita(e01, iniziaMissione(e01, v0, dich))).toBe(false);
  });
});
