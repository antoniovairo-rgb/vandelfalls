// D-241 idea B, «una mossa per chiamata» (mossa-ui.tsx): nella risposta l'indicazione «Puoi spostare…» sta sopra la mappa
// (la pagina non si allunga); si toccano solo le unità spostabili (bersagli ≥ --tocco-min), poi solo i settori ammessi; la
// mossa cambia la disposizione e il salvataggio; dopo la mossa nessun'altra nella stessa pausa; Esc lascia l'unità; «Avanti»
// senza mossa resta possibile. Con la tastiera a 760 di altezza, col tocco a 640 e 667. Chiamata costruita col motore
// (sonda-altezze), aperta da salvataggio. Rossi: VALMORA_ROSSI=C241B01 (mosse illimitate), C241M02 (mappa che non si tocca).
// D-255 punto 2: il riquadro radio non copre mai un bersaglio della mossa (unità toccabili, poi settori ammessi con ogni unità
// in mano), nella prima chiamata con mossa di ognuno dei 36 episodi, all'altezza più bassa della larghezza (RADIO_VP).
// Rosso C255R01 (fascia fissa e rapporto intero, come prima): a 360×640 210 stati coperti.
// D-258 (opzione B del PO): in ogni stato il costo dopo «Conferma» si vede, nel riquadro o nella risposta sotto la mappa, e la
// risposta scorre entro la soglia di sonda-altezze (SOGLIE[vp].risposta, 0 se manca). Rosso C258S01: niente copia sotto.
// D-259: con la copia sotto la mappa si abbassa (adatta.ts) fino a 200 px; stampa le altezze raggiunte. Rosso C259A01: mappa piena.
// D-261: in ogni risposta con la mossa (anche dopo la mossa) entro soglia; una sola «Home» visibile (rosso C261H01: la mappa si
// rialza per «Home» e la risposta scorre); unità e settori toccabili col bordo dell'evidenziazione (rosso C261E01).
import { join } from 'node:path';
import { chiamateCostruite, SOGLIE } from './sonda-altezze.mjs';

export const ALTEZZE_PO152B = [640, 667, 760];
export const RADIO_VP = { 360: 640, 375: 667, 412: 760 };
const CHIAVE = 'vandelfalls-salvataggio';
const sal = (p) => p.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null'), CHIAVE);
const ecc = (p) => p.evaluate(() => document.scrollingElement.scrollHeight - innerHeight);
// i bersagli della mossa coperti dal riquadro radio (area > 0) e se il rapporto è passato al solo lettore («stretto»)
const coperti = (p) => p.evaluate(() => {
  const q = document.querySelector('.mappa [data-radio-mappa]'), r = q?.getBoundingClientRect();
  if (!r) return { xs: [], stretto: false };
  // D-258: il costo si vede (un rapporto col testo del costo, mostrato e non ritagliato) e quanto scorre la pagina
  const costo = [...document.querySelectorAll('[data-rapporto-costo]')].some((e) => { const b = e.getBoundingClientRect(), c = e.closest('.radio-mappa');
    return e.checkVisibility() && b.height > 2 && b.width > 2 && !c?.classList.contains('muto') && !!e.querySelector('[data-costo]')?.textContent.trim(); });
  const ecc = document.scrollingElement.scrollHeight - innerHeight, sotto = !!document.querySelector('.rapporto-sotto')?.checkVisibility();
  const mappa = Math.round(document.querySelector('.mappa').getBoundingClientRect().height); // D-259: quanto si abbassa
  // D-261: una sola «Home» visibile (sulla mappa o nella testata); bersagli della mossa col bordo dell'evidenziazione
  const case_ = [...document.querySelectorAll('[data-azione="home"]')].filter((e) => e.checkVisibility()).length, fuori = !!document.querySelector('.mappa[data-casa-fuori]');
  const senzaBordo = [...document.querySelectorAll('.mappa.mossa [data-presenza]:not(:disabled) .pastiglia, .mappa.mossa .settore-punto:not(:disabled)')]
    .filter((e) => getComputedStyle(e).outlineStyle === 'none').map((e) => e.closest('[data-presenza]')?.dataset.presenza ?? e.closest('[data-settore]').dataset.settore);
  if (q.classList.contains('muto')) return { xs: [], stretto: true, muto: true, costo, ecc, sotto, mappa, case_, fuori, senzaBordo }; // al solo lettore: non copre niente
  const sop = (x) => Math.max(0, Math.min(r.right, x.right) - Math.max(r.left, x.left)) * Math.max(0, Math.min(r.bottom, x.bottom) - Math.max(r.top, x.top));
  return { costo, ecc, sotto, mappa, case_, fuori, senzaBordo, stretto: q.classList.contains('stretto'), xs: [...document.querySelectorAll('.mappa [data-presenza]:not(:disabled), .mappa [data-settore] .settore-punto:not(:disabled)')]
    .map((e) => [e.dataset.presenza ?? e.closest('[data-settore]').dataset.settore, sop(e.getBoundingClientRect())]).filter(([, a]) => a > 0.5).map(([k, a]) => `${k} ${Math.round(a)} px²`) };
});
const stato = (p) => p.evaluate(() => {
  const px = (v) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(v)) || 0, r = (e) => e.getBoundingClientRect();
  const badge = [...document.querySelectorAll('.mappa [data-presenza]')], m = document.querySelector('.mappa')?.getBoundingClientRect();
  const ind = document.querySelector('.mappa [data-mossa]');
  return { indicazione: ind?.dataset.mossa ?? null, dentro: !!ind && !!m && r(ind).top >= m.top - 0.5 && r(ind).bottom <= m.bottom + 0.5,
    attivi: badge.filter((b) => !b.disabled).map((b) => ({ id: b.dataset.presenza, lato: Math.min(r(b).width, r(b).height), premuto: b.getAttribute('aria-pressed') })),
    settori: [...document.querySelectorAll('.mappa [data-settore] .settore-punto')].filter((b) => !b.disabled).map((b) => b.closest('[data-settore]').dataset.settore), min: px('--tocco-min') };
});

