// Pezzi comuni dello stile «graphic novel» (D-066): testata con numero inclinato, mittente di un
// messaggio (avatar, nome, affidabilità, timbro), lettera delle opzioni.
import { House, Info, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { spento } from '../../interruttori.ts';
import { Icona } from '../icone.tsx';

export const due = (n: number) => String(n).padStart(2, '0');
export const LETTERE = 'ABCDEFGH';

/** Pulsante «Home» (S-21, C14-05): nella testata del verbale e nell'angolo delle mappe; la partita resta salvata. */
export function TastoHome(p: { vai: () => void; angolo?: string; riserva?: boolean }) {
  return <button type="button" className={`tasto-home${p.angolo ? ` ${p.angolo}` : ''}`} data-azione={p.riserva ? 'home-riserva' : 'home'} aria-label="Torna alla home (la partita resta salvata)" onClick={p.vai}><Icona di={House} /></button>;
}

/** «home» (S-21, C14-05): pulsante per tornare alla home, la partita resta salvata. */
/** PO-101: «i» accanto al titolo dell'ondata; al tocco la riga che spiega il momento della serata, sotto il titolo.
 *  Si chiude toccando di nuovo o altrove. */
function InfoOndata(p: { testo: string }) {
  const [aperta, setAperta] = useState(false);
  const qui = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!aperta) return;
    // C25-02: si chiude al «click», non al «pointerdown»: chiusa prima, la pagina saliva di 43-59 px fra il tocco e il
    // click, e il tocco sulla mappa finiva altrove (0/108 arrivati). Rosso C69I01: al pointerdown, come prima.
    const evento = spento('C69I01') ? 'pointerdown' : 'click';
    const fuori = (e: Event) => { if (!qui.current?.contains(e.target as Node)) setAperta(false); };
    document.addEventListener(evento, fuori);
    return () => document.removeEventListener(evento, fuori);
  }, [aperta]);
  return (
    <div className="info-ondata" ref={qui}>
      <button type="button" className="info" data-azione="info-ondata" aria-expanded={aperta} aria-label="Che momento della serata è" onClick={() => setAperta(!aperta)}><Icona di={Info} /></button>
      {aperta && <p className="info-riga" data-info-ondata role="status">{p.testo}</p>}
    </div>
  );
}

export function Testata(p: { numero: string; etichetta: string; titolo: ReactNode; home?: () => void; info?: string | null; casaRiserva?: () => void }) {
  return (
    <header className="testata">
      <div className="testata-n" aria-hidden="true">{p.numero}</div>
      <div className="testata-t"><small>{p.etichetta}</small><h1>{p.titolo}</h1>{p.info && <InfoOndata key={p.info} testo={p.info} />}</div>
      {p.home && <TastoHome vai={p.home} />}
      {/* D-261: nella risposta con la mossa «Home» di riserva, nascosta finché la mappa abbassata non la manda qui
          (.mappa[data-casa-fuori], adatta.ts): solo CSS, niente stato (con lo stato le «Home» visibili erano 0 o 2) */}
      {!p.home && p.casaRiserva && <span className="casa-riserva"><TastoHome vai={p.casaRiserva} riserva /></span>}
    </header>
  );
}

export function Mittente(p: { icona: LucideIcon; nome: string; etichetta?: string; timbro?: string; vice?: boolean; figura?: ReactNode; urgenza?: boolean }) {
  return (
    <div className="chi">
      {/* D-118: nel briefing al posto dell'avatar c'è la vignetta della fonte (luogo e chi parla), alta come l'avatar */}
      {p.figura ? <span className="figura-fonte" data-figura-fonte>{p.figura}</span> : <span className={`avatar${p.vice ? ' vice' : ''}`}><Icona di={p.icona} /></span>}
      <div>
        <div className="chi-nome">{p.nome}</div>
        {p.etichetta && <span className="etichetta">{p.etichetta}</span>}
      </div>
      {/* D-120 (PO-085): spicchio d'orologio che si svuota accanto al timbro; solo grafica, nessun tempo limite */}
      {p.timbro && p.urgenza && <span className="orologio" data-urgenza aria-hidden="true" />}
      {p.timbro && <span className="timbro">{p.timbro}</span>}
    </div>
  );
}
