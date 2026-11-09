// Schieramento compatto (S-24, C16-02): ogni ondata dei 36 episodi, ripresa dalla home con uno stato calcolato dal
// motore (giocatore equilibrato), a 360×760: zero scorrimento e la barra in basso non copre niente. e03 ondata 3
// anche a 375×812 e 412×915, con foto (è la schermata della foto del PO).
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { leggiDati } from './dati-disco.mjs';
import { variabiliIniziali } from '../src/logica/condizioni.ts';
import { chiamateAperte, chiudiOndata, iniziaMissione, missioneFinita, rispondi, schiera } from '../src/logica/missione.ts';
import { attenta, equilibrata } from '../src/logica/bot.ts';
import { creaCaso } from '../src/logica/caso.ts';
import { salvataggioTutti } from './foto-bozze.mjs';

/** Stati all'inizio di ogni ondata, per missione. */
function partenze(dirDati) {
  const dati = leggiDati(dirDati);
  const dich = new Map(dati['stato.json'].variabili.map((d) => [d.id, d]));
  const v0 = variabiliIniziali(dich.values());
  const missioni = Object.entries(dati).filter(([k]) => k.startsWith('missioni/')).map(([, x]) => x).sort((a, b) => a.episodio - b.episodio);
  const stati = [];
  for (const m of missioni) {
    const g = equilibrata(creaCaso(1), dich);
    let s = iniziaMissione(m, v0, dich);
    while (!missioneFinita(m, s)) {
      stati.push({ m, n: s.ondata, s });
      s = schiera(m, s, g.schiera(m, s));
      for (let c = chiamateAperte(m, s)[0]; c; c = chiamateAperte(m, s)[0]) s = rispondi(m, s, c.id, g.scegli(m, s, c), dich);
      s = chiudiOndata(m, s, dich);
    }
  }
  return { missioni, v0, stati };
}

/** Gli stati all'inizio di ogni ondata con la disposizione del bot attento (C26-11: la sonda del collaudo gioca così). */
export function partenzeAttente(dirDati) {
  const dati = leggiDati(dirDati), dich = new Map(dati['stato.json'].variabili.map((d) => [d.id, d])), v0 = variabiliIniziali(dich.values());
  const missioni = Object.entries(dati).filter(([k]) => k.startsWith('missioni/')).map(([, x]) => x).sort((a, b) => a.episodio - b.episodio), stati = [];
  for (const m of missioni) {
    const g = attenta(creaCaso(1), dich); let s = iniziaMissione(m, v0, dich);
    while (!missioneFinita(m, s)) {
      const d = g.schiera(m, s); stati.push({ m, n: s.ondata, s, d }); s = schiera(m, s, d);
      for (let c = chiamateAperte(m, s)[0]; c; c = chiamateAperte(m, s)[0]) s = rispondi(m, s, c.id, g.scegli(m, s, c), dich);
      s = chiudiOndata(m, s, dich);
    }
  }
  return stati;
}

/** C26-11: sulla mappa dello schieramento nessun nome di settore sopra un altro, e ogni pastiglia toccabile prende il
 *  tocco al suo centro (non il disco di un altro settore). Le unità si mettono come il bot attento (il caso del
 *  collaudo: e06 a 360, mediatore di Piazza del concerto), con la bozza nel salvataggio. Rosso VALMORA_ROSSI=C77E01. */
// C33-04: ogni disposizione delle etichette riscrive data-unita su tutti i settori; dopo un caricamento o un cambio di
// misura il ResizeObserver può arrivare anche dopo 500 ms, quindi un'attesa fissa (120 ms) leggeva uno stato di mezzo.
// Si contano le scritture e si aspetta che la mappa stia ferma 500 ms (con `almenoUna`, dopo almeno una disposizione).
export const ascoltaEtichette = (pagina) => pagina.evaluate(() => { const m = document.querySelector('.mappa:not(.citta)'), g = (globalThis.__etichette = { n: 0, ultimo: performance.now() });
  globalThis.__etichetteO?.disconnect(); if (m) (globalThis.__etichetteO = new MutationObserver(() => { g.n++; g.ultimo = performance.now(); })).observe(m, { attributes: true, subtree: true, attributeFilter: ['data-unita', 'data-nome'] }); });
