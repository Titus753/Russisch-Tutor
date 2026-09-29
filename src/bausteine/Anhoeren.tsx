import { sprich } from '../audio/wiedergabe.ts';
import { useApp } from '../app/kontext.ts';
import { IconLautsprecher } from './Icons.tsx';

/** Anhören-Knopf für eine russische Zeile; optional „Langsam". */
export function Anhoeren({
  text,
  langsam = false,
  label,
}: {
  text: string;
  langsam?: boolean;
  label?: string;
}) {
  const { zeigeHinweis } = useApp();
  const abspielen = async () => {
    if ((await sprich(text, langsam)) === 'keine-stimme') {
      zeigeHinweis('Keine russische Stimme auf diesem Gerät gefunden.');
    }
  };
  return (
    <button type="button" class="knopf knopf--klein" onClick={() => void abspielen()}>
      <IconLautsprecher />
      {label ?? (langsam ? 'Langsam' : 'Anhören')}
    </button>
  );
}

/** Liest automatisch vor, wenn die Einstellung „Automatisch vorlesen" aktiv ist. */
export function vorlesenWennAktiv(aktiv: boolean, text: string) {
  if (aktiv) void sprich(text);
}
