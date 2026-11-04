// D-271 (PO-159, «dopo un pò di tempo il numero di versione può anche sparire»): fuori dal Titolo la versione si vede
// all'avvio e svanisce da sola dopo qualche secondo; con la riduzione del movimento sparisce senza animazione; nel Titolo resta
// leggibile. Misura sulle animazioni della pagina (getAnimations: attesa, durata, stato finale con finish()), non sul tempo
// reale. Rosso C271V01: la versione resta sempre (nessuna animazione).
const leggi = (p) => p.evaluate(() => {
  const v = document.querySelector('[data-versione-angolo]'); if (!v) return null;
  const a = v.getAnimations().find((x) => x.animationName === 'versione-svanisce'), t = a?.effect?.getTiming();
  return { opacita: Number(getComputedStyle(v).opacity), animata: !!a, attesa: t ? Number(t.delay) : null, durata: t ? Number(t.duration) : null };
});
const finita = (p) => p.evaluate(() => { const v = document.querySelector('[data-versione-angolo]');
  for (const a of v?.getAnimations() ?? []) a.finish(); return v ? Number(getComputedStyle(v).opacity) : null; });

/** Errori alla larghezza data; `sal` è un salvataggio che con «Riprendi» porta nel gioco. */
export async function controllaVersioneSvanisce(browser, url, larghezza, rossi, sal) {
  const male = [];
  for (const moto of ['no-preference', 'reduce']) {
    const dove = `${larghezza}x760 (${moto === 'reduce' ? 'movimento ridotto' : 'movimento'})`;
    const p = await browser.newPage({ viewport: { width: larghezza, height: 760 }, reducedMotion: moto });
    await p.addInitScript(() => { globalThis.__VALMORA_SECONDO_MS = 1; });
    if (rossi.length) await p.addInitScript((xs) => { for (const x of xs) globalThis[`__NO_${x}`] = true; }, rossi);
    await p.goto(url); await p.evaluate((v) => localStorage.setItem('vandelfalls-salvataggio', v), sal); await p.reload();
    await p.getByRole('button', { name: 'Riprendi' }).waitFor({ timeout: 15000 });
    const t = await leggi(p);
    if (!t) { male.push(`${dove}: nel Titolo manca la versione (D-271)`); await p.close(); continue; }
    if (t.animata || t.opacita < 1) male.push(`${dove}: nel Titolo la versione svanisce (opacità ${t.opacita}, D-271)`);
    await p.getByRole('button', { name: 'Riprendi' }).click(); await p.waitForTimeout(300);
    const g = await leggi(p);
    if (!g?.animata) male.push(`${dove}: nel gioco la versione non svanisce (D-271)`);
    else {
      if (g.opacita < 0.99) male.push(`${dove}: entrando nel gioco la versione non si vede (opacità ${g.opacita}, D-271)`);
      if (g.attesa < 2000 || g.attesa > 10000) male.push(`${dove}: la versione resta ${g.attesa} ms, non «qualche secondo» (D-271)`);
      if (moto === 'reduce' && g.durata !== 0) male.push(`${dove}: col movimento ridotto la versione svanisce con un'animazione di ${g.durata} ms (D-271)`);
      if (moto !== 'reduce' && !(g.durata > 0)) male.push(`${dove}: la versione sparisce di colpo anche col movimento (D-271)`);
      const fine = await finita(p); if (fine > 0.01) male.push(`${dove}: a fine animazione la versione ha opacità ${fine} (D-271)`);
    }
    await p.close();
  }
  return male;
}