/** Problemi alla larghezza data, alle altezze di ALTEZZE_PO152B. */
export async function controllaPo152b(browser, url, larghezza, rossi = [], cartella = '', dati, dich) {
  const male = [], ris = [], c = chiamateCostruite(dati, dich).find((x) => x.ep === 'e01');
  if (!c) return { ris, male: ['PO-152 B: nessuna chiamata di e01 costruita'] };
  const m = dati['missioni/e01.json'], ch = m.ondate.flatMap((o) => o.chiamate).find((x) => x.id === c.id), opzione = ch.opzioni[0].id;
  for (const h of ALTEZZE_PO152B) for (const giro of ['mossa', 'avanti']) {
    const vp = `${larghezza}x${h}`, dove = `${vp} e01 ${c.id} (${giro})`, p = await browser.newPage({ viewport: { width: larghezza, height: h }, hasTouch: true, reducedMotion: 'reduce' });
    await p.addInitScript(() => { globalThis.__VALMORA_SECONDO_MS = 1; });
    if (rossi.length) await p.addInitScript((xs) => { for (const x of xs) globalThis[`__NO_${x}`] = true; }, rossi);
    await p.goto(url); await p.evaluate(([k, v]) => localStorage.setItem(k, v), [CHIAVE, c.sal]); await p.reload();
    await p.getByRole('button', { name: 'Riprendi' }).click();
    if (!(await p.waitForSelector(`[data-messaggio="chiamata-${c.id}"]`, { timeout: 15000 }).then(() => true).catch(() => false))) { male.push(`${dove}: la chiamata non si apre (PO-152 B)`); await p.close(); continue; }
    await p.click(`[data-opzione="${opzione}"]`); await p.click('[data-conferma]').catch(() => {});
    if (!(await p.waitForSelector('[data-messaggio="risposta"]', { timeout: 15000 }).then(() => true).catch(() => false))) { male.push(`${dove}: la risposta non arriva (PO-152 B)`); await p.close(); continue; }
    await p.waitForTimeout(300);
    const s0 = await stato(p), e0 = await ecc(p), senza = await p.evaluate(() => { const e = document.querySelector('[data-radio-mappa]'); if (e) e.style.display = 'none'; const x = document.scrollingElement.scrollHeight - innerHeight; if (e) e.style.display = ''; return x; });
    if (s0.indicazione !== 'puoi' || !s0.dentro) male.push(`${dove}: nella risposta manca l'indicazione «Puoi spostare una squadra» sopra la mappa (${s0.indicazione}, PO-152 B)`);
    if (!s0.attivi.length) male.push(`${dove}: nessuna unità si tocca nella risposta (PO-152 B)`);
    if (s0.settori.length) male.push(`${dove}: settori toccabili prima di scegliere l'unità (PO-152 B)`);
    for (const b of s0.attivi) if (b.lato < s0.min) male.push(`${dove}: unità ${b.id} toccabile su ${Math.round(b.lato)} px, serve ≥ ${s0.min} (PO-152 B)`);
    const lim = Math.max(SOGLIE[vp]?.risposta ?? 0, senza);
    if (e0 > lim) male.push(`${dove}: con la mossa la risposta scorre di ${e0} px (soglia ${lim}, PO-152 B)`);
    ris.push({ vp, giro, risposta: e0, senza, unita: s0.attivi.length });
    if (giro === 'avanti' || !s0.attivi.length) {
      if (giro === 'avanti') { // la mossa è facoltativa: «Avanti» senza toccare niente porta alla chiamata dopo
        await p.click('[data-azione="continua"]');
        if (!(await p.waitForSelector('[data-messaggio^="chiamata-"]', { timeout: 15000 }).then(() => true).catch(() => false))) male.push(`${dove}: «Avanti» senza mossa non porta alla chiamata dopo (PO-152 B)`);
      }
      await p.close(); continue;
    }
    const prima = await sal(p), id = s0.attivi[0].id, badge = p.locator(`.mappa [data-presenza="${id}"]`);
    // Esc lascia l'unità
    await badge.click(); await p.keyboard.press('Escape'); await p.waitForTimeout(100);
    if ((await stato(p)).attivi.find((b) => b.id === id)?.premuto === 'true') male.push(`${dove}: Esc non lascia l'unità (PO-152 B)`);
    // la mossa: col tocco a 640/667, con la tastiera a 760
    if (h === 760) { await badge.focus(); await p.keyboard.press('Enter'); } else await badge.click();
    await p.waitForTimeout(150);
    const s1 = await stato(p);
    if (s1.indicazione !== 'dove' || s1.attivi.find((b) => b.id === id)?.premuto !== 'true' || !s1.settori.length) { male.push(`${dove}: toccata l'unità ${id}, nessun settore dove portarla (PO-152 B)`); await p.close(); continue; }
    const a = s1.settori[0], punto = p.locator(`.mappa [data-settore="${a}"] .settore-punto`);
    if (h === 760) { await punto.focus(); await p.keyboard.press('Enter'); } else await punto.click();
    await p.waitForTimeout(250);
    const dopo = await sal(p), [r, da] = id.split('@'), s2 = await stato(p);
    if (cartella) await p.screenshot({ path: join(cartella, `${vp}-po152b-mossa.png`) });
    if ((dopo.in_corso.disposizione[r]?.[da] ?? 0) !== (prima.in_corso.disposizione[r]?.[da] ?? 0) - 1 || (dopo.in_corso.disposizione[r]?.[a] ?? 0) !== (prima.in_corso.disposizione[r]?.[a] ?? 0) + 1) male.push(`${dove}: la mossa ${r} ${da} → ${a} non è nel salvataggio (PO-152 B)`);
    if ((dopo.in_corso.mosse ?? []).length !== (prima.in_corso.mosse ?? []).length + 1) male.push(`${dove}: la mossa non è segnata nel salvataggio (PO-152 B)`);
    if (s2.indicazione !== 'fatta') male.push(`${dove}: dopo la mossa manca «Mossa fatta» (${s2.indicazione}, PO-152 B)`);
    if (s2.attivi.length) male.push(`${dove}: dopo la mossa si toccano ancora ${s2.attivi.length} unità: seconda mossa possibile (PO-152 B)`);
    await p.close();
  }
  const hr = RADIO_VP[larghezza];
  if (hr) { const r = await controllaRadio(browser, url, larghezza, hr, rossi, dati, dich); male.push(...r.male); ris.push(r.ris); }
  return { ris, male };
}

