// Passi della catena «logica» (e «build» per la completa). Ognuno restituisce l'elenco dei problemi.
import { controllaCrescita, quoteCasuale, quoteDistratto } from './crescita.mjs';
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { controllaConfini, controllaSalvataggiReali, RIGHE_MAX } from './controlli-logica.mjs';
import { leggiSchemi, leggiDati } from './dati-disco.mjs';
// Moduli TypeScript del gioco: Node li esegue togliendo i tipi (Node ≥ 22.18; la CI usa 24).
import { validaDati } from '../src/dati/valida.ts';
import { migra, SAVE_VERSION } from '../src/salvataggi/salvataggio.ts';
import { giraBot, sceltePesano, chiamateViste, esisteStelle, controllaFiduciaMinima } from './bot.mjs';
import { controllaFisse, posizioneConta } from './fisse.mjs';
import { controllaConsolidamento } from './consolidamento.mjs';
import { controllaRitmo } from '../src/dati/ritmo.ts';

// Bot: 0 blocchi su tutti i semi, e ogni esito di ogni missione raggiunto da almeno una strategia.
export function controllaBot(rapporto, dati) {
  const p = rapporto.flatMap((r) => r.blocchi.slice(0, 3).map((b) => `${r.missione} · ${r.strategia}: ${b}`));
  for (const [k, m] of Object.entries(dati).filter(([k]) => k.startsWith('missioni/'))) {
    for (const e of m.esiti) if (!rapporto.some((r) => r.missione === m.id && r.esiti[e.id])) p.push(`${k}: esito «${e.id}» mai raggiunto dai bot`);
    for (const n of [1, 2, 3]) if (!rapporto.some((r) => r.missione === m.id && r.stelle?.[n]) && !(n === 3 && esisteStelle(dati, m.id, 3))) p.push(`${k}: ${n} stelle mai raggiunte dai bot`);
  }
  return p;
}

// D-108: nella stagione la quota di fallimento del giocatore casuale non scende da un episodio al successivo
// (tolleranza di rumore: 1 punto percentuale). D-154: vale per tutte le stagioni (il passo «bot» le controlla tutte e 3).
export function controllaDifficolta(rapporto, dati, stagione = 1, tolleranza = 1) {
  const quota = (id) => { const r = rapporto.find((x) => x.missione === id && x.strategia === 'casuale'); return r ? (100 * (r.stelle?.[0] ?? 0)) / r.semi : null; };
  const ep = Object.values(dati).filter((m) => m?.ondate && m.stagione === stagione).sort((a, b) => a.episodio - b.episodio)
    .map((m) => [m.id, quota(m.id)]).filter(([, q]) => q !== null);
  return ep.slice(1).flatMap(([id, q], i) => (q < ep[i][1] - tolleranza
    ? [`stagione ${stagione}: il casuale fallisce in ${id} il ${q.toFixed(1)}%, meno di ${ep[i][0]} (${ep[i][1].toFixed(1)}%) oltre la tolleranza di ${tolleranza} punto (D-108)`] : []));
}

// Ogni chiamata compare in almeno una campagna (episodi in fila, variabili portate avanti): nessuna chiamata morta.
export const controllaCampagna = (r) => r.flatMap((x) => x.mai.map((c) => `${x.missione}: la chiamata «${c}» non compare mai in campagna`));

// Le scelte contano (D-048): a parità di schieramento (attento), risposte diverse portano ad almeno 2 esiti.
export function controllaScelte(rapporto, dati) {
  return rapporto.filter((r) => (dati[`missioni/${r.missione}.json`]?.ondate ?? []).some((o) => o.chiamate?.length) && Object.keys(r.esiti).length < 2)
    .map((r) => `${r.missione}: con lo stesso schieramento le scelte portano sempre a ${JSON.stringify(r.esiti)}`);
}

const esegui = (cmd) => {
  try { execSync(cmd, { encoding: 'utf8', stdio: 'pipe' }); return []; } catch (e) {
    return `${e.stdout ?? ''}${e.stderr ?? ''}`.split('\n').filter((r) => r.trim()).slice(-25);
  }
};
const tracciatiENuovi = () => execSync('git ls-files --cached --others --exclude-standard', { encoding: 'utf8' })
  .split('\n').filter((p) => p && existsSync(p));
const SALVATAGGI = 'tests/salvataggi-reali';
const leggiSalvataggi = () => Object.fromEntries(readdirSync(SALVATAGGI).filter((n) => n.endsWith('.json'))
  .map((n) => [n, JSON.parse(readFileSync(`${SALVATAGGI}/${n}`, 'utf8'))]));

