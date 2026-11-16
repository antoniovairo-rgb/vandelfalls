// Verbale: esito e stelle (D-060), fonti vere e false (D-024), le scelte fatte durante le chiamate.
// Sotto l'esito il bilancio (D-085, PO-036). Esito «fallita» (D-059): l'episodio non è superato e il verbale porta a «Riparti dall'ondata N» (S-17) o «Ricomincia l'episodio».
import { BookOpen, ChevronRight, Map as IconaMappa, RotateCcw, Share2, StepForward } from 'lucide-react';
import { condividi } from '../collegamenti.ts';
import { Fragment, useState, type ReactNode } from 'react';
import type { Risultato } from '../../logica/episodi.ts';
import type { FineStagione } from '../../logica/epilogo.ts';
import type { EsitoMissione } from '../../logica/missione.ts';
import type { Missione } from '../../logica/tipi.ts';
import { t, genereAttuale } from '../dati.ts';
import { Icona } from '../icone.tsx';
import { spento } from '../../interruttori.ts';
import { tono } from '../partita.ts';
import { sezioniBilancio } from './Bilancio.tsx';
import { Passi } from './Passi.tsx';
import { PassoFineStagione } from './Epilogo.tsx';
import { Stelle } from '../stelle.tsx';
import { VignettaEsito } from '../vignette-gioco.tsx';
import { Sfida } from '../stemma.tsx';
import { due, Testata } from './Fumetto.tsx';

