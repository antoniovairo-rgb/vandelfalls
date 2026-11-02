// Librerie e asset del gioco con licenza e autori: la schermata «Crediti» li mostra, CREDITI.md li
// ripete per il repository. Il test tests/crediti.test.ts pretende che ogni dipendenza di runtime
// in package.json sia qui e in CREDITI.md. Autori = riga «Copyright» del file LICENSE del pacchetto.
export interface Credito { nome: string; uso: string; licenza: string; autori: string; fonte: string }

export const CREDITI: Credito[] = [
  { nome: 'React, react-dom', uso: 'interfaccia', licenza: 'MIT', autori: '© Meta Platforms, Inc. and affiliates', fonte: 'https://github.com/facebook/react' },
  { nome: 'PixiJS (pixi.js)', uso: 'mappa tattica in WebGL', licenza: 'MIT', autori: '© 2013-2023 Mathew Groves, Chad Engler', fonte: 'https://github.com/pixijs/pixijs' },
  { nome: '@pixi/react', uso: 'PixiJS dentro React', licenza: 'MIT', autori: '© 2018 Patrick Brouwer', fonte: 'https://github.com/pixijs/pixi-react' },
  { nome: 'Motion (motion)', uso: 'transizioni fra le scene', licenza: 'MIT', autori: '© 2024 Motion B.V.', fonte: 'https://github.com/motiondivision/motion' },
  { nome: 'Lucide (lucide-react)', uso: 'icone dell\'interfaccia', licenza: 'ISC (alcune icone MIT, dal progetto Feather)', autori: '© 2026 Lucide Icons and Contributors; Feather © 2013-present Cole Bemis', fonte: 'https://github.com/lucide-icons/lucide' },
  { nome: 'Capacitor (@capacitor/core, @capacitor/android)', uso: 'app Android', licenza: 'MIT', autori: '© 2017-present Drifty Co.', fonte: 'https://github.com/ionic-team/capacitor' },
  { nome: 'Space Grotesk (@fontsource/space-grotesk)', uso: 'carattere dei titoli', licenza: 'SIL Open Font License 1.1', autori: '© 2020 The Space Grotesk Project Authors', fonte: 'https://github.com/floriankarsten/space-grotesk' },
  { nome: 'Inter (@fontsource/inter)', uso: 'carattere dei testi e dei simboli (Inter 4.1.1 per → ≤ ≥ ▲ ▼ ★ ☆)', licenza: 'SIL Open Font License 1.1', autori: '© 2016 The Inter Project Authors', fonte: 'https://github.com/rsms/inter' },
  { nome: 'Ajv (ajv)', uso: 'controllo dei dati di gioco', licenza: 'MIT', autori: '© 2015-2021 Evgeny Poberezkin', fonte: 'https://github.com/ajv-validator/ajv' },
];

/** Pacchetti npm coperti da ogni voce (per il test). */
export const PACCHETTI: Record<string, string> = {
  react: 'React, react-dom', 'react-dom': 'React, react-dom', 'pixi.js': 'PixiJS (pixi.js)', '@pixi/react': '@pixi/react',
  motion: 'Motion (motion)', 'lucide-react': 'Lucide (lucide-react)', '@capacitor/core': 'Capacitor (@capacitor/core, @capacitor/android)',
  '@capacitor/android': 'Capacitor (@capacitor/core, @capacitor/android)', ajv: 'Ajv (ajv)',
  '@fontsource/space-grotesk': 'Space Grotesk (@fontsource/space-grotesk)', '@fontsource/inter': 'Inter (@fontsource/inter)',
};
