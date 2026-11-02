// Durante l'ondata: le chiamate una alla volta (fonte, testo, commento del vice, opzioni), la risposta
// alla scelta, poi la chiusura col rapporto. Ogni scelta si salva subito: una ricarica riporta alla
// chiamata successiva (la risposta già letta non torna).
import { Check, ChevronDown, ChevronRight, Coffee, FileText, Radio, Undo2 } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { spento } from '../../interruttori.ts';
import { opzioniEsaurite, opzioniValide, unitaFinita, type InCorso } from '../../logica/missione.ts';
import { morsiDellOndata } from '../../logica/dopo.ts';
import type { Chiamata as TChiamata, EffettoMissione, Missione, Opzione } from '../../logica/tipi.ts';
import type { Decisione } from '../../logica/sospesa.ts';
import { t } from '../dati.ts';
import { Icona, iconaFonte } from '../icone.tsx';
import { LETTERE, Mittente } from './Fumetto.tsx';
import { Messaggio } from './Scena.tsx';
import { iconaChi, VignettaChiamata } from '../vignette-chiamata.tsx';
import { urgente } from '../vignette-evento.tsx';
import { altoNellaPagina, scorriPerIntero } from '../vista.ts';
import { EffettiOpzione, quandoCosta } from '../effetti-opzione.tsx';


/** Durata di un «secondo» delle attese della scena (Scena.tsx, Tono.tsx). Solo per gli strumenti: il giro foto mette
 *  globalThis.__VALMORA_SECONDO_MS = 1 per non aspettare il tempo reale. */
export const secondoMs = () => (globalThis as { __VALMORA_SECONDO_MS?: number }).__VALMORA_SECONDO_MS ?? 1000;

