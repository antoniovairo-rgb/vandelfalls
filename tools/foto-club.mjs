// Controlli delle foto su club e rapporto (S-08), a parte da foto.mjs che è al limite delle 400 righe.
// - curve coi colori del club dai dati (D-086): si campiona la mappa vera (strato Pixi) vicino a ogni curva;
// - stemmi della sfida (D-088): uno per club delle curve;
// - picco della tensione nel rapporto (C09-01): si vede dove il motore dice che è salita più di dove è finita.
import { leggiDati } from './dati-disco.mjs';

const livello = (t) => (t <= 0 ? 0 : Math.min(5, Math.ceil(t / 2))); // come src/resa/partita.ts
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** Club dei dati, per id. */
export const clubDai = (dirDati) => Object.fromEntries(Object.entries(leggiDati(dirDati)).filter(([k]) => k.startsWith('club/')).map(([, c]) => [c.id, c]));

/** Distanza (RGB) del pixel più vicino al colore cercato, in una fascia sopra ogni curva, verso il campo. */
async function campiona(pagina, curve) {
  const mappa = pagina.locator('.mappa').first();
  await pagina.evaluate(() => document.querySelectorAll('.mappa > [data-settore]').forEach((x) => { x.style.visibility = 'hidden'; }));
  const png = (await mappa.screenshot()).toString('base64');
  await pagina.evaluate(() => document.querySelectorAll('.mappa > [data-settore]').forEach((x) => { x.style.visibility = ''; }));
  return pagina.evaluate(async ([png, curve]) => {
    const img = new Image(); img.src = `data:image/png;base64,${png}`; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const f = c.getContext('2d'); f.drawImage(img, 0, 0);
    const css = getComputedStyle(document.documentElement);
    const lato = (parseFloat(css.getPropertyValue('--settore')) || 44) / 2, sotto = parseFloat(css.getPropertyValue('--margine-nomi')) || 34;
    const r = document.querySelector('.mappa').getBoundingClientRect(), sx = img.width / r.width;
    const centro = curve.reduce((a, q) => a + q.x, 0) / curve.length;
    return curve.map((q) => {
      const x = (lato + ((r.width - 2 * lato) * q.x) / 100) * sx, y = (lato + ((r.height - 2 * lato - sotto) * q.y) / 100) * sx;
      const verso = Math.sign(centro - q.x) || 1;
      let migliore = Infinity;
      // parte alta della curva, fuori dall'alone del settore (raggio 34 px) che la tinge col colore della tensione
      for (let dx = 0; dx <= 40 * sx; dx++) for (let dy = -75 * sx; dy <= -36 * sx; dy++) {
        if (y + dy < 0) continue;
        const [R, G, B] = f.getImageData(Math.round(x + verso * dx), Math.round(y + dy), 1, 1).data;
        migliore = Math.min(migliore, Math.hypot(R - q.colore[0], G - q.colore[1], B - q.colore[2]));
      }
      return { id: q.id, distanza: Math.round(migliore) };
    });
  }, [png, curve]);
}

/** Curve sulla mappa col primario del loro club (D-086), nella prima ondata di partita (spalti pieni, S-11);
 *  solo con WebGL (senza, la mappa è solo HTML). */
export async function controllaCurve(pagina, m, n, club, atteso) {
  if (m.ondate.findIndex((o) => o.eventi.some((e) => e.tipo === 'curva')) !== n - 1) return;
  if ((await pagina.getAttribute('.mappa', 'data-mappa')) !== 'webgl') return;
  const curve = m.mappa.settori.filter((s) => s.tipo === 'curva' && club[s.club]?.colori && s.pos)
    .map((s) => ({ id: s.id, x: s.pos.x, y: s.pos.y, colore: rgb(club[s.club].colori.primario) }));
  if (!curve.length) return;
  for (const q of await campiona(pagina, curve)) {
    atteso(`${m.id}: la curva «${q.id}» non ha i colori del suo club (pixel più vicino a ${q.distanza}, serve ≤ 40) (D-086)`, q.distanza <= 40);
  }
}

/** Uno stemma per club delle curve, col club giusto (D-088). */
export async function controllaSfida(pagina, m, atteso, dove) {
  // C26-06 (D-130): col campo partita, casa contro ospiti (rosso C79P01)
  const attesi = m.partita ? `${m.partita.casa},${m.partita.ospiti}` : [...new Set(m.mappa.settori.filter((s) => s.club && s.tipo === 'curva' && !s.id.includes('gemellati')).map((s) => s.club))].join(','); // C20-08: club delle curve, una volta; C26-01: non i gemellati (rosso C75G01)
  if (!attesi) return;
  const visti = await pagina.$$eval('.scena [data-sfida] [data-stemma]', (xs) => xs.map((x) => x.dataset.stemma).join(','));
  atteso(`${m.id} ${dove}: stemmi «${visti}», servono «${attesi}» (D-088)`, visti === attesi);
  await (await import('./foto-c22.mjs')).controllaStemmi(pagina, atteso, `${m.id} ${dove}`); // C22-06
}

