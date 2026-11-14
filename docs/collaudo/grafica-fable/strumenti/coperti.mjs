import { readFileSync } from 'node:fs';
const cart = process.argv[2] ?? 'g'; const Ls = (process.argv[3] ?? '360,375,412').split(',');
for (const L of Ls) { const g = JSON.parse(readFileSync(`${cart}${L}/${L}-misure.json`));
  const m = new Map(); let statiCon = 0; const perEt = new Map();
  for (const s of g.stati) { const c = s.coperti.filter((x) => x.quota >= 40); if (c.length) { statiCon++; perEt.set(s.etichetta, (perEt.get(s.etichetta) ?? 0) + 1); }
    for (const x of c) { const k = `${x.sel.split('[')[0].split('.').slice(0,2).join('.')} ← ${x.da[0]?.split('[')[0]}`; const v = m.get(k) ?? { n: 0, max: 0, es: '' }; v.n++; if (x.quota > v.max) { v.max = x.quota; v.es = `${s.nome} «${x.t}» ${x.sel.match(/\[.*\]/)?.[0] ?? ''} ${x.quota}%`; } m.set(k, v); } }
  console.log(`== ${L}: stati ${g.stati.length}, con elementi coperti ≥40%: ${statiCon}`, JSON.stringify([...perEt]));
  for (const [k, v] of [...m].sort((a, b) => b[1].n - a[1].n).slice(0, 14)) console.log(`  ${v.n}× ${k} (max ${v.max}%: ${v.es})`);
  const alt = new Map(); for (const s of g.stati) alt.set(s.etichetta, Math.max(alt.get(s.etichetta) ?? 0, s.alto - s.finestra)); console.log('  oltre la finestra:', [...alt].filter(([, v]) => v > 0).map(([k, v]) => `${k}+${v}`).join(' '));
}
