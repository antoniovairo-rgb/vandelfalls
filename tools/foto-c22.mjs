// Guardiani del collaudo C-022 (grafica piccola), chiamati dagli altri guardiani del giro foto.

/** C22-06: in ogni stemma visibile il simbolo (o le iniziali) sta a ≥3:1 sulla forma; se no ha un contorno che sta a
 *  ≥3:1 sia sulla forma sia sul simbolo (WCAG 1.4.11, https://www.w3.org/TR/WCAG21/#non-text-contrast).
 *  Rosso VALMORA_ROSSI=C57S01: nessun contorno. */
export async function controllaStemmi(pagina, atteso, dove) {
  const deboli = await pagina.evaluate(() => {
    const rgb = (s) => (s.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
    const lum = (v) => v.map((u) => { u /= 255; return u <= 0.03928 ? u / 12.92 : ((u + 0.055) / 1.055) ** 2.4; }).reduce((s, u, i) => s + u * [0.2126, 0.7152, 0.0722][i], 0);
    const rap = (a, b) => { const [l1, l2] = [lum(rgb(a)), lum(rgb(b))].sort((p, q) => q - p); return (l1 + 0.05) / (l2 + 0.05); };
    return [...document.querySelectorAll('svg.stemma')].filter((s) => s.getClientRects().length).flatMap((s) => {
      const forma = s.querySelector('.stemma-forma > *'), segno = s.querySelector('[data-simbolo] > *');
      if (!forma || !segno || !/^rgb/.test(getComputedStyle(forma).fill)) return [];
      const f = getComputedStyle(forma).fill, g = getComputedStyle(segno).fill;
      if (rap(f, g) >= 3) return [];
      const a = s.querySelector('[data-alone-stemma] > *'), c = a && getComputedStyle(a).fill;
      return c && rap(c, f) >= 3 && rap(c, g) >= 3 ? [] : [`${s.dataset.stemma} simbolo ${rap(f, g).toFixed(2)}:1${c ? `, contorno ${rap(c, f).toFixed(2)}:1` : ', senza contorno'}`];
    });
  });
  atteso(`${dove}: stemmi col simbolo poco visibile: ${[...new Set(deboli)].join('; ')} (C22-06)`, !deboli.length);
}

/** C22-05: le icone nelle pastiglie e negli effetti sotto le opzioni misurano a schermo almeno 16×16 px (metro del
 *  C-022: sotto 16 px è un difetto medio). Rosso VALMORA_ROSSI=C58I01: 13 e 12 px, come prima. */
export async function controllaIconePiccole(pagina, atteso, dove) {
  const piccole = await pagina.evaluate(() => [...document.querySelectorAll('.pastiglia .icona, .effetto-chip .icona')].filter((i) => i.getClientRects().length)
    .map((i) => [i.closest('.pastiglia') ? 'pastiglia' : 'effetto', i.getBoundingClientRect()]).filter(([, r]) => r.width < 16 || r.height < 16).map(([k, r]) => `${k} ${r.width.toFixed(1)}×${r.height.toFixed(1)}`));
  atteso(`${dove}: ${piccole.length} icone sotto 16 px: ${[...new Set(piccole)].slice(0, 4).join(', ')} (C22-05)`, !piccole.length);
}

/** C22-09: nella chiamata l'avatar del mittente ha la stessa icona di chi chiama accanto alla vignetta (stesso disegno
 *  SVG). Rosso VALMORA_ROSSI=C59A01: l'avatar dalla regola di prima (icone.tsx). */
export async function controllaAvatarChi(pagina, atteso, dove) {
  const [avatar, chi] = await pagina.evaluate(() => [document.querySelector('[data-messaggio^="chiamata-"] .avatar svg'), document.querySelector('.chiamata-corpo [data-chi-icona] svg')].map((s) => s?.innerHTML ?? null));
  if (!chi) return; // il vice non ha l'icona accanto alla vignetta
  atteso(`${dove}: l'avatar del mittente ha un'icona diversa da quella di chi chiama accanto alla vignetta (C22-09)`, avatar === chi);
}

/** C22-10: le icone dei pulsanti misurano a schermo almeno 20×20 px (Material: 20 dp minimo,
 *  https://m3.material.io/styles/icons/designing-icons). Pastiglie ed effetti hanno la loro misura (C22-05).
 *  Rosso VALMORA_ROSSI=C60I01: 18 px come prima. */
export async function controllaIconePulsanti(pagina, atteso, dove) {
  const piccole = await pagina.evaluate(() => [...document.querySelectorAll('button .icona, .pulsante .icona')].filter((i) => i.getClientRects().length && !i.closest('.pastiglia, .effetto-chip'))
    .map((i) => i.getBoundingClientRect()).filter((r) => r.width < 20 || r.height < 20).map((r) => `${r.width.toFixed(1)}×${r.height.toFixed(1)}`));
  atteso(`${dove}: ${piccole.length} icone di pulsanti sotto 20 px: ${[...new Set(piccole)].slice(0, 3).join(', ')} (C22-10)`, !piccole.length);
}

/** S-23, PO-078: la vignetta di sala («apertura-») e del verbale («esito-»). */
export async function controllaVignetta(pagina, prefisso, atteso, dove, dallaCitta = false) {
  // D-126 d (C22-04): sala e verbale nascondono la vignetta se lo spazio libero non arriva al minimo; nascosta solo
  // allora, e mai al minimo con la pagina che scorre (prova anche a 375×667). Rosso VALMORA_ROSSI=C66V01: resta al minimo.
  const misura = () => pagina.evaluate((pre) => {
    const v = document.querySelector(`[data-vignetta^="${pre}"]`); if (!v) return null;
    const main = v.closest('main') ?? document.body, app = main.parentElement ?? document.body, px = (e, k) => parseFloat(getComputedStyle(e)[k]) || 0;
    const fondo = main.getBoundingClientRect().bottom + scrollY + px(main, 'marginBottom') + px(app, 'paddingBottom') + (app === document.body ? 0 : px(document.body, 'paddingBottom'));
    const libero = innerHeight - fondo - (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--vignetta-margine')) || 0);
    const soglia = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--vignetta-finestra-min')) || 0;
    return { bassa: innerHeight < soglia, nascosta: v.hasAttribute('data-nascosta'), vista: v.getClientRects().length > 0, h: v.getBoundingClientRect().height, min: parseFloat(getComputedStyle(v).minHeight) || 0, libero, margini: Number(v.dataset.margini) || 0 };
  }, prefisso);
  const giudica = (r, qui) => {
    atteso(`${qui}: manca la vignetta «${prefisso}…» (S-23, PO-078)`, !!r && (r.vista || r.nascosta));
    if (!r) return;
    if (r.nascosta) atteso(`${qui}: vignetta «${prefisso}…» nascosta con ${(r.libero - r.margini).toFixed(0)} px liberi, minimo ${r.min} (D-126 d)`, r.libero - r.margini < r.min || (r.bassa && /^(apertura|esito)-/.test(prefisso)));
    else atteso(`${qui}: vignetta «${prefisso}…» alta ${r.h.toFixed(0)} px (minimo ${r.min}) con la pagina che scorre di ${(-r.libero).toFixed(0)} px: va nascosta (D-126 d)`, r.h >= r.min - 0.5 && r.libero > -1);
  };
  // C26 (catena instabile su e25 sala): si misura a scena ferma, finita la molla d'entrata (Scena.tsx); la vignetta presa
  // durante la molla restava alta col riquadro scalato e la pagina scorreva di 3 px. Rosso VALMORA_ROSSI=C78V01.
  await pagina.waitForFunction(() => [...document.querySelectorAll('.scena')].every((e) => /^(none|matrix\(1, 0, 0, 1, 0, 0\))$/.test(getComputedStyle(e).transform)), null, { timeout: 3000 }).catch(() => {});
  giudica(await misura(), dove);
  if (dallaCitta) {
    // prova della molla, senza dipendere dai tempi: la scena scalata come all'entrata, la vignetta rimisurata (resize),
    // poi la scala tolta senza altri eventi; la pagina non deve scorrere. Rosso VALMORA_ROSSI=C78V01: scorre di 3 px.
    await pagina.evaluate(() => { for (const e of document.querySelectorAll('.scena')) e.style.setProperty('scale', '1.03'); dispatchEvent(new Event('resize'));
      return new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok))); }); // scalata anche per il ResizeObserver
    await pagina.evaluate(() => { for (const e of document.querySelectorAll('.scena')) e.style.removeProperty('scale'); });
    giudica(await misura(), `${dove} (molla)`);
    await pagina.evaluate(() => dispatchEvent(new Event('resize')));
    return;
  }
  if (!/^(apertura|esito)-/.test(prefisso)) return;
  const prima = pagina.viewportSize();
  await pagina.setViewportSize({ width: 375, height: 667 }); await pagina.waitForTimeout(250);
  const piccola = await misura(); giudica(piccola, `${dove} a 375×667`);
  // C26-03 (D-126 d): a 375×667 sala e verbale senza vignetta, anche se ci starebbe sopra il minimo. Rosso VALMORA_ROSSI=C76V01.
  atteso(`${dove} a 375×667: vignetta «${prefisso}…» mostrata a ${piccola?.h.toFixed(1)} px, va nascosta (C26-03)`, !piccola || piccola.nascosta);
  // C29-01: in alcune finestre la vignetta si nascondeva e riappariva a ogni frame (pagina che salta, clic a vuoto).
  // Si contano i cambi in 30 frame a 1366×768 e 360×700, dove il collaudo li ha misurati. Rosso VALMORA_ROSSI=C89V01.
  for (const [width, height] of [[1366, 768], [360, 700]]) {
    await pagina.setViewportSize({ width, height }); await pagina.waitForTimeout(250);
    const cambi = await pagina.evaluate((pre) => new Promise((ok) => { let n = 0, k = 0, prec = null; const f = () => {
      const v = document.querySelector(`[data-vignetta^="${pre}"]`); const ora = v ? v.hasAttribute('data-nascosta') : null;
      if (prec !== null && ora !== prec) k++; prec = ora; if (++n < 30) requestAnimationFrame(f); else ok(k); }; requestAnimationFrame(f); }), prefisso);
    atteso(`${dove} a ${width}×${height}: vignetta «${prefisso}…» che appare e sparisce ${cambi} volte in 30 frame (C29-01)`, cambi === 0);
  }
  await pagina.setViewportSize(prima); await pagina.waitForTimeout(150);
}