/** Picco della tensione nel rapporto (C09-01): segnato dove il picco ha un colore più alto della fine. */
export async function controllaPicco(pagina, m, rapporto, atteso) {
  if (!rapporto?.picco) return;
  for (const s of m.mappa.settori) {
    const sale = livello(rapporto.picco[s.id] ?? 0) > livello(rapporto.tensione[s.id] ?? 0);
    const visto = (await pagina.locator(`[data-picco="${s.id}"]`).count()) === 1;
    atteso(`${m.id} rapporto ${rapporto.n}: «${s.id}» ${sale ? 'salita e poi calmata ma il picco non si vede' : 'picco mostrato senza salita'} (C09-01)`, sale === visto);
  }
}

/** Spalti e cortei disegnati secondo gli eventi dell'ondata (S-11, PO-046): partita = spalti pieni e strade
 *  vuote; cortei solo dove l'ondata ha gente in strada; dopo il deflusso i cortei escono. */
export async function controllaFolla(pagina, m, n, atteso) {
  if ((await pagina.getAttribute('.mappa', 'data-mappa')) !== 'webgl') return;
  const [spalti, lista = ''] = ((await pagina.getAttribute('.mappa', 'data-folla')) ?? '').split('|');
  const cortei = lista ? lista.split(',').map((x) => x.split('>')) : [];
  const eventi = m.ondate[n - 1].eventi; const tipi = new Set(eventi.map((e) => e.tipo)); const fase = m.ondate[n - 1].fase, partita = fase ? fase === 'partita' : tipi.has('curva'); // C27-04: la fase dei dati, se c'è
  const strade = new Set(m.mappa.settori.filter((s) => s.tipo === 'strada').map((s) => s.id));
  const dove = `${m.id} ondata ${n} (spalti «${spalti}», cortei «${lista}»)`;
  if (partita) atteso(`${dove}: durante la partita servono spalti pieni e strade vuote (PO-046)`, spalti === 'pieni' && cortei.length === 0);
  for (const [s] of cortei) atteso(`${dove}: corteo su «${s}» senza un evento in strada in questa ondata (PO-046)`, eventi.some((e) => e.settore === s));
  for (const e of eventi) if (e.tipo === 'corteo' && strade.has(e.settore) && !partita) atteso(`${dove}: evento corteo su «${e.settore}» ma nessun corteo disegnato`, cortei.some(([s]) => s === e.settore));
  // C24-07: senza curve lo stadio è vuoto (S-25): spalti «vuoti», mai «in arrivo». Rosso VALMORA_ROSSI=C67S01.
  const senzaCurve = !m.mappa.settori.some((s) => s.tipo === 'curva');
  if (senzaCurve) atteso(`${dove}: episodio senza curve, gli spalti devono essere «vuoti» (C24-07)`, spalti === 'vuoti');
  if (fase ? fase === 'dopo' : tipi.has('deflusso')) atteso(`${dove}: al deflusso la gente esce dallo stadio`, (spalti === 'deflusso' || senzaCurve) && cortei.every(([, v]) => v === 'esce'));
}

/** Schermate a passi (S-10, PO-045): a 360 px di larghezza la pagina sta in 760 px di altezza, senza scorrere.
 *  Con VALMORA_MISURE=1 stampa l'altezza di ogni schermata (misura prima/dopo). */
export async function controllaAltezza(pagina, larghezza, nome, atteso) {
  if (!['sala', 'briefing', 'verbale', 'guida'].includes(nome) && process.env.VALMORA_MISURE !== 'tutte') return; // «tutte»: misura ogni schermata
  const prima = pagina.viewportSize();
  await pagina.setViewportSize({ width: prima.width, height: 760 }); // il telefono di riferimento è 360×760
  await pagina.waitForTimeout(50);
  const [h, passo, passi] = await pagina.evaluate(() => [document.documentElement.scrollHeight, document.querySelector('.passi')?.dataset.passo, !!document.querySelector('.passi')]);
  await pagina.setViewportSize(prima);
  if (process.env.VALMORA_MISURE) console.log(`misura ${larghezza}px ${nome} ${passo ?? '-'}: ${h} px`);
  if (larghezza === 360 && (passi || nome === 'guida' || process.env.VALMORA_ROSSI?.includes('C12P01'))) atteso(`${nome} ${passo ?? ''}: ${h} px di pagina, a 360×760 si scorre (PO-045)`, h <= 760);
}

