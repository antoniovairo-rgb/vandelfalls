# Crediti

Librerie e asset usati dal gioco, con licenza e autori (riga «Copyright» del file LICENSE di ogni
pacchetto in `node_modules/`, letta il 2026-10-11). La schermata «Crediti» del gioco mostra le stesse
voci (`src/resa/crediti.ts`); il test `tests/resa.test.ts` pretende che ogni dipendenza di runtime di
package.json compaia in entrambi.

| pacchetto | versione | uso | licenza | autori | fonte |
|---|---|---|---|---|---|
| `react`, `react-dom` | 19.3.0 | interfaccia | MIT | © Meta Platforms, Inc. and affiliates | https://github.com/facebook/react |
| `pixi.js` | 8.22.0 | mappa tattica in WebGL | MIT | © 2013-2023 Mathew Groves, Chad Engler | https://github.com/pixijs/pixijs |
| `@pixi/react` | 8.0.5 | PixiJS dentro React | MIT | © 2018 Patrick Brouwer | https://github.com/pixijs/pixi-react |
| `motion` | 14.1.0 | transizioni fra le scene | MIT | © 2024 Motion B.V. | https://github.com/motiondivision/motion |
| `lucide-react` | 1.55.0 | icone dell'interfaccia | ISC (le icone derivate da Feather: MIT) | © 2026 Lucide Icons and Contributors; Feather © 2013-present Cole Bemis | https://github.com/lucide-icons/lucide |
| `@capacitor/core`, `@capacitor/android` | 8.5.3 | app Android | MIT | © 2017-present Drifty Co. | https://github.com/ionic-team/capacitor |
| `@fontsource/space-grotesk` | 5.3.0 | carattere dei titoli (file nel gioco, nessun CDN) | SIL Open Font License 1.1 | © 2020 The Space Grotesk Project Authors | https://github.com/floriankarsten/space-grotesk |
| `@fontsource/inter` | 5.3.0 | carattere dei testi (file nel gioco, nessun CDN) | SIL Open Font License 1.1 | © 2016 The Inter Project Authors | https://github.com/rsms/inter |
| `inter-ui` (solo per generare i file, non è una dipendenza) | 4.1.1 | simboli → ≤ ≥ ▲ ▼ ★ ☆ in Inter, più ⋮ e ⚑ disegnati da noi (`tools/caratteri-simboli.py`, D-257) | SIL Open Font License 1.1 | © 2016-2018 The Inter Project Authors | https://github.com/rsms/inter |
| `ajv` | 8.20.0 | controllo dei dati di gioco | MIT | © 2015-2021 Evgeny Poberezkin | https://github.com/ajv-validator/ajv |

Testo delle licenze dei caratteri, distribuito col gioco: `public/licenze/inter-OFL.txt`, `public/licenze/space-grotesk-OFL.txt`.

## Asset grafici

Nessuno per ora. Le icone game-icons.net (CC BY 3.0) entreranno solo con l'autore di ogni icona
scritto qui e nella schermata «Crediti» (D-052); ogni asset passa il filtro su simboli reali
(docs/REGOLE_PLAY.md §3).
