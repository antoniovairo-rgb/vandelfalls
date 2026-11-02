// Esecutore unico delle catene di prova.
// Uso: node tools/catena.mjs <nome>      (nomi: vedi CATENE)
// Ogni giro viene registrato in STABILITA.json. Un passo rosso si rilancia da solo
// fino a 2 volte: se poi passa è «instabile», se resta rosso la catena è rossa.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import {
  DOCUMENTI_OBBLIGATORI, controllaDocumenti, controllaBacklog, controllaSegreti, controllaModello, controllaVersione,
} from './controlli.mjs';
import { generaGoverno } from './governo-html.mjs';
import { controllaStore, storeCiechi } from './store/misure.mjs';

const leggi = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : null);
const git = (cmd) => execSync(`git ${cmd}`, { encoding: 'utf8' }).trim();
const tracciati = () => git('ls-files').split('\n').filter(Boolean);

// Passi: ognuno restituisce l'elenco dei problemi.
const PASSI = {
  documenti: () => controllaDocumenti(Object.fromEntries(Object.keys(DOCUMENTI_OBBLIGATORI).map((p) => [p, leggi(p)]))),
  backlog: () => controllaBacklog(leggi('docs/governo/BACKLOG.md') ?? ''),
  segreti: () => controllaSegreti(tracciati()),
  versione: () => controllaVersione(leggi('src/versione.ts')),
  store: () => controllaStore(), // PO-144 (S-23): immagini e testi della scheda Play Store
  modello: () => {
    const testi = {};
    for (const p of tracciati()) if (/\.(md|mjs|js|ts|tsx|json|html|css|txt)$/.test(p) && existsSync(p)) testi[p] = readFileSync(p, 'utf8');
    testi['git log'] = git('log --format=%B');
    return controllaModello(testi);
  },
  // Braccio rosso: ogni guardiano deve trovare il difetto in un campione difettoso.
  'bracci-rossi': () => {
    const ciechi = [];
    if (!controllaDocumenti({}).length) ciechi.push('documenti è cieco');
    if (!controllaBacklog('| PO-1 | ieri | x | boh | FATTO | L0 | – | – | chat |').length) ciechi.push('backlog è cieco');
    if (!controllaSegreti(['android/app/rilascio.jks']).length) ciechi.push('segreti è cieco');
    if (!controllaVersione("// 0.1.0 – x\nexport const GAME_VERSION = '0.2.0';").length) ciechi.push('versione è cieco');
    const firma = ['Co-Authored-By:', 'Claude'].join(' ');
    if (!controllaModello({ prova: firma }).length) ciechi.push('modello è cieco');
    ciechi.push(...storeCiechi());
    return ciechi;
  },
  'governo.html': () => { generaGoverno(); return []; },
};

const CATENE = {
  governo: ['documenti', 'backlog', 'segreti', 'versione', 'store', 'modello', 'bracci-rossi', 'governo.html'],
  logica: ['tipi', 'confini', 'schema', 'test', 'bot', 'storia', 'salvataggi-reali', 'bracci-rossi-logica'],
  grafica: ['token', 'build', 'email', 'foto', 'schieramenti', 'offline', 'caratteri', 'altezze', 'bracci-rossi-grafica'],
};
CATENE.completa = [...CATENE.governo, ...CATENE.logica, ...CATENE.grafica];

// D-257: ogni Chromium delle catene (lo eredita dall'ambiente) vede gli stessi caratteri di sistema e li disegna senza
// hinting: larghezze dei testi uguali in locale e in CI (con l'hinting di serie della CI si arrotondavano al pixel).
process.env.FONTCONFIG_FILE ??= new URL('./caratteri/fonts.conf', import.meta.url).pathname;
const nome = process.argv[2];
if (!CATENE[nome]) {
  console.error(`Catena sconosciuta «${nome}». Disponibili: ${Object.keys(CATENE).join(', ')}`);
  process.exit(2);
}
// I passi «logica» usano le dipendenze npm: si caricano solo se la catena li chiede,
// così «governo» resta eseguibile senza npm install (D-004).
if (CATENE[nome].some((p) => !(p in PASSI))) Object.assign(PASSI, (await import('./passi-logica.mjs')).PASSI_LOGICA);
if (CATENE[nome].some((p) => !(p in PASSI))) Object.assign(PASSI, (await import('./passi-grafica.mjs')).PASSI_GRAFICA);

