// Mappa tattica della sala operativa (D-049). Due strati:
// - sotto, PixiJS (StratoPixi) disegna griglia, campo, aloni e impulsi; se WebGL manca non c'è e basta;
// - sopra, HTML: un punto per settore (pulsante vero, tocco e lettori di schermo), nome e unità schierate.
// La tensione si vede SOLO come colore (D-055): classe liv-0…liv-5, mai il numero.
import { lazy, Suspense, useEffect, type ReactNode, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { disponiEtichette } from './etichette.ts';

// Interruttore rosso C05S08: nomi e unità restano al posto fisso (difetto C-008).
const disponi = (el: HTMLElement) => { if (!spento('C05S08')) disponiEtichette(el); };
import type { Disposizione, Missione } from '../../logica/tipi.ts';
import { spento } from '../../interruttori.ts';
import { club, t, quante } from '../dati.ts';
import { Lock } from 'lucide-react';
import { TastoHome } from '../schermate/Fumetto.tsx';
import { Icona, iconaRisorsa } from '../icone.tsx';
import { livello } from '../partita.ts';
import type { PuntoMappa } from './StratoPixi.tsx';
import { webglDisponibile } from './webgl.ts';
import { follaDellOndata } from './folla.ts';
import { parolaSegno, simboloSegno, type Segno } from './segni.ts';
import { useAdatta } from './adatta.ts';
import { rigaFolla, SchedaSettore } from './scheda-settore.tsx';
import { RadioMappa } from './radio-mappa.tsx';

// PixiJS pesa: si carica a parte, dopo il titolo, e solo se WebGL c'è.
const StratoPixi = lazy(() => import('./StratoPixi.tsx').then((x) => ({ default: x.StratoPixi })));

const PAROLE = ['calma', 'tranquilla', 'mossa', 'tesa', 'molto tesa', 'critica'];
const conWebgl = typeof document !== 'undefined' && webglDisponibile();

export interface MappaProps {
  m: Missione;
  /** S-21 (C14-05): pulsante «Home» nell'angolo della mappa (la partita resta salvata) */
  home?: () => void;
  /** ondata di cui si mostrano spalti e cortei (prima della prima: 1) */
  ondata?: number;
  accesi?: string[];
  /** PO-089: settore di cui parla la chiamata in corso: lì la gente si muove (corteo o folla) */
  citato?: string;
  /** PO-085: segni dell'ultima risposta (▲/▼ pressione o tensione, squadre), per un attimo */
  segni?: Segno[];
  tensione?: Record<string, number> | null;
  presenze?: Disposizione | null;
  /** unità fisse già montate nelle ondate prima (transenne, D-082): si vedono col lucchetto e non si ritirano */
  fisse?: Disposizione | null;
  /** settori dove la risorsa scelta non si può mettere (transenne sugli spalti): spenti */
  vietati?: string[];
  /** schieramento: tocco su un settore, e tocco su un'unità già schierata per ritirarla */
  onSettore?: (settore: string) => void;
  onTogli?: (risorsa: string, settore: string) => void;
  /** PO-152 (D-241): senza onSettore il tocco su un settore apre la sua scheda di stato (scheda-settore.tsx) */
  schede?: boolean;
  /** D-241 idea B (mossa-ui.tsx): si toccano solo le unità spostabili («risorsa@settore»), poi solo i settori ammessi */
  mossa?: { spostabili: string[]; inMano: string | null; ammessi: string[] };
  /** PO-152 (D-241): rapporto radio del costo dopo «Conferma», sopra la mappa (RadioMappa) */
  radio?: ReactNode;
  /** D-165 (fischio dell'ultimo derby): settori già spenti, città vuota (niente folla né cortei), sala al buio */
  spenti?: string[]; vuota?: boolean; buio?: boolean;
  /** D-191: il rapporto nasconde la mappa che non ci sta; App mette «Home» nella testata */
  nascosta?: (si: boolean) => void;
}

/** Posizione del settore in percentuale, passata al CSS come variabili (niente stili in linea). */
const posiziona = (x: number, y: number) => (el: HTMLElement | null) => {
  el?.style.setProperty('--x', String(x));
  el?.style.setProperty('--y', String(y));
};

export function Mappa(p: MappaProps) {
  const contenitore = useRef<HTMLDivElement>(null);
  const [pronta, setPronta] = useState(!conWebgl);
  const settori = useMemo(() => p.m.mappa.settori.map((s, i, tutti) => ({ ...s, pos: s.pos ?? { x: ((i + 1) * 100) / (tutti.length + 1), y: 50 } })), [p.m]);
  // S-21: il pulsante «Home» va nell'angolo più lontano dai settori (in e02 la stazione sta in alto a sinistra).
  const angolo = useMemo(() => {
    const angoli = { 'alto-sx': [0, 0], 'alto-dx': [100, 0], 'basso-sx': [0, 100], 'basso-dx': [100, 100] } as const;
    const lontano = (k: keyof typeof angoli) => Math.min(...settori.map((s) => Math.hypot(s.pos.x - angoli[k][0], s.pos.y - angoli[k][1])));
    return (Object.keys(angoli) as (keyof typeof angoli)[]).reduce((a, b) => (lontano(b) > lontano(a) + 5 ? b : a));
  }, [settori]);
  const accesi = useMemo(() => new Set(p.accesi ?? []), [p.accesi]);
  const punti: PuntoMappa[] = useMemo(() => settori.map((s) => ({
    id: s.id, tipo: s.tipo, x: s.pos.x, y: s.pos.y, acceso: accesi.has(s.id), livello: p.tensione ? livello(p.tensione[s.id] ?? 0) : null,
    // Curve, folla e corteo coi colori del club della curva (D-086). Rosso C10C01: colori fissi di prima.
    colori: s.club && !spento('C10C01') ? club.get(s.club)?.colori : undefined,
    meta: (s as { meta?: string }).meta, // C27-02: dove va la strada (campo facoltativo dei dati)
  })), [settori, accesi, p.tensione]);
  // Margine interno = mezzo punto del settore, come nel CSS (.settore), così Pixi e HTML coincidono.
  // e in basso c'è in più lo spazio per i nomi (--margine-nomi): stessi conti di .settore in stile.css.
  const margine = useMemo(() => {
    const v = (k: string, d: number) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(k)) || d;
    return { lato: v('--settore', 44) / 2, sotto: v('--margine-nomi', 34) };
  }, []);

  // Atmosfera dai dati (campi facoltativi mappa.ora e mappa.dettagli, e03 «Notte di coppa»).
  const extra = p.m.mappa as { ora?: string; dettagli?: string[] };
  const folla = useMemo(() => (p.vuota ? { spalti: 'vuoti' as const, cortei: [] } : follaDellOndata(p.m, p.ondata ?? 1)), [p.m, p.ondata, p.vuota]);
  const atmosfera = useMemo(() => ({ notte: extra.ora === 'notte', cartelloni: !!extra.dettagli?.some((x) => x.split('@')[0] === 'cartelloni_stadio_nuovo'), dettagli: extra.dettagli ?? [] }), [extra.ora, extra.dettagli]);

  // Nomi e unità al posto che non copre niente (C-008): a ogni disegno, quando la mappa cambia misura e
  // quando arrivano i caratteri.
  useLayoutEffect(() => { if (contenitore.current) disponi(contenitore.current); });
  useAdatta(contenitore, disponi, p.nascosta); // D-187, D-191
  // PO-152: una scheda alla volta; si chiude da sola quando cambia la chiamata. Chiusa dalla tastiera, il fuoco torna al settore.
  const schede = !!p.schede && !p.onSettore;
  const [aperto, setAperto] = useState<string | null>(null);
  useEffect(() => setAperto(null), [p.citato, schede]);
  const chiudiScheda = () => {
    const el = contenitore.current, id = aperto, dentro = !!el?.querySelector('.scheda-settore')?.contains(document.activeElement);
    setAperto(null);
    if (id && dentro) requestAnimationFrame(() => el?.querySelector<HTMLButtonElement>(`[data-settore="${id}"] .settore-punto`)?.focus({ preventScroll: true }));
  };
  const statoDi = (s: (typeof settori)[number]) => {
    const liv = p.tensione ? livello(p.tensione[s.id] ?? 0) : null;
    const conta = (d: Disposizione | null | undefined) => Object.entries(d ?? {}).map(([r, ps]) => [r, ps[s.id] ?? 0] as const).filter(([, n]) => n > 0);
    const unita = [...conta(p.presenze).map(([r, n]) => quante(n, r)), ...conta(p.fisse).map(([r, n]) => `${quante(n, r)} ${t('scheda.fisse')}`)];
    return { id: s.id, tipo: s.tipo, situazione: liv !== null ? PAROLE[liv] ?? null : null, unita, citato: p.citato === s.id };
  };
  useLayoutEffect(() => {
    const el = contenitore.current;
    if (!el) return;
    const rifai = () => disponi(el);
    const ro = new ResizeObserver(rifai); ro.observe(el);
    void document.fonts?.ready.then(rifai);
    return () => ro.disconnect();
  }, []);

  return (
    <div className={`mappa${atmosfera.notte ? ' notte' : ''}${p.buio ? ' buio' : ''}`} ref={contenitore} data-vuota={p.vuota ? 'si' : undefined} data-mappa={conWebgl ? 'webgl' : 'html'} data-pronta={pronta ? 'si' : 'no'} aria-label="Mappa tattica">
      {p.home && <TastoHome vai={p.home} angolo={angolo} />}
      {/* C20-07: segni di una chiamata senza settore (squadre dalla centrale), al centro in basso della mappa */}
      {(p.segni ?? []).some((x) => !x.settore) && (
        <span className="segni-effetto centrale" role="status">
          {(p.segni ?? []).filter((x) => !x.settore).map((x, i) => (
            <span key={`${x.tipo}-${i}`} className={`segno-effetto ${x.tipo} ${x.verso}`} data-segno={`:${x.tipo}:${x.verso}`} aria-label={`Centrale: ${parolaSegno(x)}`}>{simboloSegno(x)}</span>
          ))}
        </span>
      )}
      {conWebgl && <Suspense fallback={null}><StratoPixi contenitore={contenitore} punti={punti} margine={margine} atmosfera={atmosfera} folla={folla} citato={p.citato} pronto={() => setPronta(true)} /></Suspense>}
      {settori.map((s) => {
        const liv = p.tensione ? livello(p.tensione[s.id] ?? 0) : null;
        const lato = s.pos.x < 30 ? 'sinistra' : s.pos.x > 70 ? 'destra' : 'centro';
        const qui = Object.entries(p.presenze ?? {}).map(([r, ps]) => [r, ps[s.id] ?? 0] as const).filter(([, n]) => n > 0);
        const fisse = Object.entries(p.fisse ?? {}).map(([r, ps]) => [r, ps[s.id] ?? 0] as const).filter(([, n]) => n > 0);
        const nome = t(`settore.${s.id}`);
        return (
          <div key={s.id} ref={posiziona(s.pos.x, s.pos.y)} data-settore={s.id}
            className={`settore lato-${lato}${accesi.has(s.id) ? ' acceso' : ''}${liv !== null ? ` liv-${liv}` : ''}${p.vietati?.includes(s.id) ? ' vietato' : ''}${p.spenti?.includes(s.id) ? ' spento' : ''}`} data-vietato={p.vietati?.includes(s.id) ? 'si' : undefined}>
            <button type="button" className="settore-punto" disabled={(!p.onSettore && !schede) || (!!p.mossa && !p.mossa.ammessi.includes(s.id))} onClick={() => (p.onSettore ? p.onSettore(s.id) : setAperto((x) => (x === s.id ? null : s.id)))}
              aria-haspopup={schede ? 'dialog' : undefined} aria-expanded={schede ? aperto === s.id : undefined}
              aria-label={`${p.mossa?.ammessi.includes(s.id) ? `${t('mossa.porta_qui')}: ` : ''}${nome}${liv !== null ? `, situazione ${PAROLE[liv]}` : ''}${qui.length ? `, ${qui.map(([r, n]) => quante(n, r)).join(', ')}` : ''}`} />
            <span className="settore-nome" aria-hidden="true">{nome}</span>
            {(p.segni ?? []).some((x) => x.settore === s.id) && (
              <span className="segni-effetto" role="status">
                {(p.segni ?? []).filter((x) => x.settore === s.id).map((x, i) => (
                  <span key={`${x.tipo}-${i}`} className={`segno-effetto ${x.tipo} ${x.verso}`} data-segno={`${x.settore}:${x.tipo}:${x.verso}`} aria-label={`${nome}: ${parolaSegno(x)}`}>
                    {simboloSegno(x)}
                  </span>
                ))}
              </span>
            )}
            {(qui.length > 0 || fisse.length > 0) && (
              <span className="settore-unita">
                {fisse.map(([r, n]) => (
                  <span key={`f-${r}`} className="tocco-pastiglia" data-fissa={`${r}@${s.id}`} role="img" aria-label={`${quante(n, r)} ${n === 1 ? 'montata' : 'montate'}, restano fino a fine serata`}>
                    <span className="pastiglia fissa"><Icona di={Lock} /><Icona di={iconaRisorsa(r)} />{n}</span>
                  </span>
                ))}
                {qui.map(([r, n]) => (
                  <button key={r} type="button" className={`${spento('C05R05') ? 'pastiglia-rossa' : 'tocco-pastiglia'}${p.mossa?.inMano === `${r}@${s.id}` ? ' in-mano' : ''}`} data-presenza={`${r}@${s.id}`}
                    disabled={!p.onTogli || (!!p.mossa && !p.mossa.spostabili.includes(`${r}@${s.id}`))} aria-pressed={p.mossa ? p.mossa.inMano === `${r}@${s.id}` : undefined}
                    aria-label={p.mossa ? `${t('mossa.sposta')} ${t(`risorsa.${r}`)} da ${nome}` : `ritira ${t(`risorsa.${r}`)} da ${nome}`} onClick={() => p.onTogli?.(r, s.id)}>
                    <span className="pastiglia"><Icona di={iconaRisorsa(r)} />{n}</span>
                  </button>
                ))}
              </span>
            )}
          </div>
        );
      })}
      {p.radio && <RadioMappa settori={settori} segni={p.segni ?? []} home={p.home ? angolo : null}>{p.radio}</RadioMappa>}
      {schede && aperto && settori.some((s) => s.id === aperto) && (() => { const s = settori.find((x) => x.id === aperto)!; return <SchedaSettore s={statoDi(s)} folla={p.vuota ? null : rigaFolla(s, folla)} chiudi={chiudiScheda} />; })()}
    </div>
  );
}