export function Verbale(p: { fiducia?: ReactNode; m: Missione; esito: EsitoMissione; risultato: Risultato; migliore: boolean; rigioca: () => void; citta: () => void; prossimo?: () => void; riparti?: { n: number; vai: () => void } | null; home?: () => void;
  /** D-164: riepilogo della stagione appena chiusa (ultimo episodio di e12, e24); D-161: apre l'epilogo dopo l'ultimo episodio */
  fineStagione?: FineStagione | null; epilogo?: () => void }) {
  const [passo, setPasso] = useState(0);
  const [condivisione, setCondivisione] = useState<string | null>(null);
  // PO-074: testo + link al gioco, dal pannello del telefono o copiato negli appunti
  const stelle = p.risultato.stelle;
  const testoCondiviso = `Vandel Falls · Ep. ${due(p.m.episodio)} «${t(p.m.titolo)}»: ${t(`esito.${p.esito.esito.id}`)} ${'★'.repeat(stelle)}${'☆'.repeat(3 - stelle)}. Ce la fai meglio di me?`;
  const condividiVerbale = () => condividi(testoCondiviso).then((r) => setCondivisione(r === 'copiato' ? 'Copiato: incollalo dove vuoi.' : r === 'errore' ? 'Condivisione non riuscita.' : null));
  const esito = (
    <>
      <div className={`scheda verbale${p.risultato.fallita && !spento('C41V06') ? ` fallita${spento('C185V01') ? '' : ' compatta'}` : ''}`}>
        <div className="vignetta-cornice">
          <VignettaEsito m={p.m} tono={p.risultato.fallita ? 'fallita' : tono(p.m, p.esito.esito)} genere={genereAttuale() === 'f' ? 'f' : 'm'} />
          {spento('C42S01') && <Sfida m={p.m} />}
        </div>
        {/* C18-08: la sfida sulla riga delle stelle, a soli stemmi (il nome del club resta nell'etichetta dello stemma):
            sopra la vignetta i nomi dei club stavano sui busti. Rosso C42S01: sopra la vignetta, come prima. */}
        {spento('C42S01') ? <Stelle n={p.risultato.stelle} /> : <div className="riga stelle-sfida"><Stelle n={p.risultato.stelle} /><Sfida m={p.m} /></div>}
        <p>{t(p.esito.esito.verbale)}</p>
      </div>
      {p.risultato.fallita
        ? <p className="avviso" data-fallita="si">{p.riparti ? `Episodio fallito: riparti dall'ondata ${p.riparti.n}, dove si è deciso, o da capo.` : 'Episodio fallito: va rigiocato. Si riparte da come stavano le cose prima.'}</p>
        : <p className="avviso buono" data-migliore={p.migliore ? 'si' : 'no'}>{p.migliore ? 'Nuovo miglior risultato per questo episodio.' : 'Resta il risultato migliore di un tentativo precedente.'}</p>}
      {!spento('C20C01') && <button className="pulsante piccolo condividi" data-azione="condividi" data-testo={testoCondiviso} onClick={condividiVerbale}><Icona di={Share2} />Condividi</button>}
      {condivisione && <p className="tenue" data-condivisione role="status">{condivisione}</p>}
      {/* S-17 (PO-060): si riparte dall'ondata che ha deciso l'esito, oppure da capo */}
      {p.risultato.fallita && (
        <div className="riga ripartenza">
          {p.riparti && <button className="pulsante" data-azione="riparti" data-ondata={p.riparti.n} onClick={p.riparti.vai}><Icona di={StepForward} />{spento('C28R01') ? `Riparti dall'ondata ${p.riparti.n}` : `Riparti dall'ondata\u00a0${p.riparti.n}`}</button>}
          <button className={`pulsante${p.riparti ? ' secondario' : ''}`} data-azione="rigioca" aria-label="Ricomincia l'episodio" onClick={p.rigioca}><Icona di={RotateCcw} />{p.riparti ? 'Ricomincia' : "Ricomincia l'episodio"}</button>
        </div>
      )}
    </>
  );
  // Bilancio (D-085): cosa ha aiutato, cosa ha pesato, dove eri scoperto, cosa manca per la stella dopo.
  // Rosso C05R03: tutte le scelte in fila, senza dire quali hanno contato.
  const bilancio = spento('C05R03')
    ? [<Fragment key="tutte">{p.esito.scelte.map((x, i) => <div className="scheda" key={i} data-scelta={`${x.chiamata}:${x.opzione}`}><p>{x.opzione}</p></div>)}</Fragment>]
    : sezioniBilancio({ m: p.m, esito: p.esito, stelle: p.risultato.stelle });
  const fonti = (
    <>
      <h2>Le fonti</h2>
      <ul className="scheda fonti-verbale">
        {p.m.briefing.map((b, i) => (
          <li key={i} data-fonte={b.fonte}>
            <span className="riga"><strong>{t(`fonte.${b.fonte}`)}</strong><span className={`timbro ${b.vera ? 'vero' : ''}`} data-vera={b.vera ? 'si' : 'no'}>{b.vera ? 'Vera' : 'Falsa'}</span></span>
            <p className="tenue">{t(b.testo)}</p>
          </li>
        ))}
      </ul>
    </>
  );
  // PO-072: a fine verbale si capisce come andare avanti — «Prossimo episodio» in evidenza, la mappa sotto, piccola,
  // con la riga che dice a cosa serve. Rosso C18V01: solo «Alla mappa della città» (difetto originale).
  const mappa = <button className={`pulsante${p.risultato.fallita ? ' secondario' : ''}`} data-azione="citta" onClick={p.citta}><Icona di={IconaMappa} />Alla mappa della città</button>;
  // D-161: dopo l'ultimo episodio superato, «Epilogo» in evidenza e la mappa piccola accanto. Rosso C161E01: solo la mappa.
  const epilogo = p.epilogo && !p.risultato.fallita && !spento('C161E01') ? (
    <div className="verbale-fine">
      <div className="verbale-riga">
        <button className="pulsante secondario icona" data-azione="citta" aria-label="Mappa della città" title="Mappa della città" onClick={p.citta}><Icona di={IconaMappa} /></button>
        <button className="pulsante" data-azione="epilogo" onClick={p.epilogo}><Icona di={BookOpen} />Epilogo</button>
      </div>
    </div>
  ) : null;
  const nota = <p className="tenue" data-spiega="mappa">Mappa: rigioca gli episodi passati.</p>;
  // D-283 (D-10, revisione R2/R3, scelta del PO: opzione A): la frase non sta più sopra i pulsanti (spingeva giù «Prossimo» di 13 px
  // e lasciava «indietro» più in alto); il pulsante della mappa dice «Mappa» sotto l'icona, come i pulsanti di D-12, e la frase resta
  // al lettore e nel title (la parola è ora la «riga che spiega la mappa» di PO-072, data-spiega). Rosso C283V03: la nota sopra i pulsanti (com'era in 24b3678). Rosso C283V01: come main, solo icona e nota sotto.
  const parola = !spento('C283V01') && !spento('C283V03'), frase = 'Mappa della città: rigioca gli episodi passati';
  const fine = epilogo ?? (spento('C18V01') || !p.prossimo || p.risultato.fallita ? mappa : (
    <div className="verbale-fine">
      {spento('C283V03') && nota}
      <div className="verbale-riga">
        <button className={`pulsante secondario icona${parola ? ' con-parola' : ''}`} data-azione="citta" aria-label={parola ? frase : 'Mappa della città'} title={parola ? frase : 'Mappa della città'} onClick={p.citta}><Icona di={IconaMappa} />{parola && <span className="parola-icona" data-spiega="mappa">Mappa</span>}</button>
        <button className="pulsante" data-azione="prossimo" onClick={p.prossimo}>Prossimo episodio<Icona di={ChevronRight} /></button>
      </div>
      {spento('C283V01') && nota}
    </div>
  ));
  // D-164: ultimo passo «Fine stagione N» (stelle, fili aperti), poi «Prossimo episodio» apre la stagione nuova. Rosso C164F01: niente.
  const stagione = p.fineStagione && !p.risultato.fallita && !spento('C164F01') ? [<PassoFineStagione key="fine-stagione" f={p.fineStagione} />] : [];
  return (
    <>
      <Testata numero={due(p.m.episodio)} etichetta="Verbale" titolo={<span className={tono(p.m, p.esito.esito)} data-esito={p.esito.esito.id}>{t(`esito.${p.esito.esito.id}`)}</span>} home={p.home} />
      {p.fiducia}
      <Passi nome="Verbale" compatto={fine !== mappa} passo={passo} vai={setPasso} passi={[esito, ...bilancio, fonti, ...stagione]}
        fine={fine} />
    </>
  );
}