// D-202: in CI la grafica a 360 si divide su più job (VALMORA_PASSI, sottoinsieme dei passi): il giro lo dice, così non passa per completo.
const scelti = process.env.VALMORA_PASSI ? process.env.VALMORA_PASSI.split(',') : null;
if (scelti && scelti.some((p) => !CATENE[nome].includes(p))) { console.error(`VALMORA_PASSI: passi non della catena «${nome}»: ${scelti.filter((p) => !CATENE[nome].includes(p)).join(', ')}`); process.exit(2); }
const commit = git('rev-parse --short HEAD');
// I file scritti dalla catena stessa non rendono «sporca» la build.
const PRODOTTI = ['STABILITA.json', 'docs/governo/governo.html'];
// Niente trim qui: la prima colonna di --porcelain può essere uno spazio.
const sporco = execSync('git status --porcelain', { encoding: 'utf8' }).split('\n').filter((r) => r && !PRODOTTI.includes(r.slice(3))).length > 0;
// PO-128: in CI la grafica gira una larghezza per job (VALMORA_LARGHEZZE): il giro lo dice, così non passa per completo.
const giro = { catena: nome, data: new Date().toISOString(), commit, modifiche_non_committate: sporco, ...(process.env.VALMORA_LARGHEZZE ? { larghezze: process.env.VALMORA_LARGHEZZE } : {}), ...(scelti ? { passi_scelti: scelti.join(',') } : {}), passi: [] };
let rosso = false;

for (const passo of CATENE[nome].filter((p) => !scelti || scelti.includes(p))) {
  let tentativi = 0;
  let problemi;
  // 2026-10-15: un passo «instabile» non lasciava traccia del tentativo fallito, quindi la causa non si poteva
  // cercare. Ora i problemi dei tentativi falliti restano nel giro (precedenti) e vengono stampati.
  const precedenti = [];
  // PO-128: secondi di ogni tentativo, per sapere dove va il tempo dei job (prima non si registrava).
  const secondi = [];
  do {
    tentativi++;
    const t0 = Date.now();
    try { problemi = await PASSI[passo](); } catch (e) { problemi = [`eccezione: ${e.message}`]; }
    secondi.push(Math.round((Date.now() - t0) / 100) / 10);
    if (problemi.length) precedenti.push(problemi.slice(0, 20));
  } while (problemi.length && tentativi < 3);
  const esito = problemi.length ? 'rosso' : tentativi > 1 ? 'instabile' : 'verde';
  giro.passi.push({ passo, esito, tentativi, secondi, problemi, ...(esito === 'instabile' ? { precedenti } : {}) });
  console.log(`${esito === 'verde' ? '✔' : esito === 'instabile' ? '≈' : '✘'} ${passo}${tentativi > 1 ? ` (${tentativi} tentativi)` : ''} [${secondi.join(' + ')} s]`);
  for (const p of problemi) console.log(`    ${p}`);
  if (esito === 'instabile') for (const [i, ps] of precedenti.entries()) for (const p of ps) console.log(`    [tentativo ${i + 1} fallito] ${p}`);
  if (esito === 'rosso') { rosso = true; break; }
}

giro.esito = rosso ? 'rosso' : giro.passi.some((p) => p.esito === 'instabile') ? 'instabile' : 'verde';
const registro = existsSync('STABILITA.json') ? JSON.parse(readFileSync('STABILITA.json', 'utf8')) : { giri: [] };
registro.giri.push(giro);
writeFileSync('STABILITA.json', JSON.stringify(registro, null, 2) + '\n');
// Rigenera la pagina anche dopo l'ultimo giro, così mostra l'esito appena registrato.
generaGoverno();

console.log(`\nCatena «${nome}» su ${commit}${sporco ? ' (con modifiche non committate)' : ''}: ${giro.esito.toUpperCase()}`);
process.exit(rosso ? 1 : 0);