/** Attraversa i passi della schermata («Avanti») finché il pulsante cercato non si vede; foto a ogni passo. */
export async function avanzaFino(pagina, sel, dopo) {
  const vede = async (s) => (await pagina.locator(s).count()) > 0 && pagina.locator(s).first().isVisible();
  while (!(await vede(sel)) && (await vede('[data-azione="passo"]'))) { await pagina.click('[data-azione="passo"]'); await dopo(); }
}

/** C12-01 (D-055): la tensione mai in cifre. Ogni frase (spezzata a «·», «,», «:») che parla di tensione non ha
 *  numeri; si leggono anche i passi nascosti del verbale. */
export async function controllaCifreTensione(pagina, atteso, dove) {
  const frasi = await pagina.evaluate(() => [...document.querySelectorAll('.scena *')]
    .filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())).map((el) => el.textContent));
  // D-147: unica eccezione, il requisito della stella nel verbale («… stella: tensione massima 3 su 10 (raggiunta: 4).»)
  const male = frasi.map((x) => x.replace(/stella: tensione (?:massima|minima) \d+(?: su \d+)? \(raggiunta: \d+\)\./g, '')).flatMap((x) => x.split(/[·,:;]/)).filter((x) => /tension/i.test(x) && /\d/.test(x));
  atteso(`${dove}: tensione in cifre «${male.slice(0, 2).join(' | ')}» (C12-01, D-055)`, male.length === 0);
}

/** S-19 (PO-067, D-097): barra della fiducia in ogni schermata dell'episodio, col valore del salvataggio; se
 *  cambia rispetto alla schermata prima, nella risposta compare «+N/−N» col segno giusto. */
let fiduciaPrima = null;
export async function controllaFiducia(pagina, nome, atteso) {
  // C15-07: anche in sala e briefing (valore da cui parte il tentativo, uguale a quello dello schieramento) e nel
  // verbale (valore finale, con gli effetti dell'esito)
  const prima = ['sala', 'briefing'].includes(nome), fine = nome === 'verbale';
  if (!prima && !fine && !['schieramento', 'chiamata', 'risposta', 'chiusura', 'rapporto'].includes(nome)) { fiduciaPrima = null; return; }
  const [barra, valore, delta, salvata] = await pagina.evaluate(() => {
    const b = document.querySelectorAll('[data-fiducia]');
    const s = JSON.parse(localStorage.getItem('vandelfalls-salvataggio') ?? 'null');
    return [b.length, Number(b[0]?.dataset.fiducia), Number(document.querySelector('[data-delta]')?.dataset.delta ?? 0), s?.in_corso?.variabili?.credito];
  });
  atteso(`${nome}: ${barra} barre della fiducia, ne serve una (PO-067)`, barra === 1);
  if (salvata !== undefined && !prima && !fine) atteso(`${nome}: la barra dice ${valore}, la fiducia salvata è ${salvata} (PO-067)`, valore === salvata);
  if (nome === 'schieramento' && fiduciaPrima !== null) atteso(`${nome}: la barra dice ${valore}, prima diceva ${fiduciaPrima} (C15-07)`, valore === fiduciaPrima);
  if (nome === 'risposta' && fiduciaPrima !== null && valore !== fiduciaPrima) atteso(`risposta: fiducia da ${fiduciaPrima} a ${valore} senza «${valore - fiduciaPrima}» accanto alla barra (PO-067)`, delta === valore - fiduciaPrima);
  fiduciaPrima = valore;
}

/** S-12 (PO-061): «Annulla l'ultima» toglie l'ultima unità messa; «Conferma» apre il riepilogo con le unità messe e,
 *  se ne avanzano, «Ti restano N»; poi «Sì, conferma». */
