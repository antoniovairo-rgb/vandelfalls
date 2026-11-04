// D-262 punto 1: dopo la mossa la mappa dice come cambia la tensione prevista alla chiusura nel settore lasciato e in quello
// coperto (src/logica/previsione.ts). Guardiano: su ogni mossa legale di ogni pausa (36 episodi, bot attento, semi 1-2) il
// segno previsto si confronta con la chiusura vera, finendo l'ondata con le stesse risposte con e senza la mossa.
// - mai di verso opposto (previsto ▲ e vero ▼, o il contrario): 0 casi;
// - quante volte coincide in tutto (anche «non cambia»): misurato 88,70 % il 4/11 (semi 1-3); le risposte che vengono dopo
//   possono cambiare la pressione degli stessi settori, e la previsione non le conosce. Decisione della principale (4/11):
//   niente soglia di qualità, ma l'accordo non scende sotto la misura di quel giorno meno 3 punti (85,7 %), così non peggiora
//   in silenzio.
// Rosso __NO_C262E01: nessun effetto, il guardiano non trova segni.
import { afterEach, describe, expect, it } from 'vitest';
import { leggiDati } from '../tools/dati-disco.mjs';
import { attenta } from '../src/logica/bot.ts';
import { creaCaso } from '../src/logica/caso.ts';
import { variabiliIniziali } from '../src/logica/condizioni.ts';
import * as M from '../src/logica/missione.ts';
import { mossaPossibile, sposta, spostabili } from '../src/logica/mossa.ts';
import { effettoMossa } from '../src/logica/previsione.ts';
import type { Dichiarazione, Missione } from '../src/logica/tipi.ts';

const g0 = globalThis as Record<string, unknown>;
afterEach(() => { delete g0.__NO_C262E01; });
const dati = leggiDati() as Record<string, unknown>;
const dich = new Map((dati['stato.json'] as { variabili: Dichiarazione[] }).variabili.map((d) => [d.id, d]));
const ms = Object.entries(dati).filter(([k]) => /^missioni\/e\d+\.json$/.test(k)).map(([, x]) => x as Missione).sort((a, b) => a.episodio - b.episodio);
const v0 = variabiliIniziali(dich.values());

/** Finisce l'ondata con le risposte date (se ancora possibili), altrimenti con quelle del bot, e la chiude. */
function fine(m: Missione, s: M.InCorso, g: M.Giocatore, risposte: Map<string, string>) {
  for (let c = M.chiamateAperte(m, s)[0]; c; c = M.chiamateAperte(m, s)[0]) {
    const o = risposte.get(c.id), x = o && M.opzioniValide(c, s, m).some((y) => y.id === o) ? o : g.scegli(m, s, c);
    risposte.set(c.id, x); s = M.rispondi(m, s, c.id, x, dich);
  }
  return M.chiudiOndata(m, s, dich).tensione;
}

function misura(semi: number) {
  const tab: Record<string, number> = {};
  for (const m of ms) for (let seme = 1; seme <= semi; seme++) {
    const g = attenta(creaCaso(seme), dich); let s = M.iniziaMissione(m, v0, dich);
    while (!M.missioneFinita(m, s)) {
      s = M.schiera(m, s, g.schiera(m, s));
      for (let c = M.chiamateAperte(m, s)[0]; c; c = M.chiamateAperte(m, s)[0]) {
        s = M.rispondi(m, s, c.id, g.scegli(m, s, c), dich);
        if (!mossaPossibile(m, s)) continue;
        const base = new Map<string, string>(), A = fine(m, s, g, base);
        for (const x of spostabili(m, s)) for (const a of M.settoriAmmessi(m, x.risorsa).filter((k) => k !== x.settore)) {
          const mossa = { risorsa: x.risorsa, da: x.settore, a }, t = sposta(m, s, mossa), B = fine(m, t, g, new Map(base));
          for (const e of effettoMossa(m, s, t, mossa, dich)) {
            const ra = A[e.settore] ?? 0, rb = B[e.settore] ?? 0, vero = rb > ra ? 'su' : rb < ra ? 'giu' : 'pari';
            tab[`${e.verso}>${vero}`] = (tab[`${e.verso}>${vero}`] ?? 0) + 1;
          }
        }
      }
      s = M.chiudiOndata(m, s, dich);
    }
  }
  return tab;
}

describe('D-262: effetto della mossa previsto sulla chiusura', () => {
  it('su ogni mossa legale il segno non è mai di verso opposto alla chiusura vera', () => {
    const tab = misura(2), tot = Object.values(tab).reduce((a, b) => a + b, 0), uguali = (tab['su>su'] ?? 0) + (tab['giu>giu'] ?? 0) + (tab['pari>pari'] ?? 0);
    console.log(`D-262: ${tot} segni, coincidono ${uguali} (${((100 * uguali) / tot).toFixed(2)} %), ${JSON.stringify(tab)}`);
    expect(tot).toBeGreaterThan(10000);
    expect((tab['su>su'] ?? 0) + (tab['giu>giu'] ?? 0)).toBeGreaterThan(0);
    expect((tab['su>giu'] ?? 0) + (tab['giu>su'] ?? 0)).toBe(0);
    expect(uguali / tot).toBeGreaterThanOrEqual(0.857);
  });
  it('rosso C262E01: nessun effetto, il guardiano non vede segni', () => {
    g0.__NO_C262E01 = true;
    expect(Object.values(misura(1)).reduce((a, b) => a + b, 0)).toBe(0);
  });
});
