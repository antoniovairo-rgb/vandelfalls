// D-241 idea B, «una mossa per chiamata» (mossa-ui.tsx): nella risposta l'indicazione «Puoi spostare…» sta sopra la mappa
// (la pagina non si allunga); si toccano solo le unità spostabili (bersagli ≥ --tocco-min), poi solo i settori ammessi; la
// mossa cambia la disposizione e il salvataggio; dopo la mossa nessun'altra nella stessa pausa; Esc lascia l'unità; «Avanti»
// senza mossa resta possibile. Con la tastiera a 760 di altezza, col tocco a 640 e 667. Chiamata costruita col motore
// (sonda-altezze), aperta da salvataggio. Rossi: VALMORA_ROSSI=C241B01 (mosse illimitate), C241M02 (mappa che non si tocca).
// D-255 punto 2: il riquadro radio non copre mai un bersaglio della mossa (unità toccabili, poi settori ammessi con ogni unità
// in mano), nella prima chiamata con mossa di ognuno dei 36 episodi, all'altezza più bassa della larghezza (RADIO_VP).
// Rosso C255R01 (fascia fissa e rapporto intero, come prima): a 360×640 210 stati coperti.
// C56-04 (D-268): «un'unità» e quante unità nel nome del badge. Rosso C268M01.
// C56-05 (D-268): dopo la mossa da tastiera (760) il fuoco è su «Avanti». Rosso C268F01.
// C56-02 (D-262), giro «ricarica»: ricaricata prima di muovere, la pausa con la mossa torna. Rosso C262R01.
// D-262 punto 1: dopo la mossa la riga della previsione e i segni ▲/▼ sono quelli della logica (effettoMossa sui due
// salvataggi, prima e dopo). Rosso C262E01: niente previsione.
// D-258 (opzione B del PO): in ogni stato il costo dopo «Conferma» si vede, nel riquadro o nella risposta sotto la mappa, e la
// risposta scorre entro la soglia di sonda-altezze (SOGLIE[vp].risposta, 0 se manca). Rosso C258S01: niente copia sotto.
// D-259: con la copia sotto la mappa si abbassa (adatta.ts) fino a 200 px; stampa le altezze raggiunte. Rosso C259A01: mappa piena.
// D-261: in ogni risposta con la mossa (anche dopo la mossa) entro soglia; una sola «Home» visibile (rosso C261H01: la mappa si
// rialza per «Home» e la risposta scorre); unità e settori toccabili col bordo dell'evidenziazione (rosso C261E01).
// C57-01 (D-269): dal comparire della risposta la mappa cambia altezza al più una volta, e poi resta ferma in ogni stato (unità
// in mano, mossa fatta). Rosso C269M01: scende a gradini e di nuovo al tocco dell'unità.
// C57-02 (D-269): dopo la mossa la previsione si vede (nel riquadro, intero, o sotto la mappa), in ogni stato del giro radio e in
// ogni combinazione unità → settore delle chiamate di CASI_PREVISIONE (e16 imp_nebbia: 4 su 24 col riquadro «muto» a 360×640).
// Rosso C269P01: previsione al solo lettore di schermo.
// D-269 a, b, c: in ogni stato l'istruzione della mossa si vede (nel riquadro o nella copia sotto la mappa; rosso C269I01);
// a pagina ferma nessuna riga della copia (istruzione, previsione) sta sotto «Avanti» (elementFromPoint su ogni riga; rosso
// C269A01); dopo l'assestamento il riquadro non cambia classe né posto per 2,5 s senza input (al «puoi spostare»; rosso C269C01).
import { join } from 'node:path';
import { chiamateCostruite, SOGLIE } from './sonda-altezze.mjs';
import { effettoMossa } from '../src/logica/previsione.ts';

