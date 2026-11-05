// Vignetta della home (PO-140, D-179, proposta A approvata dal PO): sala operativa di notte, dalla finestra lo stadio
// con i fari, le curve nei colori dei club del derby di e01 (dati, D-086) e il fumo; davanti protagonista e Malvasi
// (seconda bozza approvata, D-171/D-176). Colori solo dalle classi «v-*». Come le altre vignette (PO-092) prende lo
// spazio libero della pagina fra --home-vignetta-min e --home-vignetta-max (useRiempi) e si ritaglia (slice).
import { club } from './dati.ts';
import { Persona, Vignetta } from './vignetta.tsx';

/** Stadio di notte visto da lontano: catino, folla nei colori dei club, torri dei fari con i coni. */
function StadioLontano(p: { x: number; y: number; k: number; sx?: string; dx?: string }) {
  const folla = Array.from({ length: 40 }, (_, i) => {
    const a = Math.PI * (0.06 + 0.88 * (i / 40));
    return { x: -Math.cos(a) * 62, y: -Math.sin(a) * 15, i };
  });
  return (
    <g transform={`translate(${p.x} ${p.y}) scale(${p.k})`}>
      {[-84, 84].map((fx) => (
        <g key={fx}>
          <polygon points={`${fx - 3},-40 ${fx + 3},-40 ${fx > 0 ? fx - 50 : fx + 50},16 ${fx > 0 ? fx - 10 : fx + 10},16`} className="v-cono" />
          <rect x={fx - 1.5} y={-42} width="3" height="56" className="v-nero" />
          <rect x={fx - 8} y={-50} width="16" height="9" className="v-faro v-tratto" />
        </g>
      ))}
      <ellipse cx="0" cy="0" rx="72" ry="22" className="v-cemento v-tratto" />
      {folla.map((f) => {
        const lato = f.x < -14 ? p.sx : f.x > 14 ? p.dx : undefined, curva = f.x < -14 || f.x > 14;
        return <circle key={f.i} cx={f.x.toFixed(1)} cy={f.y.toFixed(1)} r="1.8" fill={lato} className={curva ? (lato ? '' : 'v-magenta') : 'v-bianco'} />;
      })}
      <ellipse cx="0" cy="6" rx="48" ry="11" className="v-prato v-tratto" />
      <path d="M-72 0 Q-72 26 0 30 Q72 26 72 0 L72 12 Q72 38 0 40 Q-72 38 -72 12 Z" className="v-cemento v-tratto" />
      <path d="M-72 12 Q-72 38 0 40 Q72 38 72 12 L72 18 Q72 42 0 44 Q-72 42 -72 18 Z" className="v-ombra" />
    </g>
  );
}

const Fumo = (p: { x: number; y: number; k: number }) => (
  <path transform={`translate(${p.x} ${p.y}) scale(${p.k})`} d="M0 0 Q-6 -14 8 -16 Q12 -30 28 -24 Q40 -34 50 -20 Q64 -20 60 -6 Q66 4 52 6 L4 6 Q-8 6 0 0 Z" className="v-fumo v-tratto" />
);

// D-265 (PO-158): misure del disegno in unità del viewBox (misurate sulla 0.61.0 con getScreenCTM): cima della testa più alta
// (capelli del protagonista), petto dei due (riga dei taschini, y 76 di persona2.ts), larghezza utile (i due e lo stadio coi
// fari) e fondo della stanza disegnata.
const TESTA = 13.4, PETTO = 161, SOTTO_PETTO = 8, UTILE: [number, number] = [54.5, 301.4], FONDO = 180;
const tokenPx = (v: string) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(v)) || 0;

/** D-265: la striscia della città si inquadra sui personaggi. Lo zoom più grande che mostra, dal margine sopra le teste
 *  (--citta-sopra-teste-min) fino a poco sotto il petto, senza uscire dalla larghezza del disegno e senza tagliare i due e lo
 *  stadio ai lati; lo spazio sopra le teste resta fra --citta-sopra-teste-min e -max, il resto va sotto (ai personaggi). */
