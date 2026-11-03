// uso: node mossa-ep.mjs <ep> <larghezza> <altezza> [tastiera=0|1] [foto=1]
import * as L from './lib.mjs';
import { writeFileSync } from 'node:fs';
const [ep, W, H, kb = '0', foto = '1'] = process.argv.slice(2); const W_ = +W, H_ = +H, tast = kb === '1';
const FOTO = '/home/user/vandelfalls/coordination/collaudi/c056';
const m = L.miss(ep), idx = L.ms.indexOf(m);
const R = { ep, vp: `${W}x${H}`, tast, pause: 0, possibili: 0, mosse: 0, difetti: [], note: [], sceneChiamata: 0, chiamataConMossa: 0, ultimaConMossa: 0, ultime: 0, mossePesano: 0, nomi: new Set(), tabStop: null };
const dif = (x) => { R.difetti.push(x); };
const a = await L.avvia([W_, H_]); const p = await a.nuova(L.salvataggioPrima(idx));
await p.getByRole('button', { name: 'Riprendi' }).click(); await p.click('[data-azione="avvia-episodio"]');
const strat = L.attenta(L.creaCaso(1), L.dich);
let rng = 1; for (const ch of ep + W) rng = (rng * 31 + ch.charCodeAt(0)) >>> 0; const rnd = () => (rng = (rng * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const mappaDom = (pp) => pp.evaluate(() => Object.fromEntries([...document.querySelectorAll('.mappa [data-presenza]')].map((b) => [b.dataset.presenza, +(b.querySelector('.pastiglia')?.textContent.replace(/\D/g, '') || 0)])));
const mappaSal = (ic) => Object.fromEntries(Object.entries(ic.disposizione ?? {}).filter(([r]) => !m.mappa.risorse[r]?.fissa).flatMap(([r, ps]) => Object.entries(ps).filter(([, n]) => n > 0).map(([s, n]) => [`${r}@${s}`, n])));
const uguali = (x, y) => JSON.stringify(Object.entries(x).sort()) === JSON.stringify(Object.entries(y).sort());
let primaPausa = true, pesata = false;
const hook = {
  chiamata: async (pp, { s }) => { R.sceneChiamata++; const st = await L.stato(pp); if (st.ind !== null || st.attivi.length) { R.chiamataConMossa++; dif(`${ep} ${R.vp}: in «chiamata» (${s.ondata}:${s.scelte.filter((x) => x.ondata === s.ondata).length}) la mossa è offerta (ind=${st.ind}, attivi=${st.attivi.length})`); }
    if (!mappaSalUguale(await mappaDom(pp), s)) dif(`${ep} ${R.vp}: la mappa in chiamata non coincide col salvataggio`); },
  risposta: async (pp, { s }) => {
    R.pause++; const st = await L.stato(pp); const turno = L.MO.turnoMossa(m, s); const poss = L.MO.mossaPossibile(m, s);
    const att = turno === null ? null : poss ? 'puoi' : 'fatta'; const aperte = L.M.chiamateAperte(m, s).map((x) => x.id);
    if (turno === null) R.ultime++;
    if (st.ind !== att) dif(`${ep} ${R.vp}: pausa ${s.ondata}:${s.scelte.length} indicatore «${st.ind}», atteso «${att}»`);
    if (turno === null && (st.attivi.length || st.ind)) { R.ultimaConMossa++; dif(`${ep} ${R.vp}: dopo l'ultima chiamata dell'ondata ${s.ondata} la mossa è offerta`); }
    if (!uguali(await mappaDom(pp), mappaSal(s))) dif(`${ep} ${R.vp}: mappa in risposta ≠ salvataggio (${JSON.stringify(await mappaDom(pp))} vs ${JSON.stringify(mappaSal(s))})`);
    if (!poss) return;
    R.possibili++;
    if (R.possibili === 1 && !tast) { // ricarica PRIMA di muovere: dove si torna?
      await pp.reload(); await pp.getByRole('button', { name: 'Riprendi' }).click(); await L.quieta(pp);
      const sA = (await L.sal(pp)).in_corso, stA = await L.stato(pp);
      R.ricPrima = { scena: stA.scena, ind: stA.ind, attivi: stA.attivi.length, stessoSalvataggio: JSON.stringify(sA.disposizione) === JSON.stringify(s.disposizione) && JSON.stringify(sA.mosse) === JSON.stringify(s.mosse) };
      if (foto === '1') await pp.screenshot({ path: `${FOTO}/${ep}-${R.vp}-0-ricarica-prima.png` });
      return; }
    const sp = L.MO.spostabili(m, s); if (sp.length !== st.attivi.length) dif(`${ep} ${R.vp}: unità toccabili UI ${st.attivi.length} ≠ motore ${sp.length}`);
    if (!sp.length) { R.note.push(`pausa ${s.ondata}:${s.scelte.length}: nessuna unità spostabile`); return; }
    // sceglie una mossa: la prima che cambia le chiamate aperte, altrimenti a caso
    let scelta = null;
    for (const u of sp) for (const a2 of L.M.settoriAmmessi(m, u.risorsa).filter((k) => k !== u.settore)) { if (scelta) break; try { const s2 = L.MO.sposta(m, s, { risorsa: u.risorsa, da: u.settore, a: a2 });
      if (L.M.chiamateAperte(m, s2).map((x) => x.id).join() !== aperte.join()) scelta = { u, a: a2, pesa: true }; } catch {} }
    if (!scelta && rnd() < 0.8) { const u = sp[Math.floor(rnd() * sp.length)]; const amm = L.M.settoriAmmessi(m, u.risorsa).filter((k) => k !== u.settore); if (amm.length) scelta = { u, a: amm[Math.floor(rnd() * amm.length)], pesa: false }; }
    if (!scelta) return;
    const id = `${scelta.u.risorsa}@${scelta.u.settore}`, badge = pp.locator(`.mappa [data-presenza="${id}"]`);
    if (primaPausa && foto === '1') await pp.screenshot({ path: `${FOTO}/${ep}-${R.vp}-1-puoi.png` });
    // Esc lascia l'unità
    await badge.focus(); await badge.click(); let s1 = await L.stato(pp);
    if (s1.ind !== 'dove' || s1.attivi.find((b) => b.id === id)?.premuto !== 'true') dif(`${ep} ${R.vp}: toccata l'unità ${id}, indicatore «${s1.ind}»`);
    const ammMotore = L.M.settoriAmmessi(m, scelta.u.risorsa).filter((k) => k !== scelta.u.settore).sort().join();
    if (s1.settori.map((x) => x.id).sort().join() !== ammMotore) dif(`${ep} ${R.vp}: settori toccabili UI [${s1.settori.map((x) => x.id)}] ≠ ammessi motore [${ammMotore}]`);
    for (const x of s1.settori) R.nomi.add(x.nome.replace(/, .*/, ''));
    for (const x of s1.attivi) R.nomi.add(x.nome);
    if (!s1.indTesto || s1.settori.some((x) => !x.nome) || s1.attivi.some((x) => !x.nome)) dif(`${ep} ${R.vp}: nomi accessibili vuoti`);
    if (primaPausa) { await pp.keyboard.press('Escape'); await pp.waitForTimeout(80); const s1b = await L.stato(pp); if (s1b.ind !== 'puoi' || s1b.attivi.find((b) => b.id === id)?.premuto === 'true') dif(`${ep} ${R.vp}: Esc non lascia l'unità (ind=${s1b.ind})`); await badge.click(); }
    if (primaPausa && foto === '1') await pp.screenshot({ path: `${FOTO}/${ep}-${R.vp}-2-dove.png` });
    const punto = pp.locator(`.mappa [data-settore="${scelta.a}"] .settore-punto`);
    const cop = await pp.evaluate((a2) => { const b = document.querySelector(`.mappa [data-settore="${a2}"] .settore-punto`); const r = b.getBoundingClientRect(); const pts = [[.5, .5], [.15, .15], [.85, .15], [.15, .85], [.85, .85]]; const chi = pts.map(([fx, fy]) => { const e = document.elementFromPoint(r.left + r.width * fx, r.top + r.height * fy); return e === b || b.contains(e) ? 'ok' : (e?.closest('[data-presenza]')?.dataset.presenza ?? e?.className ?? 'altro'); }); return { box: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], chi }; }, scelta.a);
    if (cop.chi[0] !== 'ok') { R.coperti = (R.coperti ?? 0) + 1; dif(`${ep} ${R.vp}: pausa ${s.ondata}:${s.scelte.length} il bersaglio «${scelta.a}» ${JSON.stringify(cop.box)} è coperto al centro da ${cop.chi[0]} (5 punti: ${cop.chi})`); if (foto === '1' || true) await pp.screenshot({ path: `${FOTO}/${ep}-${R.vp}-coperto-${scelta.a}.png` }); }
    if (tast) { await punto.focus(); await pp.keyboard.press('Enter'); } else await punto.click({ force: cop.chi[0] !== 'ok', timeout: 8000 }).catch(async () => { dif(`${ep} ${R.vp}: tocco sul bersaglio ${scelta.a} impossibile`); await punto.focus(); await pp.keyboard.press('Enter'); });
    await pp.waitForTimeout(200);
    const s3 = await L.sal(pp).then((x) => x.in_corso), st3 = await L.stato(pp);
    const atteso = L.MO.sposta(m, s, { risorsa: scelta.u.risorsa, da: scelta.u.settore, a: scelta.a });
    if (JSON.stringify(s3.disposizione) !== JSON.stringify(atteso.disposizione) || JSON.stringify(s3.mosse) !== JSON.stringify(atteso.mosse)) dif(`${ep} ${R.vp}: dopo la mossa ${id}→${scelta.a} il salvataggio non coincide col motore`);
    if (!uguali(await mappaDom(pp), mappaSal(s3))) dif(`${ep} ${R.vp}: dopo la mossa la mappa ≠ salvataggio`);
    if (st3.ind !== 'fatta' || st3.attivi.length) dif(`${ep} ${R.vp}: dopo la mossa indicatore «${st3.ind}», ${st3.attivi.length} unità ancora toccabili`);
    R.mosse++; if (scelta.pesa) { R.mossePesano++; if (!pesata) { pesata = true; R.note.push(`mossa che cambia le chiamate (${aperte} → ${L.M.chiamateAperte(m, atteso).map((x) => x.id)}) eseguita in UI a ${s.ondata}:${s.scelte.length}`); } }
    if (primaPausa && foto === '1') await pp.screenshot({ path: `${FOTO}/${ep}-${R.vp}-3-fatta.png` });
    // seconda mossa: tocco forzato sulle ex-unità e sui settori
    await pp.locator('.mappa [data-presenza]').first().click({ force: true, timeout: 1500 }).catch(() => {}); await pp.locator('.mappa [data-settore] .settore-punto').first().click({ force: true, timeout: 1500 }).catch(() => {});
    const s4 = (await L.sal(pp)).in_corso; if (JSON.stringify(s4.disposizione) !== JSON.stringify(s3.disposizione) || s4.mosse.length !== s3.mosse.length) dif(`${ep} ${R.vp}: seconda mossa nella stessa pausa riuscita`);
    // ricarica
    if (primaPausa) { primaPausa = false;
      await pp.reload(); await pp.getByRole('button', { name: 'Riprendi' }).click(); await L.quieta(pp);
      const s5 = (await L.sal(pp)).in_corso, st5 = await L.stato(pp);
      if (JSON.stringify(s5.disposizione) !== JSON.stringify(s3.disposizione) || JSON.stringify(s5.mosse) !== JSON.stringify(s3.mosse)) dif(`${ep} ${R.vp}: dopo la ricarica la disposizione/mosse sono cambiate`);
      R.ricDopo = { scena: st5.scena, ind: st5.ind, attivi: st5.attivi.length }; if (st5.attivi.length) dif(`${ep} ${R.vp}: dopo la ricarica a mossa fatta restano ${st5.attivi.length} unità toccabili`);
      if (!uguali(await mappaDom(pp), mappaSal(s5))) dif(`${ep} ${R.vp}: dopo la ricarica mappa ≠ salvataggio`);
      if (foto === '1') await pp.screenshot({ path: `${FOTO}/${ep}-${R.vp}-4-ricarica.png` });
      R.note.push('ricarica a mossa fatta: identica'); }
  },
};
function mappaSalUguale(dom, s) { return uguali(dom, mappaSal(s)); }
try { await L.gioca(p, m, strat, hook); } catch (e) { dif(`${ep} ${R.vp}: eccezione del pilota: ${String(e.message).split('\n').slice(0,14).join(' / ')}`); }
R.nomi = [...R.nomi].slice(0, 12); R.errori = p.errori; R.fine = await L.scena(p);
writeFileSync(`${process.env.OUT}/mossa-${ep}-${R.vp}${tast ? '-kb' : ''}.json`, JSON.stringify(R, null, 1));
console.log(JSON.stringify({ ep, vp: R.vp, tast, pause: R.pause, possibili: R.possibili, mosse: R.mosse, pesano: R.mossePesano, difetti: R.difetti.length, errori: R.errori.length }));
await a.chiudi();
