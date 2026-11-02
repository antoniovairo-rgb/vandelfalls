// PO-152 (D-241, idea A): dopo «Conferma» il costo della risposta arriva per radio sopra la mappa, insieme ai segni ▲/▼.
// Sopra la mappa e non sotto la risposta: la pagina non si allunga (a 360×640 la risposta aveva 6 px prima della soglia di
// sonda-altezze). Sta nella fascia bassa, o in quella alta se i segni sono tutti in basso; i segni e «Home» restano sopra.
// La fascia si sceglie quando compare (i segni spariscono dopo 1,8 s e il rapporto non deve saltare).
// D-255 punto 2 (idea B): con la mossa il riquadro copriva le unità e i settori da toccare (sonda a 360×640, prima chiamata
// dei 36 episodi: 210 stati coperti). Con la mossa («evita») il riquadro resta nella sua fascia se è libera, altrimenti va
// nella posizione libera più vicina (larghezza piena, poi mezza); con l'unità in mano («compatto») mostra solo
// l'indicazione, il rapporto del costo è già stato letto; se anche prima di toccare il riquadro intero non trova posto
// («stretto», 13 delle 36 prime chiamate a 360×640) resta solo l'indicazione e il rapporto passa al solo lettore di schermo.
// Rosso C255R01: fascia fissa e rapporto sempre intero, come prima.
import { useState, type ReactNode } from 'react';
import { spento } from '../../interruttori.ts';
import type { Segno } from './segni.ts';

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

/** Colloca il riquadro radio fuori dai bersagli della mossa (unità e settori toccabili, «Home»). Chiamata da Mappa a ogni
 *  disegno e quando la mappa cambia misura, dopo le etichette (le unità si spostano con i nomi). */
export function collocaRadio(mappa: HTMLElement) {
  const r = mappa.querySelector<HTMLElement>(':scope > .radio-mappa');
  if (!r) return;
  r.classList.remove('posto', 'stretto', ...MODI.filter(Boolean));
  if (r.dataset.evita !== 'si') return;
  const m = mappa.getBoundingClientRect(), base = r.getBoundingClientRect();
  const bersagli = [...mappa.querySelectorAll('[data-presenza]:not(:disabled), .settore-punto:not(:disabled), .tasto-home')].map((e) => e.getBoundingClientRect());
  const v = (k: string) => parseFloat(getComputedStyle(mappa).getPropertyValue(k)) || 0, bordo = v('--spazio-2'), aria = v('--spazio-1');
  // un filo d'aria (--spazio-1) fra il riquadro e i bersagli: a filo i pixel frazionari si toccano
  const urto = (l: number, d: number, y: number, h: number) => bersagli.reduce((a, x) => a + Math.max(0, Math.min(d, x.right + aria) - Math.max(l, x.left - aria)) * Math.max(0, Math.min(y + h, x.bottom + aria) - Math.max(y, x.top - aria)), 0);
  if (!m.height || !base.height || !urto(base.left, base.right, base.top, base.height)) return; // la sua fascia è già libera
  const zero = base.top - r.offsetTop; // bordo interno della mappa, da cui conta «top»
  const metti = (modo: string, y: number) => { r.classList.add('posto', ...(modo ? [modo] : [])); r.style.setProperty('--radio-y', String(Math.round(y - zero))); };
  let minimo = { y: base.top, urto: Infinity };
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
        if (!modo && u < minimo.urto) minimo = { y, urto: u };
      }
      if (libero !== null) { metti(modo, libero); return true; } // la larghezza piena vince sulla mezza
    }
    return false;
  };
  if (cerca()) return;
  if (!r.classList.contains('compatto')) { r.classList.add('stretto'); minimo = { y: base.top, urto: Infinity }; if (cerca()) return; }
  metti('', minimo.y); // nessun posto libero: il meno coperto (il guardiano tools/foto-po152-b.mjs lo segnala)
}
