// D-272 passo 4: dopo la mossa, per circa 2 s, «−1» sul settore lasciato e «+1» su quello d'arrivo (Mappa.tsx, mossa-ui.tsx;
// rosso C272D01: nessun segno). Giro «segno» di po152b, e03 auto_in_sosta, ogni unità spostabile verso il primo settore ammesso.
// Subito dopo la mossa (150 ms): un solo «−1» sul settore di partenza e un solo «+1» su quello d'arrivo, con l'icona dell'unità;
// testo e bordo staccati dal fondo almeno 3:1; nessun tocco (centro di dischi e pastiglie) preso dal segno; la pagina non scorre
// più di prima della mossa; con la riduzione del movimento niente animazione. Dopo 2,5 s veri il segno non c'è più.
import { chiamateCostruite } from './sonda-altezze.mjs';
import { contrasto } from './anelli-mossa.mjs';
import { CASI_SALTI } from './salti-po152b.mjs';

const rgb = (s) => (s.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
const leggi = (p) => p.evaluate(() => {
  const segni = [...document.querySelectorAll('.mappa .segno-mossa')].map((e) => { const s = getComputedStyle(e);
    return { k: e.dataset.segnoMossa, testo: e.textContent, icona: !!e.querySelector('svg'), colore: s.color, fondo: s.backgroundColor, bordo: s.borderTopColor, anim: s.animationName }; });
  const presi = [...document.querySelectorAll('.mappa [data-presenza], .mappa [data-fissa], .mappa .settore-punto')].flatMap((e) => { const r = e.getBoundingClientRect();
    const x = (r.left + r.right) / 2, y = (r.top + r.bottom) / 2, su = document.elementFromPoint(x, y);
    return su?.closest('.segno-mossa') ? [e.dataset.presenza ?? e.dataset.fissa ?? e.closest('[data-settore]')?.dataset.settore] : []; });
  return { segni, presi, scorre: document.documentElement.scrollHeight - innerHeight };
});

/** Giro «segno»: problemi e conto alla larghezza data. */
export async function controllaSegno(browser, url, larghezza, h, rossi, dati, insieme, pagine = 1) {
  const male = [], vp = `${larghezza}x${h}`, dich = new Map(dati['stato.json'].variabili.map((d) => [d.id, d])), tutte = chiamateCostruite(dati, dich);
  const conto = { vp, giro: 'segno', mosse: 0, conSegno: 0, contrastoMin: Infinity, presi: 0, rimasti: 0 }, D = '(D-272 segno)';
  for (const [ep, id] of CASI_SALTI) {
    const c = tutte.find((x) => x.ep === ep && x.id === id), ch = dati[`missioni/${ep}.json`].ondate.flatMap((o) => o.chiamate ?? []).find((x) => x.id === id);
    if (!c || !ch) { male.push(`${vp} ${ep} ${id}: chiamata non trovata ${D}`); continue; }
    const apri = async () => { const p = await browser.newPage({ viewport: { width: larghezza, height: h }, hasTouch: true, reducedMotion: 'reduce' });
      await p.addInitScript((xs) => { globalThis.__VALMORA_SECONDO_MS = 1; for (const x of xs) globalThis[`__NO_${x}`] = true; }, rossi);
      await p.goto(url); await p.evaluate((v) => localStorage.setItem('vandelfalls-salvataggio', v), c.sal); await p.reload(); await p.getByRole('button', { name: 'Riprendi' }).click();
      if (!(await p.waitForSelector(`[data-messaggio="chiamata-${id}"]`, { timeout: 15000 }).then(() => true, () => false))) { await p.close(); return null; }
      await p.click(`[data-opzione="${ch.opzioni[0].id}"]`); await p.click('[data-conferma]').catch(() => {});
      if (!(await p.waitForSelector('.mappa [data-mossa="puoi"]', { timeout: 15000, state: 'attached' }).then(() => true, () => false))) { await p.close(); return null; }
      await p.waitForTimeout(2500); return p; };
    const p0 = await apri(); if (!p0) { male.push(`${vp} ${ep} ${id}: il «puoi spostare» non compare ${D}`); continue; }
    const unita = await p0.$$eval('.mappa [data-presenza]:not(:disabled)', (xs) => xs.map((x) => x.dataset.presenza)); await p0.close();
    await insieme(unita.map((u) => async () => {
      const p = await apri(); if (!p) { male.push(`${vp} ${ep} ${id} ${u}: il «puoi spostare» non compare ${D}`); return; }
      const prima = await leggi(p), da = u.split('@')[1], r = u.split('@')[0];
      await p.locator(`.mappa [data-presenza="${u}"]`).click({ force: true }); await p.waitForTimeout(80);
      const s = await p.$('.mappa .settore-punto:not(:disabled)'); if (!s) { male.push(`${vp} ${ep} ${id} ${u}: nessun settore ammesso ${D}`); await p.close(); return; }
      const a = await s.evaluate((e) => e.closest('[data-settore]').dataset.settore); await s.click({ force: true }); await p.waitForTimeout(150);
      const ora = await leggi(p); conto.mosse++; const dove = `${vp} ${ep} ${id} ${u} → ${a}`;
      const atteso = [`${da}:-1:${r}`, `${a}:+1:${r}`], visti = ora.segni.map((x) => x.k).sort();
      if (visti.join(' ') !== [...atteso].sort().join(' ')) male.push(`${dove}: segni ${visti.join(' ') || 'nessuno'}, attesi ${atteso.join(' ')} ${D}`); else conto.conSegno++;
      for (const x of ora.segni) { const t = contrasto(rgb(x.colore), rgb(x.fondo)), b = contrasto(rgb(x.bordo), rgb(x.fondo)); conto.contrastoMin = Math.min(conto.contrastoMin, t, b);
        if (t < 3 || b < 3) male.push(`${dove}: segno ${x.k} con contrasto ${t.toFixed(2)}:1 (testo) e ${b.toFixed(2)}:1 (bordo), sotto 3:1 ${D}`);
        if (!/^[−+]1$/.test(x.testo.trim()) || !x.icona) male.push(`${dove}: segno ${x.k} «${x.testo}»${x.icona ? '' : ' senza icona'} ${D}`);
        if (x.anim !== 'none') male.push(`${dove}: segno ${x.k} animato (${x.anim}) con la riduzione del movimento ${D}`); }
      if (ora.presi.length) { conto.presi += ora.presi.length; male.push(`${dove}: il segno prende il tocco di ${ora.presi.join(', ')} ${D}`); }
      if (ora.scorre > Math.max(0, prima.scorre)) male.push(`${dove}: col segno la pagina scorre ${ora.scorre} px (prima ${prima.scorre}) ${D}`);
      await p.waitForTimeout(2500); const poi = await leggi(p); await p.close();
      if (poi.segni.length) { conto.rimasti++; male.push(`${dove}: dopo 2,5 s il segno c'è ancora (${poi.segni.map((x) => x.k).join(' ')}) ${D}`); }
    }), pagine);
  }
  if (conto.contrastoMin === Infinity) conto.contrastoMin = null; else conto.contrastoMin = Math.round(conto.contrastoMin * 100) / 100;
  console.log(`segno dopo la mossa ${vp}: ${conto.mosse} mosse, col segno giusto ${conto.conSegno}, contrasto minimo ${conto.contrastoMin}:1, tocchi presi ${conto.presi}, rimasti dopo 2,5 s ${conto.rimasti}`);
  if (!conto.mosse) male.push(`${vp}: nessuna mossa provata ${D}`);
  return { ris: conto, male };
}
