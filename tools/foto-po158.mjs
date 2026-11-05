// PO-158 (D-265, foto del PO della città a ~412×830, 0.60.0: «si vede male»). Sulla città, a 640/760/830/915 di altezza:
//  (a) striscia: lo spazio sopra le teste fra --citta-sopra-teste-min e -max e il petto dei due personaggi (riga dei
//      taschini, y 76 di persona2.ts) dentro la striscia;
//  (b) bolle degli episodi staccate in tutte e tre le stagioni: fra due bolle, con l'anello della bolla scelta su una delle
//      due, almeno lo scarto dell'ombra più --spazio-1; nessuna bolla sul parco (data-parco, il disegno vero);
//  (c) bolle bloccate leggibili: nessuna trasparenza e contrasto del numero ≥ 4,5:1 (WCAG 2.2 AA, «contrast minimum»:
//      https://www.w3.org/TR/WCAG22/#contrast-minimum);
//  (d) nome delle squadre intero nella scheda di ogni episodio (nessun taglio, al massimo due righe), senza scorrimento.
// Rossi: VALMORA_ROSSI=C265S01 (cielo di PO-149), C265B01 (luoghi e parco di prima), C265C01 (bolle bloccate trasparenti),
// C265N01 (nome su una riga con l'ellissi).
import { join } from 'node:path';
import { missioniDai, salvataggioTutti } from './foto-bozze.mjs';

export const ALTEZZE_PO158 = [640, 760, 830, 915];
const { missioni, v0 } = missioniDai('data'), tutto = salvataggioTutti(missioni, v0);
const nuovo = JSON.stringify({ ...tutto, missioni_concluse: [], episodi: {} }), tutti = JSON.stringify(tutto);

