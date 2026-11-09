// D-272 (salti residui, 9/11): nello stato «puoi spostare» i segni ▲/▼ della risposta spariscono dopo 1,8 s veri; da 0.69.0 il
// ricalcolo che segue spostava le pastiglie (e21 corteo_dal_cortile a 375: squadre e steward@piazza_fonderie 132 px; e28
// voce_magazzino a 360: tre pastiglie), perché il costo di spostamento partiva dalla disposizione fatta coi segni (0 su 0.67.0
// e 0.68.0). Correzione in congela.ts (primaDi), rosso C272W03. Giro «sparizione» di po152b: in ogni episodio, la prima chiamata
// con la mossa fra le prime 4; posizioni delle pastiglie coi segni presenti e 500 ms dopo che sono spariti: nessuna si sposta.
import { chiamateCostruite } from './sonda-altezze.mjs';

const posti = (p) => p.evaluate(() => ({ segni: document.querySelectorAll('.mappa [data-segno]').length,
  u: Object.fromEntries([...document.querySelectorAll('.mappa [data-presenza] .pastiglia, .mappa [data-fissa] .pastiglia')].map((e) => { const r = e.getBoundingClientRect(), t = e.closest('[data-presenza], [data-fissa]');
    return [t.dataset.presenza ?? t.dataset.fissa, [Math.round(r.left), Math.round(r.top)]]; })) }));

/** Giro «sparizione»: problemi e conto alla larghezza data. episodi: se dato (i bracci), solo quelli. */
export async function controllaSparizione(browser, url, larghezza, h, rossi, dati, insieme, pagine = 1, episodi = null) {
  const male = [], vp = `${larghezza}x${h}`, dich = new Map(dati['stato.json'].variabili.map((d) => [d.id, d])), tutte = chiamateCostruite(dati, dich), D = '(D-272 sparizione)';
  const conto = { vp, giro: 'sparizione', episodi: 0, conSegni: 0, pastiglie: 0, mosse: 0, max: 0 };
  const eps = episodi ?? [...new Set(tutte.map((x) => x.ep))].sort();
  const caso = async (ep, id) => {
    const c = tutte.find((x) => x.ep === ep && x.id === id), ch = dati[`missioni/${ep}.json`].ondate.flatMap((o) => o.chiamate ?? []).find((x) => x.id === id);
    if (!c || !ch) return false;
    const p = await browser.newPage({ viewport: { width: larghezza, height: h }, hasTouch: true, reducedMotion: 'reduce' });
    try {
      await p.addInitScript((xs) => { globalThis.__VALMORA_SECONDO_MS = 1; for (const x of xs) globalThis[`__NO_${x}`] = true; }, rossi);
      await p.goto(url); await p.evaluate((v) => localStorage.setItem('vandelfalls-salvataggio', v), c.sal); await p.reload(); await p.getByRole('button', { name: 'Riprendi' }).click();
      if (!(await p.waitForSelector(`[data-messaggio="chiamata-${id}"]`, { timeout: 15000 }).then(() => true, () => false))) return false;
      await p.click(`[data-opzione="${ch.opzioni[0].id}"]`); await p.click('[data-conferma]').catch(() => {});
      if (!(await p.waitForSelector('.mappa [data-mossa="puoi"]', { timeout: 15000, state: 'attached' }).then(() => true, () => false))) return false;
      await p.waitForTimeout(300); const a = await posti(p); conto.episodi++;
      if (!a.segni) return true; // segni già spariti (carico) o assenti: niente da confrontare
      conto.conSegni++;
      await p.waitForFunction(() => !document.querySelector('.mappa [data-segno]'), null, { timeout: 10000 }).catch(() => {}); await p.waitForTimeout(500);
      const z = await posti(p), mossi = Object.entries(a.u).filter(([k]) => z.u[k]).map(([k, [x, y]]) => [k, Math.round(Math.hypot(z.u[k][0] - x, z.u[k][1] - y))]);
      conto.pastiglie += mossi.length;
      for (const [k, px] of mossi) { conto.max = Math.max(conto.max, px); if (px > 0) { conto.mosse++; male.push(`${vp} ${ep} ${id}: alla sparizione dei segni ▲/▼ ${k} si sposta di ${px} px ${D}`); } }
      return true;
    } catch (e) { male.push(`${vp} ${ep} ${id}: non riuscito: ${String(e).split('\n')[0].slice(0, 120)} ${D}`); return true; } finally { await p.close(); }
  };
  await insieme(eps.map((ep) => async () => { let ok = false; for (const c of tutte.filter((x) => x.ep === ep).slice(0, 4)) if ((ok = await caso(ep, c.id))) break;
    if (!ok) male.push(`${vp} ${ep}: nessuna chiamata con la mossa fra le prime 4 ${D}`); }), pagine);
  console.log(`sparizione dei segni ${vp}: ${conto.episodi} episodi, coi segni ${conto.conSegni}, pastiglie confrontate ${conto.pastiglie}, mosse ${conto.mosse}, massimo ${conto.max} px`);
  if (!conto.conSegni) male.push(`${vp}: nessun episodio coi segni al «puoi» ${D}`);
  return { ris: conto, male };
}
