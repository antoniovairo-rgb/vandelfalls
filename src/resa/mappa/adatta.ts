// D-187 (PO-052, PO-058): nelle schermate di gioco la mappa si abbassa quanto basta perché la pagina non scorra, fino a
// --mappa-altezza-min (sotto, i settori non si leggono più); la tela segue il contenitore (C28-01). La chiamata no: D-114
// vuole la mappa intera e accetta lo scorrimento. Le vignette nascondibili (D-126 d) cedono per prime: nel conto valgono
// come nascoste, così si nascondono loro (useRiempi) e la mappa si abbassa solo per il resto; quelle che si riempiono
// (PO-092) valgono al loro minimo. Rosso C187M01: altezza dalla sola proporzione, come prima.
import { useLayoutEffect, type RefObject } from 'react';
import { spento } from '../../interruttori.ts';

const ESCLUSE = new Set(['chiamata']);
// D-197 (opzione A del PO): nella risposta la mappa resta piena come nella chiamata: cambiare altezza fra le due rifaceva la
// scena di Pixi e i nomi a ogni risposta (secondi di lavoro a CPU lenta) e in CI i segni di PO-085 scadevano prima del
// controllo. Rosso C197R01: la risposta si adatta come prima (D-193).
const ESCLUSE_D197 = new Set(['risposta']);
// D-191: dove la mappa non si tocca (risposta, sala, briefing) può scendere fino a --mappa-altezza-min-lettura (160 px).
// Rosso C191L01: il minimo di sempre.
const LETTURA = new Set(['risposta', 'sala', 'briefing']); // «risposta» vale solo col rosso C197R01
// D-259 e D-261 (opzione 1, deroga a D-197): nella risposta con la mossa (indicazione nel riquadro radio, radio-mappa.tsx), se
// la pagina scorre, la mappa si abbassa fino a --mappa-altezza-min (si tocca ancora: 200 px, non quello di lettura); succede
// soprattutto quando il costo non ha posto sopra la mappa e va nella risposta (D-258). Rosso C259A01: mappa piena, come D-197.
// D-261: in questa deroga, se la mappa abbassata porterebbe «Home» sopra un settore, «Home» passa nella testata (come il
// rapporto, D-191) invece di rialzare la mappa (S-21). Rosso C261H01: si rialza come prima.
const CON_MOSSA = '.radio-mappa [data-mossa]';
// D-191: nel rapporto, se la pagina scorre anche con la mappa al minimo, la mappa non si mostra (resta la scheda dei
// settori, che dice lo stato di ognuno) e «Home» passa nella testata. Rosso C191R01: la mappa resta.
const SENZA_MAPPA = new Set(['rapporto']);
const NASCONDIBILE = /^(apertura|esito|ondata)-/;

let avvisa: (nascosta: boolean) => void = () => {};
let ridisponi: (m: HTMLElement) => void = () => {};

// Ultima situazione misurata: schermata, finestra e altezza di ciò che sta fuori dalla mappa. Se non cambia, il risultato è
// lo stesso: niente rifacimento (il ResizeObserver risponde anche al cambio d'altezza fatto da qui; ogni giro in più
// rallentava i disegni e in CI a 375 i segni della risposta, 1,8 s di tempo vero, sparivano prima del controllo PO-085).
const ultima = new WeakMap<HTMLElement, string>();

