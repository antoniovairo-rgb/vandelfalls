// D-241 idea B, «una mossa per chiamata»: nella risposta (dopo «Conferma», prima della chiamata dopo) la mappa si tocca per
// spostare UNA unità: tocco sull'unità (badge), poi sul settore dove portarla (anche da tastiera: Invio sui due pulsanti; Esc
// lascia l'unità). Facoltativa: «Avanti» senza mossa resta il default. L'indicazione sta nel riquadro radio sopra la mappa
// (radio-mappa.tsx), quindi la pagina non si allunga. Rosso C241M02: la mappa non si tocca fra le chiamate.
import { useEffect, useState, type ReactNode } from 'react';
import { spento } from '../interruttori.ts';
import { settoriAmmessi, type InCorso } from '../logica/missione.ts';
import { mossaPossibile, sposta, spostabili, turnoMossa } from '../logica/mossa.ts';
import { effettoMossa, type EffettoMossa } from '../logica/previsione.ts';
import type { Missione } from '../logica/tipi.ts';
import { dichiarate, t } from './dati.ts';
import type { Segno } from './mappa/segni.ts';
import type { MappaProps } from './mappa/Mappa.tsx';

type PropsMossa = Pick<MappaProps, 'onTogli' | 'onSettore' | 'mossa'>;

export function useMossa(p: { m: Missione | null; ic: InCorso | null; attiva: boolean; icOra: () => InCorso | null; conIc: (ic: InCorso) => unknown }) {
  const [inMano, setInMano] = useState<{ risorsa: string; settore: string } | null>(null);
  // D-262: l'effetto previsto della mossa fatta (settore lasciato e coperto), finché resta questa pausa
  const [effetto, setEffetto] = useState<EffettoMossa[] | null>(null);
  const pausa = p.ic ? `${p.ic.ondata}:${p.ic.scelte.length}` : '';
  useEffect(() => { setInMano(null); setEffetto(null); }, [pausa, p.attiva]);
  useEffect(() => {
    if (!inMano) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setInMano(null); };
    addEventListener('keydown', esc);
    return () => removeEventListener('keydown', esc);
  }, [inMano]);
  if (!p.attiva || !p.m || !p.ic || spento('C241M02')) return null;
  const m = p.m, ic = p.ic, turno = turnoMossa(m, ic);
  if (turno === null) return null;
  const possibile = mossaPossibile(m, ic), fatta = (ic.mosse ?? []).includes(turno);
  const muovi = (a: string) => {
    const ora = p.icOra();
    if (!inMano || !ora || !mossaPossibile(m, ora)) return;
    const mossa = { risorsa: inMano.risorsa, da: inMano.settore, a }, dopo = sposta(m, ora, mossa);
    p.conIc(dopo);
    setEffetto(effettoMossa(m, ora, dopo, mossa, dichiarate));
    setInMano(null);
    // C56-05 (D-268): dopo la mossa il fuoco va su «Avanti» (prima finiva su «i» in cima: da tastiera si ripassava tutta
    // l'intestazione). Rosso C268F01: il fuoco resta dove lo mette il browser.
    if (!spento('C268F01')) requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-azione="continua"]')?.focus({ preventScroll: true }));
  };
  const mappa: PropsMossa = possibile ? {
    onTogli: (r, s) => setInMano((x) => (x && x.risorsa === r && x.settore === s ? null : { risorsa: r, settore: s })),
    onSettore: muovi,
    mossa: { spostabili: spostabili(m, ic).map((x) => `${x.risorsa}@${x.settore}`), inMano: inMano && `${inMano.risorsa}@${inMano.settore}`,
      ammessi: inMano ? settoriAmmessi(m, inMano.risorsa).filter((k) => k !== inMano.settore) : [] },
  // D-262: dopo la mossa il riquadro tiene solo l'indicazione e la previsione (compatto, il costo va nella risposta, D-258):
  // col rapporto intero la previsione era tagliata dal riquadro (alto al più metà mappa). Rosso C262E01: come prima.
  } : fatta && !spento('C262E01') ? { mossa: { spostabili: [], inMano: null, ammessi: [], fatta: true } } : {};
  const stato = fatta && !possibile ? 'fatta' : inMano ? 'dove' : 'puoi';
  // D-262: dopo la mossa, la riga della previsione e i segni ▲/▼ sui due settori (niente segno dove non cambia)
  const cambi = stato === 'fatta' ? (effetto ?? []).filter((e) => e.verso !== 'pari') : [];
  const riga = stato !== 'fatta' || !effetto?.length ? null : cambi.length
    ? `${t('mossa.previsione')} ${cambi.map((e) => `${t(`settore.${e.settore}`)} ${t(e.verso === 'su' ? 'mossa.si_scalda' : 'mossa.si_calma')}`).join(', ')}.`
    : t('mossa.non_cambia');
  const testo = t(stato === 'puoi' && spento('C268M01') ? 'mossa.puoi_c56' : `mossa.${stato}`); // C56-04: «un'unità», non «una squadra»; rosso C268M01: come prima
  const indicazione = <p className="mossa-indicazione" data-mossa={stato}>{testo}{riga && <> <span data-previsione={cambi.map((e) => `${e.settore}:${e.verso}`).join(' ')}>{riga}</span></>}</p>;
  const segni: Segno[] = cambi.map((e) => ({ settore: e.settore, tipo: 'tensione', verso: e.verso as 'su' | 'giu' }));
  // C57-02 e D-269 punto a: se il riquadro non trova posto («muto»), istruzione e previsione si leggono sotto la mappa (come il
  // costo, D-258), mai solo al lettore di schermo: nessuno stato lascia il giocatore senza istruzione. Nella misura di adatta.ts
  // (C57-01) la copia porta il testo più lungo fra gli stati possibili («riserva»), così la mappa non cambia altezza.
  // Rossi: C269P01 niente previsione nella copia; C269I01 niente istruzione (solo la previsione, come in 614c5103).
  let sotto: ReactNode = null;
  const conPrev = !spento('C269P01') && !spento('C262E01'), conIstr = !spento('C269I01');
  if ((conPrev || conIstr) && (possibile || riga)) {
    const unisci = (...xs: string[]) => xs.filter(Boolean).join(' ');
    const verbo = t('mossa.si_scalda').length >= t('mossa.si_calma').length ? t('mossa.si_scalda') : t('mossa.si_calma');
    const prevLunga = !conPrev ? '' : spostabili(m, ic).flatMap((x) => settoriAmmessi(m, x.risorsa).filter((k) => k !== x.settore)
      .map((a) => `${t('mossa.previsione')} ${t(`settore.${x.settore}`)} ${verbo}, ${t(`settore.${a}`)} ${verbo}.`)).reduce((a, b) => (b.length > a.length ? b : a), t('mossa.non_cambia'));
    const ora = unisci(conIstr ? testo : '', conPrev && riga ? riga : '');
    const riserva = !possibile ? ora : [conIstr ? t('mossa.puoi') : '', conIstr ? t('mossa.dove') : '', unisci(conIstr ? t('mossa.fatta') : '', prevLunga)].reduce((a, b) => (b.length > a.length ? b : a), ora);
    sotto = (
      <p className="istruzione-sotto" data-istruzione-sotto={ora ? 'vera' : 'vuota'} aria-hidden="true">
        <span className="vera">{conIstr && testo}{conIstr && conPrev && riga ? ' ' : ''}{conPrev && riga && <span data-previsione-sotto>{riga}</span>}</span>
        <span className="riserva">{riserva}</span>
      </p>
    );
  }
  return { mappa, indicazione, segni, sotto };
}
