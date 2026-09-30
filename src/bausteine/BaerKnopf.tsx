import { useState } from 'preact/hooks';
import { spieleFolge, type Sprechbar } from '../audio/wiedergabe.ts';
import { useApp } from '../app/kontext.ts';
import { KEINE_STIMME } from './Anhoeren.tsx';
import { Baer } from './Baer.tsx';
import { IconLautsprecher } from './Icons.tsx';

/**
 * Mischa als Schaltfläche: Antippen lässt ihn sprechen. Browser erlauben Ton erst nach einer
 * Nutzeraktion – deshalb spricht er bewusst nur auf Antippen, überall gleich zuverlässig.
 */
export function BaerKnopf({ saetze, groesse }: { saetze: readonly Sprechbar[]; groesse?: number }) {
  const { zeigeHinweis } = useApp();
  const [angetippt, setAngetippt] = useState(false);
  const [spricht, setSpricht] = useState(false);

  const sprechen = async () => {
    setAngetippt(true);
    setSpricht(true);
    try {
      if ((await spieleFolge(saetze)) === 'keine-stimme') zeigeHinweis(KEINE_STIMME);
    } finally {
      setSpricht(false);
    }
  };

  return (
    <div class="baerknopf">
      <p class="baerknopf__hinweis" aria-live="polite">
        {spricht
          ? 'Mischa spricht …'
          : angetippt
            ? 'Nochmal tippen, dann sagt er es noch einmal.'
            : 'Tippe auf Mischa – er sagt dir Hallo!'}
      </p>
      <button
        type="button"
        class={`baerknopf__knopf${angetippt ? '' : ' baerknopf__knopf--lockt'}${spricht ? ' baerknopf__knopf--spricht' : ''}`}
        aria-label="Mischa antippen – er spricht"
        onClick={() => void sprechen()}
      >
        <Baer {...(groesse ? { groesse } : {})} />
        <span class="baerknopf__abzeichen" aria-hidden="true">
          <IconLautsprecher />
        </span>
      </button>
    </div>
  );
}