export function Chiamata(p: { m: Missione; ic: InCorso; c: TChiamata; numero: number; totale: number; rispondi: (opzione: string) => void;
  sospendi?: (opzione: string) => boolean; decidi?: (esito: Decisione) => void }) {
  // Al primo tocco le opzioni si bloccano: un secondo tocco non cambia la scelta (C-005 R01).
  const [scelta, setScelta] = useState<string | null>(null);
  // PO-148 (D-236, al posto del conto alla rovescia di PO-121/D-148): la scelta resta evidenziata e sotto le opzioni
  // compaiono «Annulla» (toglie la scelta) e «Conferma» (applica la risposta); niente vale prima di «Conferma». Il fuoco non
  // va da solo sui due pulsanti (un Invio involontario non decide): resta sull'opzione scelta, che non si può ripremere.
  // Senza sospendi (rosso C107A01) la risposta vale subito, come prima. Rosso C236C01: la risposta vale già al tocco,
  // anche se i pulsanti compaiono; C236A01: «Annulla» conferma; C236T01 (CSS): pulsanti più bassi di 44 px. Il guardiano
  // tools/foto-po121.mjs deve vederli tutti.
  const [inAttesa, setInAttesa] = useState(false);
  const { decidi } = p;
  const annulla = () => { setInAttesa(false); setScelta(null); decidi?.(spento('C236A01') ? 'confermata' : 'annullata'); }; // rosso C236A01: «Annulla» conferma
  const conferma = () => { setInAttesa(false); decidi?.('confermata'); };
  // i due pulsanti compaiono sotto le opzioni: la pagina scorre fin lì (senza dar loro il fuoco), così si vedono subito
  const barraDecidi = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => { if (inAttesa) barraDecidi.current?.scrollIntoView({ block: 'nearest' }); }, [inAttesa]);
  // C-010 C09-03: se le opzioni sono sotto la piega, un indicatore in basso dice che c'è da scorrere.
  const opzioni = useRef<HTMLDivElement>(null);
  const urgenteQui = urgente(p.m, p.c, p.ic.variabili); // D-126 c: spicchio e «Urgente!» solo con un evento sul settore
  const imprevistoQui = !!p.c.imprevisto && !spento('C190I01'); // PO-022 (D-190)
  // D-206 (C45-05, scelta del PO): nell'imprevisto niente vignetta e niente riga «Imprevisto», opzioni strette. Rosso C206I01
  const asciutto = imprevistoQui && !spento('C206I01');
  // C28-02: col mouse, alla nuova chiamata l'opzione sotto il puntatore fermo appariva già accesa (106/156): l'evidenza
  // al passaggio vale solo dopo che il puntatore si è mosso. Rosso C87H01: subito, come prima.
  const [fermo, setFermo] = useState(true);
  useEffect(() => {
    if (spento('C87H01')) { setFermo(false); return; }
    setFermo(true);
    const via = () => setFermo(false);
    addEventListener('pointermove', via, { once: true });
    return () => removeEventListener('pointermove', via);
  }, [p.c.id]);
  const [nascoste, setNascoste] = useState(false);
  const [serve, setServe] = useState(false); // C18-05: una volta comparso nel fumetto resta, così il testo non salta scorrendo
  // Calcolo diretto (non IntersectionObserver, che risponde solo attraversando soglie e in ritardo): prima del disegno,
  // a ogni scorrimento e ridimensionamento e quando cambia il layout della pagina (mappa pronta, caratteri caricati).
  useLayoutEffect(() => {
    const el = opzioni.current?.querySelector('.opzione'); // la prima opzione deve vedersi tutta
    if (!el) return;
    const misura = () => {
      const r = el.getBoundingClientRect();
      const visibile = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
      const n = r.height > 0 && visibile / r.height < 0.99;
      setNascoste(n); if (n) setServe(true);
    };
    misura();
    addEventListener('scroll', misura, { passive: true }); addEventListener('resize', misura);
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(misura);
    ro?.observe(document.body);
    return () => { removeEventListener('scroll', misura); removeEventListener('resize', misura); ro?.disconnect(); };
  }, []);
  // C25-08: all'apertura (e quando compare «Rispondi», che sposta il fumetto) l'icona di chi chiama non resta tagliata
  // dal fondo della finestra: la pagina scorre quanto basta. Posizione dall'impaginazione, non dall'animazione d'entrata.
  useLayoutEffect(() => {
    const b = document.querySelector<HTMLElement>('.chiamata-corpo [data-chi-icona]');
    if (!b) return;
    const alto = altoNellaPagina(b) - scrollY, margine = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--spazio-2')) || 0;
    const d = scorriPerIntero(alto, alto + b.offsetHeight, innerHeight, margine);
    if (d) scrollBy({ top: d, behavior: 'instant' });
  }, [p.c.id, serve]);
  const indicatore = (
    <button type="button" className="indicatore" data-indicatore="opzioni" onClick={() => opzioni.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
      Rispondi <Icona di={ChevronDown} />
    </button>
  );
  return (
    <>
      {/* PO-022 (D-190): l'imprevisto interrompe la sequenza; nessun conto alla rovescia. Rosso C190I01: chiamata come le altre */}
      {imprevistoQui && !asciutto && <p className="avviso-imprevisto" data-imprevisto={p.c.id} role="status">Imprevisto: interrompe le chiamate</p>}
      <Messaggio key={p.c.id} classe={`radio ultimo${imprevistoQui ? ' imprevisto' : ''}`} dati={`chiamata-${p.c.id}`}>
        {/* C22-09: l'avatar segue la stessa regola dell'icona accanto alla vignetta (prima: 222/498 chiamate con l'icona generica). Rosso C59A01 */}
        <Mittente icona={(!spento('C59A01') && iconaChi(p.c.fonte)) || iconaFonte(p.c.fonte)} nome={t(`fonte.${p.c.fonte}`)} etichetta={p.c.settore ? t(`settore.${p.c.settore}`) : undefined} timbro={urgenteQui ? 'Urgente!' : undefined} urgenza={urgenteQui && !spento('C51O01')} />
        {/* C18-05: «Rispondi» dentro il fumetto, sotto il mittente: fisso in basso copriva il testo. Rosso C42R01: fisso. */}
        {serve && !spento('C42R01') && indicatore}
        {/* PO-089 (scelta A del PO): vignetta piccola a sinistra del testo, dentro il fumetto */}
        <div className="chiamata-corpo">
          {!asciutto && <VignettaChiamata m={p.m} c={p.c} variabili={p.ic.variabili} chiFuori />}
          <div>
            <p className="testo-radio">{t(p.c.testo)}</p>
            {p.c.commento && <p className="vice-a-margine"><span className="chi-vice">Il vice — </span>{t(p.c.commento)}</p>}
          </div>
        </div>
      </Messaggio>
      {nascoste && spento('C42R01') && indicatore}
      <div className="opzioni" ref={opzioni} role="group" aria-label="Che cosa rispondi?" data-fermo={fermo ? '' : undefined}>
        {opzioniValide(p.c, p.ic, p.m).map((o, i) => (
          <button key={o.id} className={`opzione${scelta === o.id ? ' scelta' : ''}`} data-opzione={o.id} disabled={scelta !== null && !spento('C05R01') && !(inAttesa && scelta === o.id)}
            aria-disabled={inAttesa && scelta === o.id ? true : undefined}
            onClick={() => { if (scelta !== null && !spento('C05R01')) return; setScelta(o.id); if (p.sospendi?.(o.id)) { setInAttesa(true); if (spento('C236C01')) decidi?.('confermata'); } else p.rispondi(o.id); }}>
            <span className="tasto" aria-hidden="true">{LETTERE[i]}</span>
            <span className="opzione-testo">
              {t(o.testo)}
              {/* PO-152 (D-241, idea A): prima della scelta solo il testo dell'opzione; il costo arriva dopo «Conferma», come
                  rapporto radio (RapportoCosto). Rosso C241A01: accenno di costo (D-078), «Ti costa…» e icone, come prima. */}
              {spento('C241A01') && <>
                {/* Accenno di costo in parole (D-078); interruttore rosso C05S05 lo nasconde */}
                {o.costo && !spento('C05S05') && <small className="costo" data-costo={o.id}>{t(o.costo)}</small>}
                {quandoCosta(o, p.ic.ondata >= p.m.ondate.length) && <small className="costo costo-quando" data-quando={o.id}>{quandoCosta(o, p.ic.ondata >= p.m.ondate.length)}</small>}
                <EffettiOpzione c={p.c} o={o} />
              </>}
            </span>
          </button>
        ))}
        {/* D-153 (C35-02): la risposta che impegna un'unità finita resta in vista, disattivata, col motivo che nomina l'unità
            (testi «esaurita.<risorsa>»; data-costo per il controllo D-078). Rosso C153A01: sparisce */}
        {opzioniEsaurite(p.c, p.ic, p.m).map((o, i) => (
          <button key={o.id} className="opzione esaurita" data-opzione={o.id} data-esaurita="" disabled aria-disabled="true">
            <span className="tasto" aria-hidden="true">{LETTERE[opzioniValide(p.c, p.ic, p.m).length + i]}</span>
            <span className="opzione-testo">
              {t(o.testo)}
              <small className="costo motivo-esaurita" data-costo={o.id}>{t(`esaurita.${unitaFinita(p.m, p.ic, o) ?? 'squadre'}`)}</small>
            </span>
          </button>
        ))}
      </div>
      {inAttesa && (
        <div className="riga azioni decidi-risposta" role="group" aria-label={t('risposta.decidi')} ref={barraDecidi}>
          <button type="button" className="pulsante secondario" data-annulla data-azione="annulla-risposta" onClick={annulla}><Icona di={Undo2} />{t('risposta.annulla')}</button>
          <button type="button" className="pulsante" data-conferma data-azione="conferma-risposta" onClick={conferma}><Icona di={Check} />{t('risposta.conferma')}</button>
        </div>
      )}
    </>
  );
}

