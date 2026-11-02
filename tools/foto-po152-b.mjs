// D-241 idea B, «una mossa per chiamata» (mossa-ui.tsx): nella risposta l'indicazione «Puoi spostare…» sta sopra la mappa
// (la pagina non si allunga); si toccano solo le unità spostabili (bersagli ≥ --tocco-min), poi solo i settori ammessi; la
// mossa cambia la disposizione e il salvataggio; dopo la mossa nessun'altra nella stessa pausa; Esc lascia l'unità; «Avanti»
// senza mossa resta possibile. Con la tastiera a 760 di altezza, col tocco a 640 e 667. Chiamata costruita col motore
// (sonda-altezze), aperta da salvataggio. Rossi: VALMORA_ROSSI=C241B01 (mosse illimitate), C241M02 (mappa che non si tocca).
import { join } from 'node:path';
import { chiamateCostruite, SOGLIE } from './sonda-altezze.mjs';

export const ALTEZZE_PO152B = [640, 667, 760];
const CHIAVE = 'vandelfalls-salvataggio';
const sal = (p) => p.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null'), CHIAVE);
const ecc = (p) => p.evaluate(() => document.scrollingElement.scrollHeight - innerHeight);
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
  return { ris, male };
}
