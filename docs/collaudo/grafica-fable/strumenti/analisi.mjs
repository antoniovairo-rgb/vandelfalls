import { readFileSync } from 'node:fs';
const cart = process.argv[2] ?? 'g'; const Ls = (process.argv[3] ?? '360,375,412').split(',');
const tutto = Ls.map((L) => JSON.parse(readFileSync(`${cart}${L}/${L}-misure.json`)));
const agg = (chiave, estrai) => { const m = new Map(); for (const g of tutto) for (const s of g.stati) for (const x of estrai(s)) { const k = chiave(x, s); const v = m.get(k) ?? { x, L: new Set(), sc: new Set(), n: 0 }; v.L.add(g.L); v.sc.add(s.etichetta); v.n++; m.set(k, v); } return [...m.values()]; };
console.log('== CONTRASTO sotto soglia (4.5 normale, 3 grande)');
for (const v of agg((x) => `${x.sel}|${x.rap}|${x.col}`, (s) => s.testi.filter((t) => t.rap < (t.grande ? 3 : 4.5))).sort((a, b) => a.x.rap - b.x.rap))
  console.log(`${v.x.rap}:1 fs${v.x.fs} p${v.x.peso} op${v.x.op} ${v.x.img ? 'IMG ' : ''}${v.x.fondoTrovato ? '' : 'FONDO? '}«${v.x.t}» ${v.x.sel} ${v.x.col} [${[...v.L]}] {${[...v.sc].slice(0, 5)}} n=${v.n}`);
console.log('== TESTO sotto 13 px (dimensioni usate)');
const dims = new Map(); for (const g of tutto) for (const s of g.stati) for (const t of s.testi) dims.set(t.fs, (dims.get(t.fs) ?? 0) + 1); console.log([...dims].sort((a, b) => a[0] - b[0]).map(([k, v]) => `${k}px×${v}`).join(' '));
console.log('== TOCCO sotto 44');
for (const v of agg((x) => `${x.sel}|${x.w}x${x.h}`, (s) => s.tocchi)) console.log(`${v.x.w}×${v.x.h} allargata=${v.x.allargata} ${JSON.stringify(v.x.prova)} dis=${v.x.disabled} «${v.x.t}» ${v.x.sel} [${[...v.L]}] {${[...v.sc].slice(0, 4)}} n=${v.n}`);
console.log('== TAGLIATI');
for (const v of agg((x) => `${x.sel}|${x.t}`, (s) => s.tagliati)) console.log(`${v.x.sw}/${v.x.cw} ${v.x.sh}/${v.x.ch} ${v.x.ov} «${v.x.t}» ${v.x.sel} [${[...v.L]}] {${[...v.sc].slice(0, 4)}} n=${v.n}`);
console.log('== SOVRAPPOSIZIONI interattivi');
for (const v of agg((x) => `${x.a}|${x.b}`, (s) => s.sovr).sort((a, b) => b.x.area - a.x.area).slice(0, 40)) console.log(`${v.x.area}px² (${v.x.w}×${v.x.h}) ${v.x.a} ⨯ ${v.x.b} [${[...v.L]}] {${[...v.sc].slice(0, 4)}} n=${v.n}`);
console.log('== FISSI');
for (const v of agg((x) => `${x.sel}`, (s) => s.fissi)) console.log(`${v.x.pos} ${v.x.x},${v.x.y} ${v.x.w}×${v.x.h} op${v.x.op} pe=${v.x.pe} ${v.x.sel} [${[...v.L]}] {${[...v.sc].slice(0, 6)}} n=${v.n}`);
console.log('== ALTEZZA pagina / finestra (max per etichetta)');
for (const g of tutto) { const m = new Map(); for (const s of g.stati) m.set(s.etichetta, Math.max(m.get(s.etichetta) ?? 0, s.alto)); console.log(g.L, g.A, [...m].map(([k, v]) => `${k}:${v > +g.A ? '+' + (v - g.A) : 'ok'}`).join(' ')); }
console.log('== LARGHEZZA oltre finestra'); for (const g of tutto) for (const s of g.stati) if (s.largo > +g.L) console.log(g.L, s.nome, s.largo);
console.log('== DISABILITATI'); for (const v of agg((x) => `${x.sel}|${x.op}`, (s) => s.disabilitati)) console.log(`op${v.x.op} «${v.x.t}» ${v.x.sel} {${[...v.sc].slice(0, 4)}}`);
console.log('== ANIMAZIONI'); for (const v of agg((x) => `${x.nome}|${x.iter}|${x.dur}`, (s) => s.animazioni)) console.log(`${v.x.nome} iter=${v.x.iter} dur=${v.x.dur} ${v.x.stato} su ${v.x.su} {${[...v.sc].slice(0, 6)}} n=${v.n}`);
console.log('errori', tutto.map((g) => g.errori.length));
