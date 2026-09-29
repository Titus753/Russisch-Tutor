import { useApp } from '../app/kontext.ts';

/** „Mehr": bis Phase 6 nur die Eingabeart; Alphabet, Einstellungen, Fortschritt folgen. */
export function Mehr() {
  const { stand, aendere } = useApp();
  const eingabe = stand.einstellungen.eingabe;
  const setze = (wert: 'app' | 'system') =>
    aendere((s) => ({ ...s, einstellungen: { ...s.einstellungen, eingabe: wert } }));

  return (
    <section class="ansicht" aria-labelledby="titel-mehr">
      <h2 id="titel-mehr" class="nur-sr">
        Mehr
      </h2>
      <div class="abschnitt">
        <h3 class="abschnitt__titel">Eingabe beim Tippen</h3>
        <div class="chips" role="radiogroup" aria-label="Eingabeart">
          {(
            [
              ['app', 'App-Tastatur'],
              ['system', 'Systemtastatur'],
            ] as const
          ).map(([wert, label]) => (
            <button
              key={wert}
              type="button"
              role="radio"
              aria-checked={eingabe === wert}
              class="chip"
              onClick={() => setze(wert)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div class="abschnitt">
        <h3 class="abschnitt__titel">Aussprache</h3>
        <p>
          Die Aufnahmen sind in der App enthalten. Nur falls eine fehlt, nutzt die App eine
          russische Stimme deines Geräts – ausschließlich lokal, nichts wird übertragen.
        </p>
        <p class="kleingedruckt">
          Russische Stimme installieren – iPhone: Einstellungen → Bedienungshilfen → Gesprochene
          Inhalte → Stimmen → Russisch. Android: Einstellungen → System → Sprache → Text-in-Sprache
          → Sprachdaten installieren → Russisch.
        </p>
      </div>
      <div class="abschnitt">
        <h3 class="abschnitt__titel">Bald hier</h3>
        <p>Alphabet, Einstellungen, Fortschritt, Sicherung und Datenschutz.</p>
      </div>
    </section>
  );
}
