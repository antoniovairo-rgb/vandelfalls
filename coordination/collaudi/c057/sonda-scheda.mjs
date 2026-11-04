// C-057 punto 1 (C55-01): in chiamata, per ogni settore toccabile di una chiamata per episodio (36 episodi), tocco vero sul centro del
// settore: la scheda si apre, non copre il centro del settore toccato, sta nella mappa, la pagina non scorre di più. Uso: VP=360x640 TESTO=1,1.3 node sonda-scheda.mjs
import { chromium } from 'playwright-core';
import { servi } from '../../../tools/foto.mjs';
import { leggiDati } from '../../../tools/dati-disco.mjs';
import { chiamateCostruite } from '../../../tools/sonda-altezze.mjs';
const dati = leggiDati(), dich = new Map(dati['stato.json'].variabili.map((d) => [d.id, d])), CH = 'vandelfalls-salvataggio';
const VPS = (process.env.VP ?? '360x640').split(','), TESTI = (process.env.TESTO ?? '1').split(',').map(Number), PER = Number(process.env.PER_EP ?? 1);
const per = new Map(); for (const c of chiamateCostruite(dati, dich)) (per.get(c.ep) ?? per.set(c.ep, []).get(c.ep)).push(c);
const campione = [...per].flatMap(([, xs]) => Array.from({ length: Math.min(PER, xs.length) }, (_, i) => xs[Math.floor((i + 0.5) * xs.length / Math.min(PER, xs.length))]));
const srv = await servi('dist'), url = `http://127.0.0.1:${srv.address().port}/`, b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const CSS = (k) => `:root{--testo-mini:${12 * k}px!important;--testo-piccolo:${13 * k}px!important;--testo-base:${16 * k}px!important}`;
for (const vp of VPS) for (const k of TESTI) { const [w, h] = vp.split('x').map(Number); let tocchi = 0, male = [];
  for (const c of campione) {
    const p = await b.newPage({ viewport: { width: w, height: h }, hasTouch: true, reducedMotion: 'reduce' }); await p.addInitScript(() => { globalThis.__VALMORA_SECONDO_MS = 1; });
    await p.goto(url); await p.evaluate(([a, v]) => localStorage.setItem(a, v), [CH, c.sal]); await p.reload(); if (k !== 1) await p.addStyleTag({ content: CSS(k) });
    await p.getByRole('button', { name: 'Riprendi' }).click(); if (!(await p.waitForSelector(`[data-messaggio="chiamata-${c.id}"]`, { timeout: 15000 }).then(() => true).catch(() => false))) { male.push(`${c.ep}/${c.id}: non apre`); await p.close(); continue; }
    if (k !== 1) await p.addStyleTag({ content: CSS(k) }); await p.waitForTimeout(300);
    const ids = await p.evaluate(() => [...document.querySelectorAll('.mappa [data-settore] .settore-punto:not(:disabled)')].map((e) => e.closest('[data-settore]').dataset.settore)), e0 = await p.evaluate(() => document.scrollingElement.scrollHeight - innerHeight);
    for (const s of ids) { const bb = await p.locator(`[data-settore="${s}"] .settore-punto`).boundingBox(); if (!bb) continue; tocchi++;
      await p.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(120);
      const r = await p.evaluate(([id, e0]) => { const sc = document.querySelector('[data-scheda-settore]'); if (!sc) return { aperta: false }; const q = document.querySelector(`[data-settore="${id}"] .settore-punto`).getBoundingClientRect(), r = sc.getBoundingClientRect(), m = sc.closest('.mappa').getBoundingClientRect(), x = q.left + q.width / 2, y = q.top + q.height / 2;
        return { aperta: true, id: sc.dataset.schedaSettore, copre: x >= r.left && x <= r.right && y >= r.top && y <= r.bottom, fuori: r.left < m.left - .5 || r.right > m.right + .5 || r.top < m.top - .5 || r.bottom > m.bottom + .5, scorre: document.scrollingElement.scrollHeight - innerHeight - e0 }; }, [s, e0]);
      if (!r.aperta) male.push(`${vp} t${k} ${c.ep}/${c.id} ${s}: la scheda non si apre`); else { if (r.id !== s) male.push(`${vp} t${k} ${c.ep}/${c.id} ${s}: scheda di ${r.id}`); if (r.copre) male.push(`${vp} t${k} ${c.ep}/${c.id} ${s}: la scheda COPRE il centro`); if (r.fuori) male.push(`${vp} t${k} ${c.ep}/${c.id} ${s}: scheda fuori dalla mappa`); if (r.scorre > 0) male.push(`${vp} t${k} ${c.ep}/${c.id} ${s}: la pagina scorre di ${r.scorre} px in più`); }
      await p.keyboard.press('Escape'); await p.waitForTimeout(60); }
    await p.close(); }
  console.log(JSON.stringify({ vp, testo: k, episodi: campione.length, tocchi, male })); }
await b.close(); srv.close();
