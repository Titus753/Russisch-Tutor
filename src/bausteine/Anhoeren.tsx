import { spiele, type Sprechbar } from '../audio/wiedergabe.ts';
import { useApp } from '../app/kontext.ts';
import { IconLautsprecher } from './Icons.tsx';

export const KEINE_STIMME =
  'Aussprache nicht verfügbar. Unter „Mehr“ steht, wie du eine russische Stimme installierst.';

/** Anhören-Knopf für eine russische Zeile; optional „Langsam". */
export function Anhoeren({
  ziel,
  langsam = false,
  label,
}: {
  ziel: Sprechbar;
  langsam?: boolean;
  label?: string;
}) {
  const { zeigeHinweis } = useApp();
  const abspielen = async () => {
    if ((await spiele(ziel, langsam)) === 'keine-stimme') zeigeHinweis(KEINE_STIMME);
  };
  return (
    <button type="button" class="knopf knopf--klein" onClick={() => void abspielen()}>
      <IconLautsprecher />
      {label ?? (langsam ? 'Langsam' : 'Anhören')}
    </button>
  );
}

/** Liest automatisch vor, wenn die Einstellung „Automatisch vorlesen" aktiv ist. */
export function vorlesenWennAktiv(aktiv: boolean, ziel: Sprechbar) {
  if (aktiv) void spiele(ziel);
}