/** C28-01: la tela Pixi copre tutta la mappa (entro 2 px), anche quando la mappa cambia forma senza ridimensionare la
 *  finestra (sala 4:3 → schieramento 1:1: quarto basso scuro). Si aspetta che la tela smetta di cambiare (rimisura al
 *  frame successivo). Rosso VALMORA_ROSSI=C86T01: la tela resta della forma di prima. */
export async function controllaTela(pagina, atteso, dove) {
  const misura = () => pagina.evaluate(() => [...document.querySelectorAll('.mappa canvas')].filter((c) => c.getClientRects().length).map((c) => {
    // dentro la cornice della mappa: l'area interna (clientWidth/Height), che è quella che la tela deve coprire
    const t = c.getBoundingClientRect(), mp = c.closest('.mappa'), m = { width: mp.clientWidth, height: mp.clientHeight };
    return { t: `${t.width.toFixed(0)}×${t.height.toFixed(0)}`, m: `${m.width}×${m.height}`, ok: Math.abs(t.width - m.width) <= 2 && Math.abs(t.height - m.height) <= 2 };
  }));
  let r = await misura();
  for (let i = 0; i < 10 && r.some((x) => !x.ok); i++) { await pagina.waitForTimeout(50); r = await misura(); }
  const male = r.filter((x) => !x.ok);
  atteso(`${dove}: tela della mappa ${male.map((x) => `${x.t} dentro ${x.m}`).join(', ')} (C28-01)`, !male.length);
}

