// Guardiani nel browser del collaudo C-041 (D-182): C41-06 (vignetta del verbale fallito a 360×760) e C41-08 (guida 2/6,
// «Quanto dura?» dentro il fumetto). Si parte dal salvataggio vero della partita A-Z, episodi e10 ed e33 giocati dal motore
// col giocatore peggiore fino all'ultimo rapporto (fallito), poi «Riprendi» → rapporto → verbale, come in foto-epilogo.mjs.
// Rossi: VALMORA_ROSSI=C41V06 (vignetta minima di prima), C185V01 (spaziature di prima), C185V01,C66V01 (con la vignetta forzata al
// minimo), C41G08 (fumetto stretto di prima).
// Uso a mano: node tools/foto-c41.mjs <cartella-foto> [larghezze]   (build già fatta in dist/)
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { chromium } from 'playwright-core';
import { pazienza } from './attese.mjs';
import { leggiDati } from './dati-disco.mjs';
import { pianoAttento } from './foto.mjs';

export const LARGHEZZE_C41 = [360, 375, 412], EPISODI_C41 = ['e10', 'e33']; // D-185: verbali falliti di e10 ed e33
const FINALE = 'tests/salvataggi-reali/v2-0.38.0-fine-campagna.json';
const TIPI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webp': 'image/webp', '.jpg': 'image/jpeg' };

/** Salvataggio con l'episodio «id» perso (giocatore peggiore del motore) fino all'ultimo rapporto. */
export function salvataggioFallito(id, dirDati = 'data') {
  const fine = JSON.parse(readFileSync(FINALE, 'utf8'));
  const missioni = Object.entries(leggiDati(dirDati)).filter(([k]) => k.startsWith('missioni/')).map(([, m]) => m).sort((a, b) => a.episodio - b.episodio);
  const i = missioni.findIndex((m) => m.id === id), prima = missioni.slice(0, i).map((m) => m.id);
  const v0 = fine.episodi[id].variabili_prima, f = pianoAttento(dirDati, i, v0).fallimento;
  return { fallita: f.fallita, salvataggio: { ...fine, variabili: v0, missioni_concluse: fine.missioni_concluse.filter((x) => prima.includes(x)),
    episodi: Object.fromEntries(prima.map((x) => [x, fine.episodi[x]])), in_corso: f.ic, rapporto_aperto: f.ic.rapporti.at(-1).n, sconfitta: null, bozza: null } };
}

