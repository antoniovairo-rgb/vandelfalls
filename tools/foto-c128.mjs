// C128-01 (PO-128): il nome dell'episodio sulla mappa della città va ricalcolato a ingresso della scena finito. Con WebGL
// il difetto si vedeva solo se Pixi era pronto prima della fine dell'animazione (CI instabile, «Il mercato del sabato» a
// 412 su d2fdf88); senza WebGL sempre. Qui ogni città con un nome visibile, fotografata dal giro, si rigioca da salvataggio
// in un browser senza WebGL: nome dentro la mappa con 5 px di margine, come il controllo R06 di tools/foto.mjs.
import { existsSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { pazienza } from './attese.mjs';
import { servi } from './foto.mjs';

/** Il salvataggio della città in foto, se mostra un nome (a 360 e 375 non c'è: D-123). */
export const statoCitta = (pagina) => pagina.evaluate(() => (document.querySelector('.mappa .settore-nome')
  ? { larghezza: innerWidth, stato: Object.fromEntries(Object.entries(localStorage)) } : null));

/** Problemi trovati rigiocando gli stati senza WebGL; rossi = interruttori __NO_X accesi (braccio rosso). */
export async function controllaCittaSenzaWebgl(stati, build = 'dist', rossi = []) {
  const p = [];
  if (!stati.length) return p;
  const srv = await servi(build), url = `http://127.0.0.1:${srv.address().port}/`;
  const browser = pazienza(await chromium.launch({ args: ['--disable-webgl', '--disable-3d-apis'],
    executablePath: process.env.VALMORA_CHROME ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined) }));
  try {
    for (const [i, { larghezza, stato }] of stati.entries()) {
      const pagina = await browser.newPage({ viewport: { width: larghezza, height: 800 }, reducedMotion: 'reduce' });
      if (rossi.length) await pagina.addInitScript((xs) => { for (const x of xs) globalThis[`__NO_${x}`] = true; }, rossi);
      await pagina.goto(url);
      await pagina.evaluate((st) => { localStorage.clear(); for (const [k, v] of Object.entries(st)) localStorage.setItem(k, v); }, stato);
      await pagina.reload();
      await pagina.getByRole('button', { name: 'Riprendi' }).click();
      await pagina.waitForSelector('.scena[data-scena="citta"] .mappa .settore-nome', { timeout: 5000 });
      // ingresso finito (la molla della scena) e nessun ricalcolo in sospeso: due fotogrammi fermi dopo transform «none»
      await pagina.waitForFunction(() => getComputedStyle(document.querySelector('.scena')).transform === 'none', null, { timeout: 5000 });
      await pagina.evaluate(() => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok))));
      const m = await pagina.evaluate(() => {
        const mappa = document.querySelector('.mappa').getBoundingClientRect(), n = document.querySelector('.mappa .settore-nome'), r = n.getBoundingClientRect();
        const margini = [r.left - mappa.left, mappa.right - r.right, r.top - mappa.top, mappa.bottom - r.bottom];
        return { nome: n.textContent, mappa: document.querySelector('.mappa').dataset.mappa, margini: margini.map((x) => Math.round(x * 10) / 10), tocca: margini.some((x) => x < 5) };
      });
      if (m.mappa !== 'html') p.push(`città senza WebGL (stato ${i + 1}, ${larghezza}px): la mappa è «${m.mappa}», non «html»: il controllo C128-01 non prova niente`);
      else if (m.tocca) p.push(`città senza WebGL (stato ${i + 1}, ${larghezza}px): nome «${m.nome}» tocca il bordo della mappa (margini sx/dx/su/giù ${m.margini.join('/')} px, C128-01)`);
      await pagina.close();
    }
  } finally { await browser.close(); srv.close(); }
  return p;
}
