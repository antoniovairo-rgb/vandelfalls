// Punto d'ingresso della resa. Caratteri open source inclusi nella build (OFL 1.1): niente CDN, il gioco è offline (D-257).
import './caratteri.css';
import { createRoot } from 'react-dom/client';
import './token.css';
import './stile.css';
import './stile-schermate.css';
import './stile-c18.css';
import './stile-home.css';
import './stile-idee.css';
import { App } from './App.tsx';
import { Contenitore } from './errore.tsx';

createRoot(document.getElementById('app')!).render(<Contenitore><App /></Contenitore>);
