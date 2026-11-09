// D-272 (salti residui, 9/11): nello stato «puoi spostare» i segni ▲/▼ della risposta spariscono dopo 1,8 s veri; da 0.69.0 il
// ricalcolo che segue spostava le pastiglie (e21 corteo_dal_cortile a 375: squadre e steward@piazza_fonderie 132 px; e28
// voce_magazzino a 360: tre pastiglie), perché il costo di spostamento partiva dalla disposizione fatta coi segni (0 su 0.67.0
// e 0.68.0). Correzione in congela.ts (primaDi), rosso C272W03. Giro «sparizione» di po152b: in ogni episodio, la prima chiamata
// con la mossa fra le prime 4; posizioni delle pastiglie coi segni presenti e 500 ms dopo che sono spariti: nessuna si sposta.
import { chiamateCostruite } from './sonda-altezze.mjs';

// posti rispetto alla mappa: a 375 e22 la mappa intera sale a volte di 2 px (bordo 130 → 128, pagina non scorsa; 2 giri su 6), le
// pastiglie restano dove sono nella mappa; quello è un altro fatto, qui si guarda se cambiano posto nella mappa
const posti = (p) => p.evaluate(() => { const m = document.querySelector('.mappa').getBoundingClientRect(); return { segni: document.querySelectorAll('.mappa [data-segno]').length,
  u: Object.fromEntries([...document.querySelectorAll('.mappa [data-presenza] .pastiglia, .mappa [data-fissa] .pastiglia')].map((e) => { const r = e.getBoundingClientRect(), t = e.closest('[data-presenza], [data-fissa]');
    return [t.dataset.presenza ?? t.dataset.fissa, [Math.round(r.left - m.left), Math.round(r.top - m.top)]]; })) }; });

/** Giro «sparizione»: problemi e conto alla larghezza data. episodi: se dato (i bracci), solo quelli. */
export async function controllaSparizione(browser, url, larghezza, h, rossi, dati, insieme, pagine = 1, episodi = null) {
  const male = [], vp = `${larghezza}x${h}`, dich = new Map(dati['stato.json'].variabili.map((d) => [d.id, d])), tutte = chiamateCostruite(dati, dich), D = '(D-272 sparizione)';
  const conto = { vp, giro: 'sparizione', episodi: 0, conSegni: 0, pastiglie: 0, mosse: 0, max: 0, riprese: 0 };
  const eps = episodi ?? [...new Set(tutte.map((x) => x.ep))].sort();
  const caso = async (ep, id, prova = 0) => {
    const c = tutte.find((x) => x.ep === ep && x.id === id), ch = dati[`missioni/${ep}.json`].ondate.flatMap((o) => o.chiamate ?? []).find((x) => x.id === id);
    if (!c || !ch) return false;
    const p = await browser.newPage({ viewport: { width: larghezza, height: h }, hasTouch: true, reducedMotion: 'reduce' });
    try {
      await p.addInitScript((xs) => { globalThis.__VALMORA_SECONDO_MS = 1; for (const x of xs) globalThis[`__NO_${x}`] = true; }, rossi);
      await p.goto(url); await p.evaluate((v) => localStorage.setItem('vandelfalls-salvataggio', v), c.sal); await p.reload(); await p.getByRole('button', { name: 'Riprendi' }).click();
      if (!(await p.waitForSelector(`[data-messaggio="chiamata-${id}"]`, { timeout: 15000 }).then(() => true, () => false))) return false;
      await p.click(`[data-opzione="${ch.opzioni[0].id}"]`); await p.click('[data-conferma]').catch(() => {});
      if (!(await p.waitForSelector('.mappa [data-mossa="puoi"]', { timeout: 15000, state: 'attached' }).then(() => true, () => false))) return false;
      // «coi segni» = l'ultima lettura coi segni presenti, ogni 50 ms fino alla sparizione: a 300 ms fissi la lettura cadeva a volte prima
      // del cambio di misura della mappa (375 e21: alta 343 → 200 a 453 ms, segni via a 1738 ms) e contava quello
      let a = await posti(p); for (let t = Date.now(); a.segni && Date.now() - t < 10000;) { await p.waitForTimeout(50); const b = await posti(p); if (!b.segni) break; a = b; }
      // segni già spariti (1,8 s veri: sotto carico si arriva tardi; CI 1386, braccio C272W03 «nessun episodio coi segni», a CPU 4× 3 su 3): si rifà
      if (!a.segni) { if (prova < 2) { conto.riprese++; return 'rifai'; } conto.episodi++; male.push(`${vp} ${ep} ${id}: segni ▲/▼ già spariti alla prima lettura in 3 aperture, niente confronto ${D}`); return true; }
      conto.episodi++;
      conto.conSegni++;
      await p.waitForTimeout(500);
      const z = await posti(p), mossi = Object.entries(a.u).filter(([k]) => z.u[k]).map(([k, [x, y]]) => [k, Math.round(Math.hypot(z.u[k][0] - x, z.u[k][1] - y))]);
      conto.pastiglie += mossi.length;
      for (const [k, px] of mossi) { conto.max = Math.max(conto.max, px); if (px > 0) { conto.mosse++; male.push(`${vp} ${ep} ${id}: alla sparizione dei segni ▲/▼ ${k} si sposta di ${px} px ${D}`); } }
      return true;
    } catch (e) { conto.episodi++; male.push(`${vp} ${ep} ${id}: non riuscito: ${String(e).split('\n')[0].slice(0, 120)} ${D}`); return true; } finally { await p.close(); }
  };
  await insieme(eps.map((ep) => async () => { let ok = false; for (const c of tutte.filter((x) => x.ep === ep).slice(0, 4)) { let r = 'rifai'; for (let k = 0; r === 'rifai'; k++) r = await caso(ep, c.id, k); if ((ok = r)) break; }
    if (!ok) male.push(`${vp} ${ep}: nessuna chiamata con la mossa fra le prime 4 ${D}`); }), pagine);
  console.log(`sparizione dei segni ${vp}: ${conto.episodi} episodi, coi segni ${conto.conSegni}, pastiglie confrontate ${conto.pastiglie}, mosse ${conto.mosse}, massimo ${conto.max} px, riaperti perché i segni erano già spariti ${conto.riprese}`);
  if (!conto.conSegni) male.push(`${vp}: nessun episodio coi segni al «puoi» ${D}`);
  return { ris: conto, male };
}
