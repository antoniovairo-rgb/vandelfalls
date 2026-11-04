// Fasi dell'ondata in corso (schieramento → chiamate → chiusura): cosa mostrano la testata, la mappa e la scena.
// Staccato da App.tsx (D-241, debito) a codice invariato: lo stato resta in App, qui arriva come contesto.
import type { ReactNode } from 'react';
import { spento } from '../interruttori.ts';
import { apriPausa } from '../logica/mossa.ts';
import { chiamateAperte, chiudiOndata, disponibili, rispondi, schiera, settoriAmmessi, type InCorso } from '../logica/missione.ts';
import type { Disposizione, Missione, Opzione } from '../logica/tipi.ts';
import { sospendi, valida, type InSospeso } from '../logica/sospesa.ts';
import type { Salvataggio } from '../salvataggi/salvataggio.ts';
import { dichiarate, t, testoSe } from './dati.ts';
import type { MappaProps } from './mappa/Mappa.tsx';
import { segniDi, type Segno } from './mappa/segni.ts';
import { faseDi, infoOndata } from './partita.ts';
import { Chiamata, Chiusura } from './schermate/Ondata.tsx';
import { Schieramento, usate } from './schermate/Schieramento.tsx';

export type TestataApp = { etichetta: string; titolo: string; info?: string | null };
export type ScenaApp = { nome: string; testata: TestataApp | null; mappa: Omit<MappaProps, 'm'> | null; corpo: ReactNode };
export type ContestoOndata = {
  m: Missione; ic: InCorso; titolo: ReactNode;
  bozza: Disposizione; scelta: string | null; avviso: string | null; riepilogoAperto: boolean; annulla: (() => void) | null;
  setScelta: (r: string | null) => void; setAvviso: (a: string | null) => void; setRiepilogoAperto: (aperto: boolean) => void;
  cambiaBozza: (d: Disposizione) => void; vola: (risorsa: string, settore: string) => void; mostraSegni: (xs: Segno[]) => void;
  setEco: (o: Opzione) => void; sospesa: { current: InSospeso | null }; icOra: () => InCorso | null;
  conIc: (ic: InCorso | null, extra?: Partial<Salvataggio>) => unknown; alRapporto: () => void;
};

export const libera = (m: Missione, ic: InCorso, d: Disposizione, preferita: string | null) => {
  const disp = disponibili(m, ic);
  const ok = (r: string) => (disp[r] ?? 0) - usate(d, r) > 0;
  return preferita && ok(preferita) ? preferita : Object.keys(disp).find(ok) ?? null;
};