export async function confermaSchieramento(pagina, { premi, atteso, fotoSe, prova, ultima }) {
  const sulla = () => pagina.evaluate(() => [...document.querySelectorAll('[data-presenza] .pastiglia')].reduce((a, e) => a + Number(e.textContent.replace(/\D/g, '') || 0), 0));
  if (prova && ultima) {
    const [r, s] = ultima, prima = await sulla();
    await premi('[data-azione="annulla"]');
    atteso(`schieramento: «Annulla l'ultima» da ${prima} a ${await sulla()} unità, doveva toglierne una (PO-061)`, (await sulla()) === prima - 1);
    if ((await sulla()) === prima - 1) {
      if ((await pagina.getAttribute(`[data-risorsa="${r}"]`, 'aria-pressed')) !== 'true') await premi(`[data-risorsa="${r}"]`);
      await premi(`[data-settore="${s}"] .settore-punto`);
    }
  }
  const messe = await sulla();
  const libere = await pagina.evaluate(() => [...document.querySelectorAll('[data-risorsa] strong:not([data-tutte])')].reduce((a, e) => a + Number(e.textContent || 0), 0));
  await premi('[data-azione="conferma"]');
  const riepilogo = await pagina.getAttribute('[data-riepilogo]', 'data-riepilogo', { timeout: 2000 }).catch(() => null);
  atteso(`schieramento: «Conferma» senza riepilogo di cosa va dove (PO-061)`, riepilogo !== null);
  if (riepilogo === null) return;
  atteso(`riepilogo: ${riepilogo} unità, sulla mappa ce ne sono ${messe} (PO-061)`, Number(riepilogo) === messe);
  const restano = await pagina.getAttribute('[data-restano]', 'data-restano', { timeout: 500 }).catch(() => null);
  atteso(`riepilogo: ${libere} unità libere ma «Ti restano» dice ${restano ?? 'niente'} (PO-061)`, libere ? Number(restano) === libere : restano === null);
  const frase = (await pagina.locator('main').textContent()).match(/\b(1 (squadre|transenne|mediatori)|([2-9]|\d\d+) (squadra|transenna|mediatore))\b/i)?.[0];
  atteso(`riepilogo: «${frase}», numero e nome non si accordano (C15-05)`, !frase);
  const attivi = await pagina.locator('.mappa .settore-punto:enabled, .mappa button.tocco-pastiglia:enabled').count();
  atteso(`riepilogo: ${attivi} punti della mappa ancora toccabili, col riepilogo aperto la mappa è solo da guardare (C15-06)`, attivi === 0);
  await fotoSe();
  await premi('[data-azione="conferma-davvero"]');
}

/** S-20 (PO-073): esporta → ricarica pulita → importa = stesso salvataggio; file rovinato = avviso e nulla
 *  cambia; con una partita, due conferme; salvataggio principale rovinato = ripresa dalla copia di riserva. */
export async function controllaArchivio(pagina, { atteso, scena, foto }) {
  const CH = 'vandelfalls-salvataggio';
  const leggi = () => pagina.evaluate((k) => localStorage.getItem(k), CH);
  await pagina.reload(); await scena('titolo');
  const prima = await leggi();
  if (!prima) { atteso('archivio: nessun salvataggio da esportare', false); return; }
  await (await import('./foto-home.mjs')).apriAltro(pagina); const [scarico] = await Promise.all([pagina.waitForEvent('download'), pagina.click('[data-azione="esporta"]')]); // PO-140: nel menu «Altro»
  atteso(`archivio: il file si chiama «${scarico.suggestedFilename()}», non vandelfalls-AAAA-MM-GG.json (D-249)`, /^vandelfalls-\d{4}-\d{2}-\d{2}\.json$/.test(scarico.suggestedFilename()));
  const percorso = await scarico.path();
  const { readFileSync } = await import('node:fs');
  const esportato = JSON.parse(readFileSync(percorso, 'utf8'));
  atteso('archivio: il file esportato non è il salvataggio', JSON.stringify(esportato) === JSON.stringify(JSON.parse(prima)));
  // ricarica pulita e importazione: senza partita entra subito
  await pagina.evaluate(() => localStorage.clear()); await pagina.reload(); await scena('titolo');
  await pagina.setInputFiles('[data-importa]', percorso);
  await pagina.waitForSelector('[data-importata]', { timeout: 3000 }).catch(() => {});
  atteso('archivio: esporta → ricarica pulita → importa non ridà lo stesso salvataggio', JSON.stringify(JSON.parse((await leggi()) ?? 'null')) === JSON.stringify(esportato));
  // file non valido: avviso, nulla cambia
  const ora = await leggi();
  await pagina.setInputFiles('[data-importa]', { name: 'rotto.json', mimeType: 'application/json', buffer: Buffer.from('{rotto') });
  await pagina.waitForSelector('[data-errore-importa]', { timeout: 3000 }).catch(() => {});
  atteso('archivio: file rovinato senza avviso', (await pagina.locator('[data-errore-importa]').count()) === 1);
  atteso('archivio: il file rovinato ha cambiato il salvataggio', (await leggi()) === ora);
  // C15-08: messaggi in parole da giocatore (niente save_version, JSON, undefined) per file estraneo, futuro e rotto
  for (const [n, x] of [['estraneo', '{"ciao": 1}'], ['futuro', '{"save_version": 99}'], ['rotto', '{rotto']]) {
    await pagina.setInputFiles('[data-importa]', { name: `${n}.json`, mimeType: 'application/json', buffer: Buffer.from(x) });
    await pagina.waitForTimeout(150);
    const msg = (await pagina.locator('[data-errore-importa]').textContent().catch(() => '')) ?? '';
    atteso(`archivio: file ${n}, messaggio «${msg}» (C15-08)`, /non è cambiata/.test(msg) && !/save_version|JSON|undefined|oggetto/.test(msg));
  }
  // con una partita: due conferme
  await pagina.setInputFiles('[data-importa]', percorso);
  const uno = await pagina.waitForSelector('[data-conferma-importa="1"]', { timeout: 3000 }).then(() => true, () => false);
  atteso('archivio: importare sopra una partita non chiede conferma', uno);
  if (uno) { await foto(); await pagina.click('[data-azione="si-importa"]'); }
  const due = await pagina.waitForSelector('[data-conferma-importa="2"]', { timeout: 3000 }).then(() => true, () => false);
  atteso('archivio: manca la seconda conferma prima di sostituire la partita', due);
  if (due) { await foto(); await pagina.click('[data-azione="si-importa"]'); }
  // salvataggio principale rovinato: si riprende dalla copia di riserva
  await pagina.evaluate((k) => localStorage.setItem(k, '{rotto'), CH); await pagina.reload(); await scena('titolo');
  atteso('archivio: salvataggio rovinato senza ripresa dalla copia di riserva (C19S01)', (await pagina.locator('[data-riserva]').count()) === 1 && (await pagina.getByRole('button', { name: 'Riprendi' }).count()) === 1);
  const dopo = await leggi(); let ripreso = null; try { ripreso = JSON.parse(dopo ?? 'null'); } catch { /* resta rovinato */ }
  atteso('archivio: dopo la ripresa il salvataggio non è quello della copia', JSON.stringify(ripreso) === JSON.stringify(esportato));
  if ((await pagina.locator('[data-riserva]').count())) await foto();
}

