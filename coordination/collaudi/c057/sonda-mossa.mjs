// C-057 punti 1-3, 5, 6: partite da salvataggio costruito (come sonda-altezze), tocchi veri (touchscreen.tap), 3 larghezze,
// testo 100% e 130% (simulato: i token --testo-* ×1,3; IPOTESI: non è il textZoom di Android). Scrive JSON-righe su stdout.
// Uso: VP=360x640,375x667,412x915 TESTO=1,1.3 EPS=e01,e05 PER_EP=3 node coordination/collaudi/c057/sonda-mossa.mjs [cartellaFoto]
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { servi } from '../../../tools/foto.mjs';
import { leggiDati } from '../../../tools/dati-disco.mjs';
import { chiamateCostruite } from '../../../tools/sonda-altezze.mjs';
const dati = leggiDati(), dich = new Map(dati['stato.json'].variabili.map((d) => [d.id, d]));
const CH = 'vandelfalls-salvataggio';
const VPS = (process.env.VP ?? '360x640,375x667,412x915').split(','), TESTI = (process.env.TESTO ?? '1,1.3').split(',').map(Number);
const PER_EP = Number(process.env.PER_EP ?? 3), EPS = process.env.EPS ? process.env.EPS.split(',') : null, FOTO = process.argv[2] ?? '';
if (FOTO) mkdirSync(FOTO, { recursive: true });
const tutte = chiamateCostruite(dati, dich);
// campione "qua e là": per episodio, PER_EP chiamate equidistanti (per e01 anche imprevisti/varianti compresi)
const per = new Map(); for (const c of tutte) (per.get(c.ep) ?? per.set(c.ep, []).get(c.ep)).push(c);
const CASI = process.env.CASI ? new Set(process.env.CASI.split(',')) : null;
const campione = [...per].filter(([e]) => !EPS || EPS.includes(e)).flatMap(([, xs]) => Array.from({ length: Math.min(PER_EP, xs.length) }, (_, i) => xs[Math.floor((i + 0.5) * xs.length / Math.min(PER_EP, xs.length))]));
const filtra = (xs) => CASI ? tutte.filter((c) => CASI.has(`${c.ep}/${c.id}`)) : xs;
const opzDi = (c) => dati[`missioni/${c.ep}.json`].ondate.flatMap((o) => o.chiamate ?? []).find((x) => x.id === c.id);
const srv = await servi('dist'), url = `http://127.0.0.1:${srv.address().port}/`;
const b = await chromium.launch({ executablePath: existsSyncChrome() });
function existsSyncChrome() { return '/opt/pw-browsers/chromium'; }
const out = (o) => console.log(JSON.stringify(o));
const CSS130 = (k) => `:root{--testo-mini:${12 * k}px!important;--testo-piccolo:${13 * k}px!important;--testo-base:${16 * k}px!important}`;
const hit = (p) => p.evaluate(() => {
  // per ogni bersaglio attivo della mappa: il centro e i 4 punti a metà strada fra centro e bordo rispondono a lui?
  const m = document.querySelector('.mappa'); if (!m) return { n: 0, male: [] };
  const els = [...m.querySelectorAll('[data-presenza]:not(:disabled), .settore-punto:not(:disabled)')], male = [], px = (v) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(v)) || 44;
  for (const e of els) { const r = e.getBoundingClientRect(), id = e.dataset.presenza ?? e.closest('[data-settore]')?.dataset.settore, tipo = e.dataset.presenza ? 'unità' : 'settore';
    if (r.bottom < 0 || r.top > innerHeight) { male.push(`${tipo} ${id}: fuori vista`); continue; }
    const pts = [[.5, .5], [.25, .5], [.75, .5], [.5, .25], [.5, .75]].map(([a, c]) => [r.left + r.width * a, r.top + r.height * c]);
    const ko = pts.filter(([x, y], i) => { const q = document.elementFromPoint(x, y); return !q || !(q === e || e.contains(q) || q.contains(e) && q.closest('button') === e); });
    if (ko.length) { const centro = pts.some((q, i) => ko.includes(q) && i === 0); const [x, y] = ko[0], q = document.elementFromPoint(x, y); male.push(`${centro ? 'CENTRO ' : ''}${tipo} ${id}: ${ko.length}/5 punti coperti da ${q?.closest('[data-presenza]')?.dataset.presenza ?? q?.closest('[data-scheda-settore]') ? 'scheda' : (q?.className?.toString?.().slice(0, 40) ?? '?')}`); }
    if (Math.min(r.width, r.height) < px('--tocco-min') - 0.5) male.push(`${tipo} ${id}: lato ${Math.round(Math.min(r.width, r.height))} < ${px('--tocco-min')}`); }
  return { n: els.length, male };
});
const stato = (p) => p.evaluate(() => {
  const m = document.querySelector('.mappa'), r = m?.getBoundingClientRect(), q = document.querySelector('[data-radio-mappa]');
  const costo = [...document.querySelectorAll('[data-rapporto-costo]')].filter((e) => e.checkVisibility() && e.getBoundingClientRect().height > 2 && !e.closest('.radio-mappa')?.classList.contains('muto')).map((e) => e.querySelector('[data-costo]')?.textContent.trim() ?? '').filter(Boolean);
  const casa = [...document.querySelectorAll('[data-azione^="home"]')].filter((e) => e.checkVisibility({ visibilityProperty: true }));
  const testata = !!document.querySelector('header [data-azione^="home"], .testata [data-azione^="home"]');
  return { mappa: r ? Math.round(r.height) : 0, ecc: document.scrollingElement.scrollHeight - innerHeight, y: scrollY, mossa: document.querySelector('[data-mossa]')?.dataset.mossa ?? null, previsione: document.querySelector('[data-previsione]')?.textContent ?? null,
    classi: q?.className ?? null, costo, sotto: !!document.querySelector('.rapporto-sotto')?.checkVisibility(), nHome: casa.length, homeInTestata: testata, homeClasse: casa.map((e) => e.closest('header,.testata,.mappa')?.tagName + '.' + (e.closest('header,.testata,.mappa')?.className ?? '')), segni: [...document.querySelectorAll('[data-segno]')].map((e) => e.dataset.segno + '@' + (e.closest('[data-settore]')?.dataset.settore ?? '')) };
});
const campioneMappa = async (p, ms = 1600) => { const v = []; const t0 = Date.now(); while (Date.now() - t0 < ms) { v.push(await p.evaluate(() => Math.round(document.querySelector('.mappa')?.getBoundingClientRect().height ?? -1))); await p.waitForTimeout(60); } return v; };
async function apri(vp, k, c, rossi) {
  const [w, h] = vp.split('x').map(Number), p = await b.newPage({ viewport: { width: w, height: h }, hasTouch: true, reducedMotion: 'reduce' });
  await p.addInitScript(() => { globalThis.__VALMORA_SECONDO_MS = 1; });
  p.on('pageerror', (e) => out({ tipo: 'errore', vp, k, ep: c.ep, id: c.id, msg: e.message }));
  await p.goto(url); await p.evaluate(([a, v]) => localStorage.setItem(a, v), [CH, c.sal]); await p.reload();
  if (k !== 1) await p.addStyleTag({ content: CSS130(k) });
  await p.getByRole('button', { name: 'Riprendi' }).click();
  const ok = await p.waitForSelector(`[data-messaggio="chiamata-${c.id}"]`, { timeout: 15000 }).then(() => true).catch(() => false);
  if (k !== 1) await p.addStyleTag({ content: CSS130(k) });
  return { p, ok };
}
for (const vp of VPS) for (const k of TESTI) for (const c of filtra(campione)) {
  const o = opzDi(c), dove = { vp, testo: k, ep: c.ep, id: c.id }, { p, ok } = await apri(vp, k, c);
  if (!ok) { out({ ...dove, tipo: 'nonApre' }); await p.close(); continue; }
  await p.waitForTimeout(250);
  const sc = await stato(p); const hitCh = await hit(p);
  // opzione: l'ultima valida (spesso quella che impegna di più)
  const opz = await p.evaluate(() => [...document.querySelectorAll('[data-opzione]:not(:disabled):not([aria-disabled="true"])')].map((e) => e.dataset.opzione));
  if (!opz.length) { out({ ...dove, tipo: 'senzaOpzioni' }); await p.close(); continue; }
  await p.tap(`[data-opzione="${opz.at(-1)}"]`); await p.tap('[data-conferma]').catch(() => {});
  const ris = await p.waitForSelector('[data-messaggio="risposta"]', { timeout: 15000 }).then(() => true).catch(() => false);
  if (!ris) { out({ ...dove, tipo: 'nessunaRisposta' }); await p.close(); continue; }
  const serie = await campioneMappa(p, 1400), s1 = await stato(p), h1 = await hit(p);
  const distinti = [...new Set(serie)];
  const rec = { ...dove, tipo: 'risposta', mappaChiamata: sc.mappa, mappaSerie: distinti, mappaFerma: distinti.length === 1, ...s1, hit: h1.n, hitMale: h1.male };
  // dopo uno scroll e un nuovo campionamento la mappa resta ferma?
  await p.evaluate(() => scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(250); const s2 = await stato(p); rec.mappaDopoScroll = s2.mappa;
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(150);
  if (s1.mossa === 'puoi') {
    // tocco vero sulla prima unità, poi su ogni settore ammesso: il tocco deve avere effetto (sposta)
    const unita = await p.evaluate(() => [...document.querySelectorAll('.mappa [data-presenza]:not(:disabled)')].map((e) => e.dataset.presenza));
    rec.unita = unita.length;
    const tocca = async (sel) => { const bb = await p.locator(sel).first().boundingBox(); if (!bb) return false; await p.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(120); return true; };
    const u0 = unita[0]; if (u0) {
      await tocca(`.mappa [data-presenza="${u0}"]`); const sd = await stato(p), hd = await hit(p);
      rec.dopoUnita = { mossa: sd.mossa, classi: sd.classi, mappa: sd.mappa, hitMale: hd.male, n: hd.n };
      if (sd.mossa !== 'dove') rec.unitaNonRisponde = u0;
      else { const settori = await p.evaluate(() => [...document.querySelectorAll('.mappa .settore-punto:not(:disabled)')].map((e) => e.closest('[data-settore]').dataset.settore)); rec.settoriAmmessi = settori;
        if (FOTO) await p.screenshot({ path: join(FOTO, `${vp}-t${k}-${c.ep}-${c.id}-inmano.png`) });
        if (settori.length) { const dest = settori[settori.length - 1], prima = await p.evaluate((a) => localStorage.getItem(a), CH);
          await tocca(`.mappa [data-settore="${dest}"] .settore-punto`); const sf = await stato(p), dopo = await p.evaluate((a) => localStorage.getItem(a), CH);
          rec.dopoMossa = { dest, mossa: sf.mossa, previsione: sf.previsione, segni: sf.segni, classi: sf.classi, mappa: sf.mappa, ecc: sf.ecc, costo: sf.costo, sotto: sf.sotto, salvato: prima !== dopo };
          if (sf.mossa !== 'fatta') rec.settoreNonRisponde = dest;
          const sr = await p.evaluate(() => { const r = document.querySelector('[data-radio-mappa]'); return r ? { tagliato: r.scrollHeight > r.clientHeight + 1, h: Math.round(r.getBoundingClientRect().height) } : null; }); rec.radioDopo = sr;
          if (FOTO) await p.screenshot({ path: join(FOTO, `${vp}-t${k}-${c.ep}-${c.id}-fatta.png`) });
          // ricarica dopo la mossa fatta
          await p.reload(); await p.getByRole('button', { name: 'Riprendi' }).click().catch(() => {}); await p.waitForTimeout(500);
          rec.dopoRicaricaFatta = await p.evaluate(() => document.querySelector('[data-messaggio]')?.dataset.messaggio ?? null);
        } } }
  }
  out(rec); await p.close();
}
await b.close(); srv.close();