export function scenaOndata(cx: ContestoOndata): ScenaApp {
  const { m, ic, bozza, scelta, avviso, icOra, conIc, vola } = cx;
  let mappa: Omit<MappaProps, 'm'> | null = null;
  let corpo: ReactNode;
  const f = faseDi(m, ic);
  let nome: string = f.tipo;
  const ondata = m.ondate[ic.ondata - 1];
  const cosa = f.tipo === 'chiamata' ? `chiamata ${f.numero}/${f.totale}` : f.tipo === 'chiusura' ? 'in corso' : 'schieramento';
  const testata = { etichetta: `Ondata ${ic.ondata}/${m.ondate.length} · ${cosa}`, titolo: f.tipo === 'schieramento' && ondata?.titolo ? t(ondata.titolo) : t(m.titolo), info: infoOndata(m, ic.ondata, testoSe) };
  if (f.tipo === 'schieramento') {
    // C-010 C09-04: l'unità scelta resta scelta anche quando è finita (prima si passava in silenzio alla
    // successiva e un tocco metteva uno steward al posto di una squadra); se è finita, avviso.
    // Interruttore rosso C10S04: torna il cambio automatico.
    const sel = spento('C10S04') || !scelta ? libera(m, ic, bozza, scelta) : scelta;
    const metti = (r: string, settore: string) => {
      if ((disponibili(m, ic)[r] ?? 0) - usate(bozza, r) <= 0) {
        cx.setAvviso(`${t(`risorsa.${r}`)}: finite. Tocca un'altra unità nel vassoio.`);
        return;
      }
      // Interruttore rosso C09S01: si accetta la risorsa ovunque (difetto: transenne sugli spalti).
      if (!spento('C09S01') && !settoriAmmessi(m, r).includes(settore)) {
        cx.setAvviso(`${t(`risorsa.${r}`)}: in «${t(`settore.${settore}`)}» non hanno effetto, qui non si montano.`);
        return;
      }
      cx.setAvviso(null);
      const d = structuredClone(bozza);
      d[r] = { ...(d[r] ?? {}), [settore]: (d[r]?.[settore] ?? 0) + 1 };
      cx.cambiaBozza(d); cx.setScelta(spento('C10S04') ? libera(m, ic, d, r) : r); vola(r, settore);
    };
    mappa = {
      tensione: ic.tensione, presenze: bozza, fisse: spento('C09S02') ? null : ic.fisse,
      vietati: sel && m.mappa.risorse[sel]?.fissa ? m.mappa.settori.map((x) => x.id).filter((x) => !settoriAmmessi(m, sel).includes(x)) : [],
      // C15-06: col riepilogo aperto la mappa è solo da guardare. Rosso C34R01: resta toccabile, come prima.
      ...(cx.riepilogoAperto && !spento('C34R01') ? {} : {
        onSettore: (s: string) => sel && metti(sel, s),
        // PO-054: il tocco su una pastiglia ritira UNA unità di quella risorsa da quel settore. Rosso C46R01: le ritira tutte.
        onTogli: (r: string, s: string) => cx.cambiaBozza({ ...bozza, [r]: { ...bozza[r], [s]: spento('C46R01') ? 0 : Math.max(0, (bozza[r]?.[s] ?? 0) - 1) } }),
      }),
    };
    corpo = <Schieramento riepilogoAperto={cx.setRiepilogoAperto} m={m} ic={ic} d={bozza} scelta={sel} avviso={avviso} scegli={(r) => { cx.setScelta(r); cx.setAvviso(null); }} metti={metti} azzera={() => cx.cambiaBozza({})} annulla={cx.annulla}
      conferma={() => { cx.setAvviso(null); const ora = icOra(); if (ora && !ora.disposizione && ora.ondata === ic.ondata) conIc(schiera(m, ora, bozza)); }} />;
  } else if (f.tipo === 'chiamata') {
    mappa = { tensione: ic.tensione, presenze: ic.disposizione, fisse: spento('C09S02') ? null : ic.fisse, accesi: f.chiamata.settore ? [f.chiamata.settore] : [], citato: f.chiamata.settore,
      // PO-152 (D-241, idea A): in chiamata la mappa è la fonte: un settore toccato apre la sua scheda di stato. Rosso C241M01:
      // mappa disattivata, come prima.
      ...(spento('C241M01') ? {} : { schede: true }) };
    const conferma = (o: string) => {
        const ora = icOra();
        if (!spento('C05R01') && (!ora || !chiamateAperte(m, ora).some((c) => c.id === f.chiamata.id))) return; // già risposta
        if (!ora) return;
        const risposta = rispondi(m, ora, f.chiamata.id, o, dichiarate), scelta0 = f.chiamata.opzioni.find((x) => x.id === o);
        // C56-02 (D-262): la pausa con la mossa che si apre a schermo si segna nel salvataggio (torna dopo una ricarica). Rosso C262R01: no
        const dopo = scelta0?.risposta && !spento('C262R01') ? apriPausa(m, risposta) : risposta;
        conIc(dopo);
        const scelta = f.chiamata.opzioni.find((x) => x.id === o)!;
        // PO-089: le squadre che la risposta impegna raggiungono il punto della chiamata. Rosso C32D01: no.
        if (f.chiamata.settore && !spento('C32D01')) for (const e of scelta.effetti) if ('riserva' in e && e.valore < 0) vola(e.riserva, f.chiamata.settore);
        cx.mostraSegni(segniDi(f.chiamata, scelta, ora, dopo)); // PO-085: la conseguenza sulla mappa, subito (C20-07: solo se cambia)
        if (scelta.risposta) cx.setEco(scelta);
    };
    // PO-148 (D-236): la risposta resta in sospeso (sospesa.ts) finché il giocatore non tocca «Conferma»; annullata non
    // lascia traccia. Rosso C107A01: vale subito, come prima.
    const chiamata = f.chiamata;
    corpo = <Chiamata key={chiamata.id} m={m} ic={ic} c={chiamata} numero={f.numero} totale={f.totale} rispondi={conferma}
      sospendi={spento('C107A01') ? undefined : (o) => { const ora = icOra(); if (!ora || !chiamateAperte(m, ora).some((c) => c.id === chiamata.id)) return false; cx.sospesa.current = sospendi(m, ora, chiamata.id, o); return true; }}
      decidi={(esito) => { const q = cx.sospesa.current, ora = icOra(); cx.sospesa.current = null; if (esito === 'confermata' && q && ora && valida(ora, q)) conferma(q.opzione); }} />;
  } else if (f.tipo === 'chiusura') {
    mappa = { tensione: ic.tensione, presenze: ic.disposizione, fisse: spento('C09S02') ? null : ic.fisse };
    corpo = <Chiusura m={m} ic={ic} chiudi={() => {
      const ora = icOra();
      if (!ora || faseDi(m, ora).tipo !== 'chiusura') return; // già chiusa (doppio tocco)
      const dopo = chiudiOndata(m, ora, dichiarate);
      conIc(dopo, { rapporto_aperto: dopo.rapporti.at(-1)!.n }); cx.alRapporto();
    }} />;
  } else { nome = 'titolo'; corpo = cx.titolo; }
  return { nome, testata, mappa, corpo };
}