/** C28-02: col mouse, una chiamata che si apre sotto il puntatore fermo non mostra un'opzione già accesa. Il puntatore
 *  va sul centro della prima opzione mentre c'è il titolo; «Riprendi» con la tastiera; poi si legge lo sfondo
 *  dell'opzione sotto il puntatore, che non deve essere quello dell'evidenza. Rosso VALMORA_ROSSI=C87H01: accesa. */
export async function controllaOpzioneFerma(pagina, atteso, scena) {
  // finestra alta: dopo la ricarica la pagina è in cima, e a 360×760 le opzioni starebbero sotto il bordo
  const prima = pagina.viewportSize(); await pagina.setViewportSize({ width: prima.width, height: 1600 });
  // prima ripresa da tastiera: dove stanno le opzioni dopo la ripresa (la pagina può scorrere all'apertura, C25-08)
  const riprendi = async () => { await pagina.reload(); await scena('titolo'); await pagina.getByRole('button', { name: 'Riprendi' }).focus(); await pagina.keyboard.press('Enter'); await scena('chiamata'); await pagina.waitForTimeout(300); };
  await riprendi();
  const r = await pagina.locator('.opzione').first().boundingBox(); if (!r) { await pagina.setViewportSize(prima); return; }
  const x = r.x + r.width / 2, y = r.y + r.height / 2;
  await pagina.reload(); await scena('titolo');
  await pagina.mouse.move(x, y);
  await pagina.getByRole('button', { name: 'Riprendi' }).focus(); await pagina.keyboard.press('Enter');
  await scena('chiamata'); await pagina.waitForTimeout(300); // come nella prima ripresa
  const [sotto, sfondo, evidenza] = await pagina.evaluate(([x, y]) => {
    const o = document.elementFromPoint(x, y)?.closest('.opzione'), v = document.createElement('i');
    v.style.color = 'var(--ciano)'; document.body.append(v); const c = getComputedStyle(v).color; v.remove();
    return [o?.dataset.opzione ?? '', o ? getComputedStyle(o).backgroundColor : '', c];
  }, [x, y]);
  atteso(`chiamata aperta col puntatore fermo sull'opzione «${sotto}»: già accesa (${sfondo}) (C28-02)`, !sotto || sfondo !== evidenza);
  atteso('C28-02: il puntatore fermo non sta su un\'opzione: il controllo è cieco', !!sotto);
  await pagina.mouse.move(0, 0); await pagina.setViewportSize(prima); await pagina.waitForTimeout(150);
}

