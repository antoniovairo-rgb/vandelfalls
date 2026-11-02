// Flusso: titolo → mappa della città (D-061) → episodio: sala operativa → briefing → per ogni ondata
// schieramento → chiamate → rapporto → verbale (stelle; se fallito si rigioca, D-059) → città. La mappa tattica resta fissa in alto, le scene cambiano
// sotto. La resa legge e mostra; i calcoli stanno in src/logica. Si salva dopo ogni passo (D-040):
// la scena dentro l'ondata si ricava dal salvataggio (partita.ts), quindi una ricarica riprende lì.
import { AnimatePresence, MotionConfig } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { spento } from '../interruttori.ts';
import { variabiliIniziali } from '../logica/condizioni.ts';
import { concludiMissione, disponibili, missioneFinita, riprendiDallOndata, type EsitoMissione, type InCorso } from '../logica/missione.ts';
import type { Disposizione, Missione, Opzione } from '../logica/tipi.ts';
import { SAVE_VERSION, type Salvataggio } from '../salvataggi/salvataggio.ts';
import { GAME_VERSION } from '../versione.ts';
import { carica, guidaVista, segnaGuidaVista, nuovoSeme, salva, ultimoAvviso } from './archivio.ts';
import { dichiarate, genereAttuale, impostaGenere, missione, missioni, testoSe } from './dati.ts';
import type { Genere } from '../dati/testi.ts';
import { ConfermaNuova, SceltaGenere } from './schermate/SceltaGenere.tsx';
import { Guida } from './schermate/Guida.tsx';
import { chiudiEpisodio, iniziaEpisodio, prossimoEpisodio } from './episodi.ts';
import type { Risultato } from '../logica/episodi.ts';
import { Mappa, type MappaProps } from './mappa/Mappa.tsx';
import { centro, Voli, type Volo } from './mappa/Volo.tsx';
import { infoOndata, livello } from './partita.ts';
import { Briefing } from './schermate/Briefing.tsx';
import { Citta } from './schermate/Citta.tsx';
import { Crediti } from './schermate/Crediti.tsx';
import { Privacy } from './schermate/Privacy.tsx';
import { RapportoCosto, Risposta } from './schermate/Ondata.tsx';
import { Rapporto } from './schermate/Rapporto.tsx';
import { Tono } from './schermate/Tono.tsx';
import { tonoOndata } from './espressioni.ts';
import { Sala } from './schermate/Sala.tsx';
import { Scena } from './schermate/Scena.tsx';
import { Titolo } from './schermate/Titolo.tsx';
import { Verbale } from './schermate/Verbale.tsx';
import { Epilogo } from './schermate/Epilogo.tsx';
import { Fischio } from './schermate/Fischio.tsx';
import { chiudeStagione, epilogo, fineStagione, ultimoEpisodio } from '../logica/epilogo.ts';
import { superato } from '../logica/episodi.ts';
import { ondataVincibile } from '../logica/ripartenza.ts';
import type { InSospeso } from '../logica/sospesa.ts';
import { valutaEpisodio } from '../logica/episodi.ts';
import type { Segno } from './mappa/segni.ts';
import { due, Testata } from './schermate/Fumetto.tsx';
import { t } from './dati.ts';
import { Fiducia } from './fiducia.tsx';
import { useIndietroApp } from './indietro.ts';
import { scenaOndata, type TestataApp } from './app-ondata.tsx';
import { useMossa } from './mossa-ui.tsx';

type Schermata = 'titolo' | 'crediti' | 'privacy' | 'conferma' | 'genere' | 'guida' | 'citta' | 'sala' | 'briefing' | 'gioco' | 'rapporto' | 'verbale' | 'fischio' | 'epilogo';

// Interruttori rossi che agiscono sul CSS (token.css): C05R06 testi a 10 px e nomi sul bordo, C05R07 etichetta
// lunga, C05N01 stato del rapporto che va a capo sotto il nome.
const ROSSI_CSS = ['C05R06', 'C05R07', 'C05N01', 'C10S03', 'C14T01', 'C35C01', 'C38A01', 'C38R01', 'C40C01', 'C40C02', 'C42V01', 'C44I02', 'C58I01', 'C60I01', 'C89C01', 'C90V01', 'C98V01', 'C113V01', 'C187C01', 'C187V01', 'C191C01', 'C193S01', 'C196V01', 'C201R01', 'C201C01', 'C203R01', 'C206I01', 'C210C01', 'C215L01', 'C218R01', 'C218S01', 'C221R01', 'C224A01', 'C230C01', 'C234V01', 'C236T01', 'C237S01', 'C237P01', 'C241N01'];