// 0.38.0 (CI rossa su e14 o1 a 360): in CI il carattere arrivava dopo i 500 ms di quiete e il guardiano misurava i nomi
// col carattere di riserva (stato di passaggio: arrivato il carattere, il gioco ridispone). Ora si aspetta anche che i
// caratteri siano caricati; la pagina del giro con le unità a 360 li rallenta apposta (CARATTERE_LENTO), così il caso della
// CI si ripete ovunque. Senza questa attesa (VALMORA_SENZA_FONT=1) il guardiano torna rosso su e14 o1.
const SENZA_FONT = !!process.env.VALMORA_SENZA_FONT;
export const etichetteFerme = (pagina, almenoUna = false) => pagina.waitForFunction(([a, f]) => { const g = globalThis.__etichette; return !!g && (!a || g.n > 0) && (f || document.fonts.status === 'loaded') && performance.now() - g.ultimo > 500; }, [almenoUna, SENZA_FONT], { timeout: 8000, polling: 100 }).then(() => true, () => false);
export const CARATTERE_LENTO = 1500; // ms: con 800 il carattere arrivava già sul titolo e il caso della CI non si ripeteva (sonda c27-ferme, e14 o1); solo a 360 (col routing la cache è spenta: ogni ricarica lo paga)
const rallentaCaratteri = (p) => p.route('**/*.woff2', async (r) => { await new Promise((ok) => setTimeout(ok, CARATTERE_LENTO)); await r.continue(); });

