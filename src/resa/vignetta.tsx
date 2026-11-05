// Vignette a fumetto (S-23, PO-078, stile C D-066/D-096): disegnate dal codice in SVG, senza asset esterni.
// Colori solo da token: le forme usano classi «v-*» definite in stile-schermate.css. Riquadro nero spesso, retino giallo
// di fondo. La vignetta si rimpicciolisce (altezza dal CSS) prima di far scorrere la pagina.
// Rosso C26V01: nessuna vignetta.
import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { spento } from '../interruttori.ts';
import { persona, type PersonaDati } from './persona2.ts';

/** PO-092: la vignetta prende lo spazio che resta libero nella pagina (fra il minimo e il massimo dei token), senza
 *  farla scorrere: la riserva fissa era tarata sul testo più lungo e lasciava vignette minuscole. Rosso C36V01: no. */
function useRiempi(el: RefObject<SVGSVGElement | null>, attivo: boolean, nascondibile = false) {
  useLayoutEffect(() => {
    const svg = el.current;
    if (!svg || !attivo || spento('C36V01')) return;
    const fai = () => {
      svg.style.removeProperty('height');
      const css = getComputedStyle(svg), min = parseFloat(css.minHeight) || 0, max = parseFloat(css.maxHeight) || Infinity;
      // spazio libero sotto il contenuto (scrollHeight non scende mai sotto la finestra, quindi si misura il fondo di main)
      // il fondo della pagina = fondo di main + suo margine + padding inferiore del contenitore (#app) e del body
      const main = svg.closest('main') ?? document.body, app = main.parentElement ?? document.body;
      const px = (e: Element, k: 'marginBottom' | 'paddingBottom') => parseFloat(getComputedStyle(e)[k]) || 0;
      const fondo = main.getBoundingClientRect().bottom + window.scrollY + px(main, 'marginBottom') + px(app, 'paddingBottom') + (app === document.body ? 0 : px(document.body, 'paddingBottom'));
      const libero = innerHeight - fondo - (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--vignetta-margine')) || 0);
      // D-126 d (C22-04): vignette di sala e verbale; se lo spazio libero non arriva al minimo si nascondono invece di
      // restare minuscole (54-67 px a 375×667). Da nascosta lo spazio libero comprende i suoi margini: si toglono per
      // non farla riapparire e sparire a ogni misura. Rosso C66V01: restano al minimo, come prima.
      const nascosta = svg.hasAttribute('data-nascosta'), margini = nascosta ? Number(svg.dataset.margini) || 0 : parseFloat(css.marginTop) + parseFloat(css.marginBottom);
      // C26 (catena instabile, e25 sala a 360): all'entrata la scena ha la scala della molla (Scena.tsx), quindi il
      // riquadro a schermo non è l'altezza vera e la misura restava sbagliata finita la molla (pagina che scorre di 3 px).
      // L'altezza si legge dall'impaginazione, senza trasformazioni. Rosso C78V01: dal riquadro, come prima.
      // C29-01: da nascosta (display: none) la vignetta non occupa spazio, ma l'altezza del CSS vale lo stesso: contarla
      // raddoppiava lo spazio libero, la vignetta riappariva, non ci stava e si rinascondeva a ogni frame (1366×768,
      // 360×700). Da nascosta l'altezza è 0. Rosso C89V01: altezza del CSS anche da nascosta, come nella 0.23.0.
      const alta = nascosta && !spento('C89V01') ? 0 : spento('C78V01') ? svg.getBoundingClientRect().height : parseFloat(css.height) || 0;
      const vuole = alta + libero - (nascosta ? margini : 0);
      // C26-03: a 375×667 il verbale restava a 62-95 px (sopra il minimo): la decisione del PO è «nascoste a 375×667»,
      // quindi conta anche l'altezza della finestra (--vignetta-finestra-min). Rosso C76V01: solo il minimo, come prima.
      const bassa = !spento('C76V01') && innerHeight < (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--vignetta-finestra-min')) || 0);
      // C41-06 (D-182): il verbale fallito ha il minimo più alto (2/3 della larghezza a 360), ma vale solo se ci sta:
      // altrimenti si nasconde come le altre (D-126 d, C26-03; su 8fc00a3 restava al minimo e a 360×760 si scorreva)
      if (nascondibile && !spento('C66V01') && (vuole < min || bassa)) { svg.dataset.margini = String(margini); svg.setAttribute('data-nascosta', ''); svg.style.setProperty('display', 'none'); return; }
      svg.removeAttribute('data-nascosta'); svg.style.removeProperty('display');
      svg.style.setProperty('height', `${Math.max(min, Math.min(max, vuole))}px`);
    };
    fai();
    // si rifà quando l'impaginazione cambia (mappa pronta, caratteri, passi): fermo appena la misura non cambia più
    const main = svg.closest('main');
    let ultimo = '';
    const ro = typeof ResizeObserver === 'undefined' || !main ? null : new ResizeObserver(() => { const ora = `${innerHeight}:${Math.round(main.getBoundingClientRect().height)}`; if (ora !== ultimo) { ultimo = ora; fai(); } });
    if (main) ro?.observe(main);
    addEventListener('resize', fai); void document.fonts?.ready.then(fai);
    return () => { removeEventListener('resize', fai); ro?.disconnect(); };
  }, [el, attivo, nascondibile]);
}

type Vista = [number, number, number, number];

/** D-265: misura del riquadro a schermo (px), per le vignette che si inquadrano da sole («inquadra»). */
function useRiquadro(el: RefObject<SVGSVGElement | null>, attivo: boolean) {
  const [r, setR] = useState<[number, number] | null>(null);
  useLayoutEffect(() => {
    const svg = el.current;
    if (!svg || !attivo) return;
    const fai = () => { const w = svg.clientWidth, h = svg.clientHeight; setR((x) => (w && h && (!x || x[0] !== w || x[1] !== h) ? [w, h] : x)); };
    fai();
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fai);
    ro?.observe(svg);
    return () => ro?.disconnect();
  }, [el, attivo]);
  return r;
}

/** «vista»: il riquadro del disegno se non è quello solito 0 0 320 180 (PO-149: la striscia della città con più cielo sopra).
 *  «inquadra» (D-265): la vista si calcola dalla misura del riquadro a schermo, con le stesse proporzioni (nessun ritaglio). */
export function Vignetta(p: { nome: string; titolo: string; children: ReactNode; fissa?: boolean; evento?: string; ritaglio?: string; vista?: Vista; inquadra?: (w: number, h: number) => Vista }) {
  const el = useRef<SVGSVGElement>(null);
  // C41-06: il verbale fallito ha il suo minimo (--vignetta-min-fallita, classe .fallita in Verbale.tsx); rosso C41V06
  const nasconde = /^(apertura|esito|ondata)-/.test(p.nome);
  useRiempi(el, !p.fissa, nasconde); // «fissa»: la misura la decide chi la contiene (vignetta nel fumetto della chiamata)
  const riquadro = useRiquadro(el, !!p.inquadra);
  if (spento('C26V01')) return null;
  const vista = (p.inquadra && riquadro ? p.inquadra(riquadro[0], riquadro[1]) : p.vista) ?? [0, 0, 320, 180];
  const [vx, vy, vw, vh] = vista;
  return (
    <svg ref={el} className="vignetta" viewBox={vista.map((x) => Math.round(x * 100) / 100).join(' ')} preserveAspectRatio={p.inquadra && riquadro ? 'xMidYMid meet' : p.ritaglio ?? 'xMidYMid meet'} role="img" aria-label={p.titolo} data-vignetta={p.nome} data-evento={p.evento}>
      <defs>
        <pattern id="v-retino" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="1.2" className="v-retino" /></pattern>
        {/* PO-092: ombra a retino (stile C): fondo grigio scuro a punti neri */}
        <pattern id="v-ombra" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" className="v-retino-ombra-fondo" /><circle cx="2.5" cy="2.5" r="1.4" className="v-nero" /></pattern>
      </defs>
      <rect x={vx} y={vy} width={vw} height={vh} className="v-giallo" />
      <rect x={vx} y={vy} width={vw} height={vh} fill="url(#v-retino)" />
      {p.children}
      <rect x={vx + 1.5} y={vy + 1.5} width={vw - 3} height={vh - 3} className="v-cornice" />
    </svg>
  );
}

/** Busto a fumetto in stile C (PO-092, D-114): spalle con la giacca e l'ombra a retino, colletto, collo, testa con
 *  orecchie, sopracciglia, occhi con la luce, naso; capelli lunghi, corti o berretto; espressione dalla bocca. */
export function Persona(p: PersonaDati) {
  // PO-119 / D-171, D-176: la quarta prova approvata (persona2.ts); fuori dalle vignette di fine ondata ed episodio la scala 0,9
  // tiene le figure grandi come prima (guida, chiamata del vice). Rosso C114P01: il disegno della 0.38.0.
  if (!spento('C114P01')) return <g data-persona="4" dangerouslySetInnerHTML={{ __html: persona({ scala: 0.9, ...p }) }} />;
  const s = (p.s ?? 1) * 0.8;
  const bocca = p.bocca === 'giu' ? 'M-7 19 Q0 13 7 19' : p.bocca === 'dritta' ? 'M-6 17 L6 17' : 'M-7 15 Q0 22 7 15';
  return (
    <g transform={`translate(${p.x} ${p.y}) scale(${s})`}>
      <path d="M-44 92 Q-46 52 -20 44 L0 52 L20 44 Q46 52 44 92 Z" className={`${p.giacca} v-tratto`} />
      <path d="M10 48 Q40 54 42 92 L18 92 Z" className="v-ombra" />
      {/* PO-059: braccia alzate (festa) o una mano alla nuca (preoccupazione) */}
      {p.braccia === 'su' && <g data-braccia="su"><path d="M-40 62 L-58 8 L-47 4 L-30 54 Z M40 62 L58 8 L47 4 L30 54 Z" className={`${p.giacca} v-tratto`} /><circle cx="-53" cy="3" r="6" className="v-pelle v-tratto" /><circle cx="53" cy="3" r="6" className="v-pelle v-tratto" /></g>}
      {p.braccia === 'nuca' && <g data-braccia="nuca"><path d="M34 58 L46 22 L32 -8 L22 -4 L35 22 L24 52 Z" className={`${p.giacca} v-tratto`} /><circle cx="26" cy="-8" r="6" className="v-pelle v-tratto" /></g>}
      <path d="M-20 44 L-6 70 L0 52 L6 70 L20 44" className="v-bianco v-tratto" />
      {p.distintivo && <path d="M-30 62 l6 -4 l6 4 l-1 8 l-5 3 l-5 -3 Z" className="v-giallo v-tratto" />}
      <path d="M-9 30 L-9 46 Q0 52 9 46 L9 30" className="v-pelle v-tratto" />
      <path d="M-22 0 Q-24 -30 0 -32 Q24 -30 22 0 Q22 24 0 34 Q-22 24 -22 0 Z" className="v-pelle v-tratto" />
      <path d="M6 -28 Q22 -22 21 2 Q20 22 2 32 Q14 14 12 -6 Z" className="v-ombra" />
      <path d="M-23 2 q-7 2 -5 9 q2 5 7 3" className="v-pelle v-tratto" /><path d="M23 2 q7 2 5 9 q-2 5 -7 3" className="v-pelle v-tratto" />
      {p.capelli === 'lunghi' && <path d="M-24 4 Q-30 -36 0 -36 Q30 -36 24 4 L26 36 L14 30 L15 -10 Q0 -20 -15 -10 L-14 30 L-26 36 Z" className="v-capelli v-tratto" />}
      {p.capelli === 'corti' && <path d="M-23 -2 Q-24 -36 0 -35 Q24 -36 23 -2 Q12 -16 -23 -2 Z" className="v-capelli v-tratto" />}
      {p.capelli === 'berretto' && <g><path d="M-24 -6 Q-24 -36 0 -36 Q24 -36 24 -6 Z" className="v-giacca-scura v-tratto" /><path d="M-26 -6 H30 L40 -2 L-24 -1 Z" className="v-nero v-tratto" /><path d="M-6 -30 l6 -4 l6 4 l-1 7 l-5 3 l-5 -3 Z" className="v-giallo v-tratto" /></g>}
      <path d={p.sopracciglia === 'su' ? 'M-14 -10 q6 -5 11 0 M3 -10 q6 -5 11 0' : p.sopracciglia === 'giu' ? 'M-14 -5 L-3 -9 M3 -9 L14 -5' : 'M-14 -6 q6 -4 11 0 M3 -6 q6 -4 11 0'} className="v-linea" data-sopracciglia={p.sopracciglia ?? ''} />
      <ellipse cx="-8" cy="1" rx="2.4" ry="3" className="v-nero" /><ellipse cx="8" cy="1" rx="2.4" ry="3" className="v-nero" />
      <circle cx="-7.2" cy="0" r="0.9" className="v-bianco" /><circle cx="8.8" cy="0" r="0.9" className="v-bianco" />
      <path d="M0 2 Q-3 10 1 12" className="v-linea" />
      {p.baffi && <path d="M-11 13 Q0 7 11 13 Q4 15 0 13 Q-4 15 -11 13 Z" className="v-capelli v-tratto" />}
      <path d={bocca} className="v-linea" />
    </g>
  );
}