/** S-16 (PO-066): la conferma arriva solo dopo tre passi, con l'ultimo in magenta e «No» sempre presente.
 *  Si ferma all'ultimo passo: chi chiama sceglie se confermare o annullare. */
export async function controllaTripla(pagina, atteso, cosa, foto = async () => {}) {
  let passi = 1;
  for (;;) {
    atteso(`${cosa}: passo ${passi} senza «No»`, (await pagina.locator('.tripla [data-azione^="annulla-"]').count()) === 1);
    if (!(await pagina.locator('[data-azione="conferma-passo"]').count())) break;
    await pagina.focus('[data-azione="conferma-passo"]'); await pagina.keyboard.press('Enter'); passi++; await pagina.waitForTimeout(80); // C34-01: con la tastiera, e il fuoco non resta sul «Sì» (rosso C104R01)
    atteso(`${cosa}: al passo ${passi} il fuoco è ancora su un comando (${await pagina.evaluate(() => document.activeElement?.dataset?.azione ?? document.activeElement?.tagName)}) e non sul testo della conferma (C34-01)`, !(await pagina.evaluate(() => !!document.activeElement?.matches('button, a[href]'))));
    if (passi > 5) break;
  }
  atteso(`${cosa}: ${passi} conferme invece di 3 (PO-066)`, passi === 3);
  atteso(`${cosa}: l'ultima conferma non è in magenta (PO-066)`, (await pagina.locator('.tripla.grave').count()) === 1);
  await foto();
}

/** S-17 (PO-060): a episodio perso il verbale offre «Riparti dall'ondata N» con N = ondataVincibile (PO-083; se N > 1)
 *  e «Ricomincia»; ripartire porta allo schieramento dell'ondata N, salvato. Si fa perdere e01 dalla città. */
