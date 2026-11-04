// PO-145 (D-217): privacy policy nel gioco e su GitHub Pages, da una sola sorgente (data/testi/it/privacy.json).
// Guardiani, ognuno col suo braccio rosso:
// - la voce «Privacy» è nella home (menu «Altro»). Rosso C145H01: la voce manca;
// - il testo della schermata e quello della pagina web sono identici. Rosso C145T01: la pagina perde l'ultimo paragrafo;
// - il build scrive privacy/index.html (plugin di vite.config.ts). Rosso C145W01: non la scrive;
// - nel rilascio il segnaposto del contatto boccia (tools/aab.mjs, job «aab» su main);
// - C54-03 (D-268): la pagina web ha la sua icona dentro di sé (data:), quindi il browser non chiede /favicon.ico (prima: 404).
//   Rosso C268P01: niente icona. L'icona data: è l'unico <link> ammesso: non carica niente da fuori.
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { Titolo } from '../src/resa/schermate/Titolo.tsx';
import { Privacy } from '../src/resa/schermate/Privacy.tsx';
import { SEGNAPOSTO_CONTATTO } from '../src/dati/privacy.ts';
import { FILE_PAGINA, htmlPrivacy, pianoPrivacy } from '../tools/privacy-pagina.mjs';
import { controllaPrivacy } from '../tools/aab.mjs';

const g = globalThis as Record<string, unknown>;
afterEach(() => { for (const x of ['C145H01', 'C145T01', 'C145W01', 'C268P01']) delete g[`__NO_${x}`]; });
const niente = () => {};
const ICONA = /<link rel="icon" type="image\/png" href="data:image\/png;base64,[A-Za-z0-9+/=]+">/; // C54-03: l'icona dentro la pagina
const home = () => renderToStaticMarkup(createElement(Titolo, { puoRiprendere: false, nuova: niente, riprendi: niente, crediti: niente, privacy: niente, sal: null, importata: niente }));
const decodifica = (s: string) => s.replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll('&#x27;', "'").replaceAll('&#39;', "'").replaceAll('&amp;', '&');
/** Paragrafi dentro [data-privacy-testo], come testo. */
const paragrafi = (html: string) => {
  const dentro = html.slice(html.indexOf('data-privacy-testo'));
  return [...dentro.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((m) => decodifica((m[1] ?? '').replace(/<[^>]+>/g, '')).trim()).filter((x) => x);
};
const gioco = () => paragrafi(renderToStaticMarkup(createElement(Privacy, { indietro: niente })));
const web = () => paragrafi(htmlPrivacy());

describe('privacy (PO-145, D-217)', () => {
  it('la voce «Privacy» è nella home; rosso C145H01: manca', () => {
    expect(home()).toContain('data-azione="privacy"');
    g.__NO_C145H01 = true;
    expect(home()).not.toContain('data-azione="privacy"');
  });

  it('schermata del gioco e pagina web hanno lo stesso testo; rosso C145T01: diverso', () => {
    const [a, b] = [gioco(), web()];
    expect(a.length).toBeGreaterThan(3);
    expect(b).toEqual(a);
    g.__NO_C145T01 = true;
    expect(web()).not.toEqual(gioco());
  });

  it('il build scrive privacy/index.html ed è nei plugin di vite.config.ts; rosso C145W01: non la scrive', () => {
    const emessi: { fileName: string; source: string }[] = [];
    const ctx = { emitFile: (f: { fileName: string; source: string }) => { emessi.push(f); return ''; } };
    pianoPrivacy().generateBundle.call(ctx as never);
    expect(emessi.map((f) => f.fileName)).toEqual([FILE_PAGINA]);
    expect(emessi[0]?.source).toContain('<div data-privacy-testo>');
    expect(readFileSync('vite.config.ts', 'utf8')).toMatch(/plugins: \[[^\]]*pianoPrivacy\(\)/);
    g.__NO_C145W01 = true; emessi.length = 0;
    pianoPrivacy().generateBundle.call(ctx as never);
    expect(emessi).toEqual([]);
  });

  it('la pagina web non carica niente da fuori (nessuno script, link o immagine)', () => {
    expect(htmlPrivacy().replace(ICONA, '')).not.toMatch(/<(script|link|img|iframe)\b|https?:\/\//);
  });

  it('nel rilascio il segnaposto del contatto boccia; con un contatto vero passa', () => {
    const testi = JSON.parse(readFileSync('data/testi/it/privacy.json', 'utf8')) as Record<string, string>;
    const conSegnaposto = Object.values(testi).some((v) => v.includes(SEGNAPOSTO_CONTATTO));
    expect(controllaPrivacy(testi, true).length > 0).toBe(conSegnaposto);
    expect(controllaPrivacy(testi, false)).toEqual([]);
    const rimedio = Object.fromEntries(Object.entries(testi).map(([k, v]) => [k, v.replace(SEGNAPOSTO_CONTATTO, 'x@y.z')]));
    expect(controllaPrivacy(rimedio, true)).toEqual([]);
  });
  it('C54-03: la pagina web ha l\'icona dentro di sé, quella del gioco (rosso C268P01: no)', () => {
    const m = htmlPrivacy().match(ICONA);
    expect(m).not.toBeNull();
    expect(m![0]).toContain(readFileSync('public/icone/favicon-32.png').toString('base64'));
    g.__NO_C268P01 = true;
    expect(htmlPrivacy()).not.toMatch(ICONA);
  });
});
