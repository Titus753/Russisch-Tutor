import baer from 'virtual:baer';
import { useEffect, useMemo, useRef } from 'preact/hooks';
import { spieleFolge } from '../audio/wiedergabe.ts';
import { begruessung } from '../logik/begruessung.ts';
import { Baer } from './Baer.tsx';
import { IconLautsprecher } from './Icons.tsx';

/** Zuletzt gezeigter zweiter Satz (pro Sitzung), damit er wechselt. */
let letzterSatz: string | undefined;

/** Kurze Begrüßung durch Mischa beim Öffnen der App. */
export function Willkommen({ onEnde }: { onEnde: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const los = useRef<HTMLButtonElement>(null);
  const saetze = useMemo(() => {
    const auswahl = begruessung(baer, new Date(), letzterSatz);
    letzterSatz = auswahl[1].id;
    return auswahl;
  }, []);
  const sprechen = () => void spieleFolge(saetze);

  useEffect(() => {
    const d = dialog.current;
    if (d && !d.open) d.showModal();
    los.current?.focus();
    // Automatisch sprechen, sofern der Browser es erlaubt (sonst beim Antippen)
    sprechen();
    const beiAbbruch = (e: Event) => {
      e.preventDefault();
      onEnde();
    };
    d?.addEventListener('cancel', beiAbbruch);
    return () => d?.removeEventListener('cancel', beiAbbruch);
  }, []);

  return (
    <dialog ref={dialog} class="willkommen" aria-labelledby="willkommen-titel">
      <button
        type="button"
        class="willkommen__baer"
        onClick={sprechen}
        aria-label="Mischa sprechen lassen"
      >
        <Baer />
      </button>
      <div class="sprechblase">
        {saetze.map((s, i) => (
          <div key={s.id}>
            <p class="sprechblase__ru" lang="ru" id={i === 0 ? 'willkommen-titel' : undefined}>
              {s.betonung ?? s.russisch}
            </p>
            <p class="sprechblase__de">{s.deutsch}</p>
          </div>
        ))}
      </div>
      <div class="aktionen aktionen--reihe">
        <button type="button" class="knopf" onClick={sprechen}>
          <IconLautsprecher />
          Anhören
        </button>
        <button ref={los} type="button" class="knopf knopf--haupt" onClick={onEnde}>
          Los geht’s
        </button>
      </div>
    </dialog>
  );
}