/** C28-09: dopo un'azione il fuoco non resta sul body (il Tab ripartirebbe dalla testata): in ogni scena del giro, che
 *  si raggiunge col clic su un comando che poi sparisce, il fuoco sta dentro la pagina del gioco. Rosso C88F01. */
export async function controllaFuoco(pagina, atteso, dove) {
  let dove2 = '';
  for (let i = 0; i < 6; i++) { dove2 = await pagina.evaluate(() => { const a = document.activeElement; return !a || a === document.body ? 'body' : ''; }); if (!dove2) break; await pagina.waitForTimeout(40); }
  atteso(`${dove}: il fuoco della tastiera è sul body (C28-09)`, dove2 !== 'body');
  // C32-01 / D-142 (C34-08): il fuoco perso DENTRO la stessa scena va al comando più vicino, non sulla scena (il Tab
  // ripartirebbe dal primo). Si prova togliendo il fuoco a un comando della scena, come quando una pastiglia si ritira o
  // un'opzione si disattiva. All'ingresso di una scena nuova il fuoco sulla scena va bene (C28-09: mai sul body).
  // Rosso VALMORA_ROSSI=C97F01: sulla scena.
  const sc = await pagina.evaluate(async () => { const s = document.querySelector('.scena'), C = 'button:not(:disabled):not(.opzione), a[href], [tabindex="0"]';
    const c = s && [...s.querySelectorAll(C)].find((e) => e.getClientRects().length); if (!c) return null;
    c.focus({ preventScroll: true }); c.blur(); await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
    const a = document.activeElement; return { sullaScena: a === s, body: !a || a === document.body }; });
  if (sc) atteso(`${dove}: il fuoco perso dentro la scena sta ${sc.body ? 'sul body' : 'sulla scena'} e non su un comando (C32-01)`, !sc.sullaScena && !sc.body);
}

/** C28-09 e C28-11, a 1366×768 (PC): i comandi casa, «i», «?», pastiglie e «Rispondi» col fuoco da tastiera hanno il
 *  contorno del gioco (non l'anello del browser); la versione sta nel margine destro della colonna, non sul bordo della
 *  finestra. Rossi VALMORA_ROSSI=C89C01 (anello del browser) e C90V01 (versione sul bordo). */
