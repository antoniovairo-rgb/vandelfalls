// Privacy policy (PO-145, D-217): una sola sorgente, data/testi/it/privacy.json. La schermata del gioco
// (src/resa/schermate/Privacy.tsx) e la pagina web …/privacy/ (vite.config.ts, «privacy») leggono gli stessi paragrafi
// da qui. Puro: riceve i testi già letti.
import { spento } from '../interruttori.ts';

/** Il contatto dello sviluppatore lo dà il PO: finché c'è questo segnaposto il rilascio è bocciato (tools/aab.mjs). */
export const SEGNAPOSTO_CONTATTO = '[[CONTATTO DA CONFERMARE]]';

export interface TestoPrivacy { titolo: string; sottotitolo: string; paragrafi: string[] }

/** Paragrafi «privacy.pNN_…» in ordine di chiave. */
export function testoPrivacy(testi: Record<string, string>): TestoPrivacy {
  const paragrafi = Object.keys(testi).filter((k) => /^privacy\.p\d\d_/.test(k)).sort().map((k) => testi[k] ?? '');
  return { titolo: testi['privacy.titolo'] ?? '', sottotitolo: testi['privacy.sottotitolo'] ?? '', paragrafi };
}

const esc = (s: string) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

/** Pagina web autonoma (nessun file esterno, nessuno script). Rosso C145T01: l'ultimo paragrafo manca, come in una copia
 *  scritta a mano rimasta indietro. Colori dai token di src/resa/token.css (passati dal build). */
// C54-03 (D-268): senza icona il browser chiedeva /favicon.ico e riceveva 404. L'icona è dentro la pagina (data:, dal build:
// tools/privacy-pagina.mjs), così la pagina continua a non caricare niente da fuori. Rosso C268P01: nessuna icona.
export function paginaPrivacy(t: TestoPrivacy, stile: string, icona?: string): string {
  const paragrafi = spento('C145T01') ? t.paragrafi.slice(0, -1) : t.paragrafi;
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(t.titolo)} – Vandel Falls</title>
${icona && !spento('C268P01') ? `<link rel="icon" type="image/png" href="${icona}">\n` : ''}<style>${stile}</style>
</head>
<body>
<main>
<h1>${esc(t.titolo)}</h1>
<p class="sotto">${esc(t.sottotitolo)}</p>
<div data-privacy-testo>
${paragrafi.map((p) => `<p>${esc(p)}</p>`).join('\n')}
</div>
</main>
</body>
</html>
`;
}

/** Problemi per il rilascio: il segnaposto del contatto è ancora nei testi. */
export function controllaSegnaposto(testi: Record<string, string>): string[] {
  return Object.entries(testi).filter(([, v]) => v.includes(SEGNAPOSTO_CONTATTO))
    .map(([k]) => `privacy: «${k}» contiene ancora il segnaposto ${SEGNAPOSTO_CONTATTO}: serve il contatto dello sviluppatore dal PO (D-217)`);
}