export function Risposta(p: { m: Missione; ic: InCorso; o: Opzione; avanti: () => void }) {
  // D-193 (PO-052): esito e conseguenza in un solo blocco, così a 360×640 e 375×667 la pagina non scorre. Rosso C193R01: due
  // messaggi, come prima.
  if (!spento('C193R01')) return (
    <>
      <Messaggio classe="vice risposta-unica" dati="risposta">
        <p className="testo-radio scelta-riga" data-scelta>{t(p.o.testo)}</p>
        {p.o.risposta && <p className="intanto"><strong><Icona di={Coffee} />Intanto…</strong> {t(p.o.risposta)}</p>}
      </Messaggio>
      <button className="pulsante" data-azione="continua" onClick={p.avanti}>Avanti<Icona di={ChevronRight} /></button>
    </>
  );
  return (
    <>
      <Messaggio classe="scelta" dati="scelta"><p className="testo-radio">{t(p.o.testo)}</p></Messaggio>
      {p.o.risposta && <Messaggio ritardo={0.15} classe="vice" dati="risposta"><Mittente icona={Coffee} nome="Intanto…" vice /><p>{t(p.o.risposta)}</p></Messaggio>}
      <button className="pulsante" data-azione="continua" onClick={p.avanti}>Avanti<Icona di={ChevronRight} /></button>
    </>
  );
}

