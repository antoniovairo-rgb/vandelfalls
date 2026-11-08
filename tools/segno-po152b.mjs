// D-272 passo 4: dopo la mossa, per circa 2 s, «−1» sul settore lasciato e «+1» su quello d'arrivo (Mappa.tsx, mossa-ui.tsx,
// segno-mossa.ts: sul proprio disco, spostato dove non copre niente; rossi C272D01 nessun segno, C272D02 a fianco e sopra tutto,
// C272D03 fermo al centro del disco). Giro «segno» di po152b: subito dopo la mossa (150 ms) un solo «−1» sul settore di partenza
// e un solo «+1» su quello d'arrivo; testo e bordo staccati dal proprio fondo almeno 3:1 (verso la mappa no: è un indicatore di
// 2 s, non un comando; decisione del principale 8/11); niente ombra (sporge oltre il riquadro misurato); nessun tocco preso; la
// pagina non scorre più di prima; non copre nomi, pastiglie, «Home» né dischi altrui; niente animazione con la riduzione del
// movimento; dopo 2,5 s veri non c'è più.
// Episodi (verifica del principale su a66978a8: in e02 il «+1» sopra il disco di curva_ospiti, in e04 il «−1» sopra una pastiglia
// di mercato, 6 mosse su 6 a 360): nel verde e02, e03, e04 e i due con i dischi più vicini dopo e02 (e05, e13: distanza minima
// fra i dischi nei dati 24 e 25,5 contro 15,1 di e02), tutte le mosse della prima chiamata con la mossa; nella catena «completa»
// (VALMORA_SEGNO_TUTTI=1) tutti i 36. I bracci passano i loro episodi.
import { chiamateCostruite } from './sonda-altezze.mjs';
import { contrasto } from './anelli-mossa.mjs';
export const EPISODI_SEGNO = ['e02', 'e03', 'e04', 'e05', 'e13'];

