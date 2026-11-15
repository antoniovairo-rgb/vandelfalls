// L'effetto prima della scelta (PO-085, D-112 punto 3): accanto al costo in parole, icone piccole per il tipo di
// effetto (situazione di un settore, fiducia, unità impegnate) e il settore coinvolto. Niente numeri né verso
// (D-055, D-078): dice dove e su cosa pesa la scelta, non quanto. Rosso C39I01: niente icone.
import { Flame, ThumbsUp } from 'lucide-react';
import type { Chiamata, Opzione } from '../logica/tipi.ts';
import { quante, t } from './dati.ts';
import { Icona, iconaRisorsa } from './icone.tsx';
import { spento } from '../interruttori.ts';

interface Voce { chiave: string; icona: typeof Flame; testo: string; aria: string }

export function vociEffetti(c: Chiamata, o: Opzione): Voce[] {
  const voci = new Map<string, Voce>();
  for (const e of o.effetti) {
    if (('tensione' in e || 'pressione' in e) && e.valore) {
      const s = 'tensione' in e ? e.tensione : e.pressione;
      voci.set(`settore:${s}`, { chiave: `settore:${s}`, icona: Flame, testo: t(`settore.${s}`), aria: `situazione di ${t(`settore.${s}`)}` });
    } else if ('aggiungi' in e && e.aggiungi === 'credito' && e.valore) {
      voci.set('fiducia', { chiave: 'fiducia', icona: ThumbsUp, testo: 'fiducia', aria: 'fiducia del comando' });
    } else if ('riserva' in e && e.valore) {
      const dove = c.settore ? ` · ${t(`settore.${c.settore}`)}` : '';
      voci.set(`unita:${e.riserva}`, { chiave: `unita:${e.riserva}`, icona: iconaRisorsa(e.riserva), testo: `${t(`risorsa.${e.riserva}`)}${e.valore < 0 ? dove : ''}`, aria: `${t(`risorsa.${e.riserva}`)} ${e.valore < 0 ? 'impegnate' : 'in più'}` });
    }
  }
  return [...voci.values()];
}

export function EffettiOpzione(p: { c: Chiamata; o: Opzione }) {
  if (spento('C39I01')) return null;
  const voci = vociEffetti(p.c, p.o);
  if (!voci.length) return null;
  return (
    <span className="effetti-opzione" data-effetti={p.o.id}>
      {voci.map((v) => <span key={v.chiave} className="effetto-chip" data-effetto={v.chiave} aria-label={v.aria}><Icona di={v.icona} />{v.testo}</span>)}
    </span>
  );
}

/** C41-03 (D-183): le unità che una risposta impegna escono dalla prossima ondata (le schierate restano dove sono):
 *  «Ti costa 1 squadra dalla prossima ondata». Null se la risposta non impegna unità. Rosso C183Q01: niente. */
export function quandoCosta(o: Opzione, ultima = false): string | null {
  if (spento('C183Q01')) return null;
  const u = o.effetti.filter((e): e is Extract<Opzione['effetti'][number], { riserva: string }> => 'riserva' in e && e.valore < 0);
  if (!u.length) return null;
  // C42-01 (D-185): all'ultima ondata non c'è una «prossima ondata»; si dice che le unità restano impegnate fino a fine
  // serata (e02 o4 «Ti costa 1 squadra dalla prossima ondata» annunciava un costo che non arriva). Rosso C42U01: come prima.
  if (ultima && !spento('C42U01')) return t('costo.fine_serata');
  return `${t('costo.ti_costa')} ${u.map((e) => quante(-e.valore, e.riserva)).join(', ')} ${t('costo.dalla_prossima')}`;
}

/** D-283 (D-16): nella radio dopo «Conferma» il testo del costo (dati) nomina già l'unità che si impegna («ma ti costa una
 *  squadra»: tutte le 237 risposte con costo in unità, misura del 15/11): la regola non la ripete e dice solo da quando vale.
 *  Se il testo non nomina un'unità impegnata resta la frase intera. Rosso C283R01: sempre la frase intera, come prima. */
export function quandoRadio(o: Opzione, ultima = false): string | null {
  const q = quandoCosta(o, ultima);
  if (!q || ultima || !o.costo || spento('C283R01')) return q;
  const testo = t(o.costo), parola = (f: string) => new RegExp(`(^|[^\\p{L}])${f}([^\\p{L}]|$)`, 'iu').test(testo);
  const detta = o.effetti.every((e) => !('riserva' in e) || e.valore >= 0 || [quante(1, e.riserva), quante(2, e.riserva)].some((x) => parola(x.replace(/^\d+ /, ''))));
  return detta ? t('costo.da_quando') : q;
}