const missioni = (d) => Object.entries(d).filter(([k]) => k.startsWith('missioni/')).map(([, m]) => m);
export const PASSI_LOGICA = {
  tipi: () => esegui('npx tsc --noEmit -p .'),
  confini: () => controllaConfini(Object.fromEntries(tracciatiENuovi().map((p) => [p, readFileSync(p, 'utf8')]))),
  schema: () => validaDati(leggiSchemi(), leggiDati()),
  test: () => esegui('npx vitest run'),
  bot: () => { const d = leggiDati(); const r = giraBot(d, 1000); return [...controllaBot(r, d), ...[1, 2, 3].flatMap((st) => controllaDifficolta(r, d, st)), ...controllaCrescita(quoteCasuale(r, d), 'casuale'), ...controllaCrescita(quoteDistratto(d), 'distratto'), ...controllaScelte(sceltePesano(d), d), ...controllaCampagna(chiamateViste(d)), ...controllaFisse(posizioneConta(d)), ...controllaFiduciaMinima(d)]; },
  // PO-068/D-092: testi consolidati (lunghezze, niente bozze, variabili di storia impostate e poi lette) e ritmo della campagna
  storia: () => { const d = leggiDati(); return [...controllaConsolidamento(d), ...controllaRitmo(missioni(d))]; },
  'salvataggi-reali': () => controllaSalvataggiReali(SAVE_VERSION, leggiSalvataggi(), migra),
  'bracci-rossi-logica': () => {
    const ciechi = [];
    const lunga = 'x\n'.repeat(RIGHE_MAX + 1);
    if (!controllaConfini({ 'src/a.ts': lunga }).length) ciechi.push('confini/righe è cieco');
    if (!controllaConfini({ 'src/logica/a.ts': 'const x = Math.random();' }).length) ciechi.push('confini/Math.random è cieco');
    if (!controllaConfini({ 'src/logica/a.ts': "import { x } from '../resa/b.ts';" }).length) ciechi.push('confini/import resa è cieco');
    if (!validaDati(leggiSchemi(), { 'stato.json': { variabili: [] }, 'missioni/m.json': {} }).length) ciechi.push('schema è cieco');
    const mc = structuredClone(leggiDati()['missioni/e01.json']); delete mc.ondate[0].chiamate[0].opzioni[0].costo;
    if (!validaDati(leggiSchemi(), { ...leggiDati(), 'missioni/e01.json': mc }).some((x) => x.includes('D-078'))) ciechi.push('schema/accenno di costo è cieco');
    if (!controllaSalvataggiReali(2, {}, migra).length) ciechi.push('salvataggi-reali/copertura è cieco');
    if (!controllaSalvataggiReali(1, { 'v1-rotto.json': { save_version: 1 } }, migra).length) ciechi.push('salvataggi-reali/migrazione è cieco');
    const d = leggiDati(); const m = structuredClone(d['missioni/e01.json']);
    const mb = structuredClone(m); mb.bozza = true;
    if (!controllaConsolidamento({ ...d, 'missioni/e01.json': mb }).length) ciechi.push('storia/bozza è cieco');
    const sv = structuredClone(d['stato.json']); sv.variabili.push({ id: 'mai_letta', tipo: 'bool', iniziale: false, descrizione: 'prova' });
    if (!controllaConsolidamento({ ...d, 'stato.json': sv }).length) ciechi.push('storia/variabili è cieco');
    if (!controllaRitmo([1, 2, 3, 4].map((episodio) => ({ ...d['missioni/e01.json'], episodio }))).length) ciechi.push('storia/ritmo è cieco');
    m.esiti.at(-1).se = { var: 'tensione_max', al_massimo: -1 };
    if (!controllaBot(giraBot({ ...d, 'missioni/e01.json': m }, 20), d).length) ciechi.push('bot/soft-lock è cieco');
    const m2 = structuredClone(d['missioni/e01.json']); m2.esiti.push({ ...m2.esiti[0], id: 'irraggiungibile' });
    if (!controllaBot(giraBot({ ...d, 'missioni/e01.json': m2 }, 20), { ...d, 'missioni/e01.json': m2 }).length) ciechi.push('bot/esito irraggiungibile è cieco');
    // D-106: le partenze per versione (variabili di storia degli esiti) non devono far passare un esito impossibile
    const m7 = structuredClone(d['missioni/e36.json']);
    m7.esiti.splice(-1, 0, { ...m7.esiti[0], id: 'impossibile', se: { tutte: [{ var: 'fascicolo', uguale: 'procura' }, { var: 'fascicolo', uguale: 'stampa' }] } });
    const d7 = { ...d, 'missioni/e36.json': m7 };
    if (!controllaBot(giraBot(d7, 20), d7).some((x) => x.includes('«impossibile»'))) ciechi.push('bot/esito per versione è cieco');
    const m4 = structuredClone(d['missioni/e01.json']); m4.stelle.tre = { var: 'tensione_max', al_massimo: -1 };
    const d4 = { ...d, 'missioni/e01.json': m4 };
    if (!controllaBot(giraBot(d4, 30), d4).some((x) => x.includes('3 stelle'))) ciechi.push('bot/stelle è cieco');
    const m5 = structuredClone(d['missioni/e02.json']); m5.ondate[0].chiamate[0].se = { var: 'credito', almeno: 99 };
    if (!controllaCampagna(chiamateViste({ ...d, 'missioni/e02.json': m5 }, 20)).length) ciechi.push('bot/campagna è cieco');
    const m6 = structuredClone(d['missioni/e03.json']); for (const o of m6.ondate) for (const e of o.eventi) if (e.settore !== 'curva_ospiti' && e.settore !== 'curva_larkspire') e.pressione = 0;
    if (!controllaFisse(posizioneConta({ ...d, 'missioni/e03.json': m6 })).length) ciechi.push('bot/transenne fisse è cieco');
    // D-113: col premio di fine ondata (PO-094) entrando a fiducia 0 le 3★ tornano possibili: il rosso spegne anche quello
    globalThis.__NO_C23F01 = true; globalThis.__NO_PO094 = true;
    try { if (!controllaFiduciaMinima(d).length) ciechi.push('bot/fiducia minima è cieco'); } finally { delete globalThis.__NO_C23F01; delete globalThis.__NO_PO094; }
    const m8 = structuredClone(d['missioni/e02.json']); m8.ondate[1].eventi[1].pressione = 4; m8.ondate[2].eventi[0].pressione = 5; // e02 prima di D-108
    const d8 = { 'stato.json': d['stato.json'], 'missioni/e01.json': d['missioni/e01.json'], 'missioni/e02.json': m8, 'missioni/e03.json': d['missioni/e03.json'] };
    if (!controllaDifficolta(giraBot(d8, 1000), d8).length) ciechi.push('bot/difficoltà della stagione 1 è cieco');
    // D-154: e21 resa più facile (faida in ondata 2 abbassata) scende sotto e20 di più di un punto nella stagione 2.
    // D-247-T: coi morsi vari di e20/e21 la faida a −1 dava e21 71,3% contro e20 72,3% (dentro la tolleranza: braccio cieco,
    // CI 1576d81); a −2 e21 65,1% contro 72,3% (sulla principale 9f32eea8: 61,8% contro 69,0%). La soglia non cambia.
    const m9 = structuredClone(d['missioni/e21.json']); for (const e of m9.ondate[1].eventi) if (e.id.startsWith('faida_')) e.pressione -= 2;
    const d9 = { 'stato.json': d['stato.json'], 'missioni/e20.json': d['missioni/e20.json'], 'missioni/e21.json': m9 };
    if (!controllaDifficolta(giraBot(d9, 1000), d9, 2).length) ciechi.push('bot/difficoltà delle stagioni 2-3 è cieco');
    // D-162: stagione 3 resa più facile della 2 (quote vere, stagione 3 ridotta di 10 punti) → segnalata
    const q9 = Object.fromEntries(Object.entries(quoteCasuale(giraBot(d, 200), d)).map(([k, [s, q]]) => [k, [s, s === 3 ? q - 10 : q]]));
    if (!controllaCrescita(q9, 'casuale').length) ciechi.push('bot/crescita fra stagioni è cieco');
    const m3 = structuredClone(d['missioni/e01.json']);
    for (const o of m3.ondate) for (const c of o.chiamate ?? []) for (const x of c.opzioni) x.effetti = [];
    const d3 = { ...d, 'missioni/e01.json': m3 };
    if (!controllaScelte(sceltePesano(d3, 50), d3).length) ciechi.push('bot/le scelte contano è cieco');
    return ciechi;
  },
  build: () => esegui('npx vite build'),
};