const rgb = (s) => (s.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
const leggi = (p) => p.evaluate(() => {
  const segni = [...document.querySelectorAll('.mappa .segno-mossa')].map((e) => { const s = getComputedStyle(e);
    return { k: e.dataset.segnoMossa, testo: e.textContent, colore: s.color, fondo: s.backgroundColor, bordo: s.borderTopColor, anim: s.animationName, ombra: s.boxShadow }; });
  const presi = [...document.querySelectorAll('.mappa [data-presenza], .mappa [data-fissa], .mappa .settore-punto')].flatMap((e) => { const r = e.getBoundingClientRect();
    const x = (r.left + r.right) / 2, y = (r.top + r.bottom) / 2, su = document.elementFromPoint(x, y);
    return su?.closest('.segno-mossa') ? [e.dataset.presenza ?? e.dataset.fissa ?? e.closest('[data-settore]')?.dataset.settore] : []; });
  // il segno non copre nomi, pastiglie, «Home» né i dischi degli altri settori (il proprio disco sì: ci sta sopra); dove si
  // sovrappone conta solo se è disegnato sopra (nel centro della parte in comune il segno è in cima)
  const area = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  const coperti = [...document.querySelectorAll('.mappa .segno-mossa')].flatMap((g) => { const r = g.getBoundingClientRect(), mio = g.closest('[data-settore]');
    return [...document.querySelectorAll('.mappa .settore-nome, .mappa .pastiglia, .mappa .tasto-home, .mappa .settore-punto')].filter((e) => !(e.classList.contains('settore-punto') && e.closest('[data-settore]') === mio))
      .map((e) => { const q = e.getBoundingClientRect(), x = (Math.max(r.left, q.left) + Math.min(r.right, q.right)) / 2, y = (Math.max(r.top, q.top) + Math.min(r.bottom, q.bottom)) / 2;
        // solo se il segno è disegnato sopra: per la prova toccabili tutti e due (nomi e segno hanno pointer-events none, elementFromPoint li salterebbe)
        const pe = e.style.pointerEvents; g.style.pointerEvents = 'auto'; e.style.pointerEvents = 'auto'; const su = area(r, q) > 0 ? document.elementFromPoint(x, y) : null; g.style.pointerEvents = ''; e.style.pointerEvents = pe;
        return [e, su && g.contains(su) ? Math.round(area(r, q)) : 0]; }).filter(([, a]) => a > 0)
      .map(([e, a]) => `${g.dataset.segnoMossa} su ${e.className.split(' ')[0]} ${e.closest('[data-presenza], [data-fissa]')?.dataset.presenza ?? e.closest('[data-settore]')?.dataset.settore ?? ''} (${a} px²)`); });
  return { segni, presi, coperti, scorre: document.documentElement.scrollHeight - innerHeight };
});

/** Giro «segno»: problemi e conto alla larghezza data. episodi: se dato (i bracci), solo quelli. */
export async function controllaSegno(browser, url, larghezza, h, rossi, dati, insieme, pagine = 1, episodi = null) {
  const male = [], vp = `${larghezza}x${h}`, dich = new Map(dati['stato.json'].variabili.map((d) => [d.id, d])), tutte = chiamateCostruite(dati, dich);
  const conto = { vp, giro: 'segno', episodi: 0, mosse: 0, conSegno: 0, contrastoMin: Infinity, presi: 0, coperti: 0, rimasti: 0 }, D = '(D-272 segno)';
  const eps = episodi ? [...episodi] : process.env.VALMORA_SEGNO_TUTTI ? [...new Set(tutte.map((x) => x.ep))].sort() : EPISODI_SEGNO;
  const caso = async (ep, id) => {
    const c = tutte.find((x) => x.ep === ep && x.id === id), ch = dati[`missioni/${ep}.json`].ondate.flatMap((o) => o.chiamate ?? []).find((x) => x.id === id);
    if (!c || !ch) return false;
    const apri = async () => { const p = await browser.newPage({ viewport: { width: larghezza, height: h }, hasTouch: true, reducedMotion: 'reduce' });
      await p.addInitScript((xs) => { globalThis.__VALMORA_SECONDO_MS = 1; for (const x of xs) globalThis[`__NO_${x}`] = true; }, rossi);
      await p.goto(url); await p.evaluate((v) => localStorage.setItem('vandelfalls-salvataggio', v), c.sal); await p.reload(); await p.getByRole('button', { name: 'Riprendi' }).click();
      if (!(await p.waitForSelector(`[data-messaggio="chiamata-${id}"]`, { timeout: 15000 }).then(() => true, () => false))) { await p.close(); return null; }
      await p.click(`[data-opzione="${ch.opzioni[0].id}"]`); await p.click('[data-conferma]').catch(() => {});
      if (!(await p.waitForSelector('.mappa [data-mossa="puoi"]', { timeout: 15000, state: 'attached' }).then(() => true, () => false))) { await p.close(); return null; }
      await p.waitForTimeout(2500); return p; };
    const p0 = await apri(); if (!p0) return false;
    const unita = await p0.$$eval('.mappa [data-presenza]:not(:disabled)', (xs) => xs.map((x) => x.dataset.presenza)); await p0.close();
    await insieme(unita.map((u) => async () => { for (let j = 0, n = 1; j < n; j++) { try {
      const p = await apri(); if (!p) { male.push(`${vp} ${ep} ${id} ${u}: il «puoi spostare» non compare ${D}`); break; }
      const prima = await leggi(p), da = u.split('@')[1], r = u.split('@')[0];
      await p.locator(`.mappa [data-presenza="${u}"]`).click({ force: true }); await p.waitForTimeout(80);
      const ss = await p.$$('.mappa .settore-punto:not(:disabled)'); n = ss.length; if (!ss[j]) { if (!j) male.push(`${vp} ${ep} ${id} ${u}: nessun settore ammesso ${D}`); await p.close(); break; }
      const a = await ss[j].evaluate((e) => e.closest('[data-settore]').dataset.settore); await ss[j].click({ force: true }); await p.waitForTimeout(150);
      const ora = await leggi(p); conto.mosse++; const dove = `${vp} ${ep} ${id} ${u} → ${a}`;
      const atteso = [`${da}:-1:${r}`, `${a}:+1:${r}`], visti = ora.segni.map((x) => x.k).sort();
      if (visti.join(' ') !== [...atteso].sort().join(' ')) male.push(`${dove}: segni ${visti.join(' ') || 'nessuno'}, attesi ${atteso.join(' ')} ${D}`); else conto.conSegno++;
      for (const x of ora.segni) { const t = contrasto(rgb(x.colore), rgb(x.fondo)), b = contrasto(rgb(x.bordo), rgb(x.fondo)); conto.contrastoMin = Math.min(conto.contrastoMin, t, b);
        if (t < 3 || b < 3) male.push(`${dove}: segno ${x.k} con contrasto ${t.toFixed(2)}:1 (testo) e ${b.toFixed(2)}:1 (bordo), sotto 3:1 ${D}`);
        if (!/^[−+]1$/.test(x.testo.trim())) male.push(`${dove}: segno ${x.k} «${x.testo}» ${D}`);
        if (x.ombra && x.ombra !== 'none') male.push(`${dove}: segno ${x.k} con l'ombra (${x.ombra}), che sporge oltre il riquadro ${D}`);
        if (x.anim !== 'none') male.push(`${dove}: segno ${x.k} animato (${x.anim}) con la riduzione del movimento ${D}`); }
      if (ora.coperti.length) { conto.coperti += ora.coperti.length; male.push(`${dove}: il segno copre ${ora.coperti.join('; ')} ${D}`); }
      if (ora.presi.length) { conto.presi += ora.presi.length; male.push(`${dove}: il segno prende il tocco di ${ora.presi.join(', ')} ${D}`); }
      if (ora.scorre > Math.max(0, prima.scorre)) male.push(`${dove}: col segno la pagina scorre ${ora.scorre} px (prima ${prima.scorre}) ${D}`);
      await p.waitForTimeout(2500); const poi = await leggi(p); await p.close();
      if (poi.segni.length) { conto.rimasti++; male.push(`${dove}: dopo 2,5 s il segno c'è ancora (${poi.segni.map((x) => x.k).join(' ')}) ${D}`); }
    } catch (e) { male.push(`${vp} ${ep} ${id} ${u}: mossa ${j + 1} non riuscita: ${String(e).split('\n')[0].slice(0, 120)} ${D}`); break; } } }), pagine);
    return true;
  };
  // la prima delle prime 4 chiamate dell'episodio dove il «puoi spostare» compare (come il giro radio e i salti)
  for (const ep of eps) {
    let ok = false; for (const c of tutte.filter((x) => x.ep === ep).slice(0, 4)) if ((ok = await caso(ep, c.id))) break;
    if (ok) conto.episodi++; else male.push(`${vp} ${ep}: nessuna chiamata con la mossa fra le prime 4 ${D}`);
  }
  if (conto.contrastoMin === Infinity) conto.contrastoMin = null; else conto.contrastoMin = Math.round(conto.contrastoMin * 100) / 100;
  console.log(`segno dopo la mossa ${vp}: ${conto.episodi} episodi, ${conto.mosse} mosse, col segno giusto ${conto.conSegno}, contrasto minimo ${conto.contrastoMin}:1, tocchi presi ${conto.presi}, sovrapposizioni ${conto.coperti}, rimasti dopo 2,5 s ${conto.rimasti}`);
  if (!conto.mosse) male.push(`${vp}: nessuna mossa provata ${D}`);
  return { ris: conto, male };
}