function adatta(m: HTMLElement) {
  const main = m.closest('main');
  // solo con la risposta già sulla pagina: durante il cambio di scena la pagina è più alta e la mappa si abbassava e si rialzava
  // (e13 viale_pieno a 360×800: 217 → 302 → 328 px, tre rifacimenti di Pixi da 280-500 ms) e i segni di PO-085 scadevano prima
  const deroga = main?.dataset.schermata === 'risposta' && !!m.querySelector(CON_MOSSA) && !!main.querySelector('[data-messaggio="risposta"]') && !spento('C259A01');
  const chiave = `${main?.dataset.schermata}|${deroga}|${innerHeight}|${Math.round((main?.getBoundingClientRect().height ?? 0) - m.getBoundingClientRect().height)}`;
  if (ultima.get(m) === chiave) return;
  ultima.set(m, chiave);
  const era = m.hasAttribute('data-nascosta');
  m.removeAttribute('data-adatta'); m.removeAttribute('data-nascosta'); m.style.removeProperty('--mappa-alta');
  const schermata = main?.dataset.schermata ?? '';
  const fine = (nascosta: boolean, fuori = false) => { if (nascosta) m.setAttribute('data-nascosta', ''); if (nascosta !== era) avvisa(nascosta);
    m.toggleAttribute('data-casa-fuori', fuori); }; // D-261: la «Home» di riserva della testata compare col CSS; l'attributo resta
    // durante la misura (la testata con la casa è più alta: la misura la conta); la casa della mappa è solo invisibile, «sotto» la vede
  if (spento('C187M01') || !main || ESCLUSE.has(schermata) || (ESCLUSE_D197.has(schermata) && !spento('C197R01') && !deroga)) return fine(false);
  // eccedenza della pagina, con le vignette nascondibili come nascoste e quelle che si riempiono al loro minimo
  const eccedenza = () => {
    let e = (document.scrollingElement ?? document.documentElement).scrollHeight - innerHeight;
    if (e <= 0) return e;
    for (const v of main.querySelectorAll<SVGSVGElement>('svg.vignetta')) {
      const r = v.getBoundingClientRect(), cs = getComputedStyle(v);
      if (!r.height || cs.display === 'none') continue;
      if (NASCONDIBILE.test(v.dataset.vignetta ?? '')) e -= r.height + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
      else if (v.style.height) e -= r.height - (parseFloat(cs.minHeight) || 0);
    }
    return e;
  };
  let ecc = eccedenza();
  if (ecc <= 0) return fine(false);
  const radice = getComputedStyle(document.documentElement);
  const min = parseFloat(radice.getPropertyValue(LETTURA.has(schermata) && !deroga && !spento('C191L01') ? '--mappa-altezza-min-lettura' : '--mappa-altezza-min')) || 0;
  const nat = m.getBoundingClientRect().height;
  let alta = Math.max(min, nat - ecc);
  // S-21: il pulsante «Home» nell'angolo non deve coprire punti e nomi dei settori (CI rossa a 375: il rapporto abbassato portava
  // la curva sotto la casa). Si rialza di un passo finché non li tocca, al più fino all'altezza naturale. Solo i punti
  // (fermi) e, quando sono liberi, i nomi appena ridisposti: la ridisposizione costa, si fa solo lì (a ogni passo rallentava
  // ogni disegno; IPOTESI: in CI a 375 i segni della risposta, 1,8 s, sparivano prima del controllo PO-085).
  const casa = m.querySelector(':scope > .tasto-home'), passo = parseFloat(radice.getPropertyValue('--spazio-2')) || 8;
  const sotto = (sel: string) => { if (!casa) return false; const h = casa.getBoundingClientRect();
    return [...m.querySelectorAll(sel)].some((e) => { const r = e.getBoundingClientRect(); return Math.max(0, Math.min(h.right, r.right) - Math.max(h.left, r.left)) * Math.max(0, Math.min(h.bottom, r.bottom) - Math.max(h.top, r.top)) > 4; }); }; // come S-21 (px²)
  // prima i punti (fermi), poi i nomi dove stanno; si ridispongono (costa) solo se uno tocca «Home»
  const fuori = deroga && !spento('C261H01');
  for (;;) {
    m.style.setProperty('--mappa-alta', `${Math.round(alta)}px`); m.setAttribute('data-adatta', '');
    if (alta >= nat || fuori) break; // D-261: con la deroga «Home» non rialza la mappa, va nella testata se tocca
    if (!sotto('.settore-punto') && (!sotto('.settore-nome') || (ridisponi(m), !sotto('.settore-nome')))) break;
    alta = Math.min(nat, alta + passo);
  }
  if (alta >= nat) { m.removeAttribute('data-adatta'); m.style.removeProperty('--mappa-alta'); }
  if (fuori && alta < nat) ridisponi(m); // nomi al loro posto sulla mappa abbassata, prima di guardare «Home»
  fine(SENZA_MAPPA.has(schermata) && !spento('C191R01') && eccedenza() > 0, fuori && alta < nat && (sotto('.settore-punto') || sotto('.settore-nome')));
}

/** Si rifà quando la pagina cambia (passi, testi, caratteri) e quando cambia la finestra. */
export function useAdatta(el: RefObject<HTMLDivElement | null>, disponi: (m: HTMLElement) => void, nascosta?: (si: boolean) => void) {
  ridisponi = disponi; avvisa = nascosta ?? (() => {});
  useLayoutEffect(() => {
    const m = el.current, main = m?.closest('main');
    if (!m || !main) return;
    let ultimo = '';
    const fai = () => adatta(m);
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => { const ora = `${innerHeight}:${Math.round(main.getBoundingClientRect().height)}`; if (ora !== ultimo) { ultimo = ora; fai(); } });
    fai(); ro?.observe(main);
    addEventListener('resize', fai); void document.fonts?.ready.then(fai);
    return () => { ro?.disconnect(); removeEventListener('resize', fai); avvisa(false); };
  }, [el]);
}
