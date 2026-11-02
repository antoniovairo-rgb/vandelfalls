// PO-152 (D-241, idea A, «la mappa è la fonte»): prima di «Conferma» sotto le opzioni non c'è nessun costo (accenno D-078,
// «Ti costa…», icone degli effetti); dopo «Conferma» il costo arriva come rapporto radio nella risposta; in chiamata i settori
// si toccano e aprono una scheda di stato che non cambia la partita, non fa scorrere la pagina, si chiude con un tocco o con
// Esc (il fuoco torna al settore) e ha bersagli ≥ --tocco-min. Chiamate costruite col motore (sonda-altezze), aperte da
// salvataggio. Rossi: VALMORA_ROSSI=C241A01 (costo sotto le opzioni, niente rapporto radio), C241M01 (mappa disattivata),
// C255S01 (C55-01: la scheda sempre in basso copre i settori bassi).
import { join } from 'node:path';
import { chiamateCostruite, SOGLIE } from './sonda-altezze.mjs';

export const ALTEZZE_PO152A = [640, 760];
// la prima chiamata di e01 con un settore, e la prima chiamata con una risposta che impegna unità («Ti costa…»)
const scegli = (dati, dich) => {
  const tutte = chiamateCostruite(dati, dich), m = (c) => dati[`missioni/${c.ep}.json`];
  const opz = (c) => m(c).ondate.flatMap((o) => o.chiamate).find((x) => x.id === c.id);
  const impegna = (o) => o.effetti.some((e) => 'riserva' in e && e.valore < 0);
  const a = tutte.find((c) => c.ep === 'e01' && opz(c).settore), b = tutte.find((c) => c !== a && opz(c).settore && opz(c).opzioni.some(impegna));
  return [a, b].filter(Boolean).map((c) => ({ ...c, settore: opz(c).settore, opzione: (opz(c).opzioni.find(impegna) ?? opz(c).opzioni[0]).id }));
};
const stato = (p) => p.evaluate(() => localStorage.getItem('vandelfalls-salvataggio'));
const ecc = (p) => p.evaluate(() => document.scrollingElement.scrollHeight - innerHeight);
const costiVisibili = (p) => p.evaluate(() => [...document.querySelectorAll('.opzioni [data-costo], .opzioni [data-quando], .opzioni [data-effetti]')]
  .filter((e) => e.getClientRects().length && !e.closest('.esaurita')).map((e) => e.textContent.trim()).concat(/Ti costa/.test(document.querySelector('.opzioni')?.textContent ?? '') ? ['«Ti costa…»'] : []));
const scheda = (p) => p.evaluate(() => {
  const s = document.querySelector('[data-scheda-settore]'); if (!s) return null;
  const r = (e) => e.getBoundingClientRect(), px = (v) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(v)) || 0;
  const rs = r(s), rm = r(s.closest('.mappa')), x = s.querySelector('[data-chiudi-scheda]'), rx = x ? r(x) : null, nome = document.getElementById(s.getAttribute('aria-labelledby') ?? '')?.textContent ?? '';
  return { id: s.dataset.schedaSettore, ruolo: s.getAttribute('role'), nome, chiudi: x?.getAttribute('aria-label') ?? '', fuoco: document.activeElement === x, righe: [...s.querySelectorAll('[data-riga]')].map((e) => e.dataset.riga),
    dentro: rs.left >= rm.left - 0.5 && rs.right <= rm.right + 0.5 && rs.top >= rm.top - 0.5 && rs.bottom <= rm.bottom + 0.5, lato: rx ? Math.min(rx.width, rx.height) : 0, min: px('--tocco-min') };
});

