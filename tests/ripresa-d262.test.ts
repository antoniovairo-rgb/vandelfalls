// C56-02 (D-262): una ricarica nella pausa con la mossa ancora da fare riporta la risposta (e quindi la mossa), dal salvataggio
// vero della 0.57.0 migrato (SAVE_VERSION 4). La resa (App.tsx, riprendi) la usa; rosso __NO_C262R01 solo nella resa
// (tools/foto-po152-b.mjs, giro «ricarica»).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { leggiDati } from '../tools/dati-disco.mjs';
import { attenta } from '../src/logica/bot.ts';
import { creaCaso } from '../src/logica/caso.ts';
import { chiamateAperte, rispondi, settoriAmmessi, type InCorso } from '../src/logica/missione.ts';
import { rispostaDaRiprendere, sposta, spostabili } from '../src/logica/mossa.ts';
import { migra } from '../src/salvataggi/salvataggio.ts';
import type { Dichiarazione, Missione } from '../src/logica/tipi.ts';

const d = leggiDati() as Record<string, unknown>;
const e01 = d['missioni/e01.json'] as Missione;
const dich = new Map((d['stato.json'] as { variabili: Dichiarazione[] }).variabili.map((x) => [x.id, x]));
const vero = (): InCorso => migra(JSON.parse(readFileSync('tests/salvataggi-reali/v3-0.57.0-e01-ondata2-in-corso.json', 'utf8'))).in_corso!;
const bot = attenta(creaCaso(1), dich);

describe('C56-02: la pausa con la mossa torna dopo una ricarica', () => {
  it('salvataggio vero a metà ondata: torna la risposta dell\'ultima scelta dell\'ondata', () => {
    const ic = vero(), u = ic.scelte.filter((x) => x.ondata === ic.ondata).at(-1)!;
    const o = rispostaDaRiprendere(e01, ic);
    expect(o?.id).toBe(u.opzione);
    expect(o?.risposta).toBeTruthy();
  });
  it('dopo la mossa, ripreso, non torna (la mossa è già fatta)', () => {
    const ic = vero(), x = spostabili(e01, ic)[0]!, a = settoriAmmessi(e01, x.risorsa).find((k) => k !== x.settore)!;
    expect(rispostaDaRiprendere(e01, JSON.parse(JSON.stringify(sposta(e01, ic, { risorsa: x.risorsa, da: x.settore, a }))))).toBeNull();
  });
  it('dopo l\'ultima chiamata dell\'ondata non torna (lì la mossa non c\'è)', () => {
    let s = vero();
    for (let c = chiamateAperte(e01, s)[0]; c; c = chiamateAperte(e01, s)[0]) s = rispondi(e01, s, c.id, bot.scegli(e01, s, c), dich);
    expect(rispostaDaRiprendere(e01, s)).toBeNull();
  });
});
