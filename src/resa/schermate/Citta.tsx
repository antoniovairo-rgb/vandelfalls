// Mappa della città degli episodi (D-061): scegli un episodio sulla mappa e lo avvii o lo rigiochi.
import { BookOpen, Play, RotateCcw } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import type { Missione } from '../../logica/tipi.ts';
import type { Salvataggio } from '../../salvataggi/salvataggio.ts';
import { genereAttuale, missioni, t } from '../dati.ts';
import { VignettaHome } from '../vignette-home.tsx';
import { prossimoEpisodio, statoEpisodio, type StatoEpisodio } from '../episodi.ts';
import { Icona } from '../icone.tsx';
import { bozza, MappaCitta } from '../mappa/MappaCitta.tsx';
import { spento } from '../../interruttori.ts';
import { Stelle } from '../stelle.tsx';
import { Sfida } from '../stemma.tsx';
import { due, TastoHome, Testata } from './Fumetto.tsx';
import { Tripla } from './Tripla.tsx';

/** «1 tentativo», «N tentativi» (C-008.1). */
const tentativi = (n: number) => `${n} ${n === 1 && !spento('C05S81') ? 'tentativo' : 'tentativi'}`;

const DESCRIZIONE: Record<StatoEpisodio, string> = {
  superato: 'Superato: puoi rigiocarlo, resta il risultato migliore.',
  da_rigiocare: 'Fallito: va rigiocato per andare avanti.',
  disponibile: 'Da giocare.',
  futuro: 'Non ancora disponibile.',
};

/** PO-149: unità di cielo sopra la finestra nella striscia; bastano per --home-vignetta-max (210 px) a 360 px di larghezza.
 *  D-265 (PO-158): niente più cielo vuoto, la striscia si inquadra sui personaggi; resta un po' di notte dietro il bordo alto. */
const CIELO_STRISCIA = 122, CIELO_RAVVICINATA = 24;