export async function mappaSchieramento(pagina) {
  return pagina.evaluate(() => {
    const a = (A, B) => Math.max(0, Math.min(A.right, B.right) - Math.max(A.left, B.left)) * Math.max(0, Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top));
    // pastiglia su nome come nella sonda del collaudo C-027: più di 1 px in tutte e due le direzioni
    const lati = (A, B) => Math.min(A.right, B.right) - Math.max(A.left, B.left) > 1 && Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top) > 1;
    // C33-01: il nome col testo vero (riquadro ∪ righe del testo), non solo il riquadro
    const testo = (n) => { const r = document.createRange(); r.selectNodeContents(n); const rs = [n.getBoundingClientRect(), ...r.getClientRects()].filter((q) => q.width && q.height);
      return { left: Math.min(...rs.map((q) => q.left)), top: Math.min(...rs.map((q) => q.top)), right: Math.max(...rs.map((q) => q.right)), bottom: Math.max(...rs.map((q) => q.bottom)) }; };
    const nomi = [...document.querySelectorAll('.mappa:not(.citta) .settore-nome')].filter((n) => n.getClientRects().length).map((n) => [n.textContent, testo(n)]);
    const sopra = nomi.flatMap(([t, r], i) => nomi.slice(0, i).filter(([, q]) => a(r, q) > 0.5).map(([u]) => `${t} × ${u}`));
    const coperte = [...document.querySelectorAll('.mappa button.tocco-pastiglia:enabled')].filter((b) => b.getClientRects().length).filter((b) => {
      const r = b.getBoundingClientRect(), x = (r.left + r.right) / 2, y = (r.top + r.bottom) / 2; if (y < 0 || y > innerHeight) return false;
      const t = document.elementFromPoint(x, y); return !(t && (b === t || b.contains(t)));
    }).map((b) => b.dataset.presenza);
    // C27-06: nessuna pastiglia sopra il nome di un settore (e19 «Magazzino delle fonderie» × «1», 34,6×22,6 px). Rosso C81P01.
    const suNomi = [...document.querySelectorAll('.mappa:not(.citta) .settore-unita .pastiglia')].filter((e) => e.getClientRects().length)
      .flatMap((e) => nomi.filter(([, q]) => lati(e.getBoundingClientRect(), q)).map(([t, q]) => `«${e.textContent}» di ${e.closest('[data-settore]')?.dataset.settore} × ${t} ${a(e.getBoundingClientRect(), q).toFixed(0)} px²`));
    // C27-06: e nessuna pastiglia oltre il bordo della mappa (dentro di 1 px almeno)
    const m = document.querySelector('.mappa:not(.citta)')?.getBoundingClientRect();
    const fuori = !m ? [] : [...document.querySelectorAll('.mappa:not(.citta) .settore-unita .pastiglia')].filter((e) => e.getClientRects().length)
      .filter((e) => { const r = e.getBoundingClientRect(); return r.left < m.left + 1 || r.right > m.right - 1 || r.top < m.top + 1 || r.bottom > m.bottom - 1; })
      .map((e) => `«${e.textContent}» di ${e.closest('[data-settore]')?.dataset.settore}`);
    // C33-05: il gruppo di pastiglie di un settore (centro dell'unione) più vicino al disco di un altro settore che al proprio
    const centro = (r) => [(r.left + r.right) / 2, (r.top + r.bottom) / 2], dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
    const dischi = [...document.querySelectorAll('.mappa:not(.citta) [data-settore]')].map((x) => [x, centro(x.querySelector('.settore-punto').getBoundingClientRect())]);
    const vicine = dischi.flatMap(([x, mio]) => { const ps = [...x.querySelectorAll('.settore-unita .pastiglia')].filter((e) => e.getClientRects().length).map((e) => e.getBoundingClientRect()); if (!ps.length) return [];
      const c = centro({ left: Math.min(...ps.map((r) => r.left)), top: Math.min(...ps.map((r) => r.top)), right: Math.max(...ps.map((r) => r.right)), bottom: Math.max(...ps.map((r) => r.bottom)) });
      const [altro, d] = dischi.filter(([y]) => y !== x).map(([y, q]) => [y.dataset.settore, dist(c, q)]).sort((u, v) => u[1] - v[1])[0] ?? [null, Infinity];
      return d < dist(c, mio) ? [`${x.dataset.settore} ${dist(c, mio).toFixed(0)} px dal suo disco, ${d.toFixed(0)} da ${altro}`] : []; });
    // C-008 (come nel giro foto, tools/foto.mjs): area di tocco di un'unità sopra un nome (anche il proprio), più di 4 px²
    const tocchiSuNomi = [...document.querySelectorAll('.mappa:not(.citta) [data-presenza]')].flatMap((t) => nomi.map(([n, q]) => [n, Math.round(a(t.getBoundingClientRect(), q))]).filter(([, x]) => x > 4).map(([n, x]) => `${t.dataset.presenza} × ${n} ${x} px²`));
    // D-145 (C33-01 / C-008): un'area di tocco può stare sopra un nome, ma non lo «ruba»: (a) il suo centro non cade sul
    // nome di un ALTRO settore; (b) toccando il nome (centro di ogni riga del testo) non si colpisce un tocco: si
    // ritirerebbe un'unità per sbaglio.
    const rubati = [];
    const elNomi = [...document.querySelectorAll('.mappa:not(.citta) .settore-nome')].filter((n) => n.getClientRects().length);
    for (const t of document.querySelectorAll('.mappa:not(.citta) [data-presenza]')) { const q = t.getBoundingClientRect(), x = (q.left + q.right) / 2, y = (q.top + q.bottom) / 2, mio = t.closest('[data-settore]');
      for (const n of elNomi) if (n.closest('[data-settore]') !== mio) { const r = document.createRange(); r.selectNodeContents(n); if ([...r.getClientRects()].some((z) => x >= z.left && x <= z.right && y >= z.top && y <= z.bottom)) rubati.push(`centro del tocco ${t.dataset.presenza} sul nome ${n.textContent}`); } }
    for (const n of elNomi) { const r = document.createRange(); r.selectNodeContents(n);
      for (const z of r.getClientRects()) { const x = (z.left + z.right) / 2, y = (z.top + z.bottom) / 2; if (y < 0 || y > innerHeight) continue;
        const e = document.elementFromPoint(x, y)?.closest('[data-presenza]'); if (e) rubati.push(`toccando «${n.textContent}» si colpisce ${e.dataset.presenza}`); } }
    // C37-03: il nome (bordo più vicino) più vicino al disco di un altro settore che al proprio (e19 a mappa vuota, 16 contro 22 px)
    const nomiVicini = dischi.flatMap(([x, mio]) => { const n = x.querySelector('.settore-nome'); if (!n || !n.getClientRects().length) return []; const r = n.getBoundingClientRect();
      const d = (q) => Math.hypot(Math.max(r.left - q[0], 0, q[0] - r.right), Math.max(r.top - q[1], 0, q[1] - r.bottom)), m = d(mio);
      const [altro, a2] = dischi.filter(([y]) => y !== x).map(([y, q]) => [y.dataset.settore, d(q)]).sort((u, v) => u[1] - v[1])[0] ?? [null, Infinity];
      return a2 < m ? [`nome ${x.dataset.settore} a ${m.toFixed(0)} px dal suo disco, ${a2.toFixed(0)} da ${altro}`] : []; });
    return { sopra, coperte, suNomi, fuori, vicine, tocchiSuNomi, rubati, nomiVicini };
  });
}

/** Rettangoli di testo e comandi che la barra fissa dello schieramento copre (S-24). */
export const copertiDallaBarra = (pagina) => pagina.evaluate(() => {
  const barra = document.querySelector('[data-barra]');
  if (!barra) return [];
  const b = barra.getBoundingClientRect();
  const inter = (a) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return [...document.querySelectorAll('main button, main a, main [role="status"], main p, main .unita, main .settore-nome, main .pastiglia')]
    .filter((e) => !barra.contains(e) && e.getClientRects().length && inter(e.getBoundingClientRect()) > 1)
    .map((e) => (e.dataset.risorsa ?? e.dataset.azione ?? e.textContent.trim().slice(0, 24)));
});

