// D-241 idea B, «una mossa per chiamata»: nella risposta (dopo «Conferma», prima della chiamata dopo) la mappa si tocca per
// spostare UNA unità: tocco sull'unità (badge), poi sul settore dove portarla (anche da tastiera: Invio sui due pulsanti; Esc
// lascia l'unità). Facoltativa: «Avanti» senza mossa resta il default. L'indicazione sta nel riquadro radio sopra la mappa
// (radio-mappa.tsx), quindi la pagina non si allunga. Rosso C241M02: la mappa non si tocca fra le chiamate.
import { useEffect, useState } from 'react';
import { spento } from '../interruttori.ts';
import { settoriAmmessi, type InCorso } from '../logica/missione.ts';
import { mossaPossibile, sposta, spostabili, turnoMossa } from '../logica/mossa.ts';
import type { Missione } from '../logica/tipi.ts';
import { t } from './dati.ts';
import type { MappaProps } from './mappa/Mappa.tsx';

type PropsMossa = Pick<MappaProps, 'onTogli' | 'onSettore' | 'mossa'>;

export function useMossa(p: { m: Missione | null; ic: InCorso | null; attiva: boolean; icOra: () => InCorso | null; conIc: (ic: InCorso) => unknown }) {
  const [inMano, setInMano] = useState<{ risorsa: string; settore: string } | null>(null);
  const pausa = p.ic ? `${p.ic.ondata}:${p.ic.scelte.length}` : '';
  useEffect(() => setInMano(null), [pausa, p.attiva]);
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
    p.conIc(sposta(m, ora, { risorsa: inMano.risorsa, da: inMano.settore, a }));
    setInMano(null);
  };
  const mappa: PropsMossa = possibile ? {
    onTogli: (r, s) => setInMano((x) => (x && x.risorsa === r && x.settore === s ? null : { risorsa: r, settore: s })),
    onSettore: muovi,
    mossa: { spostabili: spostabili(m, ic).map((x) => `${x.risorsa}@${x.settore}`), inMano: inMano && `${inMano.risorsa}@${inMano.settore}`,
      ammessi: inMano ? settoriAmmessi(m, inMano.risorsa).filter((k) => k !== inMano.settore) : [] },
  } : {};
  const stato = fatta && !possibile ? 'fatta' : inMano ? 'dove' : 'puoi';
  const indicazione = <p className="mossa-indicazione" data-mossa={stato}>{t(`mossa.${stato}`)}</p>;
  return { mappa, indicazione };
}