/** Problemi alla larghezza data, alle altezze di ALTEZZE_PO152A. */
export async function controllaPo152a(browser, url, larghezza, rossi = [], cartella = '', dati, dich) {
  const male = [], ris = [], casi = scegli(dati, dich);
  if (casi.length < 2) male.push(`PO-152 A: chiamate di prova trovate ${casi.length}, servono 2`);
  for (const h of ALTEZZE_PO152A) for (const c of casi) {
    const vp = `${larghezza}x${h}`, dove = `${vp} ${c.ep} ${c.id}`, p = await browser.newPage({ viewport: { width: larghezza, height: h }, hasTouch: true, reducedMotion: 'reduce' });
    await p.addInitScript(() => { globalThis.__VALMORA_SECONDO_MS = 1; });
    if (rossi.length) await p.addInitScript((xs) => { for (const x of xs) globalThis[`__NO_${x}`] = true; }, rossi);
    await p.goto(url); await p.evaluate((v) => localStorage.setItem('vandelfalls-salvataggio', v), c.sal); await p.reload();
    await p.getByRole('button', { name: 'Riprendi' }).click();
    if (!(await p.waitForSelector(`[data-messaggio="chiamata-${c.id}"]`, { timeout: 8000 }).then(() => true).catch(() => false))) { male.push(`${dove}: la chiamata non si apre (PO-152)`); await p.close(); continue; }
    await p.waitForTimeout(400);
    // 1) prima della scelta nessun costo
    const visti = await costiVisibili(p);
    if (visti.length) male.push(`${dove}: prima di «Conferma» si vedono ${visti.length} indicazioni di costo («${visti[0]}», PO-152 A)`);
    // 2) settori toccabili in chiamata: la scheda si apre, non cambia la partita né l'altezza della pagina, si chiude
    const prima = await stato(p), e0 = await ecc(p);
    const altro = await p.evaluate((s) => [...document.querySelectorAll('[data-settore]')].map((e) => e.dataset.settore).find((x) => x !== s) ?? null, c.settore);
    for (const s of [c.settore, altro].filter(Boolean)) {
      const punto = p.locator(`[data-settore="${s}"] .settore-punto`);
      if (await punto.isDisabled()) { male.push(`${dove}: il settore ${s} non si tocca in chiamata (PO-152 A)`); continue; }
      const lato = await punto.evaluate((e) => { const r = e.getBoundingClientRect(); return Math.min(r.width, r.height); });
      await punto.click(); await p.waitForTimeout(200);
      const k = await scheda(p);
      if (!k || k.id !== s) { male.push(`${dove}: il tocco sul settore ${s} non apre la sua scheda (PO-152 A)`); continue; }
      if (cartella && s === c.settore) await p.screenshot({ path: join(cartella, `${vp}-po152a-${c.ep}-scheda.png`), fullPage: true });
      ris.push({ vp, ep: c.ep, settore: s, righe: k.righe.join(','), lato: k.lato, puntoLato: lato, ecc: await ecc(p) });
      if (k.ruolo !== 'dialog' || !k.nome || !k.chiudi) male.push(`${dove}: scheda di ${s} senza ruolo o nome accessibile (PO-152 A)`);
      if (!k.fuoco) male.push(`${dove}: aperta la scheda di ${s}, il fuoco non va su «Chiudi» (PO-152 A)`);
      if (!k.dentro) male.push(`${dove}: la scheda di ${s} esce dalla mappa (PO-152 A)`);
      if (k.lato < k.min || lato < k.min) male.push(`${dove}: bersaglio di ${Math.round(Math.min(k.lato, lato))} px, serve ≥ ${k.min} (PO-152 A)`);
      if (!k.righe.includes('chiamata') || !k.righe.includes('unita')) male.push(`${dove}: scheda di ${s} senza le righe attese (${k.righe.join(', ')}, PO-152 A)`);
      if ((await ecc(p)) > e0) male.push(`${dove}: con la scheda di ${s} aperta la pagina scorre di ${(await ecc(p)) - e0} px in più (PO-152 A)`);
      // chiusura: col tocco sulla scheda (primo settore), con Esc da tastiera (secondo); col tasto il fuoco torna al settore
      if (s === c.settore) { await p.click('[data-scheda-settore]', { position: { x: 8, y: 8 } }); }
      else { await p.keyboard.press('Escape'); }
      await p.waitForTimeout(150);
      if (await p.locator('[data-scheda-settore]').count()) male.push(`${dove}: la scheda di ${s} non si chiude ${s === c.settore ? 'col tocco' : 'con Esc'} (PO-152 A)`);
      if (s !== c.settore && !(await punto.evaluate((e) => document.activeElement === e))) male.push(`${dove}: chiusa con Esc, il fuoco non torna al settore ${s} (PO-152 A)`);
    }
    // C55-01 (D-255): per ogni settore, aperta la sua scheda, il centro del settore toccato resta in vista (rosso C255S01)
    for (const k of await p.evaluate(() => [...document.querySelectorAll('.mappa [data-settore]')].map((e) => e.dataset.settore))) {
      const punto = p.locator(`[data-settore="${k}"] .settore-punto`);
      if (await punto.isDisabled()) continue;
      await punto.click(); await p.waitForTimeout(120);
      const coperto = await p.evaluate((id) => { const sc = document.querySelector('[data-scheda-settore]'), b = document.querySelector(`[data-settore="${id}"] .settore-punto`); if (!sc || !b) return null;
        const r = sc.getBoundingClientRect(), q = b.getBoundingClientRect(), x = q.left + q.width / 2, y = q.top + q.height / 2; return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; }, k);
      if (coperto) male.push(`${dove}: la scheda copre il settore toccato «${k}» (C55-01)`);
      await p.keyboard.press('Escape'); await p.waitForTimeout(80);
    }
    if ((await stato(p)) !== prima) male.push(`${dove}: aprire e chiudere le schede ha cambiato il salvataggio (PO-152 A)`);
    // 3) dopo «Conferma» il costo arriva come rapporto radio, in parole (D-078: niente numeri nell'accenno)
    await p.click(`[data-opzione="${c.opzione}"]`); await p.click('[data-conferma]').catch(() => {});
    if (!(await p.waitForSelector('[data-messaggio="risposta"]', { timeout: 8000 }).then(() => true).catch(() => false))) { male.push(`${dove}: dopo «Conferma» la risposta non arriva (PO-152 A)`); await p.close(); continue; }
    await p.waitForTimeout(300);
    // D-258: il rapporto visibile, nel riquadro sopra la mappa o (senza posto) nella risposta sotto; quello sotto non ha i controlli del riquadro
    const radio = await p.evaluate((o) => { const e = [...document.querySelectorAll(`[data-rapporto-costo="${o}"]`)].find((x) => x.getClientRects().length && x.checkVisibility()); if (!e) return null;
      const r = (x) => x.getBoundingClientRect(), b = e.closest('[data-radio-mappa]') ?? e, rb = r(b), rm = b.closest('.mappa') ? r(b.closest('.mappa')) : null;
      const tocca = (q) => q.left < rb.right && q.right > rb.left && q.top < rb.bottom && q.bottom > rb.top;
      return { costo: e.querySelector('[data-costo]')?.textContent.trim() ?? '', quando: e.querySelector('[data-quando]')?.textContent.trim() ?? '', tagliato: b.scrollHeight > b.clientHeight + 1,
        sotto: e.hasAttribute('data-sotto'), dentro: !!rm && rb.left >= rm.left - 0.5 && rb.right <= rm.right + 0.5 && rb.top >= rm.top - 0.5 && rb.bottom <= rm.bottom + 0.5, segni: [...document.querySelectorAll('[data-segno]')].filter((x) => tocca(r(x))).length }; }, c.opzione);
    if (!radio || !radio.costo) male.push(`${dove}: dopo «Conferma» nessun rapporto radio col costo di «${c.opzione}» (PO-152 A)`);
    else {
      if (/\d/.test(radio.costo)) male.push(`${dove}: il costo per radio contiene numeri («${radio.costo}», D-078)`);
      if (!radio.quando) male.push(`${dove}: «${c.opzione}» impegna unità ma il rapporto radio non dice quante (PO-152 A)`);
      if (radio.sotto) { /* nella risposta: niente controlli del riquadro */ } else if (!radio.dentro || radio.tagliato) male.push(`${dove}: il rapporto radio ${radio.dentro ? 'è tagliato' : 'esce dalla mappa'} (PO-152 A)`);
      if (!radio.sotto && radio.segni) male.push(`${dove}: il rapporto radio sta sotto ${radio.segni} segni ▲/▼ (PO-152 A)`);
    }
    // il rapporto radio non allunga la risposta: scorrimento entro la soglia di sonda-altezze, o non più di senza rapporto
    const er = await ecc(p), senza = await p.evaluate(() => { const e = document.querySelector('[data-rapporto-costo]'); if (e) e.style.display = 'none'; const x = document.scrollingElement.scrollHeight - innerHeight; if (e) e.style.display = ''; return x; });
    const lim = Math.max(SOGLIE[vp]?.risposta ?? 0, senza);
    ris.push({ vp, ep: c.ep, risposta: er, senzaRadio: senza });
    if (er > lim) male.push(`${dove}: la risposta col rapporto radio scorre di ${er} px (soglia ${lim}, sonda-altezze)`);
    if (cartella) await p.screenshot({ path: join(cartella, `${vp}-po152a-${c.ep}-risposta.png`), fullPage: true });
    await p.close();
  }
  return { ris, male };
}
