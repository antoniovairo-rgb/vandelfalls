// Passi della catena «grafica». Ognuno restituisce l'elenco dei problemi.
import { execSync } from 'node:child_process';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { controllaToken, controllaGiro, controllaEmail } from './controlli-grafica.mjs';
import { controllaNome } from './nome-d244.mjs';
import { readdirSync } from 'node:fs';
import { giraFoto } from './foto.mjs';
import { giraEpilogo } from './foto-epilogo.mjs';
import { giraC41 } from './foto-c41.mjs';
import { giraOffline } from './offline.mjs';
import { controllaCittaSenzaWebgl } from './foto-c128.mjs';
import { BRACCI_PO152B, BRACCI_CHIAMATE, braccioCieco } from './bracci-po152b.mjs';

// D-202: quanti giri di browser insieme (bracci rossi, foto); le attese dominano sul calcolo
const PARTE_ROSSO = { C201C01: ['citta36'], C203R01: ['rapporti'], C206I01: ['chiamate'], C215L01: ['chiamate'], C210C01: ['citta36'], C210G01: ['citta36'], C218R01: ['riepilogo'], C218S01: ['citta36'], C219H01: ['riepilogo'], C221R01: ['riepilogo'], C230C01: ['citta36'], C234V01: ['verbali'], C237S01: ['po149'], C237P01: ['po149'], C241A01: ['po152a'], C241M01: ['po152a'], C242M01: ['po149'], C241N01: ['c52nomi'], C241B01: ['po152b'], C241M02: ['po152b'], C253C01: ['chiusure'] , C255S01: ['po152a'], C255R01: ['po152b'] , C258S01: ['po152b'], C259A01: ['po152b'], C261H01: ['po152b'], C261E01: ['po152b'] , C262R01: ['po152b'] , C262E01: ['po152b'] , C262M01: ['po152b'], C262D01: ['po152b'] , C268M01: ['po152b'], C268F01: ['po152b'], C269M01: ['po152b'], C269P01: ['po152b'], C269I01: ['po152b'], C269A01: ['po152b'], C269C01: ['po152b'], C265S01: ['po158'], C265B01: ['po158'], C265C01: ['po158'], C265N01: ['po158'], C271T01: ['po152b'], C271V01: ['po152b'], C271U01: ['po152b'], C272V01: ['po152b'], C272D01: ['po152b'], C272A01: ['po152b'], C272D02: ['po152b'], C272D03: ['po152b'], C272W01: ['po152b'], C94N01: ['po152b'] };
export const PARALLELI = Number(process.env.VALMORA_PARALLELI ?? 5);
export async function insieme(compiti, n) { const coda = [...compiti]; await Promise.all(Array.from({ length: Math.min(n, coda.length) }, async () => { while (coda.length) await coda.shift()(); })); }
const larghezzeGiro = () => (process.env.VALMORA_LARGHEZZE ?? '360,375,412').split(',').map(Number);
const fileResa = () => execSync('git ls-files --cached --others --exclude-standard src/resa', { encoding: 'utf8' })
  .split('\n').filter((p) => p && existsSync(p));

