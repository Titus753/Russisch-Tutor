import baer from 'virtual:baer';
import { useEffect, useMemo, useRef } from 'preact/hooks';
import { begruessung } from '../logik/begruessung.ts';
import { BaerKnopf } from './BaerKnopf.tsx';

/** Zuletzt gezeigter zweiter Satz (pro Sitzung), damit er wechselt. */
let letzterSatz: string | undefined;

/** Kurze Begrüßung durch Mischa beim Öffnen der App. Er spricht, wenn man ihn antippt. */
export function Willkommen({ onEnde }: { onEnde: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const saetze = useMemo(() => {
    const auswahl = begruessung(baer, new Date(), letzterSatz);
    letzterSatz = auswahl[1].id;
    return auswahl;
  }, []);

  useEffect(() => {
    const d = dialog.current;
    if (d && !d.open) d.showModal();
    // Fokus auf Mischa: Enter/Leertaste lässt ihn sprechen
    d?.querySelector<HTMLButtonElement>('.baerknopf__knopf')?.focus();
    const beiAbbruch = (e: Event) => {
      e.preventDefault();
      onEnde();
    };
    d?.addEventListener('cancel', beiAbbruch);
    return () => d?.removeEventListener('cancel', beiAbbruch);
  }, []);

  return (
    <dialog ref={dialog} class="willkommen" aria-labelledby="willkommen-titel">
      <BaerKnopf saetze={saetze} />
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
      <button type="button" class="knopf knopf--haupt knopf--breit" onClick={onEnde}>
        Los geht’s
      </button>
    </dialog>
  );
}