export function App() {
  const [sal, setSal] = useState<Salvataggio | null>(() => carica());
  const [aggiornato] = useState(() => ultimoAvviso()); // dopo carica(): avviso dell'adattamento ai dati nuovi (C-014)
  const [schermata, setSchermata] = useState<Schermata>('titolo');
  const [visti, setVisti] = useState(0);
  const [mappaNascosta, setMappaNascosta] = useState(false); // D-191: rapporto senza mappa, «Home» nella testata
  const [bozza, setBozza] = useState<Disposizione>({});
  // S-12 (PO-061): ogni mossa dello schieramento si può annullare («Annulla l'ultima»).
  const [storia, setStoria] = useState<Disposizione[]>([]);
  // C17-16: la bozza va anche nel salvataggio, così una ricarica non la perde. Rosso C35B01: solo in memoria, come prima.
  const salvaBozza = (d: Disposizione) => {
    const ora = ultimo.current, c = ora?.in_corso;
    if (ora && c && !spento('C35B01')) aggiorna({ ...ora, bozza: Object.values(d).some((x) => Object.values(x ?? {}).some((n) => n > 0)) ? { missione: c.missione, ondata: c.ondata, d } : null });
  };
  const cambiaBozza = (d: Disposizione) => { setStoria((s) => [...s, bozza]); setBozza(d); salvaBozza(d); };
  const nuovaBozza = () => { setStoria([]); setBozza({}); };
  const annulla = () => { if (!storia.length || spento('C17C02')) return; setBozza(storia.at(-1)!); salvaBozza(storia.at(-1)!); setStoria(storia.slice(0, -1)); setAvviso(null); };
  const [scelta, setScelta] = useState<string | null>(null);
  const [esito, setEsito] = useState<{ m: Missione; e: EsitoMissione; r: Risultato; migliore: boolean; ic: InCorso } | null>(null);
  const [scelto, setScelto] = useState<string | null>(null);
  const [spenti, setSpenti] = useState(0); // D-165: settori spenti dal fischio dell'ultimo derby // episodio scelto sulla mappa della città
  // PO-083: l'ondata da cui ripartire si calcola una volta a fine episodio (fino a ~0,7 s misurati su computer), non a ogni disegno
  const nRiparti = useMemo(() => (esito?.r.fallita ? ondataVincibile(esito.m, esito.e, esito.ic, dichiarate) : 1), [esito]);
  const [tonoVisto, setTonoVisto] = useState<string | null>(null); // C33-06: la scena del tono già vista per «episodio-ondata»
  const sospesa = useRef<InSospeso | null>(null); // PO-121: la risposta che si può ancora annullare (mai nel salvataggio)
  const [voli, setVoli] = useState<Volo[]>([]); // unità in volo verso il settore (solo decorazione)
  const [segni, setSegni] = useState<Segno[]>([]); // PO-085: segni dell'ultima risposta sulla mappa, per 1,8 s
  const timerSegni = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { if (!segni.length || spento('C193T01')) return; const id = setTimeout(() => setSegni([]), 1800); timerSegni.current = id; return () => clearTimeout(id); }, [segni]);
  const mostraSegni = (xs: Segno[]) => {
    if (timerSegni.current) clearTimeout(timerSegni.current); setSegni(xs);
    // D-193: il conto di 1,8 s parte quando i segni sono sulla pagina (effetto qui sotto), non al tocco: con la mappa che
    // cambia altezza fra chiamata e risposta (D-187) il disegno arrivava dopo e i segni potevano scadere prima di vedersi
    // (CI a 375, PO-085). Rosso C193T01: dal tocco, come prima.
    if (spento('C193T01')) timerSegni.current = setTimeout(() => setSegni([]), 1800);
    // C20-07: se la mappa è scorsa via (opzione toccata in fondo alla pagina), torna in vista. Rosso C44E04: no.
    const mappa = document.querySelector('.mappa');
    if (xs.length && mappa && !spento('C44E04') && mappa.getBoundingClientRect().top < 0) mappa.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  const contaVoli = useRef(0);
  const vola = (risorsa: string, settore: string) => {
    document.documentElement.dataset.volo = `${risorsa}>${settore}`; // per le foto: anche quando il volo non si vede
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // dal vassoio dello schieramento; nella chiamata (PO-089) dal bordo basso della mappa, cioè dalla centrale
    const da = centro(`[data-risorsa="${risorsa}"]`) ?? centro('.mappa', 'basso'), a = centro(`[data-settore="${settore}"] .settore-punto`);
    if (da && a) setVoli((v) => [...v, { id: ++contaVoli.current, risorsa, da, a }]);
  };
  const [avviso, setAvviso] = useState<string | null>(null);
  const [riepilogoAperto, setRiepilogoAperto] = useState(false); // C15-06: col riepilogo aperto la mappa non si tocca // transenne su un settore dove non si montano (D-082)
  const [eco, setEco] = useState<Opzione | null>(null); // risposta all'ultima scelta, solo a schermo
  // Ogni azione parte dal salvataggio PIÙ RECENTE (ref), non da quello catturato quando la scena è stata
  // disegnata: un secondo tocco durante l'uscita della scena trova la chiamata già chiusa e non fa nulla (C-005 R01).
  const ultimo = useRef(sal);
  const aggiorna = (s: Salvataggio) => { ultimo.current = s; salva(s); setSal(s); };
  // Interruttore rosso C05R01: si torna allo stato catturato dalla scena (difetto originale).
  const icOra = () => (spento('C05R01') ? sal?.in_corso ?? null : ultimo.current?.in_corso ?? null);
  // C17-04: un nuovo stato di gioco («Riparti», «Ricomincia», un altro episodio) chiude la sconfitta salvata
  const conIc = (ic: InCorso | null, extra: Partial<Salvataggio> = {}) => ultimo.current && aggiorna({ ...ultimo.current, in_corso: ic, bozza: null, ...(ic ? { sconfitta: null } : {}), ...extra });

  impostaGenere(sal?.genere ?? 'm');
  // D-241 idea B: la mossa fra una chiamata e l'altra, nella risposta (mossa-ui.tsx)
  const mossa = useMossa({ m: sal?.in_corso ? missione(sal.in_corso.missione) : null, ic: sal?.in_corso ?? null, attiva: schermata === 'gioco' && !!eco, icOra, conIc });
  const nuova = (genere: Genere) => {
    const seme = nuovoSeme();
    const s: Salvataggio = { save_version: SAVE_VERSION, game_version: GAME_VERSION, seme, caso: seme, variabili: variabiliIniziali(dichiarate.values()), missioni_concluse: [], episodi: {}, genere, in_corso: null, rapporto_aperto: null };
    aggiorna(s);
    // S-18 (PO-056): alla prima partita su questo telefono, la guida a passi (saltabile) prima della città.
    // Rosso C22G01: niente guida.
    // C16-04: «vista» quando la chiudi o la finisci, non prima di mostrarla (rosso C28G01: prima, come allora)
    if (!guidaVista() && !spento('C22G01')) { if (spento('C28G01')) segnaGuidaVista(); setScelto(prossimoEpisodio(s)?.id ?? null); setSchermata('guida'); return; }
    alla_citta(s);
  };
  // Sulla mappa è già scelto il prossimo episodio da giocare; se sono tutti superati, l'ultimo.
  function alla_citta(s: Salvataggio) { setScelto(prossimoEpisodio(s)?.id ?? missioni.at(-1)?.id ?? null); setSchermata('citta'); }
  const riprendi = () => {
    const ic = sal?.in_corso;
    nuovaBozza(); setEco(null);
    if (!ic) {
      // C17-04: ultimo episodio perso e non ancora ripartito → di nuovo il verbale, con «Riparti». Rosso C35R01: città.
      const sc = sal?.sconfitta;
      if (sc && !spento('C35R01')) {
        try {
          const mm = missione(sc.missione), e = concludiMissione(mm, sc, dichiarate);
          setEsito({ m: mm, e, r: valutaEpisodio(mm, e), migliore: false, ic: sc }); setSchermata('verbale'); return;
        } catch (x) { console.warn(`sconfitta salvata non più valida: ${(x as Error).message}`); }
      }
      if (sal) alla_citta(sal); return;
    }
    const b = sal?.bozza; // C17-16: la bozza di questa ondata, se lo schieramento non è ancora confermato
    if (b && b.missione === ic.missione && b.ondata === ic.ondata && !ic.disposizione && !spento('C35B01')) setBozza(b.d);
    // Rapporto aperto al momento del salvataggio: si torna lì (C-005 R04).
    setSchermata(missioneFinita(missione(ic.missione), ic) || (sal?.rapporto_aperto && !spento('C05R04')) ? 'rapporto' : 'gioco');
  };
  const giocaEpisodio = (id: string) => { setScelto(id); setSchermata('sala'); };

  const ic = sal?.in_corso ?? null;
  const m = ic ? missione(ic.missione) : scelto ? missione(scelto) : null;
  let nome: string = schermata;
  let corpo;
  let mappa: Omit<MappaProps, 'm'> | null = null;
  let testata: TestataApp | null = null; // sopra la mappa, come nella bozza C2

  // Con una partita salvata, «Nuova partita» chiede conferma prima di cancellarla (C-005 R02).
  // S-21 (D-104, C14-05): «Home» dalla città e dall'episodio; il tasto indietro del telefono non esce a metà.
  const home = () => { setEco(null); setSchermata('titolo'); };
  useIndietroApp(schermata === 'titolo', () => { if (schermata === 'titolo') return false; home(); return true; });
  // S-17 (PO-060): episodio perso → si riparte dall'ondata che ha deciso l'esito, se lo stato di quell'ondata
  // c'è (salvataggi vecchi: no) e non è la prima (allora è «Ricomincia»). Rosso C21R01: solo «Ricomincia».
  const ripartenza = (x: NonNullable<typeof esito>) => {
    if (!x.r.fallita || spento('C21R01')) return null;
    const n = nRiparti;
    const stato = n > 1 ? riprendiDallOndata(x.ic, n) : null;
    return stato ? { n, vai: () => { nuovaBozza(); setEsito(null); setScelto(x.m.id); conIc(stato, { rapporto_aperto: null }); setSchermata('gioco'); } } : null;
  };
  const titolo = <Titolo avviso={aggiornato} puoRiprendere={!!sal} nuova={() => setSchermata(sal && !spento('C05R02') ? 'conferma' : 'genere')} riprendi={riprendi} crediti={() => setSchermata('crediti')} privacy={() => setSchermata('privacy')} sal={sal} importata={aggiorna} />;
  if (schermata === 'crediti') corpo = <Crediti indietro={() => setSchermata('titolo')} />;
  else if (schermata === 'privacy') corpo = <Privacy indietro={() => setSchermata('titolo')} />; // PO-145
  else if (schermata === 'conferma') corpo = <ConfermaNuova si={() => setSchermata('genere')} no={() => setSchermata('titolo')} />;
  else if (schermata === 'genere') corpo = <SceltaGenere scegli={nuova} indietro={() => setSchermata('titolo')} />;
  else if (schermata === 'guida' && sal) { nome = 'guida'; corpo = <Guida introduttiva chiudi={() => { segnaGuidaVista(); alla_citta(sal); }} />; }
  else if (schermata === 'verbale' && esito && sal) {
    corpo = <Verbale m={esito.m} esito={esito.e} risultato={esito.r} migliore={esito.migliore}
      rigioca={() => giocaEpisodio(esito.m.id)} citta={() => alla_citta(sal)} home={home} riparti={ripartenza(esito)}
      prossimo={prossimoEpisodio(sal) ? () => giocaEpisodio(prossimoEpisodio(sal)!.id) : undefined}
      fineStagione={!esito.r.fallita && chiudeStagione(missioni, esito.m) ? fineStagione(missioni, sal.episodi, sal.variabili, dichiarate.values(), esito.m.stagione) : null}
      epilogo={ultimoEpisodio(missioni)?.id === esito.m.id ? () => { setSpenti(0); setScelto(esito.m.id); setSchermata(spento('C165F01') ? 'epilogo' : 'fischio'); } : undefined} />;
  } else if (schermata === 'epilogo' && sal && !ic) {
    // D-161: epilogo della campagna; si torna alla città (e dalla città si rilegge, finché l'ultimo episodio è superato)
    corpo = <Epilogo e={epilogo(missioni, sal.episodi, sal.variabili, dichiarate.values())} citta={() => alla_citta(sal)} home={home}
      genere={sal.genere} fiducia={Number(sal.variabili.credito ?? 0)} fiduciaMax={Number(dichiarate.get('credito')?.max ?? 10)} />;
  } else if (schermata === 'fischio' && sal && !ic && m) {
    // D-165 parte 1: fischio dell'ultimo derby sulla mappa dell'episodio, poi l'epilogo
    const n = m.mappa.settori.length;
    mappa = { spenti: m.mappa.settori.slice(0, spenti).map((x) => x.id), vuota: true, buio: spenti > n };
    testata = { etichetta: t('finale.fischio.etichetta'), titolo: t('finale.fischio.titolo') };
    corpo = <Fischio settori={n} spenti={spenti} spegni={(k) => setSpenti((x) => Math.min(n + 1, k < 0 ? x + 1 : k))} avanti={() => setSchermata('epilogo')} />;
  } else if (schermata === 'citta' && sal && !ic) {
    const fine = ultimoEpisodio(missioni);
    corpo = <Citta sal={sal} scelto={m} scegli={setScelto} avvia={(x) => giocaEpisodio(x.id)} home={home}
      epilogo={fine && superato(sal.episodi, fine.id) && !spento('C161E01') ? () => setSchermata('epilogo') : undefined} />;
  }
  else if (schermata === 'titolo' || !sal || !m) { nome = 'titolo'; corpo = titolo; }
  else if (schermata === 'sala') {
    nome = 'sala';
    // C17-17: in sala non pulsa niente (non c'è ancora una chiamata). Rosso C35S01: tutti accesi, come prima.
    mappa = { accesi: spento('C35S01') ? m.mappa.settori.map((s) => s.id) : [] };
    testata = { etichetta: 'Sala operativa', titolo: t(m.titolo) };
    corpo = <Sala m={m} avanti={() => { setVisti(Math.min(1, m.briefing.length)); setSchermata('briefing'); }} />;
  } else if (schermata === 'briefing') {
    const ultimo = m.briefing[visti - 1];
    mappa = { accesi: ultimo?.settore ? [ultimo.settore] : [] };
    testata = { etichetta: `Briefing · ${Math.min(visti, m.briefing.length)} di ${m.briefing.length} fonti`, titolo: t(m.titolo) };
    corpo = <Briefing m={m} visti={visti} vai={setVisti} inizia={() => {
      if (icOra()) return; // già iniziata (doppio tocco)
      nuovaBozza(); conIc(iniziaEpisodio(sal, m)); setSchermata('gioco');
    }} />;
  } else if (schermata === 'rapporto' && ic?.rapporti.length && !spento('C110V01') && tonoVisto !== `${m.id}-${ic.rapporti.at(-1)!.n}`) {
    // C33-06 (D-143): prima del rapporto la scena del tono con la vignetta grande; rosso C110V01: il rapporto subito
    const r = ic.rapporti.at(-1)!, visto = `${m.id}-${r.n}`;
    nome = 'tono';
    corpo = <Tono n={r.n} genere={genereAttuale() === 'f' ? 'f' : 'm'} avanti={() => setTonoVisto(visto)}
      tono={tonoOndata(m.mappa.settori.map((x) => livello(r.tensione[x.id] ?? 0)), Object.values(r.scoperto).filter((x) => x > 0).length)} />;
  } else if (schermata === 'rapporto' && ic?.rapporti.length) {
    const r = ic.rapporti.at(-1)!;
    const fine = missioneFinita(m, ic);
    // C-010 C09-02: un settore scoperto non può sembrare tranquillo: almeno il giallo (livello 2).
    // Interruttore rosso C10S02: colore dalla sola tensione.
    mappa = { tensione: spento('C10S02') ? r.tensione : Object.fromEntries(Object.entries(r.tensione).map(([k, v]) => [k, (r.scoperto[k] ?? 0) > 0 ? Math.max(v, 3) : v])) };
    testata = { etichetta: `Rapporto · ondata ${r.n} di ${m.ondate.length}`, titolo: `Rapporto dell'ondata ${r.n}` };
    corpo = <Rapporto m={m} r={r} scelte={ic.scelte} ultima={fine} prossime={fine ? {} : disponibili(m, ic)} avanti={() => {
      const ora = icOra();
      if (!ora) return; // episodio già chiuso (doppio tocco)
      if (!missioneFinita(m, ora)) { conIc(ora, { rapporto_aperto: null }); nuovaBozza(); setSchermata('gioco'); return; }
      const e = concludiMissione(m, ora, dichiarate);
      const chiuso = chiudiEpisodio(ultimo.current!, m, e); // registro, stelle, variabili (D-059…D-062)
      aggiorna({ ...chiuso.salvataggio, rapporto_aperto: null, sconfitta: chiuso.risultato.fallita && !spento('C35R01') ? ora : null });
      setEsito({ m, e, r: chiuso.risultato, migliore: chiuso.migliore, ic: ora });
      setSchermata('verbale');
    }} />;
  } else if (!ic) { nome = 'titolo'; corpo = titolo; }
  else if (eco) {
    nome = 'risposta';
    testata = { etichetta: `Ondata ${ic.ondata}/${m.ondate.length} · la tua scelta`, titolo: t(m.titolo), info: infoOndata(m, ic.ondata, testoSe) };
    // PO-152 A: il costo per radio sopra la mappa; idea B: lì anche l'indicazione della mossa, e la mappa si tocca per farla
    mappa = { tensione: ic.tensione, presenze: ic.disposizione, fisse: spento('C09S02') ? null : ic.fisse, radio: <><RapportoCosto m={m} ic={ic} o={eco} />{mossa?.indicazione}</>, ...mossa?.mappa };
    corpo = <Risposta m={m} ic={ic} o={eco} avanti={() => setEco(null)} />;
  } else {
    ({ nome, testata, mappa, corpo } = scenaOndata({ m, ic, titolo, bozza, scelta, avviso, riepilogoAperto, annulla: storia.length ? annulla : null,
      setScelta, setAvviso, setRiepilogoAperto, cambiaBozza, vola, mostraSegni, setEco, sospesa, icOra, conIc, alRapporto: () => setSchermata('rapporto') }));
  }

  // Barra della fiducia (D-097): durante l'episodio, e (C15-07) anche in sala e briefing col valore da cui parte
  // il tentativo, e nel verbale col valore finale che decide le stelle. Rosso C34F01: solo gioco e rapporto.
  const altrove = !spento('C34F01');
  const fiducia = ic && (schermata === 'gioco' || schermata === 'rapporto') ? Number(ic.variabili.credito ?? 0)
    : altrove && !ic && sal && m && (schermata === 'sala' || schermata === 'briefing') ? Number(iniziaEpisodio(sal, m).variabili.credito ?? 0)
    : altrove && schermata === 'verbale' && esito ? Number(esito.ic.variabili.credito ?? 0) : null;
  const chiave = (nome === 'chiamata' || nome === 'risposta') && ic ? `${nome}-${ic.ondata}-${Object.keys(ic.risposte).length}` : `${nome}-${ic?.ondata ?? 0}`;
  return (
    <MotionConfig reducedMotion="user">
      <main data-schermata={nome} data-ondata={ic?.ondata ?? 0} className={ROSSI_CSS.filter((x) => spento(x)).map((x) => `rosso-${x.toLowerCase()}`).join(' ')}>
        {mappa && m && testata && <Testata numero={due(m.episodio)} etichetta={testata.etichetta} titolo={testata.titolo} info={testata.info} home={mappaNascosta ? home : undefined} />}
        {fiducia !== null && <Fiducia valore={fiducia} max={Number(dichiarate.get('credito')?.max ?? 10)} />}
        {mappa && m && <Mappa m={m} home={home} nascosta={setMappaNascosta} segni={segni} ondata={schermata === 'rapporto' ? ic?.rapporti.at(-1)?.n : Math.min(ic?.ondata ?? 1, m.ondate.length)} {...mappa} />}
        <Voli voli={voli} finito={(id) => setVoli((v) => v.filter((x) => x.id !== id))} />
        {/* PO-097: versione su ogni schermata, in basso a destra, piccola e non toccabile. Rosso C38V01: niente. */}
        {!spento('C38V01') && <small className="versione-angolo" data-versione-angolo aria-hidden="true">v{GAME_VERSION}</small>}
        <AnimatePresence mode="wait" initial={false}>
          <Scena key={chiave} nome={nome} missione={m?.id}>{corpo}</Scena>
        </AnimatePresence>
      </main>
    </MotionConfig>
  );
}