export async function giraC41(cartella = 'out/foto', build = 'dist', larghezze = process.env.VALMORA_LARGHEZZE ? process.env.VALMORA_LARGHEZZE.split(',').map(Number) : LARGHEZZE_C41, rossi = (process.env.VALMORA_ROSSI ?? '').split(',').filter(Boolean)) {
  mkdirSync(cartella, { recursive: true });
  const srv = await new Promise((ok) => { const s = createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); const p = join(build, u === '/' ? 'index.html' : u);
    if (!existsSync(p)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': TIPI[extname(p)] ?? 'application/octet-stream' }); r.end(readFileSync(p)); }); s.listen(0, '127.0.0.1', () => ok(s)); });
  const browser = pazienza(await chromium.launch({ executablePath: process.env.VALMORA_CHROME ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined) }));
  const stati = EPISODI_C41.map((id) => [id, salvataggioFallito(id)]), giri = [];
  try {
    for (const larghezza of larghezze) {
      const g = { larghezza, errori: [], scorrimento: [], attesi: [], misure: {} };
      const atteso = (cosa, ok) => g.attesi.push({ cosa: `C41: ${cosa}`, ok });
      const pagina = await browser.newPage({ viewport: { width: larghezza, height: 760 }, reducedMotion: 'reduce' });
      if (rossi.length) await pagina.addInitScript((xs) => { for (const x of xs) globalThis[`__NO_${x}`] = true; }, rossi);
      pagina.on('pageerror', (e) => g.errori.push(e.message));
      // strumento instabile (28/10, bracci in parallelo con carico ~20 su 4 core: il clic su «avanti» fermo 30 s mentre la pagina
      // calcola il verbale): si attende la scena e il clic fino a 60 s. È un'attesa, non una soglia: se la scena non arriva, rosso
      const scena = async (nome) => { await pagina.waitForSelector(`.scena[data-scena="${nome}"]`, { timeout: 60_000 }); await pagina.waitForFunction(() => document.querySelectorAll('.scena').length === 1 && getComputedStyle(document.querySelector('.scena')).opacity === '1', null, { timeout: 60_000 }); };
      try {
        await pagina.goto(`http://127.0.0.1:${srv.address().port}/`); await scena('titolo');
        // C41-06: verbale di e10 ed e33 perso, primo passo, finestra 760 px
        for (const [id, stato] of stati) {
        const dove = `${id} ${larghezza}×760 verbale fallito`;
        atteso(`${id} giocato dal peggiore non è fallito, il controllo non si può fare`, stato.fallita);
        await pagina.evaluate((v) => localStorage.setItem('vandelfalls-salvataggio', v), JSON.stringify(stato.salvataggio));
        await pagina.reload(); await scena('titolo');
        await pagina.getByRole('button', { name: 'Riprendi' }).click(); await scena('rapporto');
        await pagina.click('[data-azione="avanti"]', { timeout: 60_000 }); await scena('verbale');
        await pagina.evaluate(() => new Promise((ok) => { scrollTo(0, 0); requestAnimationFrame(() => requestAnimationFrame(ok)); })); await pagina.waitForTimeout(300);
        const v = await pagina.evaluate(() => {
          const svg = document.querySelector('.passo:not([hidden]) svg.vignetta'), r = svg?.getBoundingClientRect(), vb = svg?.viewBox.baseVal;
          const disegno = r && vb ? Math.min(r.width, r.height * vb.width / vb.height) : 0; // il disegno 320×180 sta dentro il riquadro («meet»)
          const sotto = [...document.querySelectorAll('[data-fallita], [data-azione="riparti"], [data-azione="rigioca"]')].map((e) => e.getBoundingClientRect().bottom);
          return { w: Math.round(r?.width ?? 0), h: Math.round(r?.height ?? 0), disegno: Math.round(disegno), contenitore: Math.round(svg?.parentElement?.getBoundingClientRect().width ?? 0), fondo: Math.round(Math.max(0, ...sotto)), finestra: innerHeight, nascosta: svg?.hasAttribute('data-nascosta'),
            // pagina: altezza vera; libero: lo spazio che vede useRiempi (fondo di main + margini e padding, come in vignetta.tsx)
            pagina: document.documentElement.scrollHeight, libero: (() => { const m = document.querySelector('main'), px = (e, k) => parseFloat(getComputedStyle(e)[k]) || 0;
              return Math.round(innerHeight - m.getBoundingClientRect().bottom - px(m, 'marginBottom') - px(m.parentElement, 'paddingBottom') - (m.parentElement === document.body ? 0 : px(document.body, 'paddingBottom')) - (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--vignetta-margine')) || 0) - (Number(svg?.dataset.margini) || 0)); })(),
            minimo: parseFloat(svg ? getComputedStyle(svg).minHeight : '0') || 0 };
        });
        g.misure[`c41_06_${id}`] = v;
        // D-185: a 760 px la vignetta del verbale fallito si vede sempre (spaziature ridotte), ≥ 2/3 a 360, e la pagina
        // non scorre (D-182). Rossi: C185V01 (spaziature di prima: nascosta), C185V01,C66V01 (forzata al minimo: si scorre).
        atteso(`${dove}: vignetta nascosta con ${v.libero} px liberi, minimo ${v.minimo} (D-185)`, !v.nascosta);
        atteso(`${dove}: disegno largo ${v.disegno} px su ${v.contenitore} (serve ≥ 2/3, C41-06)`, v.nascosta || larghezza !== 360 || v.disegno * 3 >= v.contenitore * 2); // la decisione vale a 360 px; alle altre larghezze si misura soltanto
        atteso(`${dove}: pagina alta ${v.pagina} px, si scorre (D-182, PO-045)`, v.pagina <= v.finestra);
        atteso(`${dove}: «Episodio fallito» e ripartenza finiscono a ${v.fondo} px, finestra ${v.finestra} (C41-06)`, v.fondo > 0 && v.fondo <= v.finestra);
        await pagina.screenshot({ path: join(cartella, `${larghezza}-c41-06-verbale-fallito-${id}.jpg`), type: 'jpeg', quality: 75 });
        }
        // C41-08: guida 2/6, testo dentro il fumetto con margine
        await pagina.evaluate(() => localStorage.clear()); await pagina.reload(); await scena('titolo');
        await pagina.getByRole('button', { name: /Nuova partita/ }).click();
        await pagina.click('[data-genere="f"]'); await scena('guida');
        await pagina.click('[data-azione="guida-avanti"]'); await pagina.waitForSelector('[data-vignetta="guida-2"]');
        const b = await pagina.evaluate(() => {
          const svg = document.querySelector('[data-vignetta="guida-2"]'), t = svg?.querySelector('text'), f = t?.previousElementSibling;
          if (!t || !f) return null; const a = t.getBBox(), c = f.getBBox(); return { testo: Math.round(a.width), fumetto: Math.round(c.width), sx: Math.round(a.x - c.x), dx: Math.round(c.x + c.width - a.x - a.width) };
        });
        g.misure.c41_08 = b;
        atteso(`${larghezza}: guida 2/6, «Quanto dura?» ${b ? `largo ${b.testo} in un fumetto di ${b.fumetto}, margini ${b.sx} e ${b.dx}` : 'non trovato'} (servono ≥ 6 unità per lato, C41-08)`, !!b && b.sx >= 6 && b.dx >= 6);
        await pagina.screenshot({ path: join(cartella, `${larghezza}-c41-08-guida2.jpg`), type: 'jpeg', quality: 75 });
      } catch (e) { g.errori.push(`giro interrotto: ${e.message.split('\n')[0]}`); }
      await pagina.close(); giri.push(g);
    }
  } finally { await browser.close(); srv.close(); }
  return giri;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const giri = await giraC41(process.argv[2] ?? 'out/foto-c41', 'dist', process.argv[3] ? process.argv[3].split(',').map(Number) : LARGHEZZE_C41);
  for (const g of giri) console.log(g.larghezza, JSON.stringify(g.misure));
  const { controllaGiro } = await import('./controlli-grafica.mjs');
  const p = giri.flatMap(controllaGiro);
  console.log(p.length ? p.join('\n') : 'verde'); process.exit(p.length ? 1 : 0);
}