const NOMI_VICINI = { 360: 6, 375: 3, 412: 0 }; // C37-03 con le unità, misurati il 18/10 col peso × 100 (residuo dichiarato, vedi CONSEGNA-PO121-C37.md)
const VICINE = { 360: 36, 375: 29, 412: 9 }; // C33-05: i valori della 0.31.0 misurati dal collaudo C-033 (0.32.0: 44 / 32 / 14)
const PARALLELE = 3; // pagine insieme nel giro con le unità (attese, non calcolo)
const PASTIGLIE_SU_NOMI = 0; // C27-06: 7 il 15/10; D-136 (C28-14): a 0 col nome su più righe e due posti in più (rosso C94N01: 7)

// La larghezza «sola» è quella del giro (CI: un job per larghezza, PO-128): ogni job fa la sua parte. Prima tutto stava nel
// job a 360, che durava 35-38 minuti contro gli 8-10 degli altri (misura del 19/10: 1626 s su 2830 di «foto» a 360).
export async function controllaSchieramenti(browser, url, dirDati, cartella, atteso, rossi = [], sola = null) {
  const tocca = (w) => sola === null || sola === w;
  // ogni pagina nuova riceve gli stessi interruttori rossi del giro (altrimenti il braccio rosso qui è cieco)
  const nuova = async (o) => { const q = await browser.newPage(o); if (rossi.length) await q.addInitScript((xs) => { for (const x of xs) globalThis[`__NO_${x}`] = true; }, rossi); return q; };
  const { missioni, v0, stati } = partenze(dirDati);
  const base = salvataggioTutti(missioni, v0);
  const prova = async (pagina, st, nome, fotografa) => {
    await pagina.evaluate((v) => localStorage.setItem('vandelfalls-salvataggio', v), JSON.stringify({ ...base, in_corso: st.s }));
    await pagina.reload();
    await pagina.getByRole('button', { name: 'Riprendi' }).click();
    // strumento instabile (28/10, 4-5 Chrome insieme nel contenitore: e15 a 360 ed e03 a 412 «non si apre», verdi al secondo
    // tentativo): 5 s non bastavano sotto carico. Si attende la barra fino a 15 s: uno schieramento che non si apre resta rosso.
    const ok = await pagina.waitForSelector('[data-barra]', { timeout: 15000 }).then(() => true, () => false);
    if (!ok) { atteso(`${nome}: lo schieramento non si apre`, false); return; }
    await ascoltaEtichette(pagina); await etichetteFerme(pagina); // C37-03: a mappa vuota ogni nome più vicino al suo disco che agli altri
    const vuota = await mappaSchieramento(pagina); atteso(`${nome} (mappa vuota): ${vuota.nomiVicini.join('; ')} (C37-03)`, !vuota.nomiVicini.length);
    const [h, alt] = await pagina.evaluate(() => [document.documentElement.scrollHeight, innerHeight]);
    atteso(`${nome}: ${h - alt} px di scorrimento nello schieramento (S-24)`, h <= alt);
    const coperti = await copertiDallaBarra(pagina);
    atteso(`${nome}: la barra in basso copre ${coperti.join(', ')} (S-24, C16-02)`, coperti.length === 0);
    if (fotografa) await pagina.screenshot({ path: join(cartella, `${nome.replace(/[^a-z0-9]+/gi, '-')}.png`) });
  };
  if (tocca(360)) {
    const p = await nuova({ viewport: { width: 360, height: 760 }, reducedMotion: 'reduce' });
    await p.goto(url);
    for (const st of stati) await prova(p, st, `${st.m.id} ondata ${st.n} 360×760`, st.m.id === 'e03' && st.n === 3);
    await p.close();
  }
  // C26-11: ogni ondata di ogni episodio con le unità del bot attento già messe (bozza nel salvataggio); C33-01: a 360,
  // 375 e 412 (prima solo 360)
  const suNomi = [], attente = partenzeAttente(dirDati);
  for (const [w, h] of [[360, 760], [375, 812], [412, 915]].filter(([w]) => tocca(w))) {
    // 7/11 (verifica del principale su c456106b): uno schieramento che non si apriva in 5 s era saltato in silenzio (139 controlli
    // contro 142 a 360×760). Ora attende 15 s come il giro a mappa vuota, il mancante è rosso e il giro dice quanti ne ha aperti.
    const vicine = [], tocchi = [], rubati = [], nomiVicini = []; let aperti = 0;
    // Gli stati sono indipendenti e il tempo è quasi tutto attesa (carattere rallentato a 360, 500 ms di quiete): si fanno su
    // più pagine insieme (prima una sola: il job a 360 durava 35-38 minuti). Gli elenchi cambiano ordine, conteggi e soglie no.
    const pagine = await Promise.all(Array.from({ length: PARALLELE }, async () => { const q = await nuova({ viewport: { width: w, height: h }, reducedMotion: 'reduce' }); if (w === 360) await rallentaCaratteri(q); await q.goto(url); return q; }));
    const corpo = async (q6, st) => {
      await q6.evaluate((v) => localStorage.setItem('vandelfalls-salvataggio', v), JSON.stringify({ ...base, in_corso: st.s, bozza: { missione: st.s.missione, ondata: st.s.ondata, d: st.d } }));
      await q6.reload(); await q6.getByRole('button', { name: 'Riprendi' }).click();
      if (!(await q6.waitForSelector('[data-barra]', { timeout: 15000 }).then(() => true, () => false))) { atteso(`${st.m.id} ondata ${st.n} ${w}×${h} con le unità: lo schieramento non si apre in 15 s (controllo mancante)`, false); return; }
      aperti++;
      await ascoltaEtichette(q6); await etichetteFerme(q6);
      const r = await mappaSchieramento(q6), dove = `${st.m.id} ondata ${st.n} ${w}×${h}`;
      atteso(`${dove} con le unità: nomi sovrapposti ${r.sopra.join('; ')}, pastiglie col centro coperto ${r.coperte.join(', ')} (C26-11)`, !r.sopra.length && !r.coperte.length);
      if (r.suNomi.length) suNomi.push(`${dove}: ${r.suNomi.join('; ')}`);
      vicine.push(...r.vicine.map((x) => `${st.m.id} o${st.n} ${x}`));
      tocchi.push(...r.tocchiSuNomi.map((x) => `${st.m.id} o${st.n} ${x}`));
      rubati.push(...r.rubati.map((x) => `${st.m.id} o${st.n} ${x}`));
      atteso(`${dove} con le unità: pastiglie sopra i nomi ${r.suNomi.join('; ')} (C27-06, il caso del collaudo)`, st.m.id !== 'e19' || !r.suNomi.length);
      atteso(`${dove} con le unità: pastiglie fuori dalla mappa ${r.fuori.join('; ')} (C27-06)`, !r.fuori.length);
      nomiVicini.push(...r.nomiVicini.map((x) => `${st.m.id} o${st.n} ${x}`));
      if (w === 360) { // C33-04: la disposizione non dipende dallo stato del giro prima (rosso VALMORA_ROSSI=C102D01; anche C272W02: il «prima» del D-272 fuori dalla mossa, 132 su 1044 a 360)
        const posti = () => q6.evaluate(() => [...document.querySelectorAll('.mappa:not(.citta) [data-settore]')].map((x) => `${x.dataset.settore}:${x.dataset.nome}/${x.dataset.unita}/${x.querySelector('.settore-nome')?.style.maxWidth ?? ''}`).join(' '));
        const prima = await posti();
        // la mappa deve cambiare misura (w+1: in 25 ondate non cambiava) e la disposizione finale deve partire dallo stato sporco
        await ascoltaEtichette(q6); await q6.setViewportSize({ width: w + 24, height: h + 24 }); await etichetteFerme(q6, true);
        await q6.evaluate(() => { for (const x of document.querySelectorAll('.mappa:not(.citta) [data-settore]')) { x.setAttribute('data-unita', 'sotto'); x.querySelector('.settore-nome')?.style.setProperty('max-width', 'calc(var(--nome-max) * 0.6)'); } });
        await ascoltaEtichette(q6); await q6.setViewportSize({ width: w, height: h });
        const rifatta = await etichetteFerme(q6, true), dopo = await posti();
        atteso(`${dove}: la disposizione cambia ripartendo da un altro stato (C33-04): ${!rifatta ? 'non ridisposta in 8 s' : prima === dopo ? '' : dopo.split(' ').filter((x, i) => x !== prima.split(' ')[i]).join(' ')}`, rifatta && prima === dopo);
      }
        };
    await Promise.all(pagine.map((q6, k) => (async () => { for (const st of attente.filter((_, i) => i % PARALLELE === k)) await corpo(q6, st); })()));
    for (const q6 of pagine) await q6.close();
    atteso(`${w}×${h} con le unità: ${aperti} schieramenti aperti su ${attente.length}`, aperti === attente.length);
    // C33-05: non più gruppi vicini al disco di un altro settore che nella 0.31.0 (36 / 29 / 9, collaudo C-033); elenco in cartella
    writeFileSync(join(cartella, `vicine-${w}.txt`), `${vicine.length}\n${vicine.join('\n')}\n`);
    writeFileSync(join(cartella, `tocchi-${w}.txt`), `${new Set(tocchi.map((x) => x.split(' ').slice(0, 2).join(' '))).size} ondate\n${tocchi.join('\n')}\n`); // misura, senza soglia
    // D-145 (C33-01): nessun nome «rubato» da un'area di tocco, tetto 0 (rosso C106T01: e35 ondata 2 a 360)
    writeFileSync(join(cartella, `rubati-${w}.txt`), `${new Set(rubati.map((x) => x.split(' ').slice(0, 2).join(' '))).size} ondate\n${rubati.join('\n')}\n`);
    // C37-03 con le unità: al massimo i casi misurati il 18/10 (e19 o2-o4 come col rosso C111E01, e02/e15/e18 o4): 6 a 360, 3 a 375, 0 a 412
    atteso(`${w}×${h} con le unità: ${nomiVicini.length} nomi più vicini a un disco altrui (al massimo ${NOMI_VICINI[w]}): ${nomiVicini.join(' | ')} (C37-03)`, nomiVicini.length <= NOMI_VICINI[w]);
    atteso(`${w}×${h}: nomi rubati da un'area di tocco: ${rubati.join(' | ')} (D-145, C33-01)`, !rubati.length);
    atteso(`${w}×${h}: ${vicine.length} gruppi di pastiglie più vicini al disco di un altro settore (al massimo ${VICINE[w]}) (C33-05)`, vicine.length <= VICINE[w]);
  }
  // C27-06 / D-136: nessuna ondata con una pastiglia sopra un nome (7 su 142 prima di C28-14, 19 col rosso C81P01).
  atteso(`schieramenti con le unità: ${suNomi.length} ondate con pastiglie sopra i nomi (al massimo ${PASTIGLIE_SU_NOMI}): ${suNomi.join(' | ')} (C27-06)`, suNomi.length <= PASTIGLIE_SU_NOMI);
  // C33-03: le unità messe una alla volta coi tocchi (unità, poi settore), come il giocatore: dopo ogni tocco nessun tocco
  // coperto né nome su nome (caricando tutto dalla bozza il caso di e06 non si vedeva). Prima ondata di ogni episodio, 360.
  const qp = await nuova({ viewport: { width: 360, height: 760 }, reducedMotion: 'reduce' }); await qp.goto(url);
  for (const st of tocca(360) ? attente.filter((x) => x.n === 1) : []) {
    await qp.evaluate((v) => localStorage.setItem('vandelfalls-salvataggio', v), JSON.stringify({ ...base, in_corso: st.s }));
    await qp.reload(); await qp.getByRole('button', { name: 'Riprendi' }).click();
    if (!(await qp.waitForSelector('[data-barra]', { timeout: 15000 }).then(() => true, () => false))) { atteso(`${st.m.id} ondata 1 360×760 coi tocchi: lo schieramento non si apre in 15 s (controllo mancante, C33-03)`, false); continue; }
    const male = new Set();
    for (const [ris, posti] of Object.entries(st.d)) for (const [sett, n] of Object.entries(posti)) for (let k = 0; k < n; k++) {
      if ((await qp.getAttribute(`[data-risorsa="${ris}"]`, 'aria-pressed').catch(() => null)) !== 'true') await qp.click(`[data-risorsa="${ris}"]`).catch(() => {});
      await ascoltaEtichette(qp); await qp.click(`[data-settore="${sett}"] .settore-punto`, { timeout: 3000 }).catch(() => male.add(`${ris}@${sett} non si tocca`));
      await etichetteFerme(qp, true);
      const r = await mappaSchieramento(qp);
      for (const x of [...r.coperte.map((c) => `tocco ${c} coperto`), ...r.sopra.map((c) => `nomi ${c}`)]) male.add(`dopo ${ris}@${sett}: ${x}`);
    }
    atteso(`${st.m.id} ondata 1 360×760, unità messe una alla volta: ${[...male].join('; ')} (C33-03)`, !male.size);
  }
  await qp.close();
  const e03 = stati.find((x) => x.m.id === 'e03' && x.n === 3);
  for (const [w, h] of [[375, 812], [412, 915]].filter(([w]) => tocca(w))) {
    const q = await nuova({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    await q.goto(url);
    if (e03) await prova(q, e03, `e03 ondata 3 ${w}×${h}`, true);
    await q.close();
  }
  // C17-22: a 375×667 il riepilogo (Conferma senza unità) non ha pulsanti sopra il testo
  if (e03 && tocca(375)) {
    const q = await nuova({ viewport: { width: 375, height: 667 }, reducedMotion: 'reduce' });
    await q.goto(url);
    await q.evaluate((v) => localStorage.setItem('vandelfalls-salvataggio', v), JSON.stringify({ ...base, in_corso: e03.s }));
    await q.reload(); await q.getByRole('button', { name: 'Riprendi' }).click();
    await q.waitForSelector('[data-barra]', { timeout: 5000 }).catch(() => {}); await q.click('[data-azione="conferma"]');
    await q.waitForSelector('[data-riepilogo]', { timeout: 3000 }).catch(() => {});
    const sotto = await q.evaluate(() => {
      const a = (A, B) => Math.max(0, Math.min(A.right, B.right) - Math.max(A.left, B.left)) * Math.max(0, Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top));
      const testi = [...document.querySelectorAll('.riepilogo li, .riepilogo h3, [data-restano]')].map((e) => [e.textContent.trim().slice(0, 20), e.getBoundingClientRect()]);
      const pulsanti = [...document.querySelectorAll('main button')].filter((b) => !b.closest('.mappa')).map((b) => b.getBoundingClientRect());
      return testi.filter(([, r]) => pulsanti.some((b) => a(r, b) > 1)).map(([t]) => t);
    });
    atteso(`riepilogo 375×667: pulsanti sopra ${sotto.join(', ')} (C17-22)`, sotto.length === 0);
    await q.close();
  }
  // C18-07, C20-04: aperto il «?», le unità, il «?» e l'aiuto sono nella finestra e non sotto la barra «Conferma»;
  //         a 375×667 (C18-07) e a 360×760 (C20-04: riquadro già nella finestra ma sotto la barra), e01 ed e06 ondata 1.
  //         Rosso VALMORA_ROSSI=C42A01: aiuto sopra le unità, come prima; VALMORA_ROSSI=C44A01: nessuno scorrimento sopra la barra.
  for (const id of ['e01', 'e06']) for (const [w, h] of [[375, 667], [360, 760]].filter(([w]) => tocca(w))) {
    const primo = stati.find((x) => x.m.id === id && x.n === 1);
    if (!primo) continue;
    const q = await nuova({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    await q.goto(url);
    await q.evaluate((v) => localStorage.setItem('vandelfalls-salvataggio', v), JSON.stringify({ ...base, in_corso: primo.s }));
    await q.reload(); await q.getByRole('button', { name: 'Riprendi' }).click();
    await q.waitForSelector('[data-azione="aiuto"]', { timeout: 5000 }).catch(() => {});
    await q.click('[data-azione="aiuto"]'); await q.waitForTimeout(300);
    const male = await q.evaluate(() => {
      const barra = document.querySelector('[data-barra]')?.getBoundingClientRect();
      return [...document.querySelectorAll('.vassoio .unita, [data-azione="aiuto"], [data-aiuto]')].filter((e) => {
        const r = e.getBoundingClientRect();
        // D-139: il «?» sta nella barra fissa: per lui conta solo che sia nella finestra
        return r.top < 0 || r.bottom > innerHeight || (!e.closest('[data-barra]') && barra && r.bottom > barra.top + 1 && r.top < barra.bottom);
      }).map((e) => e.dataset.risorsa ?? e.dataset.azione ?? 'aiuto');
    });
    atteso(`schieramento ${id} ${w}×${h} col «?» aperto: fuori vista o sotto la barra ${male.join(', ')} (C18-07, C20-04)`, male.length === 0);
    await q.close();
  }
  // PO-101: e07 ondata 2 («La partita, fuori») a 360×760, 375×667 e 412×915: c'è la «i» accanto al titolo; al tocco la
  //         riga dei dati sotto il titolo, che non copre la mappa né comandi; si chiude col secondo tocco e toccando altrove.
  //         Foto chiusa e aperta. Rosso VALMORA_ROSSI=C43I01: niente icona.
  const e07 = stati.find((x) => x.m.id === 'e07' && x.n === 2);
  if (e07) for (const [w, h] of [[360, 760], [375, 667], [412, 915]].filter(([w]) => tocca(w))) {
    const q = await nuova({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    await q.goto(url);
    await q.evaluate((v) => localStorage.setItem('vandelfalls-salvataggio', v), JSON.stringify({ ...base, in_corso: e07.s }));
    await q.reload(); await q.getByRole('button', { name: 'Riprendi' }).click();
    await q.waitForSelector('[data-barra]', { timeout: 5000 }).catch(() => {}); await q.waitForTimeout(120);
    const dove = `e07 ondata 2 ${w}×${h}`;
    await q.screenshot({ path: join(cartella, `po101-${w}-chiusa.png`) });
    const icona = q.locator('[data-azione="info-ondata"]');
    atteso(`${dove}: manca la «i» accanto al titolo dell'ondata (PO-101)`, (await icona.count()) === 1);
    if (await icona.count()) {
      // C20-06: la zona di tocco è almeno --tocco-min (44 px): i punti a ±21 px dal centro colpiscono la «i».
      //         Rosso VALMORA_ROSSI=C44I02: 38 px, come prima.
      const tocco = await q.evaluate(() => {
        const b = document.querySelector('[data-azione="info-ondata"]'), r = b.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const s = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tocco-min')) / 2 - 1;
        return [[-s, -s], [s, -s], [-s, s], [s, s], [0, -s], [0, s], [-s, 0], [s, 0]].filter(([dx, dy]) => !b.contains(document.elementFromPoint(cx + dx, cy + dy))).length;
      });
      atteso(`${dove}: la zona di tocco della «i» è sotto 44 px (${tocco} punti di 8 a ±21 px fuori) (C20-06)`, tocco === 0);
      await icona.click(); await q.waitForTimeout(80);
      await q.screenshot({ path: join(cartella, `po101-${w}-aperta.png`) });
      const r = await q.evaluate(() => {
        const riga = document.querySelector('[data-info-ondata]');
        if (!riga) return null;
        const a = riga.getBoundingClientRect();
        const tocca = (b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0;
        const sopra = [...document.querySelectorAll('.mappa, main button')].filter((e) => !e.closest('.info-ondata') && e.getClientRects().length && tocca(e.getBoundingClientRect()))
          .map((e) => e.dataset.azione ?? e.className);
        return { testo: riga.textContent, sopra, vista: a.top >= 0 && a.bottom <= innerHeight };
      });
      atteso(`${dove}: al tocco della «i» non compare la riga (PO-101)`, !!r);
      if (r) {
        atteso(`${dove}: riga «i» «${r.testo}» vuota o senza testo dei dati (PO-101)`, r.testo.trim().length > 0 && !r.testo.includes('[['));
        atteso(`${dove}: la riga «i» copre ${r.sopra.join(', ')} o è fuori dalla finestra (PO-101)`, r.sopra.length === 0 && r.vista);
      }
      await icona.click(); await q.waitForTimeout(80);
      atteso(`${dove}: il secondo tocco della «i» non chiude la riga (PO-101)`, (await q.locator('[data-info-ondata]').count()) === 0);
      await icona.click(); await q.waitForTimeout(80); await q.mouse.click(w / 2, h - 120); await q.waitForTimeout(80);
      atteso(`${dove}: toccando altrove la riga «i» resta aperta (PO-101)`, (await q.locator('[data-info-ondata]').count()) === 0);
      // C25-02: con la riga aperta, il tocco vero (mouse) su un settore della mappa arriva a quel settore e chiude la
      // riga. Si registra dove arriva il click. Rosso VALMORA_ROSSI=C69I01: chiusa al pointerdown, il tocco si perde.
      await icona.click(); await q.waitForTimeout(80);
      const bersaglio = await q.evaluate(() => {
        window.__arrivato = null; document.addEventListener('click', (e) => { window.__arrivato = e.target.closest?.('[data-settore]')?.dataset.settore ?? '(altrove)'; }, { capture: true, once: true });
        const p = [...document.querySelectorAll('.mappa [data-settore] .settore-punto')].find((x) => x.getClientRects().length && !x.disabled);
        if (!p) return null; const r = p.getBoundingClientRect(); return { id: p.closest('[data-settore]').dataset.settore, x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
      if (bersaglio) {
        await q.mouse.click(bersaglio.x, bersaglio.y); await q.waitForTimeout(80);
        const arrivato = await q.evaluate(() => window.__arrivato);
        atteso(`${dove}: con la riga «i» aperta il tocco su «${bersaglio.id}» arriva a «${arrivato}» (C25-02)`, arrivato === bersaglio.id);
      }
    }
    await q.close();
  }
  return stati.length;
}
