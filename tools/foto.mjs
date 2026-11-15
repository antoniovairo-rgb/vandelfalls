// Gioca e01-e03 nel browser a 360/375/412 px: foto di ogni scena, errori, scorrimento, trascinamento,
// ripresa dopo una ricarica, esito = quello del motore (giocatore di src/logica/bot.ts).
// Uso: node tools/foto.mjs [cartella-foto] [cartella-build] [cartella-dati]
//   predefinite: out/foto, dist, data. Con dati di prova serve una build con VALMORA_DATI=<cartella-dati>.
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { chromium } from 'playwright-core';
import { leggiDati } from './dati-disco.mjs';
import { apriTutte } from './foto-bozze.mjs';
import { copertiDallaBarra } from './foto-schieramenti.mjs';
import { controllaBilancio, controllaVerbaleAvanti, controllaVerbaleBasso, provaProssimo } from './foto-verbale.mjs';
import { avanzaFino, clubDai, confermaSchieramento, controllaArchivio, controllaGuida, controllaHome, controllaIndietro, controllaRende, controllaRidisegno, controllaRipartiTesto, controllaVignetta, controllaRipartenza, controllaTripla, controllaAltezza, controllaCifreTensione, controllaFiducia, controllaCurve, controllaFolla, controllaPicco, controllaSfida } from './foto-club.mjs'; import { controllaLampeggio, controllaDinamica, controllaVoloRisposta, controllaChiIcona } from './foto-chiamata.mjs'; import { controllaSalvataggiPersi, controllaNomiSala } from './foto-c15.mjs'; import { controllaContrasto, controllaRiquadri } from './foto-contrasto.mjs'; import { statoCitta } from './foto-c128.mjs'; import { controllaBozzaRicarica, controllaRiempi, controllaRispondi, controllaRigaAiuto, controllaVersione, controllaFiduciaRapporto, controllaSfidaBusti, controllaSegni, controllaIconeEffetti, controllaColoriCortei, statoSalvato, controllaVignettaEvento, controllaRitiroSingolo } from './foto-c17.mjs';
import { variabiliIniziali } from '../src/logica/condizioni.ts';
import { chiamateAperte, chiudiOndata, concludiMissione, iniziaMissione, missioneFinita, opzioniValide, rispondi, schiera } from '../src/logica/missione.ts';
import { attenta, equilibrata, peggiore } from '../src/logica/bot.ts';
import { valutaEpisodio } from '../src/logica/episodi.ts';
import { creaCaso } from '../src/logica/caso.ts';
import { GAME_VERSION } from '../src/versione.ts';

export const LARGHEZZE = [360, 375, 412]; // VALMORA_LARGHEZZE=360 le limita (misure a mano, non nella catena)
const larghezze = () => (process.env.VALMORA_LARGHEZZE ? process.env.VALMORA_LARGHEZZE.split(',').map(Number) : LARGHEZZE);
const TIPI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