export async function controllaRipartenza(pagina, { atteso, scena, partita, piano, dirDati }) {
  const { ondataVincibile } = await import('../src/logica/ripartenza.ts');
  const { variabiliIniziali } = await import('../src/logica/condizioni.ts');
  const v0 = variabiliIniziali(leggiDati(dirDati)['stato.json'].variabili); // il piano del fallimento parte da qui
  const f = piano.fallimento;
  if (!f.fallita) return;
  const dich = new Map(leggiDati(dirDati)['stato.json'].variabili.map((x) => [x.id, x]));
  const n = ondataVincibile(piano.m, { rapporti: f.ondate.map((o) => o.rapporto), variabili: f.variabili }, f.ic, dich);
  await pagina.evaluate((v) => { const s = JSON.parse(localStorage.getItem('vandelfalls-salvataggio')); s.episodi = {}; s.missioni_concluse = []; s.in_corso = null; s.variabili = v; localStorage.setItem('vandelfalls-salvataggio', JSON.stringify(s)); }, v0);
  await pagina.reload(); await scena('titolo');
  await pagina.getByRole('button', { name: 'Riprendi' }).click(); await scena('citta');
  await pagina.locator(`[data-episodio="${piano.m.id}"] .settore-punto`).click();
  await pagina.click('[data-azione="avvia-episodio"]');
  await partita({ m: piano.m, ...f });
  const visto = await pagina.getAttribute('[data-azione="riparti"]', 'data-ondata', { timeout: 2000 }).catch(() => null);
  atteso(`ripartenza: il verbale offre «Riparti dall'ondata ${visto ?? '—'}», il motore dice ${n > 1 ? n : 'solo «Ricomincia»'} (PO-060)`, n > 1 ? visto === String(n) : visto === null);
  atteso('ripartenza: manca «Ricomincia l\'episodio»', (await pagina.locator('[data-azione="rigioca"]').count()) === 1);
  if (n <= 1 || visto === null) { // C16-01: perso già alla prima ondata → solo «Ricomincia»; si rientra nell'episodio per i controlli dopo
    await pagina.click('[data-azione="rigioca"]'); await scena('sala');
    await avanzaFino(pagina, '[data-azione="avanti"]', async () => {}); await pagina.click('[data-azione="avanti"]'); await scena('briefing');
    for (let i = 0; i < 20 && !(await pagina.locator('[data-azione="inizia"]:visible').count()); i++) {
      const avanti = pagina.locator('[data-azione="prossimo"]:visible, [data-azione="passo"]:visible').first();
      if (await avanti.count()) await avanti.click(); else break;
    }
    await pagina.click('[data-azione="inizia"]'); await scena('schieramento');
    return;
  }
  await pagina.click('[data-azione="riparti"]'); await scena('schieramento');
  const [ondata, salvata] = await pagina.evaluate(() => [document.querySelector('main')?.dataset.ondata, JSON.parse(localStorage.getItem('vandelfalls-salvataggio'))?.in_corso?.ondata]);
  atteso(`ripartenza: dopo «Riparti» si è all'ondata ${ondata} (salvata ${salvata}), non alla ${n} (PO-060)`, ondata === String(n) && salvata === n);
}

/** S-18 (PO-056): alla prima «Nuova partita», dopo il genere, la guida a passi; si salta dal primo passo
 *  («Salta») oppure si arriva a «Iniziamo»; poi la città. */
export async function controllaGuida(pagina, { atteso, scena, foto, salta }) {
  const c = await scena('guida').then(() => true, () => false);
  atteso('prima partita: dopo il genere manca la guida introduttiva (PO-056)', c);
  if (!c) return;
  atteso('guida introduttiva: al primo passo manca «Salta»', (await pagina.locator('[data-azione="guida-salta"]').count()) === 1);
  await foto();
  if (salta) { await pagina.click('[data-azione="guida-salta"]'); return; }
  let passi = 1;
  const vignetta = async () => atteso(`guida passo ${passi}: manca la vignetta (S-23, PO-078)`, await pagina.locator(passi === 1 ? '[data-guida-testata] [data-vignetta="home"], [data-vignetta="guida-1"]' : `[data-vignetta="guida-${passi}"]`).first().isVisible().catch(() => false)); // D-210: al passo 1 la vignetta della home
  await vignetta();
  while (await pagina.locator('[data-azione="guida-avanti"]').count()) {
    await pagina.click('[data-azione="guida-avanti"]'); passi++; await vignetta(); await foto();
    // C16-04: a metà guida non è ancora «vista» (se l'app si chiude qui, la prossima volta torna)
    if (passi === 3) atteso('guida introduttiva: segnata «vista» prima di finirla (C16-04)', (await pagina.evaluate(() => localStorage.getItem('vandelfalls-guida-vista'))) !== 'si');
  }
  atteso(`guida introduttiva: ${passi} passi, ne servono 6`, passi === 6);
  await pagina.click('[data-azione="guida-fine"]');
}

/** S-21 (D-104, C14-05): il tasto indietro non esce dal gioco e non annulla niente. Dall'episodio in corso porta
 *  alla home (salvataggio identico, «Riprendi» torna lì); il pulsante «Home» fa lo stesso; dalla città, alla home. */