const misura = (p) => p.evaluate(() => {
  const r = (e) => e.getBoundingClientRect(), px = (v) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(v)) || 0;
  const out = { ecc: document.scrollingElement.scrollHeight - innerHeight, regola: { min: px('--citta-sopra-teste-min'), max: px('--citta-sopra-teste-max'), stacco: px('--ombra-1-scarto') + px('--spazio-1'), anello: px('--bordo') + px('--spazio-1') } };
  const sv = document.querySelector('[data-citta-striscia] svg');
  if (sv) { const rs = r(sv);
    out.persone = [...sv.querySelectorAll('[data-persona]')].map((g) => { const m = (g.querySelector('g[transform]') ?? g).getScreenCTM();
      const testa = Math.min(...[...g.querySelectorAll('.v-pelle, [class*="capelli"], [class*="berretto"]')].map((e) => r(e).top));
      return { sopra: Math.round(testa - rs.top), petto: Math.round(rs.bottom - new DOMPoint(0, 76).matrixTransform(m).y) }; }); }
  const mappa = document.querySelector('.mappa.citta'), rm = mappa && r(mappa), pa = mappa?.dataset.parco?.split(' ').map(Number);
  out.parco = pa && rm ? { l: rm.left + rm.width * pa[0], t: rm.top + rm.height * pa[1], d: rm.left + rm.width * (pa[0] + pa[2]), b: rm.top + rm.height * (pa[1] + pa[3]) } : null;
  // contrasto WCAG fra due colori rgb(a) opachi
  const lum = (c) => { const v = c.match(/[\d.]+/g).slice(0, 3).map((x) => { const s = Number(x) / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  out.bolle = [...document.querySelectorAll('.mappa.citta [data-episodio] .settore-punto')].map((e) => { const q = r(e), cs = getComputedStyle(e);
    let op = 1; for (let x = e; x && x !== mappa; x = x.parentElement) op *= Number(getComputedStyle(x).opacity);
    const a = lum(cs.color), b = lum(cs.backgroundColor);
    return { n: e.textContent.trim(), x: q.left + q.width / 2, y: q.top + q.height / 2, r: q.width / 2, futuro: !!e.closest('.futuro'), op, contrasto: Math.round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 100) / 100 }; });
  out.alto = rm ? Math.round((rm.top + scrollY) * 10) / 10 : null;
  return out;
});

const nomi = (p) => p.evaluate(() => [...document.querySelectorAll('.scheda .sfida-club > span:last-child')].map((e) => {
  const cs = getComputedStyle(e), riga = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
  return { nome: e.textContent.trim(), largo: e.scrollWidth - e.clientWidth, alto: e.scrollHeight - e.clientHeight, righe: Math.round(e.getBoundingClientRect().height / riga), ellissi: cs.textOverflow === 'ellipsis' && e.scrollWidth > e.clientWidth };
}));

const apri = async (p, url, sal) => { await p.goto(url); await p.evaluate((v) => localStorage.setItem('vandelfalls-salvataggio', v), sal); await p.reload();
  await p.getByRole('button', { name: 'Riprendi' }).click(); await p.waitForSelector('.scena[data-scena="citta"]'); await p.waitForTimeout(300); };

/** Misure e problemi alla larghezza data (le quattro altezze). */
export async function controllaPo158(browser, url, larghezza, rossi = [], cartella = '') {
  const ris = [], male = [];
  for (const h of ALTEZZE_PO158) {
    const vp = `${larghezza}x${h}`, p = await browser.newPage({ viewport: { width: larghezza, height: h }, reducedMotion: 'reduce' });
    if (rossi.length) await p.addInitScript((xs) => { for (const x of xs) globalThis[`__NO_${x}`] = true; }, rossi);
    // la foto del PO: partita nuova, stagione 1, e01 scelto (anello), episodi 2-12 bloccati
    await apri(p, url, nuovo); await p.click('[data-episodio="e01"] .settore-punto'); await p.waitForTimeout(400);
    const m = await misura(p); ris.push({ vp, stato: 'po158', ...m });
    if (cartella) await p.screenshot({ path: join(cartella, `${vp}-citta-po158.png`) });
    if (m.ecc > 0) male.push(`${vp} città: la pagina scorre di ${m.ecc} px (D-265, D-243)`);
    if (m.persone) { // la striscia c'è da 700 px in su (D-210)
      const sopra = Math.min(...m.persone.map((x) => x.sopra));
      if (sopra < m.regola.min || sopra > m.regola.max) male.push(`${vp} città: sopra le teste ${sopra} px (serve fra ${m.regola.min} e ${m.regola.max}, PO-158, D-265)`);
      m.persone.forEach((x, i) => { if (x.petto < 0) male.push(`${vp} città: il personaggio ${i + 1} è tagliato sopra il petto (petto ${-x.petto} px sotto il bordo, PO-158, D-265)`); });
    }
    for (const b of m.bolle.filter((x) => x.futuro)) {
      if (b.op < 1) { male.push(`${vp} città: bolla bloccata ${b.n} trasparente (opacità ${Math.round(b.op * 100) / 100}, PO-158, D-265)`); break; }
      if (b.contrasto < 4.5) { male.push(`${vp} città: numero della bolla bloccata ${b.n} con contrasto ${b.contrasto}:1 (serve ≥ 4,5:1, PO-158, D-265)`); break; }
    }
    // le tre stagioni con tutti gli episodi conclusi: le bolle come cadono nella mappa (l'anello può stare su ognuna)
    await apri(p, url, tutti);
    for (const s of [1, 2, 3]) {
      await p.click(`[data-stagione="${s}"]`); await p.waitForTimeout(250);
      const q = await misura(p), b = q.bolle, k = q.regola;
      for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++) {
        const g = Math.round((Math.hypot(b[i].x - b[j].x, b[i].y - b[j].y) - b[i].r - b[j].r - k.anello) * 10) / 10;
        if (g < k.stacco) male.push(`${vp} città stagione ${s}: bolle ${b[i].n} e ${b[j].n} a ${g} px (con l'anello della scelta; serve ≥ ${k.stacco}, PO-158, D-265)`);
      }
      if (q.parco) for (const x of b) { const cx = Math.max(q.parco.l, Math.min(x.x, q.parco.d)), cy = Math.max(q.parco.t, Math.min(x.y, q.parco.b));
        if (Math.hypot(x.x - cx, x.y - cy) < x.r) male.push(`${vp} città stagione ${s}: la bolla ${x.n} sta sul parco (PO-158, D-265)`); }
      ris.push({ vp, stato: `stagione-${s}`, alto: q.alto });
    }
    // (d) a 760 (scheda compatta, D-243): il nome intero nella scheda di ogni episodio; a 640 la scheda cresce col contenuto
    if (h === 760) for (const e of missioni) {
      await p.click(`[data-stagione="${e.stagione}"]`); await p.click(`[data-episodio="${e.id}"] .settore-punto`); await p.waitForTimeout(60);
      for (const n of await nomi(p)) if (n.largo > 1 || n.alto > 1 || n.ellissi || n.righe > 2) male.push(`${vp} città ${e.id}: nome «${n.nome}» tagliato (${n.righe} righe, ${n.largo} px in largo, ${n.alto} px in alto; PO-158, D-265)`);
      const ecc = await p.evaluate(() => document.scrollingElement.scrollHeight - innerHeight);
      if (ecc > 0) male.push(`${vp} città ${e.id}: la pagina scorre di ${ecc} px (D-265)`);
    }
    await p.close();
  }
  // la mappa non si muove fra gli stati (C52-01, D-243): ≤ 1 px a ogni altezza
  for (const h of ALTEZZE_PO158) { const a = ris.filter((x) => x.vp === `${larghezza}x${h}` && x.alto !== null).map((x) => x.alto);
    if (a.length && Math.max(...a) - Math.min(...a) > 1) male.push(`${larghezza}x${h} città: la mappa si sposta di ${Math.round(Math.max(...a) - Math.min(...a))} px fra gli stati (D-265, C52-01)`); }
  return { ris, male };
}