export const ALTEZZE_PO152B = [640, 667, 760];
export const RADIO_VP = { 360: 640, 375: 667, 412: 760 };
// D-269 c (verifica della principale su ede76c72): a 412×915 il riquadro cambiava ancora senza input (e10 imp_cantiere, e16
// imp_nebbia): la mappa non si abbassa e nomi e riquadro si disponevano prima che arrivasse la risposta. Giro di solo fermo.
export const FERMO_VP = { 412: 915 };
const CHIAVE = 'vandelfalls-salvataggio';
const sal = (p) => p.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null'), CHIAVE);
const ecc = (p) => p.evaluate(() => document.scrollingElement.scrollHeight - innerHeight);
// D-270 (bracci veloci): «Avanti» c'è solo nella risposta e il riquadro della mossa arriva nello stesso disegno (App.tsx, ramo eco):
// appena c'è «Avanti» si sa se c'è il «puoi spostare». Prima si aspettavano 15 s a ogni chiamata senza mossa (rosso C241M02: ogni chiamata)
const puoi = (p) => p.waitForFunction(() => (document.querySelector('[data-azione="continua"]') ? (document.querySelector('.mappa [data-mossa="puoi"]') ? 'si' : 'no') : null), null, { timeout: 15000 })
  .then((x) => x.jsonValue()).then((v) => v === 'si').catch(() => false);
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
  // C56-03 (D-262): il centro di ogni bersaglio della mossa risponde al tocco (prima a 412×760 in e30 il centro di «Piazzale»
  // dava il badge dell'unità in mano)
  const coperto = [...document.querySelectorAll('.mappa [data-presenza]:not(:disabled), .mappa .settore-punto:not(:disabled)')].filter((e) => {
    const b = e.getBoundingClientRect(), x = (b.left + b.right) / 2, y = (b.top + b.bottom) / 2; if (y < 0 || y > innerHeight) return false;
    const sopra = document.elementFromPoint(x, y); return !!sopra && sopra !== e && !e.contains(sopra); })
    .map((e) => `${e.dataset.presenza ?? e.closest('[data-settore]').dataset.settore} sotto ${(() => { const b = e.getBoundingClientRect(), q = document.elementFromPoint((b.left + b.right) / 2, (b.top + b.bottom) / 2); return q?.closest('[data-presenza]')?.dataset.presenza ?? q?.className ?? '?'; })()}`);
  const case_ = [...document.querySelectorAll('[data-azione^="home"]')].filter((e) => e.checkVisibility({ visibilityProperty: true })).length, fuori = !!document.querySelector('.mappa[data-casa-fuori]');
  const senzaBordo = [...document.querySelectorAll('.mappa.mossa [data-presenza]:not(:disabled) .pastiglia, .mappa.mossa .settore-punto:not(:disabled)')]
    .filter((e) => getComputedStyle(e).outlineStyle === 'none').map((e) => e.closest('[data-presenza]')?.dataset.presenza ?? e.closest('[data-settore]').dataset.settore);
  // C57-02 e D-269 a: istruzione e previsione (se c'è) si vedono: nel riquadro non muto e non tagliato, oppure nella copia sotto
  // la mappa con lo stesso testo; D-269 b: a pagina ferma nessuna riga della copia è coperta (da «Avanti») o fuori dallo schermo
  const intero = !q.classList.contains('muto') && q.scrollHeight <= q.clientHeight + 1;
  const ind = document.querySelector('.mappa [data-mossa]'), pr = document.querySelector('.mappa [data-previsione]');
  const copia = document.querySelector('.istruzione-sotto[data-istruzione-sotto="vera"]'), vera = copia?.querySelector('.vera'), prSotto = copia?.querySelector('[data-previsione-sotto]');
  const istruzione = !ind || (intero && ind.checkVisibility()) || (!!vera?.checkVisibility() && vera.dataset.mossaSotto === ind.dataset.mossa && !!vera.textContent.replace(prSotto?.textContent ?? '', '').trim() && (ind.querySelector('[data-previsione]')?.textContent ?? '') === (prSotto?.textContent ?? '')); // D-269: nella copia lo stesso stato (testo breve per «puoi») e la stessa previsione
  const previsione = !pr || (intero && pr.checkVisibility()) || (!!prSotto?.checkVisibility() && prSotto.textContent === pr.textContent);
  const y0 = scrollY; scrollTo(0, 0);
  const righe = [];
  if (copia?.checkVisibility()) { const rg = document.createRange(); rg.selectNodeContents(vera);
    for (const b of rg.getClientRects()) { if (b.width < 2 || b.height < 2) continue; const y = (b.top + b.bottom) / 2; // 9 punti per riga: anche la punta del fumetto
      const e = y < innerHeight ? [1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => document.elementFromPoint(b.left + (b.width * i) / 10, y)).find((x) => !x || !copia.contains(x)) ?? copia : null;
      if (!e || !copia.contains(e)) righe.push(`riga a y ${Math.round(b.top)}-${Math.round(b.bottom)} sotto ${e ? (e.closest('[data-azione]')?.dataset.azione ?? e.className) : 'il bordo dello schermo'}`); } }
  scrollTo(0, y0);
  if (q.classList.contains('muto')) return { xs: [], stretto: true, muto: true, costo, ecc, sotto, mappa, case_, fuori, senzaBordo, coperto, previsione, istruzione, righe, tagliato: false };
 // al solo lettore: non copre niente
  const sop = (x) => Math.max(0, Math.min(r.right, x.right) - Math.max(r.left, x.left)) * Math.max(0, Math.min(r.bottom, x.bottom) - Math.max(r.top, x.top));
  return { costo, ecc, sotto, mappa, case_, fuori, senzaBordo, coperto, previsione, istruzione, righe, tagliato: q.scrollHeight > q.clientHeight + 1, stretto: q.classList.contains('stretto'), xs: [...document.querySelectorAll('.mappa [data-presenza]:not(:disabled), .mappa [data-settore] .settore-punto:not(:disabled)')]
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
// D-270: `solo` restringe un braccio rosso ai giri (e01, radio, previsione, fermo) e agli episodi del giro radio dove il suo rosso si vede
export async function controllaPo152b(browser, url, larghezza, rossi = [], cartella = '', dati, dich, solo = {}) {
  const giri = solo.giri ?? ['e01', 'radio', 'previsione', 'fermo'];
  // lotto «altezze» (S-11): il verde gira radio, previsione e fermo su PAGINE_RADIO pagine insieme; i bracci (5 processi insieme,
  // pochi episodi) su una: con 4 anche lì, in 1 giro su 3, C269A01 ha dato 0 problemi e C269P01 un'attesa scaduta di 15 s
  const pagine = solo.giri ? 1 : PAGINE_RADIO;
  const male = [], ris = [], c = chiamateCostruite(dati, dich).find((x) => x.ep === 'e01');
  if (!c) return { ris, male: ['PO-152 B: nessuna chiamata di e01 costruita'] };
  const m = dati['missioni/e01.json'], ch = m.ondate.flatMap((o) => o.chiamate).find((x) => x.id === c.id), opzione = ch.opzioni[0].id;
  for (const h of giri.includes('e01') ? ALTEZZE_PO152B : []) for (const giro of ['mossa', 'avanti', 'ricarica']) {
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
    // C56-04 (D-268): si spostano anche steward e mediatore, quindi «un'unità»; il badge dice anche quante unità ci sono
    const nomi = await p.evaluate(() => ({ testo: document.querySelector('.mappa [data-mossa]')?.textContent ?? '', badge: [...document.querySelectorAll('.mappa [data-presenza]:not(:disabled)')].map((b) => [b.getAttribute('aria-label'), b.querySelector('.pastiglia')?.textContent?.trim()]) }));
    if (/una squadra/i.test(nomi.testo)) male.push(`${dove}: l'indicazione dice «una squadra» ma si spostano tutte le unità (C56-04)`);
    for (const [a, n] of nomi.badge) if (!a?.includes(`, ${n} `)) male.push(`${dove}: il nome del badge «${a}» non dice quante unità (${n}) ci sono (C56-04)`);
    if (s0.settori.length) male.push(`${dove}: settori toccabili prima di scegliere l'unità (PO-152 B)`);
    for (const b of s0.attivi) if (b.lato < s0.min) male.push(`${dove}: unità ${b.id} toccabile su ${Math.round(b.lato)} px, serve ≥ ${s0.min} (PO-152 B)`);
    const lim = Math.max(SOGLIE[vp]?.risposta ?? 0, senza);
    if (e0 > lim) male.push(`${dove}: con la mossa la risposta scorre di ${e0} px (soglia ${lim}, PO-152 B)`);
    ris.push({ vp, giro, risposta: e0, senza, unita: s0.attivi.length });
    if (giro === 'ricarica') { // C56-02 (D-262): ricaricata prima di muovere, la pausa con la mossa torna (rosso C262R01: persa)
      await p.reload(); await p.getByRole('button', { name: 'Riprendi' }).click();
      const torna = await p.waitForSelector('.mappa [data-mossa="puoi"]', { timeout: 15000, state: 'attached' }).then(() => true).catch(() => false);
      if (!torna || !(await stato(p)).attivi.length) male.push(`${dove}: dopo una ricarica prima di muovere la mossa di quella pausa è persa (C56-02)`);
      await p.close(); continue;
    }
    if (giro === 'avanti' || !s0.attivi.length) {
      if (giro === 'avanti') { // la mossa è facoltativa: «Avanti» senza toccare niente porta alla chiamata dopo
        await p.click('[data-azione="continua"]');
        if (!(await p.waitForSelector('[data-messaggio^="chiamata-"]', { timeout: 15000 }).then(() => true).catch(() => false))) male.push(`${dove}: «Avanti» senza mossa non porta alla chiamata dopo (PO-152 B)`);
        // C56-02: «Avanti» senza mossa chiude la pausa; ricaricata, si riprende dalla chiamata, non dalla risposta lasciata
        else { await p.reload(); await p.getByRole('button', { name: 'Riprendi' }).click();
          if (!(await p.waitForSelector('[data-messaggio^="chiamata-"]', { timeout: 15000 }).then(() => true).catch(() => false))) male.push(`${dove}: dopo «Avanti» e una ricarica torna la risposta lasciata (C56-02)`); }
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
    // C56-05 (D-268): dopo la mossa da tastiera il fuoco è su «Avanti» (rosso C268F01: su «i» in cima)
    if (h === 760) { const f = await p.evaluate(() => document.activeElement?.dataset?.azione ?? document.activeElement?.className ?? ''); if (f !== 'continua') male.push(`${dove}: dopo la mossa da tastiera il fuoco è su «${f}», non su «Avanti» (C56-05)`); }
    if (s2.indicazione !== 'fatta') male.push(`${dove}: dopo la mossa manca «Mossa fatta» (${s2.indicazione}, PO-152 B)`);
    if (s2.attivi.length) male.push(`${dove}: dopo la mossa si toccano ancora ${s2.attivi.length} unità: seconda mossa possibile (PO-152 B)`);
    // D-262: la previsione a schermo (riga e segni sulla mappa) è quella della logica
    const attesa = effettoMossa(m, prima.in_corso, dopo.in_corso, { risorsa: r, da, a }, dich).filter((e) => e.verso !== 'pari').map((e) => `${e.settore}:${e.verso}`).join(' ');
    const vista = await p.evaluate(() => ({ riga: document.querySelector('.mappa [data-previsione]')?.dataset.previsione ?? null, segni: [...document.querySelectorAll('.mappa [data-segno]')].map((x) => x.dataset.segno) }));
    if (vista.riga === null) male.push(`${dove}: dopo la mossa manca la previsione (D-262)`);
    else if (vista.riga !== attesa) male.push(`${dove}: previsione a schermo «${vista.riga}», la logica dice «${attesa}» (D-262)`);
    for (const x of attesa.split(' ').filter(Boolean)) { const [k, v] = x.split(':'); if (!vista.segni.includes(`${k}:tensione:${v}`)) male.push(`${dove}: manca il segno ${v === 'su' ? '▲' : '▼'} su ${k} (D-262)`); }
    await p.close();
  }
  const hr = RADIO_VP[larghezza];
  if (hr && giri.includes('radio')) { const r = await controllaRadio(browser, url, larghezza, hr, rossi, dati, dich, solo.episodi, pagine); male.push(...r.male); ris.push(r.ris); }
  if (hr && giri.includes('previsione')) { const r = await controllaPrevisione(browser, url, larghezza, hr, rossi, dati, dich, pagine); male.push(...r.male); ris.push(r.ris); }
  if (FERMO_VP[larghezza] && giri.includes('fermo')) { const r = await controllaFermo(browser, url, larghezza, FERMO_VP[larghezza], rossi, dati, dich, pagine); male.push(...r.male); ris.push(r.ris); }
  return { ris, male };
}

const PAGINE_RADIO = Number(process.env.PAGINE_RADIO ?? 4);
const insieme = async (compiti, n) => { const coda = [...compiti]; await Promise.all(Array.from({ length: Math.min(n, coda.length) }, async () => { while (coda.length) await coda.shift()(); })); };
/** D-255 punto 2: prima chiamata con mossa di ogni episodio; stati «puoi», «dove» (ogni unità in mano) e «mossa fatta». */
async function controllaRadio(browser, url, larghezza, h, rossi, dati, dich, episodi, pagine = 1) {
  const male = [], vp = `${larghezza}x${h}`, tutte = chiamateCostruite(dati, dich), conto = { vp, giro: 'radio', episodi: 0, conSegni: 0, senzaSegni: 0, stati: 0, stretti: 0, muti: 0, conCosto: 0, senzaCosto: 0, scorreMax: 0, sotto: 0, mappaMin: Infinity, mappaMax: 0, casaFuori: 0 }, soglia = SOGLIE[vp]?.risposta ?? 0;
  // al più 4 chiamate per episodio: col rosso C241M02 (mappa che non si tocca) nessuna ha la mossa e si giravano tutte le chiamate
  // dei 36 episodi (4 ore e 20 nel giro dei bracci), fino a un'opzione esaurita (e28 blocca_corteo) che faceva saltare il passo
  // lotto «altezze» (S-11): gli episodi vanno su più pagine insieme (prima uno alla volta: 390 s su 540 di po152b a 360, quasi tutti attese)
  const uno = async (ep) => { for (const c of tutte.filter((x) => x.ep === ep).slice(0, 4)) {
    const ch = dati[`missioni/${ep}.json`].ondate.flatMap((o) => o.chiamate ?? []).find((x) => x.id === c.id);
    const p = await browser.newPage({ viewport: { width: larghezza, height: h }, hasTouch: true, reducedMotion: 'reduce' });
    await p.addInitScript(() => { globalThis.__VALMORA_SECONDO_MS = 1; });
    if (rossi.length) await p.addInitScript((xs) => { for (const x of xs) globalThis[`__NO_${x}`] = true; }, rossi);
    await p.goto(url); await p.evaluate(([k, v]) => localStorage.setItem(k, v), [CHIAVE, c.sal]); await p.reload();
    await p.getByRole('button', { name: 'Riprendi' }).click();
    let n0 = conto.stati;
    const ok = ch && await p.waitForSelector(`[data-messaggio="chiamata-${c.id}"]`, { timeout: 15000 }).then(() => true).catch(() => false);
    if (ok && await p.$(`[data-opzione="${ch.opzioni[0].id}"]:disabled`)) { await p.close(); continue; } // esaurita: la prossima chiamata
    // C57-01: le altezze della mappa da quando c'è la risposta, a ogni fotogramma
    if (ok) await p.evaluate(() => { const t = globalThis.__altezze = []; const reg = () => { const m = document.querySelector('.mappa');
      if (m && document.querySelector('[data-messaggio="risposta"]')) { const a = Math.round(m.getBoundingClientRect().height); if (t.at(-1) !== a) t.push(a); } requestAnimationFrame(reg); }; reg(); });
    // D-270 (D-269 c): posto del riquadro e presenza dei segni ▲/▼ a ogni fotogramma, dentro la pagina (non dipende dal carico)
    if (ok) await p.evaluate(() => { const t = globalThis.__posti = []; const reg = () => { const r = document.querySelector('.radio-mappa');
      if (r && document.querySelector('[data-messaggio="risposta"]')) { const k = `${r.className} ${r.style.getPropertyValue('--radio-y')}`, s = !!document.querySelector('.mappa [data-segno]');
        if (t.at(-1)?.k !== k || t.at(-1)?.s !== s) t.push({ t: performance.now(), k, s }); } requestAnimationFrame(reg); }; reg(); });
    if (ok) { await p.click(`[data-opzione="${ch.opzioni[0].id}"]`); await p.click('[data-conferma]').catch(() => {}); }
    const pronta = ok && await puoi(p);
    if (!pronta) { await p.close(); continue; } // nessuna mossa dopo questa chiamata (ultima dell'ondata): la prossima
    await p.waitForTimeout(300);
    // la pagina ferma: la mappa che si abbassa (D-259) e i nomi si ridispongono dopo il tocco; due letture uguali a 100 ms, al più 3 s
    // (e30 raduno_silenzio a 375: 79 px a 80 ms, 0 a 250 ms)
    const ferma = async () => { let prima = ''; for (let i = 0; i < 30; i++) { const ora = await p.evaluate(() => `${document.scrollingElement.scrollHeight}|${document.querySelector('.mappa')?.getBoundingClientRect().height}|${document.querySelector('.radio-mappa')?.className}`); if (ora === prima) return; prima = ora; await p.waitForTimeout(100); } };
    const giu = async (dove) => { await ferma(); const x = await coperti(p); conto.stati++; if (x.muto) conto.muti++; else if (x.stretto) conto.stretti++;
      if (x.xs.length) male.push(`${vp} ${ep} ${c.id} ${dove}: il riquadro radio copre ${x.xs.join(', ')} (D-255)`);
      conto.scorreMax = Math.max(conto.scorreMax, x.ecc);
      if (x.fuori) conto.casaFuori++;
      if (x.case_ !== 1) male.push(`${vp} ${ep} ${c.id} ${dove}: ${x.case_} pulsanti «Home» visibili, ne serve uno (D-261)`);
      if (x.tagliato) male.push(`${vp} ${ep} ${c.id} ${dove}: il riquadro radio è tagliato (D-262)`);
      if (!x.previsione) male.push(`${vp} ${ep} ${c.id} ${dove}: la previsione non si vede (C57-02)`);
      if (!x.istruzione) male.push(`${vp} ${ep} ${c.id} ${dove}: l'istruzione della mossa non si vede (D-269 a)`);
      if (x.righe.length) male.push(`${vp} ${ep} ${c.id} ${dove}: copia sotto la mappa coperta a pagina ferma: ${x.righe.join(', ')} (D-269 b)`);
      if (x.coperto.length) male.push(`${vp} ${ep} ${c.id} ${dove}: il centro non si tocca: ${x.coperto.join(', ')} (C56-03)`);
      if (x.senzaBordo.length) male.push(`${vp} ${ep} ${c.id} ${dove}: senza evidenziazione ${x.senzaBordo.join(', ')} (D-261)`);
      if (x.sotto) { conto.sotto++; conto.mappaMin = Math.min(conto.mappaMin, x.mappa); conto.mappaMax = Math.max(conto.mappaMax, x.mappa); }
      if (x.ecc > soglia) male.push(`${vp} ${ep} ${c.id} ${dove}: la risposta scorre di ${x.ecc} px (soglia ${soglia}, D-258)`);
      if (ch.opzioni[0].costo) { conto.conCosto++; if (!x.costo) { conto.senzaCosto++; male.push(`${vp} ${ep} ${c.id} ${dove}: dopo «Conferma» il costo non si vede (D-258)`); } } };
    // D-269 c: dopo l'assestamento il riquadro resta com'è senza input, anche quando spariscono i segni ▲/▼ (1,8 s veri, App.tsx:85).
    // D-270: la sola lettura da fuori veniva spesso a segni già spariti (rosso C269C01 visto a caso, 0-8 episodi su 36 secondo il
    // carico): ora si confronta anche il posto dell'ultimo fotogramma coi segni (fermo da ≥ 300 ms) con quello a segni spariti
    const posto = () => p.evaluate(() => { const r = document.querySelector('.radio-mappa'); return `${r?.className} ${r?.style.getPropertyValue('--radio-y')}`; });
    await giu('«puoi spostare»'); const t0 = Date.now(), posto0 = await posto();
    await p.waitForFunction(() => !document.querySelector('.mappa [data-segno]'), null, { timeout: 5000 }).catch(() => {});
    await p.waitForTimeout(Math.max(500, 2500 - (Date.now() - t0))); const posto1 = await posto();
    if (posto1 !== posto0) male.push(`${vp} ${ep} ${c.id}: senza input il riquadro passa da «${posto0}» a «${posto1}» (D-269 c)`);
    const st = await p.evaluate(() => globalThis.__posti), iv = st.findIndex((x, i) => i > 0 && !x.s && st[i - 1].s);
    if (iv > 0 && st[iv].t - st[iv - 1].t >= 300) { conto.conSegni++;
      if (posto1 !== st[iv - 1].k) male.push(`${vp} ${ep} ${c.id}: allo sparire dei segni ▲/▼ il riquadro passa da «${st[iv - 1].k}» a «${posto1}» (D-269 c)`); }
    else conto.senzaSegni++; // segni mai visti a riquadro fermo: l'episodio non dice niente su D-269 c
    const altezze = await p.evaluate(() => globalThis.__altezze), ferma0 = altezze.at(-1);
    if (altezze.length > 2) male.push(`${vp} ${ep} ${c.id}: dopo «Conferma» la mappa scende a gradini, ${altezze.join(' → ')} px (C57-01)`);
    const stessa = async (dove) => { const a = await p.evaluate(() => globalThis.__altezze); if (a.at(-1) !== ferma0 || a.length > altezze.length)
      male.push(`${vp} ${ep} ${c.id} ${dove}: la mappa cambia altezza, ${a.slice(altezze.length - 1).join(' → ')} px (C57-01)`); };
    // D-259: anche con la mappa abbassata ogni unità spostabile (logica: schierata, non fissa) ha il suo pulsante toccabile
    const sv = await sal(p), attese = Object.entries(sv.in_corso.disposizione ?? {}).filter(([r]) => !dati[`missioni/${ep}.json`].mappa.risorse[r]?.fissa)
      .flatMap(([r, ps]) => Object.entries(ps).filter(([, n]) => n > 0).map(([k]) => `${r}@${k}`));
    const toccabili = await p.$$eval('.mappa [data-presenza]:not(:disabled)', (xs) => xs.filter((x) => x.checkVisibility() && x.getBoundingClientRect().width > 0).map((x) => x.dataset.presenza));
    for (const u of attese) if (!toccabili.includes(u)) male.push(`${vp} ${ep} ${c.id}: l'unità ${u} si può spostare ma non si tocca sulla mappa (D-259)`);
    for (const id of await p.$$eval('.mappa [data-presenza]:not(:disabled)', (xs) => xs.map((x) => x.dataset.presenza))) {
      await p.locator(`.mappa [data-presenza="${id}"]`).click({ force: true }); await p.waitForTimeout(80);
      await giu(`«tocca il settore» con ${id} in mano`); await stessa(`con ${id} in mano`);
      await p.keyboard.press('Escape'); await p.waitForTimeout(50);
    }
    // la mossa fatta: la risposta resta (entro soglia, costo visibile, una «Home»)
    const id = (await p.$$eval('.mappa [data-presenza]:not(:disabled)', (xs) => xs.map((x) => x.dataset.presenza)))[0];
    if (id) { await p.locator(`.mappa [data-presenza="${id}"]`).click({ force: true }); await p.waitForTimeout(80);
      const a = await p.$('.mappa .settore-punto:not(:disabled)'); if (a) { await a.click({ force: true }); await p.waitForTimeout(150); await giu('«mossa fatta»'); await stessa('dopo la mossa'); } }
    if (process.env.VALMORA_DETTAGLIO) console.log(`  ${vp} ${ep} ${c.id}: ${conto.stati - n0} stati`);
    conto.episodi++; await p.close(); break;
  } };
  await insieme([...new Set(tutte.map((c) => c.ep))].filter((e) => !episodi || episodi.includes(e)).map((ep) => () => uno(ep)), pagine);
  console.log(`radio della mossa ${vp}: ${conto.episodi} episodi (D-269 c: segni ▲/▼ visti a riquadro fermo in ${conto.conSegni}, no in ${conto.senzaSegni}), ${conto.stati} stati, rapporto al solo lettore in ${conto.stretti}, riquadro al solo lettore in ${conto.muti}; con costo ${conto.conCosto}, costo non visibile in ${conto.senzaCosto}; scorrimento massimo ${conto.scorreMax} px (soglia ${soglia}); costo sotto la mappa in ${conto.sotto}, mappa alta da ${conto.mappaMin} a ${conto.mappaMax} px; «Home» nella testata in ${conto.casaFuori}`);
  if (conto.episodi < (episodi ? episodi.length : 30)) male.push(`${vp}: radio della mossa provata solo in ${conto.episodi} episodi${episodi ? ` su ${episodi.length} del braccio` : ''} (D-255)`);
  return { ris: conto, male };
}

/** C57-02 (D-269): ogni combinazione unità → settore delle chiamate di CASI_PREVISIONE; dopo la mossa la previsione si vede, la
 *  mappa non ha cambiato altezza dal «puoi spostare» (C57-01) e la risposta scorre entro soglia. */
const CASI_PREVISIONE = [['e16', 'imp_nebbia']];
async function controllaPrevisione(browser, url, larghezza, h, rossi, dati, dich, pagine = 1) {
  const male = [], vp = `${larghezza}x${h}`, tutte = chiamateCostruite(dati, dich), conto = { vp, giro: 'previsione', mosse: 0, sotto: 0 }, soglia = SOGLIE[vp]?.risposta ?? 0;
  for (const [ep, id] of CASI_PREVISIONE) {
    const c = tutte.find((x) => x.ep === ep && x.id === id), ch = dati[`missioni/${ep}.json`].ondate.flatMap((o) => o.chiamate ?? []).find((x) => x.id === id);
    if (!c || !ch) { male.push(`${vp} ${ep} ${id}: chiamata non trovata (C57-02)`); continue; }
    const apri = async () => { const p = await browser.newPage({ viewport: { width: larghezza, height: h }, hasTouch: true, reducedMotion: 'reduce' });
      await p.addInitScript((xs) => { globalThis.__VALMORA_SECONDO_MS = 1; for (const x of xs) globalThis[`__NO_${x}`] = true; }, rossi);
      await p.goto(url); await p.evaluate(([k, v]) => localStorage.setItem(k, v), [CHIAVE, c.sal]); await p.reload(); await p.getByRole('button', { name: 'Riprendi' }).click();
      await p.waitForSelector(`[data-messaggio="chiamata-${id}"]`, { timeout: 15000 }); await p.click(`[data-opzione="${ch.opzioni[0].id}"]`); await p.click('[data-conferma]').catch(() => {});
      // CI 1256: col rosso C241M02 il «puoi spostare» non c'è; prima era un'eccezione (catena rossa per crash), ora è un problema
      if (!(await puoi(p))) { await p.close(); return null; }
      await p.waitForTimeout(300);
      let prima = ''; for (let i = 0; i < 30; i++) { const ora = await p.evaluate(() => `${document.scrollingElement.scrollHeight}|${document.querySelector('.mappa')?.getBoundingClientRect().height}|${document.querySelector('.radio-mappa')?.className}`); if (ora === prima) break; prima = ora; await p.waitForTimeout(100); }
      return p; };
    const altezza = (p) => p.evaluate(() => Math.round(document.querySelector('.mappa').getBoundingClientRect().height));
    const p0 = await apri(); if (!p0) { male.push(`${vp} ${ep} ${id}: il «puoi spostare» non compare (C57-02)`); continue; }
    const unita = await p0.$$eval('.mappa [data-presenza]:not(:disabled)', (xs) => xs.map((x) => x.dataset.presenza)); await p0.close();
    // lotto «altezze» (S-11): un'unità per pagina, più pagine insieme; le mosse di ogni unità restano in fila
    await insieme(unita.map((u) => async () => { for (let j = 0, n = 1; j < n; j++) {
      const p = await apri(); if (!p) { male.push(`${vp} ${ep} ${id} ${u}: il «puoi spostare» non compare (C57-02)`); break; }
      const h0 = await altezza(p);
      await p.locator(`.mappa [data-presenza="${u}"]`).click({ force: true }); await p.waitForTimeout(80);
      const ss = await p.$$('.mappa .settore-punto:not(:disabled)'); n = ss.length;
      if (!ss[j]) { await p.close(); break; }
      const a = await ss[j].evaluate((e) => e.closest('[data-settore]').dataset.settore); await ss[j].click({ force: true }); await p.waitForTimeout(600);
      const x = await coperti(p), h1 = await altezza(p), dove = `${vp} ${ep} ${id} ${u} → ${a}`; conto.mosse++; if (x.muto) conto.sotto++;
      if (!x.previsione) male.push(`${dove}: la previsione non si vede (C57-02)`);
      if (!x.istruzione) male.push(`${dove}: l'istruzione della mossa non si vede (D-269 a)`);
      if (x.righe.length) male.push(`${dove}: copia sotto la mappa coperta a pagina ferma: ${x.righe.join(', ')} (D-269 b)`);
      if (h1 !== h0) male.push(`${dove}: dopo la mossa la mappa passa da ${h0} a ${h1} px (C57-01)`);
      if (x.ecc > soglia) male.push(`${dove}: la risposta scorre di ${x.ecc} px (soglia ${soglia})`);
      await p.close();
    } }), pagine);
  }
  console.log(`previsione dopo la mossa ${vp}: ${conto.mosse} mosse, previsione sotto la mappa in ${conto.sotto}`);
  if (!conto.mosse) male.push(`${vp}: nessuna mossa provata (C57-02)`);
  return { ris: conto, male };
}

/** D-269 c: prima chiamata con la mossa di ogni episodio; nello stato «puoi», 2,5 s senza input: riquadro (classe, posto) e unità fermi. */
export async function controllaFermo(browser, url, larghezza, h, rossi, dati, dich, pagine = 1) {
  const male = [], vp = `${larghezza}x${h}`, tutte = chiamateCostruite(dati, dich), conto = { vp, giro: 'fermo', episodi: 0 };
  // lotto «altezze» (S-11): episodi su più pagine insieme, come il giro radio
  const uno = async (ep) => { for (const c of tutte.filter((x) => x.ep === ep).slice(0, 4)) {
    const ch = dati[`missioni/${ep}.json`].ondate.flatMap((o) => o.chiamate ?? []).find((x) => x.id === c.id);
    const p = await browser.newPage({ viewport: { width: larghezza, height: h }, hasTouch: true, reducedMotion: 'reduce' });
    await p.addInitScript(() => { globalThis.__VALMORA_SECONDO_MS = 1; });
    if (rossi.length) await p.addInitScript((xs) => { for (const x of xs) globalThis[`__NO_${x}`] = true; }, rossi);
    await p.goto(url); await p.evaluate(([k, v]) => localStorage.setItem(k, v), [CHIAVE, c.sal]); await p.reload();
    await p.getByRole('button', { name: 'Riprendi' }).click();
    const ok = ch && await p.waitForSelector(`[data-messaggio="chiamata-${c.id}"]`, { timeout: 15000 }).then(() => true).catch(() => false);
    if (!ok || await p.$(`[data-opzione="${ch.opzioni[0].id}"]:disabled`)) { await p.close(); continue; }
    await p.click(`[data-opzione="${ch.opzioni[0].id}"]`); await p.click('[data-conferma]').catch(() => {});
    if (!(await puoi(p))) { await p.close(); continue; }
    await p.waitForTimeout(300);
    const posto = () => p.evaluate(() => { const r = document.querySelector('.radio-mappa'), m = document.querySelector('.mappa').getBoundingClientRect();
      return `${r?.className} ${r?.style.getPropertyValue('--radio-y')} | unità ${[...document.querySelectorAll('.mappa [data-presenza]')].map((b) => Math.round(b.getBoundingClientRect().top - m.top)).join(',')}`; });
    const posto0 = await posto(); await p.waitForTimeout(2500); const posto1 = await posto();
    if (posto1 !== posto0) male.push(`${vp} ${ep} ${c.id}: senza input riquadro o unità cambiano, da «${posto0}» a «${posto1}» (D-269 c)`);
    conto.episodi++; await p.close(); break;
  } };
  await insieme([...new Set(tutte.map((c) => c.ep))].map((ep) => () => uno(ep)), pagine);
  console.log(`fermo della mossa ${vp}: ${conto.episodi} episodi`);
  return { male, ris: conto };
}
