// C-057: i guardiani po152a e po152b di tools/sonda-altezze.mjs, da soli, alle tre larghezze (supporto, non sostituto delle sonde).
import { giraAltezze, controllaAltezze } from '../../../tools/sonda-altezze.mjs';
const g = await giraAltezze({ build: 'dist', vps: ['360x640', '375x667', '412x830'], parti: ['po152a', 'po152b'] });
const male = controllaAltezze(g); console.log(male.length ? `ROSSO (${male.length}):\n${male.join('\n')}` : 'VERDE'); process.exit(0);
