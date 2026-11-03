// Mappa della città degli episodi (D-061): ogni episodio è un punto in «missione.luogo» (0-100) con
// esito e stelle; i futuri sono spenti. Tocco su un punto = lo scegli. Pixi sotto (se c'è WebGL), HTML sopra.
import { lazy, Suspense, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Missione } from '../../logica/tipi.ts';
import { t } from '../dati.ts';
import type { StatoEpisodio } from '../episodi.ts';
import { Stelle } from '../stelle.tsx';
import { TastoHome } from '../schermate/Fumetto.tsx';
import type { PuntoCitta } from './StratoCitta.tsx';
import { webglDisponibile } from './webgl.ts';
import { disponiNomeCitta } from './etichette.ts';
import { parcoCitta } from './parco.ts';
import { spento } from '../../interruttori.ts';

const StratoCitta = lazy(() => import('./StratoCitta.tsx').then((x) => ({ default: x.StratoCitta })));
const conWebgl = typeof document !== 'undefined' && webglDisponibile();

/** Episodio abbozzato (D-087): bordo tratteggiato sul punto, etichetta sulla scheda. Rosso C14B01: nessun segno. */
export const bozza = (m: Missione) => !!m.bozza && !spento('C14B01');

export interface VoceCitta { m: Missione; stato: StatoEpisodio; stelle: number | null }

/** Rosso C265B01: i luoghi della 0.61.0 (episodio 1-12 di ogni stagione). */
const LUOGHI_PRIMA = [[15, 20], [40, 15], [65, 20], [86, 30], [20, 45], [45, 40], [70, 45], [86, 60], [15, 70], [40, 70], [65, 75], [86, 86]].map(([x, y]) => ({ x: x!, y: y! }));

const posiziona = (x: number, y: number) => (el: HTMLElement | null) => {
  el?.style.setProperty('--x', String(x));
  el?.style.setProperty('--y', String(y));
};

/** D-123 (decisione del PO): a 360 e 375 px il nome dell'episodio scelto non sta sulla mappa (si legge nella scheda
 *  sotto): solo dalla larghezza della finestra del token --citta-nome-da in su. Rosso C61N01: il nome a ogni larghezza, come prima. */
const larghezzaNome = () => `(min-width: ${getComputedStyle(document.documentElement).getPropertyValue('--citta-nome-da').trim()})`;
function useConNome() {
  const [si, setSi] = useState(() => typeof matchMedia === 'undefined' || matchMedia(larghezzaNome()).matches);
  useLayoutEffect(() => {
    if (typeof matchMedia === 'undefined') return;
    const q = matchMedia(larghezzaNome()), cambia = () => setSi(q.matches);
    q.addEventListener('change', cambia); cambia();
    return () => q.removeEventListener('change', cambia);
  }, []);
  return si;
}

/** C24-06: il nome si mostra solo coi caratteri caricati. Calcolato col carattere di riserva e poi rifatto all'arrivo del
 *  carattere vero (C47N02), si vedeva saltare (e36 a 412: da due righe a una, 43 px a sinistra). Rosso C68N01: subito. */
function useCaratteri() {
  const f = typeof document === 'undefined' ? undefined : document.fonts;
  const [pronti, setPronti] = useState(() => !f || f.status === 'loaded');
  useLayoutEffect(() => {
    if (!f) return;
    const si = () => setPronti(f.status === 'loaded'), no = () => setPronti(false);
    f.addEventListener?.('loading', no); f.addEventListener?.('loadingdone', si); f.addEventListener?.('loadingerror', si);
    void f.ready.then(si);
    return () => { f.removeEventListener?.('loading', no); f.removeEventListener?.('loadingdone', si); f.removeEventListener?.('loadingerror', si); };
  }, [f]);
  return pronti || spento('C68N01');
}