export function Citta(p: { sal: Salvataggio; scelto: Missione | null; scegli: (id: string) => void; avvia: (m: Missione) => void; home?: () => void; epilogo?: () => void }) {
  const [rigioca, setRigioca] = useState<string | null>(null);
  const tutte = missioni.map((m) => ({ m, stato: statoEpisodio(p.sal, m), stelle: p.sal.episodi[m.id]?.migliore?.stelle ?? null }));
  // PO-044: una stagione alla volta (quella dell'episodio scelto, cambiabile); rosso __NO_C13M01 = tutte insieme
  const stagioni = [...new Set(missioni.map((m) => m.stagione))].sort((a, b) => a - b);
  const [stagione, setStagione] = useState(p.scelto?.stagione ?? stagioni[0] ?? 1);
  const voci = spento('C13M01') ? tutte : tutte.filter((x) => x.m.stagione === stagione);
  const v = voci.find((x) => x.m.id === p.scelto?.id);
  // D-210: sotto --vignetta-finestra-min (700 px) la striscia non ci sta senza scorrere (360×640): resta la testata di prima
  const bassa = () => innerHeight < (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--vignetta-finestra-min')) || 0);
  const [finestraBassa, setFinestraBassa] = useState(bassa);
  useEffect(() => { const f = () => setFinestraBassa(bassa()); addEventListener('resize', f); return () => removeEventListener('resize', f); }, []);
  // D-243 (C52-01/02): con la striscia la scheda sotto la mappa (o l'invito) ha la stessa altezza in ogni stato, da token: la
  // striscia, che prende lo spazio libero, e la mappa non si spostano più. «Rileggi l'epilogo» sta nella scheda, accanto al
  // pulsante. Rosso C242M01: la scheda cresce col contenuto e l'epilogo sta sotto, come prima (la mappa salta fino a 110 px).
  const compatta = !(spento('C210C01') || finestraBassa) && !spento('C242M01');
  const epilogo = compatta ? p.epilogo : undefined;
  return (
    <>
      {/* D-210 (PO-140 fase 2, scelta del PO): in testa la striscia della home al posto della testata; la stagione la dicono
          i tasti Stagione N (aria-pressed), il titolo resta per il lettore di schermo. Rosso C210C01: la testata di prima */}
      {spento('C210C01') || finestraBassa ? <Testata numero={`S${stagione}`} etichetta={`Stagione ${stagione} · mappa della città`} titolo="Vandel Falls" /> : <>
        <h1 className="solo-lettore">{`Vandel Falls · stagione ${stagione} · mappa della città`}</h1>
        <figure className="home-vignetta citta-striscia" data-citta-striscia>
          {/* PO-149 (D-237): sugli schermi alti la striscia prende lo spazio libero (come la vignetta della home, PO-092) e cresce
              verso l'alto, con più cielo sopra le teste. Rosso C237S01: fissa a 96 px, inquadrata dall'alto, come prima */}
          {spento('C237S01') ? <VignettaHome genere={genereAttuale() === 'f' ? 'f' : 'm'} didascalia={t('citta.striscia')} fissa />
            : spento('C265S01') ? <VignettaHome genere={genereAttuale() === 'f' ? 'f' : 'm'} didascalia={t('citta.striscia')} cielo={CIELO_STRISCIA} />
            /* D-265 (PO-158): personaggi più grandi e visibili fino al petto, 16-32 px sopra le teste. Rosso C265S01: il cielo di PO-149 */
            : <VignettaHome genere={genereAttuale() === 'f' ? 'f' : 'm'} didascalia={t('citta.striscia')} cielo={CIELO_RAVVICINATA} ravvicinata />}
          <figcaption className="home-didascalia">{t('citta.striscia')}</figcaption>
        </figure></>}
      {stagioni.length > 1 && (
        <div className="stagioni" data-stagioni>
          {p.home && <TastoHome vai={p.home} />}
          {stagioni.map((n) => (
            <button key={n} type="button" className={`pulsante${n === stagione ? '' : ' secondario'}`} data-stagione={n}
              aria-pressed={n === stagione} onClick={() => setStagione(n)}>Stagione {n}</button>
          ))}
        </div>
      )}
      <MappaCitta voci={voci} scelto={p.scelto?.id ?? null} scegli={p.scegli} />
      {v ? (
        <SchedaEpisodio m={v.m} stato={v.stato} stelle={v.stelle} tentativi={p.sal.episodi[v.m.id]?.tentativi ?? 0} compatta={compatta} epilogo={epilogo}
          azione={() => (v.stato === 'superato' ? setRigioca(v.m.id) : p.avvia(v.m))}
          tripla={rigioca === v.m.id && v.stato === 'superato' ? ( /* S-16 (PO-066): rigiocare un episodio già superato chiede tre conferme */
            <Tripla azione="rigioca" no="No, resta qui" si="Sì, rigioca l'episodio" annulla={() => setRigioca(null)} conferma={() => p.avvia(v.m)}
              testi={[`Rigiocare «${t(v.m.titolo)}»? L'hai già superato.`,
                'Sicuro? Si riparte da come stavano le cose prima di questo episodio; resta il risultato migliore che hai già.',
                'Ultima conferma: rigiochi l\'episodio dall\'inizio.']} />) : undefined} />
      ) : <Invito sal={p.sal} stagione={stagione} voci={voci} compatta={compatta} epilogo={epilogo} scegli={(id) => { setStagione(missioni.find((x) => x.id === id)?.stagione ?? stagione); p.scegli(id); }} />}
      {/* D-161: campagna finita → l'epilogo si rilegge dalla città */}
      {p.epilogo && !compatta && <TastoEpilogo vai={p.epilogo} />}
    </>
  );
}

/** PO-091: senza episodio scelto, una scheda come le altre. Se la stagione è tutta chiusa dice perché e cosa la
 * apre (il prossimo episodio da superare, toccabile); altrimenti invita a toccare un episodio. Rosso C33C01: la
 * riga di prima, anche per le stagioni chiuse. */
function Invito(p: { sal: Salvataggio; stagione: number; voci: { m: Missione; stato: StatoEpisodio }[]; scegli: (id: string) => void; compatta: boolean; epilogo?: () => void }) {
  if (spento('C33C01')) return <p className="tenue">Tocca un episodio sulla mappa.</p>;
  const chiusa = p.voci.length > 0 && p.voci.every((x) => x.stato === 'futuro');
  const classe = `scheda invito${p.compatta ? ' compatta' : ''}`;
  if (!chiusa) return <div className={classe} data-invito="tocca"><p>Tocca un episodio sulla mappa per vederlo e giocarlo.</p>{p.epilogo && <Azioni><TastoEpilogo vai={p.epilogo} compatta /></Azioni>}</div>;
  const prossimo = prossimoEpisodio(p.sal);
  const vai = prossimo && <button className="pulsante secondario" data-azione="vai-prossimo" onClick={() => p.scegli(prossimo.id)}>
    {testo(p.compatta, `Prossimo: episodio ${due(prossimo.episodio)}, ${t(prossimo.titolo)}`)}
  </button>;
  return (
    <div className={classe} data-invito="chiusa">
      <h2>Stagione {p.stagione} chiusa</h2>
      {prossimo && prossimo.stagione < p.stagione ? <>
        <p>Si apre quando avrai superato tutti gli episodi della stagione {prossimo.stagione}{prossimo.stagione < p.stagione - 1 ? ' e di quelle prima' : ''}.</p>
        {p.compatta ? <Azioni>{vai}</Azioni> : vai}
      </> : <p>Si apre più avanti nella storia.</p>}
    </div>
  );
}

/** D-243: nella scheda compatta il testo dei pulsanti sta su una riga, con l'ellissi se non ci sta (il testo intero resta). */
const testo = (compatta: boolean, s: string) => (compatta ? <span className="testo-pulsante">{s}</span> : s);
const Azioni = (p: { children: ReactNode }) => <div className="scheda-azioni">{p.children}</div>;

/** La scheda dell'episodio scelto. Compatta (D-243): le stelle nella riga in alto, i pulsanti in una fila. */
function SchedaEpisodio(p: { m: Missione; stato: StatoEpisodio; stelle: number | null; tentativi: number; azione: () => void; tripla?: ReactNode; compatta: boolean; epilogo?: () => void }) {
  const avvia = p.stato !== 'futuro' && (
    <button className="pulsante" data-azione="avvia-episodio" onClick={p.azione}>
      {p.stato === 'disponibile' ? <><Icona di={Play} />{testo(p.compatta, 'Avvia l\'episodio')}</> : <><Icona di={RotateCcw} />{testo(p.compatta, 'Rigioca l\'episodio')}</>}
    </button>
  );
  return (
    <div className={`scheda${p.compatta ? ' compatta' : ''}`} data-scheda-episodio={p.m.id}>
      <div className="riga"><span className="etichetta">Episodio {due(p.m.episodio)}</span>{p.compatta && p.stelle !== null && <Stelle n={p.stelle} />}<span className="tenue">{tentativi(p.tentativi)}</span></div>
      <h2>{t(p.m.titolo)}</h2>
      {bozza(p.m) && <p className="tenue" data-bozza-scheda><span className="etichetta bozza">Bozza</span> Episodio abbozzato: testi e numeri ancora provvisori.</p>}
      <Sfida m={p.m} />
      {!p.compatta && p.stelle !== null && <Stelle n={p.stelle} />}
      <p className={p.stato === 'da_rigiocare' ? 'avviso' : 'tenue'}>{DESCRIZIONE[p.stato]}</p>
      {p.tripla ?? (p.compatta ? (avvia || p.epilogo) && <Azioni>{avvia}{p.epilogo && <TastoEpilogo vai={p.epilogo} compatta />}</Azioni> : avvia)}
    </div>
  );
}

const TastoEpilogo = (p: { vai: () => void; compatta?: boolean }) => <button className="pulsante secondario" data-azione="epilogo" onClick={p.vai}><Icona di={BookOpen} />{testo(!!p.compatta, 'Rileggi l\'epilogo')}</button>;
