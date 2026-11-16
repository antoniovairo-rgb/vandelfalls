// Crediti (D-052): ogni libreria e asset con licenza, autori e fonte.
import { ArrowLeft } from 'lucide-react';
import { CREDITI } from '../crediti.ts';
import { Icona } from '../icone.tsx';
import { Testata } from './Fumetto.tsx';
import { GAME_VERSION } from '../../versione.ts';
import { spento } from '../../interruttori.ts';

export function Crediti(p: { indietro: () => void }) {
  return (
    <>
      <Testata numero="©" etichetta="Crediti" titolo="Chi ha reso possibile Vandel Falls" />
      <p className="tenue">Software libero usato dal gioco. Nessun asset con licenza CC BY è ancora presente; quando entrerà, qui comparirà l'autore di ognuno.</p>
      {CREDITI.map((c) => (
        <div className="scheda" key={c.nome} data-credito={c.nome}>
          <div className="riga"><strong>{c.nome}</strong><span className="etichetta">{c.licenza}</span></div>
          <p className="tenue">{c.uso} · {c.autori}</p>
          <p className="tenue fonte">{c.fonte}</p>
        </div>
      ))}
      <button className="pulsante" onClick={p.indietro}><Icona di={ArrowLeft} />Torna al titolo</button>
      {/* D-283 (D-15): la versione in fondo alla pagina, come nel Titolo; quella nell'angolo stava sopra il bordo delle schede
          (stile-d283.css la toglie qui). Rosso C283C01: solo quella nell'angolo, come prima. */}
      {!spento('C283C01') && <p className="tenue" data-versione={GAME_VERSION}>Versione {GAME_VERSION}</p>}
    </>
  );
}
