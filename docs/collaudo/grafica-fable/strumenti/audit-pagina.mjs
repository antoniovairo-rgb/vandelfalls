// Funzione eseguita nella pagina: misure di leggibilità, tocco, tagli, sovrapposizioni.
export function auditPagina() {
  const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const rgba = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1]; };
  const sopra = (a, b) => { const k = a[3]; return [a[0] * k + b[0] * (1 - k), a[1] * k + b[1] * (1 - k), a[2] * k + b[2] * (1 - k), 1]; };
  const fondo = (el) => { // colore di fondo effettivo: risale gli antenati; segnala immagini/tele
    let c = [0, 0, 0, 0], img = false, n = el;
    const strati = [];
    while (n && n.nodeType === 1) {
      const cs = getComputedStyle(n);
      const b = rgba(cs.backgroundColor);
      if (cs.backgroundImage !== 'none' && !strati.length) img = img || cs.backgroundImage.slice(0, 40);
      if (b && b[3] > 0) { strati.push(b); if (b[3] >= 0.999) break; }
      n = n.parentElement;
    }
    let base = [255, 255, 255, 1];
    for (let i = strati.length - 1; i >= 0; i--) base = sopra(strati[i], base);
    return { c: base, img, trovato: strati.length > 0 && strati.at(-1)[3] >= 0.999 };
  };
  const visibile = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05; };
  const opacita = (el) => { let o = 1; for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= Number(getComputedStyle(n).opacity); return o; };
  const sel = (el) => { const d = Object.entries(el.dataset).slice(0, 2).map(([k, v]) => `[${k}=${String(v).slice(0, 24)}]`).join(''); return `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : ''}${d}`; };
  const testi = [], piccoli = [], tagliati = [];
  for (const el of document.querySelectorAll('body *')) {
    if (!visibile(el)) continue;
    const proprio = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).map((n) => n.textContent.trim()).join(' ');
    const cs = getComputedStyle(el);
    if (proprio) {
      const op = opacita(el); if (op < 0.05) continue;
      const fs = parseFloat(cs.fontSize), peso = Number(cs.fontWeight) || 400;
      const f = fondo(el); let col = rgba(cs.color); if (!col) continue;
      col = sopra([col[0], col[1], col[2], col[3] * op], f.c);
      const l1 = lum(col), l2 = lum(f.c); const rap = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      const grande = fs >= 24 || (fs >= 18.66 && peso >= 700);
      const r = el.getBoundingClientRect();
      testi.push({ t: proprio.slice(0, 40), sel: sel(el), fs, peso, rap: Math.round(rap * 100) / 100, grande, img: f.img, fondoTrovato: f.trovato, op: Math.round(op * 100) / 100, col: cs.color, y: Math.round(r.top) });
      if (fs < 12) piccoli.push({ t: proprio.slice(0, 40), fs });
    }
    if ((cs.overflow !== 'visible' || cs.textOverflow === 'ellipsis') && el.textContent.trim() && (el.scrollWidth > el.clientWidth + 1 || (el.scrollHeight > el.clientHeight + 1 && cs.overflowY === 'hidden')) && !['HTML', 'BODY', 'MAIN'].includes(el.tagName) && cs.overflowY !== 'auto' && cs.overflowY !== 'scroll' && cs.overflowX !== 'auto')
      tagliati.push({ sel: sel(el), t: el.textContent.trim().slice(0, 40), sw: el.scrollWidth, cw: el.clientWidth, sh: el.scrollHeight, ch: el.clientHeight, ov: cs.overflow });
  }
  // aree di tocco
  const interattivi = [...document.querySelectorAll('button, a[href], [role="button"], input, select, summary, [tabindex]:not([tabindex="-1"])')].filter(visibile);
  const tocchi = [];
  for (const el of interattivi) {
    const r = el.getBoundingClientRect();
    if (r.width >= 44 && r.height >= 44) continue;
    // l'area vera può essere allargata da pseudo-elementi: provo i punti a ±21 px dal centro
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const prova = [[-21, 0], [21, 0], [0, -21], [0, 21]].map(([dx, dy]) => { const e = document.elementFromPoint(cx + dx, cy + dy); return !!e && (e === el || el.contains(e)); });
    tocchi.push({ sel: sel(el), t: (el.getAttribute('aria-label') ?? el.textContent.trim()).slice(0, 30), w: Math.round(r.width), h: Math.round(r.height), allargata: prova.every(Boolean), prova, disabled: el.disabled || el.getAttribute('aria-disabled') === 'true', y: Math.round(r.top) });
  }
  // sovrapposizioni fra interattivi (non antenato/discendente)
  const sovr = [];
  for (let i = 0; i < interattivi.length; i++) for (let j = i + 1; j < interattivi.length; j++) {
    const a = interattivi[i], b = interattivi[j]; if (a.contains(b) || b.contains(a)) continue;
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
    if (w > 2 && h > 2) sovr.push({ a: sel(a), b: sel(b), area: Math.round(w * h), w: Math.round(w), h: Math.round(h) });
  }
  // elementi fissi che coprono testo o pulsanti
  const fissi = [...document.querySelectorAll('body *')].filter((e) => visibile(e) && ['fixed', 'sticky'].includes(getComputedStyle(e).position)).map((e) => { const r = e.getBoundingClientRect(); return { sel: sel(e), pos: getComputedStyle(e).position, x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), op: Math.round(opacita(e) * 100) / 100, pe: getComputedStyle(e).pointerEvents }; });
  // elementi coperti: quota di punti (griglia 5×5) di pastiglie, punti e nomi dove in cima c'è un altro elemento
  const coperti = [];
  for (const el of document.querySelectorAll('.mappa [data-presenza], .mappa [data-fissa], .mappa .settore-nome, .mappa .settore-punto, .mappa .segno-mossa, .radio-mappa')) {
    if (!visibile(el)) continue; const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) continue;
    const vis = el.matches('[data-presenza]') ? (el.querySelector('.pastiglia') ?? el) : el; const q = vis.getBoundingClientRect();
    let tot = 0, cop = 0; const chi = new Map();
    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) { const x = q.left + q.width * (i + 0.5) / 5, y = q.top + q.height * (j + 0.5) / 5; if (y < 0 || y > innerHeight || x < 0 || x > innerWidth) continue; tot++; const e = document.elementFromPoint(x, y); if (e && !(e === el || el.contains(e) || e.contains(el))) { cop++; const k = sel(e.closest('[data-presenza],.settore-nome,.radio-mappa,.scheda-settore,.tasto-home,.segno-mossa,.settore-punto,button') ?? e); chi.set(k, (chi.get(k) ?? 0) + 1); } }
    if (tot && cop / tot >= 0.2) coperti.push({ sel: sel(el), t: el.textContent.trim().slice(0, 20), quota: Math.round(100 * cop / tot), da: [...chi].sort((a, b) => b[1] - a[1]).slice(0, 2).map((x) => x[0]), x: Math.round(q.left), y: Math.round(q.top), w: Math.round(q.width), h: Math.round(q.height) });
  }
  const rr = (e) => { const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; };
  const geo = { radio: [...document.querySelectorAll('.mappa .radio-mappa')].filter(visibile).map((e) => ({ r: rr(e), c: e.className, t: e.textContent.slice(0, 50) })),
    past: [...document.querySelectorAll('.mappa [data-presenza], .mappa [data-fissa]')].filter(visibile).map((e) => ({ r: rr(e.querySelector('.pastiglia') ?? e), id: e.dataset.presenza ?? e.dataset.fissa, dis: !!e.disabled })),
    nomi: [...document.querySelectorAll('.mappa .settore-nome')].filter(visibile).map((e) => ({ r: rr(e), id: e.closest('[data-settore],[data-episodio]')?.dataset.settore ?? e.textContent })),
    punti: [...document.querySelectorAll('.mappa .settore-punto')].filter(visibile).map((e) => ({ r: rr(e), id: e.closest('[data-settore],[data-episodio]')?.dataset.settore ?? e.textContent, dis: !!e.disabled })),
    home: [...document.querySelectorAll('.mappa .tasto-home, .tasto-home')].filter(visibile).map((e) => ({ r: rr(e) })), segni: [...document.querySelectorAll('.mappa .segno-mossa, .mappa [data-segno]')].filter(visibile).map((e) => ({ r: rr(e), t: e.textContent })),
    mappa: [...document.querySelectorAll('.mappa')].filter(visibile).map((e) => ({ r: rr(e) })) };
  const d = document.documentElement;
  const disabilitati = [...document.querySelectorAll('button:disabled, [aria-disabled="true"]')].filter(visibile).map((e) => ({ sel: sel(e), t: e.textContent.trim().slice(0, 30), op: Math.round(opacita(e) * 100) / 100 }));
  return { scena: document.querySelector('.scena')?.dataset.scena, alto: d.scrollHeight, finestra: innerHeight, largo: d.scrollWidth, testi, piccoli, tagliati, tocchi, sovr, fissi, disabilitati, coperti, geo,
    animazioni: document.getAnimations().map((a) => ({ nome: a.animationName ?? a.transitionProperty ?? '?', iter: a.effect?.getTiming().iterations === Infinity ? 'inf' : a.effect?.getTiming().iterations, dur: a.effect?.getTiming().duration, su: a.effect?.target ? sel(a.effect.target) : '?', stato: a.playState })) };
}