export async function controllaIndietro(pagina, { atteso, scena }) {
  const salvato = () => pagina.evaluate(() => localStorage.getItem('vandelfalls-salvataggio'));
  const dove = () => pagina.evaluate(() => document.querySelector('.scena')?.dataset.scena ?? `fuori dal gioco (${location.href})`);
  const qui = await dove(); const prima = await salvato();
  if (!['schieramento', 'chiamata', 'chiusura', 'rapporto'].includes(qui)) { atteso(`indietro: si doveva partire da un episodio in corso, non da «${qui}»`, false); return; }
  await pagina.goBack().catch(() => {}); await scena('titolo').catch(() => {});
  atteso(`indietro dall'episodio («${qui}»): si arriva a «${await dove()}», non alla home (D-104)`, (await dove()) === 'titolo');
  atteso('indietro dall\'episodio: il salvataggio è cambiato (D-104)', (await salvato()) === prima);
  if ((await dove()) !== 'titolo') return;
  await pagina.getByRole('button', { name: 'Riprendi' }).click(); await scena(qui).catch(() => {});
  atteso(`indietro, poi «Riprendi»: si torna a «${await dove()}», non a «${qui}»`, (await dove()) === qui);
  await pagina.click('[data-azione="home"]'); await scena('titolo').catch(() => {});
  atteso(`«Home» dall'episodio porta a «${await dove()}» (C14-05)`, (await dove()) === 'titolo' && (await salvato()) === prima);
  // dalla città: la partita in corso si lascia con «Riprendi» → episodio; la città si vede con una partita senza episodio in corso
  await pagina.evaluate(() => { const s = JSON.parse(localStorage.getItem('vandelfalls-salvataggio')); s.in_corso = null; localStorage.setItem('vandelfalls-salvataggio', JSON.stringify(s)); });
  await pagina.reload(); await scena('titolo'); await pagina.getByRole('button', { name: 'Riprendi' }).click(); await scena('citta');
  await pagina.goBack().catch(() => {}); await scena('titolo').catch(() => {});
  atteso(`indietro dalla città: si arriva a «${await dove()}», non alla home (C14-05)`, (await dove()) === 'titolo');
}

/** S-21: il pulsante «Home» sulla mappa non copre punti né nomi dei settori. */
export async function controllaHome(pagina, nome, atteso) {
  const sopra = await pagina.evaluate(() => {
    const h = document.querySelector('.mappa > .tasto-home')?.getBoundingClientRect();
    if (!h) return [];
    const inter = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    return [...document.querySelectorAll('.mappa .settore-punto, .mappa .settore-nome')].filter((e) => inter(h, e.getBoundingClientRect()) > 4)
      .map((e) => e.closest('[data-settore]')?.dataset.settore ?? '?');
  });
  atteso(`${nome}: il pulsante «Home» copre ${sopra.join(', ')} (S-21)`, sopra.length === 0);
}

/** PO-099 (D-116, sostituisce C14-11): prendendo ogni unità, nello schieramento non compare nessun suggerimento su dove
 *  rende («Rende di più», «normale», «qui non serve», «Dimezza»): era uno spoiler. Si prova all'ondata 1. */
export async function controllaRende(pagina, m, n, atteso) {
  if (n !== 1) return;
  for (const r of Object.keys(m.mappa.risorse)) {
    const b = pagina.locator(`[data-risorsa="${r}"]:not([disabled])`);
    if (!(await b.count())) continue;
    await b.click();
    const [spia, testo] = await pagina.evaluate(() => [document.querySelectorAll('[data-rende]').length, document.querySelector('main')?.textContent ?? '']);
    atteso(`${m.id}: con «${r}» in mano lo schieramento suggerisce dove rende (PO-099)`, spia === 0 && !/Rende di più|qui non serve|Dimezza/.test(testo));
  }
}

/** S-23 (PO-078): la vignetta della schermata si vede (sala: apertura; verbale: esito). Rosso __NO_C26V01. */
export { controllaVignetta } from './foto-c22.mjs'; // D-126 d: spostata per la misura dei moduli (400 righe)

/** C16-06: «Riparti dall'ondata N» non lascia il numero da solo sull'ultima riga. Si fa perdere, dalla città, il primo
 *  episodio il cui fallimento dà una ripartenza N > 1 (e01 dopo C16-01 offre solo «Ricomincia»). */
