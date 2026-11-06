// PO-152 (D-241, idea A): dopo «Conferma» il costo della risposta arriva per radio sopra la mappa, insieme ai segni ▲/▼.
// Sopra la mappa e non sotto la risposta: la pagina non si allunga (a 360×640 la risposta aveva 6 px prima della soglia di
// sonda-altezze). Sta nella fascia bassa, o in quella alta se i segni sono tutti in basso; i segni e «Home» restano sopra.
// La fascia si sceglie quando compare (i segni spariscono dopo 1,8 s e il rapporto non deve saltare).
// D-255 punto 2 (idea B): con la mossa il riquadro copriva le unità e i settori da toccare (sonda a 360×640, prima chiamata
// dei 36 episodi: 210 stati coperti). Con la mossa («evita») il riquadro resta nella sua fascia se è libera, altrimenti va
// nella posizione libera più vicina (larghezza piena, poi mezza); con l'unità in mano («compatto») mostra solo
// l'indicazione; se anche prima di toccare il riquadro intero non trova posto
// («stretto») resta solo l'indicazione e il rapporto va nella risposta sotto la mappa (D-258, opzione B del PO; anche con
// «compatto»); se non c'è posto neanche così («muto») l'indicazione passa al solo lettore di schermo. I segni ▲/▼ contano come ostacoli (PO-152 A).
// Rosso C255R01: fascia fissa e rapporto sempre intero, come prima.
import { useState, type ReactNode } from 'react';
import { spento } from '../../interruttori.ts';
import type { Segno } from './segni.ts';
import { segniVisti, type Rett } from './segni-visti.ts';

export function RadioMappa(p: { settori: { id: string; pos: { y: number } }[]; segni: Segno[]; home: string | null; evita?: boolean; compatto?: boolean; children: ReactNode }) {
  const [banda] = useState(() => {
    const ys = p.settori.filter((s) => p.segni.some((x) => x.settore === s.id)).map((s) => s.pos.y);
    return ys.length && ys.every((y) => y > 50) ? 'alto' : 'basso';
  });
  // in alto, il lato di «Home» resta libero
  const lato = banda === 'alto' && p.home?.startsWith('alto') ? ` libero-${p.home.endsWith('sx') ? 'sx' : 'dx'}` : '';
  const rosso = spento('C255R01'), compatto = p.compatto && !rosso ? ' compatto' : '';
  return <div className={`radio-mappa ${banda}${lato}${compatto}`} role="status" data-radio-mappa={banda} data-evita={p.evita && !rosso ? 'si' : undefined}>{p.children}</div>;
}

const MODI = ['', 'meta-sx', 'meta-dx'] as const;
// D-269 c: senza input il riquadro cambiava classe e posto dopo l'assestamento (po152b, 2,5 s ferma: 8-10 chiamate per larghezza,
// da «muto» a «posto», o 7 px più su): spariti i segni ▲/▼ (1,8 s di gioco) gli ostacoli erano meno e si ricollocava. Ora i segni
// già visti nella risposta restano ostacoli (segni-visti.ts) e, se nello stesso stato (testo, misura della mappa) gli ostacoli
// non cambiano, il riquadro resta com'è. Rosso C269C01: si ricolloca a ogni disegno, come prima.
const visto = new WeakMap<HTMLElement, { stato: string; firma: string }>();

/** Colloca il riquadro radio fuori dai bersagli della mossa (unità e settori toccabili, «Home») e dai segni ▲/▼ (PO-152 A). Chiamata da Mappa a ogni
 *  disegno e quando la mappa cambia misura, dopo le etichette (le unità si spostano con i nomi). */