export async function controllaLargo(pagina, atteso, dove) {
  const prima = pagina.viewportSize();
  await pagina.setViewportSize({ width: 1366, height: 768 }); await pagina.waitForTimeout(200);
  const r = await pagina.evaluate(() => {
    const v = document.querySelector('[data-versione-angolo]')?.getBoundingClientRect(), app = document.querySelector('#app')?.getBoundingClientRect();
    // C32-06: e non tocca nessun comando
    const tocca = !v ? [] : [...document.querySelectorAll('button, a[href]')].filter((e) => { const b = e.getBoundingClientRect(); return b.width && Math.min(v.right, b.right) - Math.max(v.left, b.left) > 0 && Math.min(v.bottom, b.bottom) - Math.max(v.top, b.top) > 0; }).map((e) => e.dataset.azione ?? e.className.split(' ')[0]);
    return { v: v && app ? { sinistra: v.left, destra: v.right, colonna: app.right, colonnaSx: app.left } : null, tocca };
  });
  // C28-11 accanto alla colonna; C32-06 subito fuori, nei 16 px oltre il bordo (rossi C90V01 e C98V01)
  // D-168: il lato è il sinistro, subito fuori dalla colonna (rosso C113V01: a destra)
  if (r.v) atteso(`${dove} a 1366×768: versione da ${r.v.sinistra.toFixed(0)} a ${r.v.destra.toFixed(0)} px, colonna da ${r.v.colonnaSx.toFixed(0)} px (C28-11, C32-06, D-168)`, r.v.destra <= r.v.colonnaSx + 1 && r.v.sinistra >= r.v.colonnaSx - 17);
  atteso(`${dove} a 1366×768: la versione tocca ${r.tocca.join(', ')} (C32-06)`, !r.tocca.length);
  await pagina.keyboard.press('Shift'); // da qui il fuoco è «da tastiera» (:focus-visible)
  const contorni = await pagina.evaluate(() => [...document.querySelectorAll('.tasto-home, .info, .aiuto, .tocco-pastiglia, .indicatore')].filter((e) => e.getClientRects().length && e.checkVisibility({ visibilityProperty: true }) && e.matches('button:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])')).map((e) => { // solo i comandi (la pastiglia fissa è un'immagine)
    e.focus({ preventScroll: true }); const c = getComputedStyle(e); const out = `${e.className.split(' ')[0]} ${c.outlineStyle} ${c.outlineColor}`, ok = c.outlineStyle === 'solid'; // letto prima del blur (stile vivo)
    e.blur(); return { out, ok };
  }));
  const male = contorni.filter((x) => !x.ok).map((x) => x.out);
  atteso(`${dove} a 1366×768: comandi col contorno del browser col fuoco da tastiera: ${male.join(', ')} (C28-09)`, !male.length);
  await pagina.setViewportSize(prima); await pagina.waitForTimeout(150);
}

/** PO-059: nel rapporto di fine ondata protagonista e vice con l'espressione della tensione più alta. Il tono si ricalcola
 *  qui dalla tensione del motore (livello come in partita.ts: 0 se ≤0, poi ceil(t/2) fino a 5; ≤1 calmo, ≤3 teso, poi
 *  critico); la vignetta può essere nascosta per mancanza di spazio (D-126 d). Rosso VALMORA_ROSSI=C96P01: niente vignetta. */
export async function controllaVignettaOndata(pagina, m, rapporto, atteso, dove) {
  if (!rapporto?.tensione) return;
  const lv = (t) => (t <= 0 ? 0 : Math.min(5, Math.ceil(t / 2))), max = Math.max(0, ...m.mappa.settori.map((s) => lv(rapporto.tensione[s.id] ?? 0)));
  // C33-07 (D-144): con un settore scoperto il tono è almeno «teso»; rosso C108T01: solo la tensione
  const scop = Object.values(rapporto.scoperto ?? {}).some((x) => x > 0) && !process.env.VALMORA_ROSSI?.includes('C108T01');
  const atteso2 = max <= 1 ? (scop ? 'teso' : 'calmo') : max <= 3 ? 'teso' : 'critico';
  const r = await pagina.evaluate(() => { const c = document.querySelector('.scena [data-tono]'), v = c?.querySelector('[data-vignetta^="ondata-"]');
    return { tono: c?.dataset.tono ?? null, vignetta: v?.dataset.vignetta ?? null, nascosta: !!v?.hasAttribute('data-nascosta'), braccia: [...(v?.querySelectorAll('[data-braccia]') ?? [])].map((b) => b.dataset.braccia).join(',') }; });
  atteso(`${dove}: manca la vignetta di fine ondata (PO-059)`, r.tono !== null);
  if (r.tono === null) return;
  atteso(`${dove}: tono «${r.tono}» (vignetta «${r.vignetta}»), la tensione dice «${atteso2}» (PO-059)`, r.tono === atteso2 && r.vignetta === `ondata-${atteso2}`);
  atteso(`${dove}: tono critico senza la mano alla nuca (PO-059)`, r.nascosta || atteso2 !== 'critico' || r.braccia.includes('nuca'));
}

