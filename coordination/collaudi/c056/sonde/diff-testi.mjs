import { execSync } from 'node:child_process';
const sh = (c) => execSync(c, { cwd: '/home/user/vandelfalls', maxBuffer: 1 << 28 }).toString();
const files = sh('git diff --name-only 30af225b c6e9c507 -- data').trim().split('\n');
const out = { cambiati: [], nuovi: [], tolti: [] };
for (const f of files) { if (!f.startsWith('data/testi/')) continue;
  let a = {}, b = {}; try { a = JSON.parse(sh(`git show 30af225b:${f}`)); } catch {} try { b = JSON.parse(sh(`git show c6e9c507:${f}`)); } catch {}
  for (const k of Object.keys(b)) { if (!(k in a)) out.nuovi.push([f, k, b[k]]); else if (a[k] !== b[k]) out.cambiati.push([f, k, a[k], b[k]]); }
  for (const k of Object.keys(a)) if (!(k in b)) out.tolti.push([f, k]); }
console.log(JSON.stringify(out));