export async function controllaRipartiTesto(pagina, { atteso, scena, partita, pianoAttento, dirDati }) {
  const { ondataVincibile } = await import('../src/logica/ripartenza.ts'); // PO-083: la stessa regola dell'app
  const dich = new Map(leggiDati(dirDati)['stato.json'].variabili.map((x) => [x.id, x]));
  const { missioniDai, salvataggioTutti, apriDallaCitta } = await import('./foto-bozze.mjs');
  const { missioni, v0 } = missioniDai(dirDati);
  let scelto = null;
  for (let i = 0; i < missioni.length && !scelto; i++) {
    const p = pianoAttento(dirDati, i, v0); const f = p?.fallimento;
    if (f?.fallita && f.ic && ondataVincibile(p.m, { rapporti: f.ondate.map((o) => o.rapporto), variabili: f.variabili }, f.ic, dich) > 1) scelto = p;
  }
  if (!scelto) { atteso('C16-06: nessun episodio con ripartenza oltre la prima ondata, il controllo non si può fare', false); return; }
  await pagina.evaluate((v) => localStorage.setItem('vandelfalls-salvataggio', v), JSON.stringify(salvataggioTutti(missioni, v0)));
  await pagina.reload(); await scena('titolo');
  await pagina.getByRole('button', { name: 'Riprendi' }).click(); await scena('citta');
  await apriDallaCitta(pagina, scelto.m, atteso);
  await partita({ m: scelto.m, ...scelto.fallimento });
  const ultima = await pagina.evaluate(() => {
    const b = document.querySelector('[data-azione="riparti"]'); if (!b) return -1;
    const t = [...b.childNodes].find((x) => x.nodeType === 3); if (!t) return 999;
    const r = document.createRange(); r.selectNodeContents(t); return Math.round([...r.getClientRects()].at(-1).width);
  });
  atteso(`${scelto.m.id} verbale perso: manca «Riparti dall'ondata»`, ultima !== -1);
  atteso(`${scelto.m.id} verbale perso: l'ultima riga di «Riparti dall'ondata» è larga ${ultima} px, il numero è rimasto solo (C16-06)`, ultima === -1 || ultima > 30);
  // C17-04: ricaricando sul verbale, «Riprendi» riporta al verbale e «Riparti» c'è ancora, dalla stessa ondata
  const prima = await pagina.getAttribute('[data-azione="riparti"]', 'data-ondata').catch(() => null);
  await pagina.reload(); await scena('titolo'); await pagina.getByRole('button', { name: 'Riprendi' }).click(); await scena('verbale').catch(() => {});
  const dopo = await pagina.getAttribute('[data-azione="riparti"]', 'data-ondata', { timeout: 2000 }).catch(() => null);
  atteso(`${scelto.m.id}: dopo una ricarica sul verbale «Riparti» ${dopo ? `dall'ondata ${dopo}` : 'sparisce'}, prima era dall'ondata ${prima} (C17-04)`, prima !== null && dopo === prima);
}

/** S-26 (PO-081): tornando dal background (pagina nascosta e poi visibile) e dopo la perdita e il ripristino del
 *  contesto WebGL, lo sfondo della mappa si ridisegna e la mappa ha lo stesso aspetto (media dei pixel). */
export async function controllaRidisegno(pagina, atteso, dove) {
  if ((await pagina.getAttribute('.mappa', 'data-mappa')) !== 'webgl') return;
  const media = async () => {
    const png = (await pagina.locator('.mappa').first().screenshot()).toString('base64');
    return pagina.evaluate(async (png) => {
      const i = new Image(); i.src = `data:image/png;base64,${png}`; await i.decode();
      const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const f = c.getContext('2d'); f.drawImage(i, 0, 0);
      const d = f.getImageData(0, 0, c.width, c.height).data; let s = 0; for (let k = 0; k < d.length; k += 4) s += d[k] + d[k + 1] + d[k + 2];
      return s / (d.length / 4) / 3;
    }, png);
  };
  const prima = await media(); const volte = Number(await pagina.getAttribute('.mappa', 'data-sfondo') ?? 0); const aloni = await pagina.getAttribute('.mappa', 'data-aloni');
  await pagina.evaluate(async () => {
    const stato = (v) => { Object.defineProperty(document, 'visibilityState', { value: v, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); };
    stato('hidden'); stato('visible');
    const gl = document.querySelector('.mappa canvas')?.getContext('webgl2') ?? document.querySelector('.mappa canvas')?.getContext('webgl');
    const e = gl?.getExtension('WEBGL_lose_context');
    if (e) { e.loseContext(); await new Promise((ok) => setTimeout(ok, 200)); e.restoreContext(); }
  });
  await pagina.waitForTimeout(800);
  const dopo = await media(); const volte2 = Number(await pagina.getAttribute('.mappa', 'data-sfondo') ?? 0);
  const aloni2 = await pagina.getAttribute('.mappa', 'data-aloni');
  atteso(`${dove}: dopo il background gli aloni della tensione sono ${aloni2} invece di ${aloni} (S-26)`, aloni2 === aloni);
  atteso(`${dove}: tornando dal background lo sfondo della mappa non si ridisegna (${volte} → ${volte2}) (S-26)`, volte2 >= volte + 2);
  atteso(`${dove}: dopo il background la mappa è cambiata (media dei pixel ${prima.toFixed(1)} → ${dopo.toFixed(1)}) (S-26)`, Math.abs(prima - dopo) < 8);
}