/** D-255 punto 2: prima chiamata con mossa di ogni episodio; stati «puoi», «dove» (ogni unità in mano) e «mossa fatta». */
async function controllaRadio(browser, url, larghezza, h, rossi, dati, dich) {
  const male = [], vp = `${larghezza}x${h}`, tutte = chiamateCostruite(dati, dich), conto = { vp, giro: 'radio', episodi: 0, stati: 0, stretti: 0, muti: 0, conCosto: 0, senzaCosto: 0, scorreMax: 0, sotto: 0, mappaMin: Infinity, mappaMax: 0, casaFuori: 0 }, soglia = SOGLIE[vp]?.risposta ?? 0;
  for (const ep of [...new Set(tutte.map((c) => c.ep))]) for (const c of tutte.filter((x) => x.ep === ep)) {
    const ch = dati[`missioni/${ep}.json`].ondate.flatMap((o) => o.chiamate ?? []).find((x) => x.id === c.id);
    const p = await browser.newPage({ viewport: { width: larghezza, height: h }, hasTouch: true, reducedMotion: 'reduce' });
    await p.addInitScript(() => { globalThis.__VALMORA_SECONDO_MS = 1; });
    if (rossi.length) await p.addInitScript((xs) => { for (const x of xs) globalThis[`__NO_${x}`] = true; }, rossi);
    await p.goto(url); await p.evaluate(([k, v]) => localStorage.setItem(k, v), [CHIAVE, c.sal]); await p.reload();
    await p.getByRole('button', { name: 'Riprendi' }).click();
    let n0 = conto.stati;
    const ok = ch && await p.waitForSelector(`[data-messaggio="chiamata-${c.id}"]`, { timeout: 15000 }).then(() => true).catch(() => false);
    if (ok) { await p.click(`[data-opzione="${ch.opzioni[0].id}"]`); await p.click('[data-conferma]').catch(() => {}); }
    const pronta = ok && await p.waitForSelector('.mappa [data-mossa="puoi"]', { timeout: 15000 }).then(() => true).catch(() => false);
    if (!pronta) { await p.close(); continue; } // nessuna mossa dopo questa chiamata (ultima dell'ondata): la prossima
    await p.waitForTimeout(300);
    const giu = async (dove) => { const x = await coperti(p); conto.stati++; if (x.muto) conto.muti++; else if (x.stretto) conto.stretti++;
      if (x.xs.length) male.push(`${vp} ${ep} ${c.id} ${dove}: il riquadro radio copre ${x.xs.join(', ')} (D-255)`);
      conto.scorreMax = Math.max(conto.scorreMax, x.ecc);
      if (x.fuori) conto.casaFuori++;
      if (x.case_ !== 1) male.push(`${vp} ${ep} ${c.id} ${dove}: ${x.case_} pulsanti «Home» visibili, ne serve uno (D-261)`);
      if (x.senzaBordo.length) male.push(`${vp} ${ep} ${c.id} ${dove}: senza evidenziazione ${x.senzaBordo.join(', ')} (D-261)`);
      if (x.sotto) { conto.sotto++; conto.mappaMin = Math.min(conto.mappaMin, x.mappa); conto.mappaMax = Math.max(conto.mappaMax, x.mappa); }
      if (x.ecc > soglia) male.push(`${vp} ${ep} ${c.id} ${dove}: la risposta scorre di ${x.ecc} px (soglia ${soglia}, D-258)`);
      if (ch.opzioni[0].costo) { conto.conCosto++; if (!x.costo) { conto.senzaCosto++; male.push(`${vp} ${ep} ${c.id} ${dove}: dopo «Conferma» il costo non si vede (D-258)`); } } };
    await giu('«puoi spostare»');
    // D-259: anche con la mappa abbassata ogni unità spostabile (logica: schierata, non fissa) ha il suo pulsante toccabile
    const sv = await sal(p), attese = Object.entries(sv.in_corso.disposizione ?? {}).filter(([r]) => !dati[`missioni/${ep}.json`].mappa.risorse[r]?.fissa)
      .flatMap(([r, ps]) => Object.entries(ps).filter(([, n]) => n > 0).map(([k]) => `${r}@${k}`));
    const toccabili = await p.$$eval('.mappa [data-presenza]:not(:disabled)', (xs) => xs.filter((x) => x.checkVisibility() && x.getBoundingClientRect().width > 0).map((x) => x.dataset.presenza));
    for (const u of attese) if (!toccabili.includes(u)) male.push(`${vp} ${ep} ${c.id}: l'unità ${u} si può spostare ma non si tocca sulla mappa (D-259)`);
    for (const id of await p.$$eval('.mappa [data-presenza]:not(:disabled)', (xs) => xs.map((x) => x.dataset.presenza))) {
      await p.locator(`.mappa [data-presenza="${id}"]`).click({ force: true }); await p.waitForTimeout(80);
      await giu(`«tocca il settore» con ${id} in mano`);
      await p.keyboard.press('Escape'); await p.waitForTimeout(50);
    }
    // la mossa fatta: la risposta resta (entro soglia, costo visibile, una «Home»)
    const id = (await p.$$eval('.mappa [data-presenza]:not(:disabled)', (xs) => xs.map((x) => x.dataset.presenza)))[0];
    if (id) { await p.locator(`.mappa [data-presenza="${id}"]`).click({ force: true }); await p.waitForTimeout(80);
      const a = await p.$('.mappa .settore-punto:not(:disabled)'); if (a) { await a.click({ force: true }); await p.waitForTimeout(150); await giu('«mossa fatta»'); } }
    if (process.env.VALMORA_DETTAGLIO) console.log(`  ${vp} ${ep} ${c.id}: ${conto.stati - n0} stati`);
    conto.episodi++; await p.close(); break;
  }
  console.log(`radio della mossa ${vp}: ${conto.episodi} episodi, ${conto.stati} stati, rapporto al solo lettore in ${conto.stretti}, riquadro al solo lettore in ${conto.muti}; con costo ${conto.conCosto}, costo non visibile in ${conto.senzaCosto}; scorrimento massimo ${conto.scorreMax} px (soglia ${soglia}); costo sotto la mappa in ${conto.sotto}, mappa alta da ${conto.mappaMin} a ${conto.mappaMax} px; «Home» nella testata in ${conto.casaFuori}`);
  if (conto.episodi < 30) male.push(`${vp}: radio della mossa provata solo in ${conto.episodi} episodi (D-255)`);
  return { ris: conto, male };
}