/** C54-04 (D-253): il costo di un morso in parole: tipo di effetto, segno e, per tensione e pressione, il settore. */
const conSegno = (n: number) => (n > 0 ? `+${n}` : `−${-n}`);
export const costoMorso = (e: EffettoMissione): string => ('tensione' in e ? `Tensione ${conSegno(e.valore)}, ${t(`settore.${e.tensione}`)}`
  : 'pressione' in e ? `Pressione ${conSegno(e.valore)}, ${t(`settore.${e.pressione}`)}`
  : 'riserva' in e ? `${t(`risorsa.${e.riserva}`)} ${conSegno(e.valore)}`
  : 'aggiungi' in e && e.aggiungi === 'credito' ? `Fiducia ${conSegno(e.valore)}` : '');

/** PO-152 (D-241): dopo «Conferma» il costo della risposta arriva per radio (D-078 rivisto: sempre nei dati, mostrato dopo),
 *  sulla mappa insieme ai segni ▲/▼ (Mappa, prop radio: sopra la mappa, la risposta non si allunga; a 360×640 restavano
 *  6 px prima della soglia di sonda-altezze). Rosso C241A01: niente, il costo era già sotto l'opzione. */
export function RapportoCosto(p: { m: Missione; ic: InCorso; o: Opzione }) {
  if (spento('C241A01') || !p.o.costo) return null;
  const quando = quandoCosta(p.o, p.ic.ondata >= p.m.ondate.length);
  return (
    <p className="rapporto-costo" data-rapporto-costo={p.o.id}>
      <strong><Icona di={Radio} />{t('radio.costo')}</strong> <span data-costo={p.o.id}>{t(p.o.costo)}</span>
      {quando && <> <span data-quando={p.o.id}>{quando}</span></>}
    </p>
  );
}

export function Chiusura(p: { m: Missione; ic: InCorso; chiudi: () => void }) {
  // D-241 idea C: le scelte «comode» che mordono alla chiusura di quest'ondata parlano qui, al posto di «La radio tace»
  // (src/logica/dopo.ts; rosso __NO_C241C01: nessun morso, la radio tace)
  const morsi = morsiDellOndata(p.m, p.ic.scelte, p.ic.ondata);
  return (
    <>
      {morsi.length ? <Messaggio classe="radio ultimo" dati="radio-dopo">
        {/* C54-01 (D-253): con due morsi il fumetto faceva scorrere la chiusura (54 px a 360×640, 27 a 375×667): senza la riga
            del mittente, che il costo in testa a ogni messaggio sostituisce. Rosso C253C01: la riga resta. */}
        {spento('C253C01') && <Mittente icona={Radio} nome="Centrale" timbro="In corso" />}
        {/* più morsi nello stesso fumetto: due fumetti a 360×760 facevano scorrere la pagina di 22 px (e02 ondata 4) */}
        {morsi.map((x) => <p key={`${x.chiamata}/${x.opzione}`} className={spento('C253C01') ? 'testo-radio' : 'costo'} data-radio-dopo>
          {/* C54-04 (D-253): il morso dice cosa è costato, una parola sul tipo di effetto. Rosso C253C02: solo il racconto. */}
          {!spento('C253C02') && <strong data-costo-morso>{x.dopo.effetti.map(costoMorso).join(' · ')}. </strong>}{t(x.dopo.rapporto)}</p>)}
      </Messaggio> : <Messaggio classe="radio ultimo">
        <Mittente icona={Radio} nome="Centrale" timbro="In corso" />
        <p className="testo-radio">La radio tace. Le unità sono ai loro posti: l'ondata fa il suo corso.</p>
      </Messaggio>}
      <button className="pulsante" data-azione="rapporto" onClick={p.chiudi}><Icona di={FileText} />Leggi il rapporto</button>
    </>
  );
}