export function collocaRadio(mappa: HTMLElement) {
  const r = mappa.querySelector<HTMLElement>(':scope > .radio-mappa');
  if (!r) return;
  const fermo = r.dataset.evita === 'si' && !spento('C269C01');
  const m0 = mappa.getBoundingClientRect(), rel = (b: Rett): Rett => ({ left: b.left - m0.left, right: b.right - m0.left, top: b.top - m0.top, bottom: b.bottom - m0.top });
  const stato = `${r.textContent}|${Math.round(m0.width)}x${Math.round(m0.height)}`, prima = fermo ? visto.get(r) : undefined;
  const segni = segniVisti(mappa, 'radio', [...mappa.querySelectorAll('[data-segno]')].map((e) => e.getBoundingClientRect())).map(rel);
  // D-272 (1): anche i nomi dei settori sono ostacoli (prima il riquadro li copriva in 116-148 stati su 277 del giro radio di
  // po152b, a ogni larghezza). Rosso C272N01: solo unità, settori e «Home», come prima.
  const SEL = `[data-presenza]:not(:disabled), .settore-punto:not(:disabled), .tasto-home${spento('C272N01') ? '' : ', .settore-nome'}`;
  const fissi = [...mappa.querySelectorAll(SEL)].map((e) => rel(e.getBoundingClientRect())).filter((x) => x.right > x.left && x.bottom > x.top);
  const firma = [...fissi, ...segni].map((b) => [b.left, b.top, b.right, b.bottom].map(Math.round).join(',')).sort().filter((x, i, a) => a.indexOf(x) === i).join(' ');
  if (fermo) { const ok = prima?.stato === stato && prima.firma === firma; visto.set(r, { stato, firma }); if (ok) return; }
  r.classList.remove('posto', 'stretto', 'muto', ...MODI.filter(Boolean));
  if (r.dataset.evita !== 'si') return;
  const m = mappa.getBoundingClientRect(), base = r.getBoundingClientRect();
  const ass = (b: Rett): Rett => ({ left: b.left + m.left, right: b.right + m.left, top: b.top + m.top, bottom: b.bottom + m.top });
  const bersagli = fermo ? [...fissi, ...segni].map(ass) : [...mappa.querySelectorAll(`${SEL}, [data-segno]`)].map((e) => e.getBoundingClientRect());
  const v = (k: string) => parseFloat(getComputedStyle(mappa).getPropertyValue(k)) || 0, bordo = v('--spazio-2'), aria = v('--spazio-1');
  // un filo d'aria (--spazio-1) fra il riquadro e i bersagli: a filo i pixel frazionari si toccano
  const urto = (l: number, d: number, y: number, h: number) => bersagli.reduce((a, x) => a + Math.max(0, Math.min(d, x.right + aria) - Math.max(l, x.left - aria)) * Math.max(0, Math.min(y + h, x.bottom + aria) - Math.max(y, x.top - aria)), 0);
  if (!m.height || !base.height || !urto(base.left, base.right, base.top, base.height)) return; // la sua fascia è già libera
  const zero = base.top - r.offsetTop; // bordo interno della mappa, da cui conta «top»
  const metti = (modo: string, y: number) => { r.classList.add('posto', ...(modo ? [modo] : [])); r.style.setProperty('--radio-y', String(Math.round(y - zero))); };
  const cerca = () => {
    for (const modo of MODI) {
      if (modo) r.classList.add(modo);
      const b = r.getBoundingClientRect(), tagliato = r.scrollHeight > r.clientHeight + 1;
      if (modo) r.classList.remove(modo);
      if (tagliato) continue; // a mezza larghezza il testo non ci sta: non si taglia
      let libero: number | null = null; // la posizione libera più vicina alla fascia di partenza
      for (let y = m.top + bordo; y + b.height <= m.bottom - bordo + 0.5; y++) {
        const u = urto(b.left, b.right, y, b.height);
        if (!u && (libero === null || Math.abs(y - base.top) < Math.abs(libero - base.top))) libero = y;
      }
      if (libero !== null) { metti(modo, libero); return true; } // la larghezza piena vince sulla mezza
    }
    return false;
  };
  if (cerca()) return;
  if (!r.classList.contains('compatto')) { r.classList.add('stretto'); if (cerca()) return; }
  // nessun posto libero neanche per una riga (e25 a 375×667: fasce libere di 24 px, ne servono 30): il riquadro passa al solo
  // lettore di schermo; unità e settori da toccare restano evidenziati
  r.classList.add('muto');
}
