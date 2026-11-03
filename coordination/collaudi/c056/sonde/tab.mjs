import * as L from './lib.mjs';
import { chiamateCostruite } from '/home/user/vandelfalls/tools/sonda-altezze.mjs';
import { writeFileSync } from 'node:fs';
const c = chiamateCostruite(L.dati, L.dich).find((x) => x.ep === 'e01'); const m = L.miss('e01'); const ch = m.ondate.flatMap((o) => o.chiamate).find((x) => x.id === c.id);
const a = await L.avvia([412, 760]); const p = await a.nuova(c.sal); await p.getByRole('button', { name: 'Riprendi' }).click();
await p.waitForSelector(`[data-messaggio="chiamata-${c.id}"]`); await L.quieta(p); await p.click(`[data-opzione="${ch.opzioni[0].id}"]`); await p.click('[data-azione="conferma-risposta"]'); await p.waitForSelector('.scena[data-scena="risposta"]'); await L.quieta(p);
const R = {}; R.nContinua = await p.evaluate(() => [...document.querySelectorAll('[data-azione="continua"]')].length); R.focusabili = await p.evaluate(() => [...document.querySelectorAll('button,a,[tabindex]')].filter((e)=>!e.disabled).map((e)=>(e.dataset.azione||e.dataset.presenza||e.className||e.tagName)+'|'+(e.getAttribute('tabindex')??'')).join(' ; ')); const desc = () => p.evaluate(() => { const e = document.activeElement; return e === document.body ? 'BODY' : `${e.tagName.toLowerCase()}${e.dataset.presenza ? '[' + e.dataset.presenza + ']' : ''}${e.dataset.azione ? '[' + e.dataset.azione + ']' : ''}${e.className?.includes?.('settore-punto') ? '[punto ' + e.closest('[data-settore]').dataset.settore + ']' : ''}`; });
await p.evaluate(() => document.activeElement?.blur()); R.tab = []; for (let i = 0; i < 14; i++) { await p.keyboard.press('Tab'); await p.waitForTimeout(250); R.tab.push(await desc()); }
R.badgeRaggiungibili = R.tab.filter((x) => x.includes('presenza') || /\[\w+@\w+\]/.test(x)).length; 
// Invio sul badge, Esc, Invio sul settore: dove va il fuoco?
const st = await L.stato(p); const b = st.attivi[0].id; const loc = p.locator(`.mappa [data-presenza="${b}"]`); await loc.focus(); await p.keyboard.press('Enter'); R.dopoInvioBadge = { fuoco: await desc(), ind: (await L.stato(p)).ind, nSettori: (await L.stato(p)).settori.length };
await p.keyboard.press('Escape'); R.dopoEsc = { fuoco: await desc(), ind: (await L.stato(p)).ind };
await loc.focus(); await p.keyboard.press('Enter'); const s1 = await L.stato(p); const dest = s1.settori[0].id; await p.locator(`.mappa [data-settore="${dest}"] .settore-punto`).focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
R.dopoMossa = { fuoco: await desc(), ind: (await L.stato(p)).ind }; await p.keyboard.press('Tab'); R.tabDopo = await desc();
// con la mossa in mano: Tab raggiunge i settori ammessi?
console.log(JSON.stringify(R, null, 1)); writeFileSync(process.env.OUT + '/tab.json', JSON.stringify(R)); await a.chiudi();