export const PASSI_GRAFICA = {
  token: () => controllaToken(Object.fromEntries(fileResa().map((p) => [p, readFileSync(p, 'utf8')]))),
  email: () => {
    const f = Object.fromEntries(['dist/index.html', ...readdirSync('dist/assets').filter((x) => /\.(js|css|html)$/.test(x)).map((x) => `dist/assets/${x}`)].map((p) => [p, readFileSync(p, 'utf8')]));
    // D-244: nel bundle costruito il nome vecchio non compare (anche manifest, service worker e pagina della privacy)
    const altri = Object.fromEntries(['dist/manifest.webmanifest', 'dist/sw.js', 'dist/privacy/index.html'].filter((p) => existsSync(p)).map((p) => [p, readFileSync(p, 'utf8')]));
    return [...controllaEmail(f), ...controllaNome({ ...f, ...altri })];
  },
  // C128-01: le città con un nome si rigiocano senza WebGL; gli stati restano in out/foto per il braccio rosso
  foto: async () => {
    // D-161, D-164, D-165: epilogo, «Fine stagione» e fischio (tools/foto-epilogo.mjs); C41: verbale fallito. D-202: insieme al giro
    const [giri, epilogo, c41] = await Promise.all([giraFoto('out/foto'), giraEpilogo('out/foto'), giraC41('out/foto')]), stati = giri.flatMap((g) => g.citta);
    writeFileSync('out/foto/citta-stati.json', JSON.stringify(stati));
    return [...giri.flatMap(controllaGiro), ...(await controllaCittaSenzaWebgl(stati)), ...epilogo.flatMap(controllaGiro), ...c41.flatMap(controllaGiro)];
  },
  // D-202: schieramenti (tools/foto-schieramenti.mjs), prima dentro il giro foto: passo a sé, così in CI può girare su un altro job
  schieramenti: async () => {
    const { servi } = await import('./foto.mjs'), { controllaSchieramenti } = await import('./foto-schieramenti.mjs'), { chromium } = await import('playwright-core');
    const srv = await servi('dist'), url = `http://127.0.0.1:${srv.address().port}/`, rossi = (process.env.VALMORA_ROSSI ?? '').split(',').filter(Boolean);
    const browser = await chromium.launch({ executablePath: process.env.VALMORA_CHROME ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined) });
    const giri = larghezzeGiro().map((larghezza) => ({ larghezza, errori: [], scorrimento: [], attesi: [] }));
    try { await Promise.all(giri.map((g) => controllaSchieramenti(browser, url, 'data', 'out/foto', (cosa, ok) => g.attesi.push({ cosa, ok }), rossi, g.larghezza))); }
    finally { await browser.close(); srv.close(); }
    return giri.flatMap(controllaGiro);
  },
  // D-187 (PO-052, PO-058): scorrimento di ogni schermata di e01 alle altezze dei telefoni della larghezza del giro
  altezze: async () => { const a = await import('./sonda-altezze.mjs'); return a.controllaAltezze(await a.giraAltezze({ vps: larghezzeGiro().flatMap((w) => a.VP_PER_LARGHEZZA[w] ?? []) })); },
  // D-257: caratteri inclusi, anche su una macchina senza Inter; resa senza hinting (tools/caratteri.mjs)
  caratteri: async () => (await import('./caratteri.mjs')).giraCaratteri('dist'),
  // S-22 (C14-01): il gioco installato funziona offline (service worker), su http://localhost
  offline: () => giraOffline('dist'),
  'bracci-rossi-grafica': async () => {
    const ciechi = [], compiti = [];
    // offline: ogni rosso del service worker e del contenitore d'errore va visto (S-22)
    for (const r of ['C14O01', 'C14O02', 'C14O03', 'C28W01']) compiti.push(async () => { if (!(await giraOffline('dist', [r])).length) ciechi.push(`offline/${r} è cieco`); });
    // D-161, D-164, D-165: senza epilogo, senza «Fine stagione» o senza fischio o senza tavole il giro deve diventare rosso (una larghezza basta)
    for (const r of ['C161E01', 'C164F01', 'C165F01', 'C165T01', 'C196V01']) // C196V01: C43-06, passo «Fine stagione» che scorre
      compiti.push(async () => { if (!(await giraEpilogo(`out/foto-rossi/${r}`, 'dist', [360], [r])).flatMap(controllaGiro).length) ciechi.push(`epilogo/${r} è cieco`); });
    // C41-06, C41-08 (collaudo C-041), D-185: senza la vignetta minima del verbale fallito, con le spaziature di prima,
    // con le spaziature di prima e la vignetta forzata al minimo (pagina che scorre) o col fumetto stretto il giro è rosso
    for (const r of ['C41V06,C234V01', 'C185V01,C234V01', 'C185V01,C66V01,C234V01', 'C41G08']) // D-234: col verbale fallito più stretto i primi tre solo con C234V01
      compiti.push(async () => { if (!(await giraC41(`out/foto-rossi/${r.replace(',', '-')}`, 'dist', [360], r.split(','))).flatMap(controllaGiro).length) ciechi.push(`c41/${r} è cieco`); });
    // C128-01: col rosso C128N01 (nessun ricalcolo a ingresso finito) il nome della città deve uscire dal bordo; D-265: coi luoghi
    // di PO-158 nessun nome degli stati del giro arriva al bordo, il braccio gira coi luoghi di prima (C265B01, da solo verde).
    const stati = existsSync('out/foto/citta-stati.json') ? JSON.parse(readFileSync('out/foto/citta-stati.json', 'utf8')) : [];
    // i nomi sulla mappa della città ci sono solo a 412 (D-123): un giro a 360 o 375 da solo (CI per larghezza) non ne ha
    const con412 = !process.env.VALMORA_LARGHEZZE || process.env.VALMORA_LARGHEZZE.split(',').includes('412');
    if (!stati.length) { if (con412) ciechi.push('foto/città senza WebGL: nessuno stato con un nome dal giro foto'); }
    else compiti.push(async () => { if (!(await controllaCittaSenzaWebgl(stati, 'dist', ['C128N01', 'C265B01'])).some((x) => x.includes('tocca il bordo'))) ciechi.push('foto/città senza WebGL (C128N01) è cieco'); });
    compiti.push(async () => { if (!(await (await import('./foto-home.mjs')).homeRossaVista('dist'))) ciechi.push('foto/home (C140H01 PO-140, C187C01+C230C01 C43-07 o C224A01 D-224) è cieco'); });
    // D-187: con la mappa che non si abbassa o la versione sopra la scena che esce il guardiano diventa rosso (360×760)
    if (larghezzeGiro().includes(360)) { const a = await import('./sonda-altezze.mjs');
      // D-191: rapporto senza mappa (R01), minimo a 160 px (L01), scheda compatta della città (C01), nomi lontani da «Home» (H01);
      // D-193: risposta in un blocco (R01), spaziature di sala e briefing (S01); D-241: costo prima della scelta (A01), mappa spenta (M01).
      // D-241: senza il costo sotto le opzioni gli imprevisti si accorciano (mediana 277 → 93 px a 360×760, misura del 28/10) e C215L01 da solo è cieco:
      // gira con C241A01, che rimette le opzioni di prima (come C218R01 con C221R01). D-242: la mappa della città che salta (M01); D-243: con la scheda
      // compatta i 12 px in più di C201C01+C230C01 ci stanno: gira con C242M01 (la scheda di prima; da solo 0, insieme 12 px); C52-03: il nome dell'episodio fuori dalla mappa a 412 (C241N01); idea B: mosse illimitate (B01), mappa che non si tocca fra le chiamate (M02); C55-01: scheda del settore sempre in basso (C255S01); D-255: riquadro radio della mossa a fascia fissa (C255R01); D-258: costo mai sotto la mappa (C258S01); D-259: mappa piena nella risposta (C259A01); D-261: «Home» sulla mappa (C261H01), niente bordo sui bersagli della mossa (C261E01); C56-02: la mossa persa dopo una ricarica (C262R01); D-262: niente previsione dopo la mossa (C262E01); C56-03: classe «in-mano» (C262M01), dischi sovrapposti nella mappa abbassata (C262D01); D-268: «una squadra» e badge senza numero (C268M01), fuoco su «i» dopo la mossa (C268F01); C57-01: la mappa della risposta scende a gradini (C269M01); C57-02: previsione al solo lettore di schermo (C269P01); D-269: istruzione della mossa al solo lettore (C269I01), copia sotto «Avanti» (C269A01), riquadro che si ricolloca senza input (C269C01). D-265: le stelle sui dischi altrui (C218S01) solo coi luoghi di prima (C265B01, da solo verde); cielo (C265S01), luoghi e parco (C265B01), bolle bloccate (C265C01), nomi delle squadre (C265N01). D-271: tratteggio di prima (C271T01), versione sempre visibile (C271V01), unità fuori dalla mappa (C271U01).
      for (const [r, vp] of [['C187M01', '360x760'], ['C187V01', '360x760'], ['C191R01', '360x760'], ['C191L01', '360x640'], ['C191C01', '360x640'], ['C191H01', '360x640'], ['C193R01', '360x640'], ['C193S01', '360x640'], ['C197R01', '360x640'], ['C201R01', '412x760'], ['C201C01,C230C01,C242M01', '360x760'], ['C203R01', '360x760'], ['C206I01', '360x760'], ['C215L01,C241A01', '360x760'], ['C210C01', '360x760'], ['C210G01', '360x760'], ['C218R01,C221R01', '360x760'], ['C218S01,C265B01', '360x760'], ['C219H01,C221R01', '360x760'], ['C221R01', '360x640'], ['C230C01', '360x640'], ['C234V01', '360x640'], ['C237S01', '360x760'], ['C237P01', '360x760'], ['C241A01', '360x760'], ['C241M01', '360x760'], ['C242M01', '360x760'], ['C241N01', '412x760'], ['C241B01', '360x760'], ['C241M02', '360x760'], ['C253C01', '360x640'], ['C255S01', '360x760'], ['C255R01', '360x760'], ['C258S01', '360x760'], ['C259A01', '360x760'], ['C261H01,C272S01', '360x760'], ['C261E01', '360x760'], ['C262R01', '360x760'], ['C262E01', '360x760'], ['C262M01,C271U01', '360x760'], ['C262D01', '360x760'], ['C268M01', '360x760'], ['C268F01', '360x760'], ['C269M01', '360x760'], ['C269P01', '360x760'], ['C269I01', '360x760'], ['C269A01,C272S01', '360x760'], ['C269C01,C271U01,C272N01', '360x760'], ['C265S01', '360x760'], ['C265B01', '360x760'], ['C265C01', '360x760'], ['C265N01', '360x760'], ['C271T01', '360x760'], ['C271V01', '360x760'], ['C271U01', '360x760'], ['C272V01', '360x760'], ['C272V01,C272W01', '360x760'], ['C272D01', '360x760'], ['C272A01', '360x760'], ['C272D02', '360x760'], ['C272D03', '360x760'], ['C272W01', '412x760'], ['C94N01', '360x760'], ['C272W01,C272V01', '360x760']])
        compiti[r === 'C272V01,C272W01' || r === 'C272W01,C272V01' ? 'unshift' : 'push'](async () => { const b = BRACCI_PO152B[r], bc = BRACCI_CHIAMATE[r]; // D-270: i bracci po152b solo dove il rosso si vede, col conteggio dichiarato; D-272: il braccio dei salti su più episodi parte per primo, non allunga la coda
          const male = a.controllaAltezze(await a.giraAltezze({ vps: [vp], rossi: r.split(','), parti: PARTE_ROSSO[r.split(',')[0]] ?? ['e01'], chiusureMax: 4 /* C253C01: 4 episodi bastano al braccio */, po152b: b ? { giri: b.giri, episodi: b.episodi } : {}, chiamateDi: bc?.chiamateDi }));
          const cieco = b || bc ? braccioCieco(r, male) : male.length ? '' : `altezze/${r} è cieco`; if (cieco) ciechi.push(cieco); }); }
    // D-257: senza i file di Inter (C254F01) il guardiano dei caratteri è rosso
    compiti.push(async () => { if (!(await (await import('./caratteri.mjs')).giraCaratteri('dist', ['C254F01'])).length) ciechi.push('caratteri/C254F01 è cieco'); });
    // e con l'hinting acceso (C257H01, com'era la CI) la larghezza del campione cambia
    compiti.push(async () => { if (!(await (await import('./caratteri.mjs')).giraCaratteri('dist', ['C257H01'])).some((e) => e.includes('larghezza campione'))) ciechi.push('caratteri/C257H01 è cieco'); });
    // C53-02: con la risposta in due messaggi (C193R01) la parte «risposte» (carte d'imprevisto e varianti) vede lo scorrimento
    if (larghezzeGiro().includes(360)) compiti.push(async () => { const a = await import('./sonda-altezze.mjs');
      if (!a.controllaAltezze(await a.giraAltezze({ vps: ['360x640'], rossi: ['C193R01'], parti: ['risposte'], limiteRisposte: 24 })).some((x) => x.includes('C53-02'))) ciechi.push('altezze/risposte C193R01 è cieco'); });
    // D-269 (CI 1249): con il testo intero di «mossa.puoi» nella copia sotto la mappa (C269B01) le risposte di e02 a 360×640 scorrono
    // oltre soglia (tornelli_falsi/settore_separato 75 px, soglia 68): le prime 120 risposte costruite comprendono e02
    if (larghezzeGiro().includes(360)) compiti.push(async () => { const a = await import('./sonda-altezze.mjs');
      if (!a.controllaAltezze(await a.giraAltezze({ vps: ['360x640'], rossi: ['C269B01'], parti: ['risposte'], limiteRisposte: 120 })).some((x) => x.includes('C53-02'))) ciechi.push('altezze/risposte C269B01 è cieco'); });
    // D-207: ogni braccio delle altezze gira solo la parte dove il suo rosso si vede
    // D-202: i bracci sono indipendenti (rossi come parametro, cartelle separate): PARALLELI insieme, ognuno col suo browser
    await insieme(compiti, PARALLELI);
    if (!controllaToken({ 'src/resa/x.css': '.a { color: #fff; }' }).length) ciechi.push('token/colore è cieco');
    if (!controllaToken({ 'src/resa/x.css': '.a { margin: 3px; }' }).length) ciechi.push('token/misura è cieco');
    if (!controllaToken({ 'src/resa/X.tsx': '<div style={{ color: "red" }} />' }).length) ciechi.push('token/stile in linea è cieco');
    if (!controllaEmail({ 'dist/x.js': 'const a="prova@esempio.it"' }).length) ciechi.push('email è cieco');
    if (!controllaNome({ 'dist/index.html': '<title>Valmora – Cortina di fumo</title>' }).length || !controllaNome({ 'dist/index.html': '<title>Varcalda – Cortina di fumo</title>' }).length) ciechi.push('nome/D-244, D-249 è cieco'); // rossi C244N01, C249N01
    if (!controllaGiro({ larghezza: 360, errori: ['x'], scorrimento: [], attesi: [] }).length) ciechi.push('foto/errori è cieco');
    if (!controllaGiro({ larghezza: 360, errori: [], scorrimento: [{ schermata: 'schieramento', contenuto: 400, finestra: 360 }], attesi: [] }).length) ciechi.push('foto/scorrimento è cieco');
    if (!controllaGiro({ larghezza: 360, errori: [], scorrimento: [], attesi: [{ cosa: 'x', ok: false }] }).length) ciechi.push('foto/attesi è cieco');
    return ciechi;
  },
};