export function MappaCitta(p: { voci: VoceCitta[]; scelto: string | null; scegli: (id: string) => void; home?: () => void }) {
  const contenitore = useRef<HTMLDivElement>(null);
  const conNome = useConNome(), caratteri = useCaratteri();
  const [pronta, setPronta] = useState(!conWebgl);
  const margine = useMemo(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--settore')) / 2 || 22, []);
  // Senza «luogo» nei dati gli episodi si mettono in fila, così non spariscono.
  // D-265 (PO-158): i luoghi nei dati sono una griglia 4 × 3 per stagione (bolle staccate a ogni misura della mappa). Rosso
  // C265B01: i luoghi di prima (stesso schema per le tre stagioni), con le bolle che si toccavano.
  const voci = useMemo(() => p.voci.map((v, i) => ({ ...v, pos: spento('C265B01') ? LUOGHI_PRIMA[(v.m.episodio - 1) % 12]! : v.m.luogo ?? { x: ((i + 1) * 100) / (p.voci.length + 1), y: 50 } })), [p.voci]);
  const punti: PuntoCitta[] = useMemo(() => voci.map((v) => ({ id: v.m.id, x: v.pos.x, y: v.pos.y, acceso: v.stato !== 'futuro' && v.stato !== 'superato' })), [voci]);
  // C17-12: il nome dell'episodio scelto al posto che non copre altri dischi, a ogni disegno, quando la mappa cambia
  // misura e quando arrivano i caratteri. Rosso C42N01: sempre sotto il disco, come prima.
  const disponi = () => { if (contenitore.current && !spento('C42N01')) disponiNomeCitta(contenitore.current); assesta(); };
  // C128-01 (PO-128, CI instabile «Il mercato del sabato» a 412): la scena entra scalata e ruotata (Scena.tsx) e il calcolo
  // fatto durante l'ingresso, corretto solo per la scala, lasciava il nome 6 px fuori dalla mappa se nessun disegno
  // arrivava dopo (senza WebGL sempre, con WebGL se Pixi era pronto prima della fine). Finché la mappa è trasformata si
  // guarda a ogni fotogramma e, a ingresso finito, si rifà il calcolo una volta. Rosso C128N01: no.
  const attesa = useRef(0);
  const assesta = () => {
    const el = contenitore.current;
    if (!el || spento('C128N01')) return;
    cancelAnimationFrame(attesa.current);
    const mossa = () => { const r = el.getBoundingClientRect(); return Math.abs(r.width - el.offsetWidth) > 0.1 || Math.abs(r.height - el.offsetHeight) > 0.1; };
    if (!mossa()) return;
    const guarda = () => { if (!el.isConnected) return; if (mossa()) attesa.current = requestAnimationFrame(guarda); else disponi(); };
    attesa.current = requestAnimationFrame(guarda);
  };
  useLayoutEffect(disponi);
  useLayoutEffect(() => {
    const el = contenitore.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(disponi); ro.observe(el);
    void document.fonts?.ready.then(disponi);
    // strumento instabile in CI: «fonts.ready» può risolversi prima che il carattere del nome inizi a caricarsi; il
    // nome calcolato col carattere di riserva restava largo e sul bordo. Si rifà a ogni carattere caricato.
    const caratteri = spento('C47N02') ? null : document.fonts;
    caratteri?.addEventListener?.('loadingdone', disponi);
    return () => { ro.disconnect(); caratteri?.removeEventListener?.('loadingdone', disponi); cancelAnimationFrame(attesa.current); };
  }, []);
  // ...e quando cambia la misura del nome scelto (carattere arrivato, testo diverso). Rosso C47N02: no.
  useLayoutEffect(() => {
    const n = contenitore.current?.querySelector('[data-episodio].acceso .settore-nome');
    if (!n || typeof ResizeObserver === 'undefined' || spento('C47N02')) return;
    let primo = true;
    const ro = new ResizeObserver(() => { if (primo) { primo = false; return; } disponi(); });
    ro.observe(n);
    return () => ro.disconnect();
  });
  return (
    <div className="mappa citta" ref={contenitore} data-mappa={conWebgl ? 'webgl' : 'html'} data-pronta={pronta ? 'si' : 'no'} data-parco={conWebgl ? parcoCitta().join(' ') : undefined} aria-label="Mappa di Vandel Falls">
      {p.home && <TastoHome vai={p.home} />}
      {conWebgl && <Suspense fallback={null}><StratoCitta contenitore={contenitore} punti={punti} margine={margine} pronto={() => setPronta(true)} /></Suspense>}
      {voci.map((v) => (
        <div key={v.m.id} ref={posiziona(v.pos.x, v.pos.y)} data-episodio={v.m.id} data-stato={v.stato} data-bozza={bozza(v.m) ? 'si' : undefined}
          className={`settore lato-${v.pos.x < 30 ? 'sinistra' : v.pos.x > 70 ? 'destra' : 'centro'} episodio ${v.stato}${p.scelto === v.m.id ? ' acceso' : ''}${bozza(v.m) ? ' bozza' : ''}`}>
          <button type="button" className="settore-punto" disabled={v.stato === 'futuro'} onClick={() => p.scegli(v.m.id)}
            aria-label={`Episodio ${v.m.episodio}: ${t(v.m.titolo)}${v.stelle !== null ? `, ${v.stelle} stelle su 3` : ''}${v.stato === 'futuro' ? ', non ancora disponibile' : ''}${bozza(v.m) ? ', bozza' : ''}`}>
            {v.m.episodio}
          </button>
          {/* PO-044: il nome solo sull'episodio scelto, gli altri punti mostrano il numero (rosso __NO_C13M01: tutti i nomi) */}
          {((p.scelto === v.m.id && (conNome || spento('C61N01')) && caratteri) || spento('C13M01')) && <span className="settore-nome" aria-hidden="true">{t(v.m.titolo)}</span>}
          {v.stelle !== null && <span className="settore-unita"><Stelle n={v.stelle} piccole /></span>}
        </div>
      ))}
    </div>
  );
}