export function inquadraStriscia(w: number, h: number): [number, number, number, number] {
  const min = tokenPx('--citta-sopra-teste-min'), max = tokenPx('--citta-sopra-teste-max');
  const sh = (h - min) / (PETTO + SOTTO_PETTO - TESTA);
  const s = Math.min(Math.max(sh, w / 320), w / (UTILE[1] - UTILE[0]));
  const margine = Math.min(max, Math.max(min, h - s * (PETTO + SOTTO_PETTO - TESTA)));
  const vw = w / s, vh = h / s, cx = (UTILE[0] + UTILE[1]) / 2;
  const y = Math.min(TESTA - margine / s, FONDO - vh), x = Math.min(320 - vw, Math.max(0, cx - vw / 2));
  return [x, y, vw, vh];
}

/** «cielo»: unità di cielo notturno sopra la finestra (PO-149, striscia della città). Il disegno si inquadra dal basso (y 96,
 *  spalle dei due), così quando la striscia cresce lo spazio in più va sopra le teste. «ravvicinata» (D-265, PO-158): al posto
 *  del cielo, i personaggi grandi e visibili fino al petto (inquadraStriscia); «cielo» resta solo per lo sfondo. */
export function VignettaHome(p: { genere: 'm' | 'f'; didascalia: string; fissa?: boolean; cielo?: number; ravvicinata?: boolean }) {
  const sx = club.get('cinderwick_united')?.colori?.primario, dx = club.get('larkspire_athletic')?.colori?.primario;
  const cielo = p.cielo ?? 0;
  return (
    <Vignetta nome="home" titolo={`${p.didascalia}: tu e il vice Malvasi, dalla finestra lo stadio di notte`} ritaglio={cielo ? 'xMidYMax slice' : 'xMidYMin slice'} fissa={p.fissa}
      vista={cielo && !p.ravvicinata ? [0, -cielo, 320, 96 + cielo] : undefined} inquadra={p.ravvicinata ? inquadraStriscia : undefined}>
      <rect x="0" y={-cielo} width="320" height={120 + cielo} className="v-notte" />
      {[[22, 14], [70, 26], [150, 10], [262, 18], [300, 30], ...(cielo ? [[40, -20], [118, -46], [196, -14], [236, -72], [288, -38], [12, -96], [168, -108], [304, -112]] : [])]
        .filter(([, y]) => (y ?? 0) > -cielo).map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.6" className="v-giallo" />)}
      <path d="M0 96 L30 80 L52 88 L80 70 L96 84 L130 74 V120 H0 Z" className="v-giacca-scura v-tratto" />
      {[[8, 84], [40, 82], [60, 74], [86, 80]].map(([x, y], i) => <rect key={i} x={x} y={y} width="5" height="5" className="v-luce" />)}
      <StadioLontano x={214} y={78} k={0.95} sx={sx} dx={dx} />
      <Fumo x={128} y={96} k={0.9} /><Fumo x={262} y={100} k={0.7} />
      <path d={`M0 ${-cielo} H320 V120 H0 Z`} className="v-cornice" />
      <rect x="0" y="118" width="320" height="62" className="v-ombra" />
      <rect x="0" y="116" width="320" height="6" className="v-nero" />
      <rect x="8" y="126" width="54" height="34" className="v-nero v-tratto" /><rect x="12" y="130" width="46" height="26" className="v-ciano" />
      <path d="M16 150 L26 142 L34 146 L44 136 L54 140" className="v-linea" />
      <Persona x={120} y={72} scala={1.15} giacca="v-ciano" capelli={p.genere === 'f' ? 'lunghi' : 'corti'} distintivo sopracciglia="giu" bocca="dritta" />
      <Persona x={240} y={78} s={0.95} scala={1.15} giro={-3} giacca="v-giacca-scura" capelli="berretto" baffi braccia="conserte" bocca="su" />
    </Vignetta>
  );
}
