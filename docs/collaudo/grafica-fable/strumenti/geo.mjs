import { readFileSync } from 'node:fs';
const inter = (a, b) => Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]));
for (const L of ['360', '375', '412']) { const g = JSON.parse(readFileSync(`g${L}/${L}-misure.json`));
  const conta = {}; const es = {}; const statiPer = {};
  const nota = (k, s, q, d) => { conta[k] = (conta[k] ?? 0) + 1; (statiPer[k] ??= new Set()).add(s.nome); if (!es[k] || q > es[k].q) es[k] = { q, d: `${s.nome}: ${d}` }; };
  let conMappa = 0;
  for (const s of g.stati) { const G = s.geo; if (!G.mappa.length) continue; conMappa++;
    for (const p of G.past) { const a = p.r[2] * p.r[3]; if (!a) continue;
      for (const r of G.radio) { const q = inter(p.r, r.r) / a; if (q >= 0.25) nota(`radio copre pastiglia [${s.etichetta}]`, s, q, `${p.id} ${Math.round(q * 100)}% dis=${p.dis} radio=«${r.t.slice(0, 30)}» ${r.c}`); }
      for (const n of G.nomi) { const q = inter(p.r, n.r) / a; if (q >= 0.25) nota(`nome ⨯ pastiglia`, s, q, `${p.id} ⨯ nome ${n.id} ${Math.round(q * 100)}%`); }
      for (const h of G.home) { const q = inter(p.r, h.r) / a; if (q >= 0.1) nota(`home ⨯ pastiglia`, s, q, `${p.id} ${Math.round(q * 100)}%`); }
      for (const o of G.past) if (o !== p && o.id < p.id) { const q = inter(p.r, o.r) / a; if (q >= 0.1) nota(`pastiglia ⨯ pastiglia`, s, q, `${p.id} ⨯ ${o.id} ${Math.round(q * 100)}%`); }
      for (const o of G.punti) { const c = [o.r[0] + o.r[2] / 2 - 11, o.r[1] + o.r[3] / 2 - 11, 22, 22]; const q = inter(p.r, c) / (22 * 22); if (q >= 0.25) nota(`pastiglia ⨯ disco del settore (22 px al centro)`, s, q, `${p.id} ⨯ punto ${o.id} ${Math.round(q * 100)}%`); }
    }
    for (const n of G.nomi) for (const o of G.punti) { const c = [o.r[0] + o.r[2] / 2 - 11, o.r[1] + o.r[3] / 2 - 11, 22, 22]; const q = inter(n.r, c) / (22 * 22); if (q >= 0.25) nota(`nome ⨯ disco del settore`, s, q, `nome ${n.id} ⨯ punto ${o.id} ${Math.round(q * 100)}%`); }
    for (const r of G.radio) for (const n of G.nomi) { const q = inter(r.r, n.r) / (n.r[2] * n.r[3] || 1); if (q >= 0.25) nota(`radio ⨯ nome [${s.etichetta}]`, s, q, `${n.id} ${Math.round(q * 100)}% ${r.c}`); }
  }
  console.log(`== ${L}: stati con mappa ${conMappa}`);
  for (const k of Object.keys(conta).sort()) console.log(`  ${k}: ${conta[k]} casi in ${statiPer[k].size} stati; peggiore ${es[k].d}`);
}