/** C34-01: con la tastiera, Invio su «Conferma» apre il riepilogo col fuoco sul suo titolo, nella finestra; mai su un
 *  comando che conferma (un secondo Invio confermava senza vedere il riepilogo, fuori dalla finestra a 1024 e 1366).
 *  Alla misura della schermata e a 1366×768; si torna allo schieramento con «Torna». Rosso VALMORA_ROSSI=C104R01. */
export async function controllaRiepilogoFuoco(pagina, atteso, dove) {
  if ((process.env.VALMORA_ROSSI ?? '').includes('C17C01')) return; // senza riepilogo Invio conferma davvero
  const prima = pagina.viewportSize();
  for (const [w, h] of [[prima.width, prima.height], [1366, 768]]) {
    await pagina.setViewportSize({ width: w, height: h }); await pagina.waitForTimeout(150);
    const c = pagina.locator('[data-barra] [data-azione="conferma"]');
    if (!(await c.count()) || await c.isDisabled()) break;
    await c.focus(); await pagina.keyboard.press('Enter');
    if (!(await pagina.waitForSelector('[data-riepilogo]', { timeout: 3000 }).then(() => true, () => false))) { atteso(`${dove} ${w}×${h}: Invio su «Conferma» non apre il riepilogo (S-12)`, false); break; }
    await pagina.waitForTimeout(150);
    const r = await pagina.evaluate(() => { const a = document.activeElement, q = a?.getBoundingClientRect(); return { fuoco: a?.dataset?.azione ?? a?.tagName, comando: !!a?.matches('button, a[href]'), vista: !!q && q.top >= 0 && q.bottom <= innerHeight }; });
    atteso(`${dove} ${w}×${h}: dopo Invio su «Conferma» il fuoco è su ${r.fuoco}${r.vista ? '' : ', fuori dalla finestra'} e non sul titolo del riepilogo (C34-01)`, !r.comando && r.vista);
    await pagina.click('[data-azione="modifica"]'); await pagina.waitForSelector('[data-barra]', { timeout: 3000 }).catch(() => {});
  }
  await pagina.setViewportSize(prima); await pagina.waitForTimeout(150);
}

/** D-168 (S-03, a 360 la versione copriva il bordo destro di un'opzione): con la pagina in cima e in fondo la versione non
 *  tocca nessun comando, contando anche l'ombra che sporge (box-shadow). Rosso VALMORA_ROSSI=C113V01 (a destra). */
export async function controllaVersioneOmbra(pagina, atteso, dove) {
  const y = await pagina.evaluate(() => scrollY), male = [];
  for (const fine of [false, true]) {
    await pagina.evaluate((f) => scrollTo(0, f ? document.documentElement.scrollHeight : 0), fine); await pagina.waitForTimeout(60);
    male.push(...await pagina.evaluate((f) => { const v = document.querySelector('[data-versione-angolo]')?.getBoundingClientRect(); if (!v) return [];
      return [...document.querySelectorAll('button, a[href], .opzione')].filter((e) => e.getClientRects().length).filter((e) => { const b = e.getBoundingClientRect(), o = (getComputedStyle(e).boxShadow.match(/(-?[\d.]+)px (-?[\d.]+)px/) ?? [0, 0, 0]).slice(1).map(Number);
        const r = { left: b.left + Math.min(0, o[0]), right: b.right + Math.max(0, o[0]), top: b.top + Math.min(0, o[1]), bottom: b.bottom + Math.max(0, o[1]) };
        return Math.min(v.right, r.right) - Math.max(v.left, r.left) > 0 && Math.min(v.bottom, r.bottom) - Math.max(v.top, r.top) > 0; })
        .map((e) => `${e.dataset.opzione ?? e.dataset.azione ?? e.className.split(' ')[0]} (${f ? 'in fondo' : 'in cima'})`); }, fine));
  }
  await pagina.evaluate((v) => scrollTo(0, v), y);
  atteso(`${dove}: la versione copre ${male.join(', ')} contando l'ombra (D-168)`, !male.length);
}