export function servi(dir) {
  const srv = createServer((req, res) => {
    const u = decodeURIComponent((req.url ?? '/').split('?')[0]);
    const p = join(dir, u === '/' ? 'index.html' : u);
    if (!existsSync(p)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': TIPI[extname(p)] ?? 'application/octet-stream' });
    res.end(readFileSync(p));
  });
  return new Promise((ok) => srv.listen(0, '127.0.0.1', () => ok(srv)));
}
export const SEME_FOTO = 1; // D-241: seme di partita delle foto (resa: __VALMORA_SEME_PARTITA); e01 ha varianti e una carta nuova
// Una partita sulla prima missione, calcolata dal motore col seme delle foto: schieramenti, risposte, esito.
export function gioca(m, dich, g, iniziali = variabiliIniziali(dich.values())) {
  let s = iniziaMissione(m, iniziali, dich, SEME_FOTO);
  const ondate = [];
  while (!missioneFinita(m, s)) {
    const disposizione = g.schiera(m, s);
    s = schiera(m, s, disposizione);
    const risposte = [];
    for (let c = chiamateAperte(m, s)[0]; c; c = chiamateAperte(m, s)[0]) { const o = g.scegli(m, s, c); risposte.push([c.id, o]); s = rispondi(m, s, c.id, o, dich); }
    s = chiudiOndata(m, s, dich);
    ondate.push({ disposizione, risposte, rapporto: s.rapporti.at(-1) });
  }
  const fine = concludiMissione(m, s, dich);
  return { ondate, esito: fine.esito.id, stelle: valutaEpisodio(m, fine).stelle, fallita: !!fine.esito.fallita, variabili: fine.variabili, ic: s };
}

/**
 * Il giocatore attento di bot.ts; se non arriva all'esito migliore (guarda solo la tensione), il
 * giocatore equilibrato (pesa anche il credito; in e01 v2 arriva a 3 stelle); se nemmeno lui,
 * schieramento attento e risposte dal seme più piccolo che porta all'esito migliore. Così il giro
 * prova sempre che l'esito migliore si raggiunge dall'interfaccia; quale giocatore è servito è stampato.
 */
export function pianoAttento(dirDati = 'data', indice = 0, iniziali = null) {
  const dati = leggiDati(dirDati);
  const missioni = Object.entries(dati).filter(([k]) => k.startsWith('missioni/')).map(([, x]) => x).sort((a, b) => a.episodio - b.episodio);
  const m = missioni[indice];
  if (!m) return null;
  const dich = new Map(dati['stato.json'].variabili.map((d) => [d.id, d]));
  const v0 = iniziali ?? variabiliIniziali(dich.values());
  const migliore = m.esiti[0].id;
  const testi = Object.assign({}, ...Object.entries(dati).filter(([k]) => k.startsWith('testi/it/')).map(([, v]) => v));
  const fallimento = gioca(m, dich, peggiore(creaCaso(1), dich), v0); // per provare «fallito → rigioca» (D-059)
  const att = attenta(creaCaso(1), dich);
  const base = gioca(m, dich, att, v0);
  const comune = { m, migliore, fallimento, testi, esitoAttento: base.esito };
  if (base.esito === migliore) return { ...comune, ...base, giocatore: 'attento' };
  const eq = gioca(m, dich, equilibrata(creaCaso(1), dich), v0);
  if (eq.esito === migliore) return { ...comune, ...eq, giocatore: 'equilibrato' };
  for (let seme = 1; seme <= 1000; seme++) {
    const caso = creaCaso(`foto:${m.id}:${seme}`);
    const p = gioca(m, dich, { schiera: att.schiera, scegli: (mm, st, c) => caso.scegli(opzioniValide(c, st, mm)).id }, v0);
    if (p.esito === migliore) return { ...comune, ...p, giocatore: `schieramento attento, risposte dal seme ${seme}` };
  }
  return { ...comune, ...base, giocatore: 'attento (nessun seme 1-1000 arriva al migliore)' };
}

export async function giraFoto(cartella = 'out/foto', build = 'dist', dirDati = 'data') {
  mkdirSync(cartella, { recursive: true });
  const srv = await servi(build);
  const url = `http://127.0.0.1:${srv.address().port}/`;
  const percorso = process.env.VALMORA_CHROME ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
  const browser = await chromium.launch({ executablePath: percorso });
  const piano = pianoAttento(dirDati);
  const piano2 = pianoAttento(dirDati, 1, piano.variabili); // null se c'è una sola missione
  const piano3 = piano2 && pianoAttento(dirDati, 2, piano2.variabili); const club = clubDai(dirDati);
  const giri = [];
  try {
    for (const larghezza of larghezze()) {
      const g = { larghezza, errori: [], scorrimento: [], attesi: [], citta: [] };
      const atteso = (cosa, ok) => g.attesi.push({ cosa, ok });
      // reducedMotion: transizioni ridotte a dissolvenze e mappa ferma → foto stabili fra un giro e l'altro.
      const pagina = await browser.newPage({ viewport: { width: larghezza, height: 800 }, reducedMotion: 'reduce' }); await pagina.addInitScript((seme) => { globalThis.__VALMORA_SECONDO_MS = 1; globalThis.__VALMORA_SEME_PARTITA = seme; }, SEME_FOTO); // PO-121: niente attese reali (la prova vera è foto-po121)
      // Braccio rosso: VALMORA_ROSSI=C05R01,C05R02,… accende gli interruttori rossi della resa (globalThis.__NO_X).
      const rossi = (process.env.VALMORA_ROSSI ?? '').split(',').filter(Boolean);
      if (rossi.length) await pagina.addInitScript((xs) => { for (const x of xs) globalThis[`__NO_${x}`] = true; }, rossi);
      pagina.on('console', (m) => { if (m.type() === 'error') g.errori.push(m.text()); }); // D-202: gli schieramenti sono un passo a sé della catena (passi-grafica.mjs)
      pagina.on('pageerror', (e) => g.errori.push(e.message));
      try {
        let k = 0;
        const scena = async (nome) => {
          await pagina.waitForSelector(`.scena[data-scena="${nome}"]`, { timeout: 5000 });
          await pagina.waitForFunction(() => document.querySelectorAll('.scena').length === 1 && getComputedStyle(document.querySelector('.scena')).opacity === '1'
            && [...document.querySelectorAll('[data-messaggio]')].every((x) => getComputedStyle(x).opacity === '1') && [...document.querySelectorAll('.mappa')].every((x) => x.dataset.pronta === 'si'), null, { timeout: 5000 });
        };
        const foto = async () => {
          const nome = await pagina.getAttribute('.scena', 'data-scena'); if (nome === 'citta') { const c = await statoCitta(pagina); if (c) g.citta.push(c); } // C128-01
          const [contenuto, finestra] = await pagina.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
          if (contenuto > finestra) g.scorrimento.push({ schermata: nome, contenuto, finestra });
          // C-005 R06/R07: niente testo sotto i 12 px, nomi dei settori dentro la mappa con margine, etichetta
          // della testata intera su una riga.
          const leggibile = await pagina.evaluate(() => {
            const p = [];
            for (const el of document.querySelectorAll('body *')) {
              if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
              const fs = parseFloat(getComputedStyle(el).fontSize);
              if (fs < 12 && el.getClientRects().length) p.push(`«${el.textContent.trim().slice(0, 30)}» a ${fs}px`);
            }
            const mappa = document.querySelector('.mappa:not([data-nascosta])')?.getBoundingClientRect(); // D-191: il rapporto può non mostrarla
            if (mappa) for (const n of document.querySelectorAll('.settore-nome')) {
              const r = n.getBoundingClientRect();
              if (r.left < mappa.left + 5 || r.right > mappa.right - 5 || r.bottom > mappa.bottom - 5 || r.top < mappa.top + 5) p.push(`nome «${n.textContent}» tocca il bordo della mappa`);
            }
            // C-008: nomi sovrapposti (> 0 px²); aree di tocco sopra i nomi come in D-145, sotto
          const inter = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
          const nomi = [...document.querySelectorAll('.mappa .settore-nome')].map((e) => { const s = e.closest('[data-settore],[data-episodio]'); return [s?.dataset.settore ?? s?.dataset.episodio ?? '?', e.getBoundingClientRect()]; });
          // D-145 (PO su C33-01): un tocco può coprire un nome ma non «rubarlo» (centro sul nome altrui; tocco colpito toccando il nome)
          for (const t of document.querySelectorAll('.mappa [data-presenza]')) { const q = t.getBoundingClientRect(), c = [(q.left + q.right) / 2, (q.top + q.bottom) / 2], mio = t.closest('[data-settore]');
            for (const n of document.querySelectorAll('.mappa .settore-nome')) { if (n.closest('[data-settore]') === mio) continue; const g = document.createRange(); g.selectNodeContents(n);
              if ([...g.getClientRects()].some((z) => c[0] >= z.left && c[0] <= z.right && c[1] >= z.top && c[1] <= z.bottom)) p.push(`centro del tocco ${t.dataset.presenza} sul nome ${n.closest('[data-settore],[data-episodio]')?.dataset.settore}`); } }
          for (const n of document.querySelectorAll('.mappa .settore-nome')) { const g = document.createRange(); g.selectNodeContents(n);
            for (const z of g.getClientRects()) { const x = (z.left + z.right) / 2, y = (z.top + z.bottom) / 2, e = y >= 0 && y <= innerHeight && document.elementFromPoint(x, y)?.closest('[data-presenza]'); if (e) p.push(`toccando il nome «${n.textContent}» si colpisce ${e.dataset.presenza}`); } }
          for (let i = 0; i < nomi.length; i++) for (let j = i + 1; j < nomi.length; j++) {
            const a = Math.round(inter(nomi[i][1], nomi[j][1]));
            if (a > 0) p.push(`nomi ${nomi[i][0]} e ${nomi[j][0]} sovrapposti: ${a} px²`);
          }
          // N01 (C-007): nel rapporto lo stato sta sulla riga del nome
          for (const li of document.querySelectorAll('[data-esito-settore]')) {
            const a = li.querySelector('.riga-sx').getBoundingClientRect(), b = li.querySelector('strong').getBoundingClientRect();
            if (b.top >= a.bottom - 2) p.push(`rapporto: lo stato di ${li.dataset.esitoSettore} va sotto il nome`);
          }
          // C-010 C09-03: a scorrimento zero il pulsante principale (o l'indicatore delle opzioni) si vede
          const vista = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); return r.height > 0 && r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth; };
          const principale = document.querySelector('.scena [data-azione="avanti"], .scena [data-azione="passo"], .scena [data-azione="prossimo"], .scena [data-azione="inizia"], .scena [data-azione="rapporto"], .scena [data-azione="continua"], .scena [data-azione="conferma"], .scena [data-azione="conferma-davvero"]');
          if (principale && !vista(principale)) p.push(`pulsante principale «${principale.textContent.trim()}» sotto la piega o fuori dallo schermo`);
          if (document.querySelector('.scena .opzione') && !vista(document.querySelector('.scena .opzione')) && !vista(document.querySelector('[data-indicatore]'))) p.push('opzioni sotto la piega senza indicatore');
          // C-010 C09-02: un settore scoperto ha almeno il giallo (liv-2)
          for (const li of document.querySelectorAll('[data-esito-settore]')) {
            const liv = Number(li.querySelector('.campione')?.className.match(/liv-(\d)/)?.[1] ?? 0);
            if (/scoperto/i.test(li.querySelector('strong').textContent) && liv < 2) p.push(`rapporto: ${li.dataset.esitoSettore} scoperto ma colore tranquillo (liv-${liv})`);
          }
          const et = document.querySelector('.testata-t small');
            if (et && et.scrollWidth > et.clientWidth + 1) p.push(`etichetta della testata tagliata: «${et.textContent}»`);
            return p;
          });
          for (const x of leggibile) atteso(`${nome}: ${x}`, false); await controllaAltezza(pagina, larghezza, nome, atteso); await controllaFiducia(pagina, nome, atteso); await controllaRiempi(pagina, atteso, nome); if (nome === 'schieramento') await controllaRigaAiuto(pagina, atteso, nome); await controllaVersione(pagina, atteso, nome, GAME_VERSION); await controllaContrasto(pagina, atteso, nome); await controllaRiquadri(pagina, atteso, nome); if (nome === 'sala' && (await pagina.getAttribute('.mappa', 'data-mappa').catch(() => null)) === 'webgl') { await controllaNomiSala(pagina, atteso, `sala ${larghezza}`); await controllaLampeggio(pagina, atteso, [], `sala ${larghezza} (C17-17)`); } await controllaHome(pagina, nome, atteso); { const c22 = await import('./foto-c22.mjs'); await c22.controllaTela(pagina, atteso, nome); await c22.controllaFuoco(pagina, atteso, nome); await c22.controllaVersioneOmbra(pagina, atteso, nome); if (nome === 'schieramento' || nome === 'chiamata') await c22.controllaLargo(pagina, atteso, nome); if (nome === 'schieramento') await c22.controllaRiepilogoFuoco(pagina, atteso, nome); } const coperti = await copertiDallaBarra(pagina); atteso(`${nome}: la barra in basso copre ${coperti.join(', ')} (S-24)`, !coperti.length);
        await pagina.mouse.move(0, 0); // niente :hover rimasto dal clic precedente nelle foto
        await pagina.screenshot({ path: join(cartella, `${larghezza}-${String(++k).padStart(2, '0')}-${nome}.png`), fullPage: true });
        };
        const premi = (sel) => avanzaFino(pagina, sel, () => fotoSe()).then(() => pagina.click(sel)); // attraversa i passi (S-10)
        const presenze = () => pagina.locator('[data-presenza]').count();
        const ricaricaERiprendi = async (attesa, perche) => {
          await pagina.reload();
          await scena('titolo');
          const riprendi = await pagina.getByRole('button', { name: 'Riprendi' }).count();
          atteso(`${perche}: dopo la ricarica manca «Riprendi»`, riprendi === 1);
          if (riprendi) await pagina.getByRole('button', { name: 'Riprendi' }).click();
          const ok = await scena(attesa).then(() => true, () => false);
          atteso(`${perche}: la ripresa non torna a «${attesa}»`, ok);
          return ok;
        };

        await pagina.goto(url);
        await pagina.evaluate(() => localStorage.clear());
        await pagina.reload();
        await scena('titolo');
        // PO-064: niente più APK nella home (l'app passa da Play con l'AAB); PO-065: c'è il logo
        atteso('home: c\'è ancora il link all\'APK', (await pagina.locator('[data-azione="apk"]').count()) === 0);
        atteso('home: manca il logo', (await pagina.locator('[data-logo]').count()) === 1);
        const [li, ln] = [await pagina.locator('[data-logo]').boundingBox(), await pagina.locator('.logo-nome').boundingBox()]; // PO-077
        atteso('home: il logo non sta a sinistra del nome, sulla stessa riga (PO-077)', !!li && !!ln && li.x + li.width <= ln.x && li.y < ln.y + ln.height && ln.y < li.y + li.height);
        // PO-032: la home dice versione e build vera (non «sviluppo»); interruttore rosso C05S09
        const versione = await pagina.getAttribute('[data-versione]', 'data-versione').catch(() => null);
        const riga = (await pagina.locator('[data-versione]').textContent().catch(() => '')) ?? '';
        atteso(`home: versione «${versione}» invece di «${GAME_VERSION}»`, versione === GAME_VERSION);
        atteso(`home: build non valida in «${riga}»`, /build \S+/.test(riga) && !/build sviluppo/.test(riga));
        await foto();
        const fh = await import('./foto-home.mjs'); await fh.controllaHomeA(browser, url, cartella, atteso, rossi, larghezza); await fh.apriAltro(pagina); await premi('[data-azione="crediti"]'); await scena('crediti'); await foto(); // PO-140
        await pagina.getByRole('button', { name: 'Torna al titolo' }).click(); await scena('titolo');
        // Genere (D-063): a 375 px la protagonista è donna, alle altre larghezze uomo.
        const genere = larghezza === 375 ? 'f' : 'm';
        await pagina.getByRole('button', { name: 'Nuova partita' }).click(); await scena('genere'); await foto();
        await premi(`[data-genere="${genere}"]`); await controllaGuida(pagina, { atteso, scena, foto, salta: larghezza === 375 }); await scena('citta'); await foto();
        const salvato = await pagina.evaluate(() => JSON.parse(localStorage.getItem('vandelfalls-salvataggio') ?? '{}').genere);
        atteso(`genere: salvato «${salvato}» invece di «${genere}»`, salvato === genere);

        // Una partita intera dall'interfaccia, dalla sala al verbale. «completa»: foto di ogni scena,
        // trascinamento e ricariche a metà ondata; altrimenti solo il verbale (serve per il fallimento).
        let completa = true;
        // Foto: «tutte» (partita completa di e01), «chiave» (la prima volta che compare ogni scena), «nessuna».
        let modoFoto = 'tutte'; const viste = new Set();
        const fotoSe = async () => {
          if (modoFoto === 'tutte') return foto();
          const nome = await pagina.getAttribute('.scena', 'data-scena');
          if (modoFoto === 'chiave' && !viste.has(nome)) { viste.add(nome); await foto(); }
        };
        const partita = async (p) => {
          await scena('sala'); await fotoSe(); await controllaSfida(pagina, p.m, atteso, 'sala'); await controllaVignetta(pagina, 'apertura-', atteso, `${p.m.id} sala`);
          const variante = (p.m.introduzione ?? []).map((k) => k.replace(/^testi:/, '')).find((k) => piano.testi[`${k}@f`]);
          if (variante) {
            const atteso_ = piano.testi[genere === 'f' ? `${variante}@f` : variante];
            atteso(`genere «${genere}»: la sala non mostra «${atteso_.slice(0, 40)}…»`, (await pagina.locator('.scena').textContent()).includes(atteso_));
          }
          await premi('[data-azione="avanti"]'); await scena('briefing'); await fotoSe();
          while (await pagina.locator('[data-azione="prossimo"]').count()) { await premi('[data-azione="prossimo"]'); await fotoSe(); } // rosso C12P01: a cascata
          await premi('[data-azione="inizia"]');
          for (const [i, o] of p.ondate.entries()) {
            const n = i + 1;
            await scena('schieramento');
            atteso(`ondata ${n}: la scena è dell'ondata ${await pagina.getAttribute('main', 'data-ondata')}`, (await pagina.getAttribute('main', 'data-ondata')) === String(n));
            await controllaCurve(pagina, p.m, n, club, atteso); await controllaFolla(pagina, p.m, n, atteso); await controllaColoriCortei(pagina, p.m, club, atteso, `${p.m.id} ondata ${n}`, n); await controllaRende(pagina, p.m, n, atteso, piano.testi); if (n === 1) { await controllaRidisegno(pagina, atteso, `${p.m.id} schieramento`); await controllaLampeggio(pagina, atteso, [], `${p.m.id} schieramento`); }
            // Risorse fisse (transenne, D-082): all'ondata 1 non si montano in curva (avviso, nessuna presenza);
            // dall'ondata 2 quelle montate all'ondata 1 restano sulla mappa col lucchetto e non si ritirano.
            const fisse = Object.entries(p.m.mappa.risorse).filter(([, x]) => x.fissa).map(([r]) => r);
            const curva = p.m.mappa.settori.find((x) => x.tipo === 'curva')?.id;
            if (n === 1) for (const r of fisse) if (curva && (await pagina.locator(`[data-risorsa="${r}"]:not([disabled])`).count())) {
              await premi(`[data-risorsa="${r}"]`); await premi(`[data-settore="${curva}"] .settore-punto`);
              atteso(`${p.m.id}: ${r} in «${curva}» senza avviso (D-082)`, (await pagina.locator('[data-avviso]').count()) === 1);
              atteso(`${p.m.id}: ${r} accettate in «${curva}» (D-082)`, (await pagina.locator(`[data-presenza="${r}@${curva}"]`).count()) === 0);
              if (completa || !viste.has('avviso')) { viste.add('avviso'); await foto(); }
            }
            if (n === 2 && fisse.length && modoFoto !== 'nessuna') await foto(); // transenne col lucchetto
            if (n > 1) for (const r of fisse) for (const [s, q] of Object.entries(p.ondate[0].disposizione[r] ?? {})) if (q > 0) {
              const segno = pagina.locator(`[data-fissa="${r}@${s}"]`);
              atteso(`${p.m.id} ondata ${n}: ${r} montate in «${s}» all'ondata 1 non si vedono`, (await segno.count()) === 1);
              if (await segno.count()) await segno.click({ force: true });
              atteso(`${p.m.id} ondata ${n}: ${r} in «${s}» ritirabili`, (await segno.count()) === 1 && (await pagina.locator(`[data-presenza="${r}@${s}"]`).count()) === 0);
            }
            let unita = Object.entries(o.disposizione).flatMap(([r, ps]) => Object.entries(ps).flatMap(([s, q]) => Array(q).fill([r, s])));
            if (completa && n === 1 && unita.length) { // la prima unità si trascina davvero dal vassoio alla mappa
              const [r, s] = unita[0];
              const da = await pagina.locator(`[data-risorsa="${r}"]`).boundingBox();
              const a = await pagina.locator(`[data-settore="${s}"] .settore-punto`).boundingBox();
              await pagina.mouse.move(da.x + da.width / 2, da.y + da.height / 2);
              await pagina.mouse.down();
              await pagina.mouse.move(a.x + a.width / 2, a.y + a.height / 2, { steps: 12 });
              await pagina.mouse.up();
              atteso(`trascinamento: ${r} non è arrivata in ${s}`, (await pagina.locator(`[data-presenza="${r}@${s}"]`).count()) === 1);
              unita = unita.slice(1);
            }
            for (const [r, s] of unita) { // le altre col tocco: unità, poi settore
              if ((await pagina.getAttribute(`[data-risorsa="${r}"]`, 'aria-pressed')) !== 'true') await premi(`[data-risorsa="${r}"]`);
              await premi(`[data-settore="${s}"] .settore-punto`);
            }
            // C-010 C09-04: con l'unità scelta finita, un tocco su un settore non mette un'altra unità
            if (completa && n === 1) {
              const conta = () => pagina.evaluate(() => [...document.querySelectorAll('[data-presenza] .pastiglia')].reduce((a, e) => a + Number(e.textContent.replace(/\D/g, '') || 0), 0));
              const prima = await conta();
              await premi(`[data-settore="${p.m.mappa.settori[0].id}"] .settore-punto`);
              const dopo = await conta();
              atteso(`schieramento: unità finita, il tocco ha messo un'altra unità (${prima} → ${dopo}) (C09-04)`, dopo === prima);
              atteso('schieramento: unità finita senza avviso (C09-04)', (await pagina.locator('[data-avviso]').count()) === 1);
              if (dopo > prima) await pagina.locator('[data-presenza]').last().click(); // rimette lo schieramento del piano (braccio rosso)
              await controllaRitiroSingolo(pagina, atteso, `${p.m.id} schieramento`); // PO-054
            }
            await fotoSe();
            const piccoli = await pagina.locator('[data-presenza]').evaluateAll((xs) => xs.map((x) => x.getBoundingClientRect()).filter((r) => r.width < 44 || r.height < 44).map((r) => `${Math.round(r.width)}×${Math.round(r.height)}`));
            atteso(`ondata ${n}: bersagli «ritira unità» sotto 44×44 px (C-005 R05): ${piccoli.join(', ')}`, piccoli.length === 0);
            if (completa && n === 2) await controllaBozzaRicarica(pagina, atteso); // C17-16 (all'ondata 1 «Annulla» usa la storia, che la ricarica azzera)
            await confermaSchieramento(pagina, { premi, atteso, fotoSe, prova: completa && n === 1, ultima: unita.at(-1) }); // S-12
            const dopo = o.risposte.length ? 'chiamata' : 'chiusura';
            await scena(dopo);
            if (completa && n === 1) { // a metà ondata: ricarico e riprendo
              const prima = await presenze();
              await ricaricaERiprendi(dopo, 'dopo lo schieramento'); if (dopo === 'chiamata') await (await import('./foto-c22.mjs')).controllaOpzioneFerma(pagina, atteso, scena);
              atteso(`ripresa: unità sulla mappa ${await presenze()} invece di ${prima}`, (await presenze()) === prima);
            }
            for (const [j, [c, op]] of o.risposte.entries()) {
              await scena('chiamata');
              atteso(`ondata ${n}: aperta una chiamata diversa da «${c}»`, (await pagina.locator(`[data-messaggio="chiamata-${c}"]`).count()) === 1); const sett = p.m.ondate[i].chiamate.find((x) => x.id === c).settore; await controllaLampeggio(pagina, atteso, sett ? [sett] : [], `chiamata «${c}»`); await controllaDinamica(pagina, atteso, p.m, p.m.ondate[i].chiamate.find((x) => x.id === c), `chiamata «${c}»`, p.m.ondate[i], club); await controllaRispondi(pagina, atteso, `chiamata «${c}» ${larghezza}`); await controllaChiIcona(pagina, atteso, p.m.ondate[i].chiamate.find((x) => x.id === c), `chiamata «${c}» ${larghezza}`); await controllaIconeEffetti(pagina, atteso, p.m.ondate[i].chiamate.find((x) => x.id === c), `chiamata «${c}»`);
            // D-078 rivisto da D-241 (PO-152 A): prima di «Conferma» sotto le opzioni nessun costo; arriva dopo, per radio, in parole
            const accenni = await pagina.evaluate(() => [...document.querySelectorAll('.opzione:not(.esaurita) [data-costo], .opzione [data-quando], .opzione [data-effetti]')].filter((e) => e.getClientRects().length).length);
            atteso(`chiamata «${c}»: ${accenni} indicazioni di costo sotto le opzioni prima di «Conferma» (D-241)`, accenni === 0);
              await fotoSe();
              const altra = p.m.ondate[i].chiamate.find((x) => x.id === c).opzioni.find((x) => x.id !== op)?.id;
              if (completa && n === 1 && j === 0 && altra) { // C-005 R01: doppio tocco a 40 ms su due opzioni
                await pagina.evaluate(([a, b]) => new Promise((ok) => {
                  document.querySelector(`[data-opzione="${a}"]`).click();
                  setTimeout(() => { document.querySelector(`[data-opzione="${b}"]`)?.click(); setTimeout(ok, 60); }, 40);
                }), [op, altra]);
                await pagina.click('[data-conferma]').catch(() => {}); await pagina.waitForFunction(() => !document.querySelector('[data-annulla]'), null, { timeout: 5000 }).catch(() => {}); const salvata = await pagina.evaluate((k) => JSON.parse(localStorage.getItem('vandelfalls-salvataggio')).in_corso.risposte[k], c); // PO-148: si salva con «Conferma»
                atteso(`doppio tocco: salvata «${salvata}» invece di «${op}» (C-005 R01)`, salvata === op);
              } else { await controllaVignettaEvento(pagina, p.m.ondate[i], p.m.ondate[i].chiamate.find((x) => x.id === c), atteso, `chiamata «${c}»`); const prima = await statoSalvato(pagina); await premi(`[data-opzione="${op}"]`); await pagina.click('[data-conferma]').catch(() => {}); await pagina.waitForFunction(() => !document.querySelector('[data-annulla]'), null, { timeout: 5000 }).catch(() => {}); /* PO-148: la risposta vale con «Conferma» */ await controllaVoloRisposta(pagina, atteso, p.m.ondate[i].chiamate.find((x) => x.id === c), op, `chiamata «${c}»`); await controllaSegni(pagina, atteso, p.m.ondate[i].chiamate.find((x) => x.id === c), op, `risposta «${op}»`, prima); }
              if (p.m.ondate[i].chiamate.find((x) => x.id === c).opzioni.find((x) => x.id === op).risposta) {
                await scena('risposta'); const radio = await pagina.evaluate(() => document.querySelector('[data-rapporto-costo] [data-costo]')?.textContent?.trim() ?? '');
                atteso(`risposta a «${c}»: costo per radio «${radio}» assente o con numeri (D-078, D-241)`, !!radio && !/\d/.test(radio));
                if (j === 0) await fotoSe();
                await premi('[data-azione="continua"]');
              }
              if (completa && n === 1 && j === 0) await ricaricaERiprendi(o.risposte.length > 1 ? 'chiamata' : 'chiusura', 'dopo la prima risposta');
            }
            await scena('chiusura'); await fotoSe();
            await premi('[data-azione="rapporto"]'); await scena('rapporto'); await fotoSe();
            // Se la ripresa non torna al rapporto (difetto R04) si è già allo schieramento dopo: si prosegue da lì.
            if (completa && n === 1 && !(await ricaricaERiprendi('rapporto', 'ricarica sul rapporto (C-005 R04)'))) continue;
            const cifre = await pagina.locator('.elenco-settori').textContent();
            atteso(`rapporto ${n}: la tensione si vede in numeri (D-055): «${cifre}»`, !/\d/.test(cifre ?? '')); await controllaPicco(pagina, p.m, o.rapporto, atteso); await (await import('./foto-c22.mjs')).controllaVignettaOndata(pagina, p.m, o.rapporto, atteso, `${p.m.id} rapporto ${n}`); await controllaCifreTensione(pagina, atteso, `${p.m.id} rapporto ${n}`); await controllaFiduciaRapporto(pagina, atteso, `${p.m.id} rapporto ${n}`);
            await premi('[data-azione="avanti"]');
          }
          await scena('verbale'); await foto(); await controllaSfida(pagina, p.m, atteso, 'verbale'); await controllaVignetta(pagina, 'esito-', atteso, `${p.m.id} verbale`); await controllaCifreTensione(pagina, atteso, `${p.m.id} verbale`); await controllaSfidaBusti(pagina, atteso, `${p.m.id} verbale`);
          await controllaBilancio(pagina, p, atteso); // D-085, C-005 R03
        };

        // 1) fallimento col giocatore peggiore → «Rigioca l'episodio» (D-059)
        const f = piano.fallimento;
        atteso(`il giocatore peggiore non fallisce l'episodio (esito «${f.esito}»): il rigioco non si prova`, f.fallita);
        await premi('[data-azione="avvia-episodio"]');
        completa = false; modoFoto = 'nessuna';
        await partita({ m: piano.m, ...f });
        completa = true; modoFoto = 'tutte';
        atteso(`fallimento: il verbale non dice «fallito» (esito «${await pagina.getAttribute('[data-esito]', 'data-esito')}»)`, (await pagina.locator('[data-fallita="si"]').count()) === 1);
        atteso('fallimento: stelle diverse da 0', (await pagina.getAttribute('.stelle', 'data-stelle')) === '0');
        await controllaVerbaleBasso(pagina, atteso, 'verbale perso'); await premi('[data-azione="rigioca"]');

        // 2) rigioco col giocatore migliore, con tutte le prove
        await partita(piano);
        const esito = await pagina.getAttribute('[data-esito]', 'data-esito');
        atteso(`giocatore «${piano.giocatore}»: la resa finisce con «${esito}», il motore dice «${piano.esito}»`, esito === piano.esito);
        atteso(`giocatore «${piano.giocatore}»: non arriva all'esito migliore «${piano.migliore}» (arriva a «${esito}»)`, esito === piano.migliore);
        const stelle = await pagina.getAttribute('.stelle', 'data-stelle');
        atteso(`verbale: ${stelle} stelle a schermo, il motore dice ${piano.stelle}`, stelle === String(piano.stelle));
        await controllaVerbaleAvanti(pagina, piano, atteso, fotoSe); // PO-072, PO-074
        // 3) mappa della città: l'episodio è superato e mostra le sue stelle
        await premi('[data-azione="citta"]'); await scena('citta'); await foto();
        const ep = pagina.locator(`[data-episodio="${piano.m.id}"]`);
        atteso(`città: ${piano.m.id} è «${await ep.getAttribute('data-stato')}», non «superato»`, (await ep.getAttribute('data-stato')) === 'superato');
        atteso(`città: stelle di ${piano.m.id} sulla mappa diverse da ${piano.stelle}`, (await ep.locator('.stelle').getAttribute('data-stelle')) === String(piano.stelle));
        // 4) secondo episodio scelto dalla città, dalle variabili lasciate da e01 (D-062)
        if (piano2) {
          const ep2 = pagina.locator(`[data-episodio="${piano2.m.id}"]`);
          atteso(`città: ${piano2.m.id} è «${await ep2.getAttribute('data-stato')}», non «disponibile»`, (await ep2.getAttribute('data-stato')) === 'disponibile');
          await ep2.locator('.settore-punto').click();
          await premi('[data-azione="avvia-episodio"]');
          completa = false; modoFoto = 'chiave';
          await partita(piano2);
          completa = true; modoFoto = 'tutte';
          const esito2 = await pagina.getAttribute('[data-esito]', 'data-esito');
          atteso(`${piano2.m.id}, giocatore «${piano2.giocatore}»: la resa finisce con «${esito2}», il motore dice «${piano2.esito}»`, esito2 === piano2.esito);
          atteso(`${piano2.m.id}: non arriva all'esito migliore «${piano2.migliore}»`, esito2 === piano2.migliore);
          await premi('[data-azione="citta"]'); await scena('citta'); await foto();
          atteso(`città: ${piano2.m.id} non è superato`, (await ep2.getAttribute('data-stato')) === 'superato');
          await ep2.locator('.settore-punto').click();
          const conta = await pagina.locator(`[data-scheda-episodio="${piano2.m.id}"] .tenue`).first().textContent();
          atteso(`città: «${conta}» invece di «1 tentativo» (C-008.1)`, conta?.trim() === '1 tentativo');
        }
        // 5) terzo episodio dalla città, dalle variabili lasciate da e02 (e03: transenne fisse, notte)
        if (piano3) {
          const ep3 = pagina.locator(`[data-episodio="${piano3.m.id}"]`);
          atteso(`città: ${piano3.m.id} è «${await ep3.getAttribute('data-stato')}», non «disponibile»`, (await ep3.getAttribute('data-stato')) === 'disponibile');
          await ep3.locator('.settore-punto').click();
          await premi('[data-azione="avvia-episodio"]');
          completa = false; modoFoto = 'chiave'; viste.clear();
          await partita(piano3);
          completa = true; modoFoto = 'tutte';
          const esito3 = await pagina.getAttribute('[data-esito]', 'data-esito');
          atteso(`${piano3.m.id}, giocatore «${piano3.giocatore}»: la resa finisce con «${esito3}», il motore dice «${piano3.esito}»`, esito3 === piano3.esito);
          await provaProssimo(pagina, piano3, atteso, scena, premi); await foto(); // PO-072
          atteso(`città: ${piano3.m.id} non è superato`, (await ep3.getAttribute('data-stato')) === 'superato');
        }
        // C-005 R02: con una partita salvata, «Nuova partita» chiede conferma e «No» non cancella nulla
        const prima = await pagina.evaluate(() => localStorage.getItem('vandelfalls-salvataggio'));
        await pagina.reload(); await scena('titolo');
        await pagina.getByRole('button', { name: 'Nuova partita' }).click();
        const chiede = await scena('conferma').then(() => true, () => false);
        atteso('«Nuova partita» con una partita salvata non chiede conferma (C-005 R02)', chiede);
        if (chiede) { await foto(); await controllaTripla(pagina, atteso, '«Nuova partita»', foto); await premi('[data-azione="annulla-nuova"]'); await scena('titolo'); }
        atteso('«No, tieni la partita» ha cambiato il salvataggio', (await pagina.evaluate(() => localStorage.getItem('vandelfalls-salvataggio'))) === prima);
        if (larghezza === 360) { await controllaArchivio(pagina, { atteso, scena, foto }); await controllaSalvataggiPersi(pagina, { atteso, scena }); await controllaRipartenza(pagina, { atteso, scena, partita, piano, dirDati }); await controllaIndietro(pagina, { atteso, scena }); await (await import('./foto-po121.mjs')).controllaAnnulla(browser, url, dirDati, cartella, atteso, rossi); await (await import('./foto-c33.mjs')).controllaTono(browser, url, dirDati, cartella, atteso, rossi); await controllaRipartiTesto(pagina, { atteso, scena, partita, pianoAttento, dirDati }); modoFoto = 'nessuna'; completa = false; await apriTutte({ pagina, dirDati, atteso, scena, premi, partita, pianoAttento, errori: g.errori, cartella }); } // S-09
      } catch (e) { atteso(`giro interrotto: ${e.message.split('\n')[0]}`, false); }
      await pagina.close();
      giri.push(g);
    }
  } finally { await browser.close(); srv.close(); }
  return giri;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { controllaGiro } = await import('./controlli-grafica.mjs');
  const [cartella = 'out/foto', build = 'dist', dati = 'data'] = process.argv.slice(2);
  const giri = await giraFoto(cartella, build, dati);
  const p = giri.flatMap(controllaGiro);
  const p1 = pianoAttento(dati); const p2 = pianoAttento(dati, 1, p1.variabili); const p3 = p2 && pianoAttento(dati, 2, p2.variabili);
  for (const q of [p1, p2, p3].filter(Boolean)) console.log(`${q.m.id}: giocatore ${q.giocatore}; esito del giocatore attento di bot.ts: ${q.esitoAttento}`);
  console.log(p.length ? p.join('\n') : `verde: ${giri.length} larghezze, foto in ${cartella}`);
  process.exit(p.length ? 1 : 0);
}
