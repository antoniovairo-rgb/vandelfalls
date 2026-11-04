// PO-145 (D-217): il build scrive dist/privacy/index.html (…/valmora/privacy/ su GitHub Pages, workflow «pagine») dai
// testi di data/testi/it/privacy.json, la stessa sorgente della schermata «Privacy» del gioco (src/dati/privacy.ts).
// Rosso C145W01 (globalThis.__NO_C145W01 o VALMORA_ROSSI=C145W01): la pagina non si scrive, come prima.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { paginaPrivacy, testoPrivacy } from '../src/dati/privacy.ts';

export const FILE_PAGINA = 'privacy/index.html';
const rosso = (x) => Boolean(globalThis[`__NO_${x}`]) || (process.env.VALMORA_ROSSI ?? '').split(',').includes(x);

/** HTML della pagina dai file su disco (dati e token della resa). */
export function htmlPrivacy(dirDati = 'data') {
  const testi = JSON.parse(readFileSync(join(dirDati, 'testi/it/privacy.json'), 'utf8'));
  const stile = ['src/resa/token.css', 'src/resa/privacy-pagina.css'].map((f) => readFileSync(f, 'utf8')).join('\n');
  const icona = `data:image/png;base64,${readFileSync('public/icone/favicon-32.png').toString('base64')}`; // C54-03 (D-268)
  return paginaPrivacy(testoPrivacy(testi), stile, icona);
}

/** Plugin di Vite: aggiunge la pagina ai file della build (prima di «precache», che la mette nella cache offline). */
export function pianoPrivacy(dirDati = process.env.VALMORA_DATI ?? 'data') {
  return {
    name: 'valmora-privacy',
    apply: 'build',
    generateBundle() {
      if (rosso('C145W01')) return;
      this.emitFile({ type: 'asset', fileName: FILE_PAGINA, source: htmlPrivacy(dirDati) });
    },
  };
}
