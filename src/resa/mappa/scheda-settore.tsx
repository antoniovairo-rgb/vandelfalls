// PO-152 (D-241, idea A): in chiamata il settore toccato apre la sua scheda di stato, sopra la mappa (non aggiunge
// altezza alla pagina). Solo lettura, la partita non cambia: situazione (la stessa parola del colore), unità sul posto,
// folla dove la mappa la disegna (spalti delle curve, cortei delle strade) e se la chiamata in corso arriva da lì.
// Si chiude con un tocco sulla scheda, col pulsante o con Esc.
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { t } from '../dati.ts';
import { Icona } from '../icone.tsx';
import type { Folla } from './folla.ts';

export interface StatoSettore { id: string; tipo: string; situazione: string | null; unita: string[]; citato: boolean }

/** Riga della folla: solo curve (spalti) e strade (corteo); null altrove, dove la mappa non disegna gente. */
export function rigaFolla(s: { id: string; tipo: string }, folla: Folla): string | null {
  if (s.tipo === 'curva') return t(`scheda.spalti.${folla.spalti}`);
  if (s.tipo !== 'strada') return null;
  const c = folla.cortei.find((x) => x.settore === s.id);
  return t(c ? `scheda.corteo.${c.verso}` : 'scheda.corteo.nessuno');
}

/** «banda»: dove si apre (C55-01, D-255: dalla parte opposta al settore toccato, che resta in vista); «libero»: il lato di «Home» */
export function SchedaSettore(p: { s: StatoSettore; folla: string | null; chiudi: () => void; banda: 'alto' | 'basso'; libero?: 'sx' | 'dx' }) {
  const chiudi = useRef<HTMLButtonElement>(null);
  const { chiudi: vai } = p;
  useEffect(() => { chiudi.current?.focus({ preventScroll: true }); }, [p.s.id]);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') vai(); };
    addEventListener('keydown', esc);
    return () => removeEventListener('keydown', esc);
  }, [vai]);
  const titolo = `scheda-settore-${p.s.id}`;
  return (
    <div className={`scheda-settore ${p.banda}${p.libero ? ` libero-${p.libero}` : ''}`} role="dialog" aria-labelledby={titolo} data-scheda-settore={p.s.id} onClick={vai}>
      <p className="scheda-settore-nome" id={titolo}>{t(`settore.${p.s.id}`)}</p>
      <ul className="scheda-settore-righe">
        {p.s.situazione && <li data-riga="situazione"><strong>{t('scheda.situazione')}</strong> {p.s.situazione}</li>}
        <li data-riga="unita"><strong>{t('scheda.unita')}</strong> {p.s.unita.length ? p.s.unita.join(', ') : t('scheda.nessuna_unita')}</li>
        {p.folla && <li data-riga="folla"><strong>{t('scheda.folla')}</strong> {p.folla}</li>}
        <li data-riga="chiamata">{t(p.s.citato ? 'scheda.chiamata_qui' : 'scheda.chiamata_altrove')}</li>
      </ul>
      <button type="button" ref={chiudi} className="scheda-settore-chiudi" data-chiudi-scheda aria-label={t('scheda.chiudi')}
        onClick={(e) => { e.stopPropagation(); vai(); }}><Icona di={X} /></button>
    </div>
  );
}
