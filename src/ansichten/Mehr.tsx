import { useState } from 'preact/hooks';
import { useApp } from '../app/kontext.ts';
import { Alphabet } from './mehr/Alphabet.tsx';
import { Datenschutz } from './mehr/Datenschutz.tsx';
import { Einstellungen } from './mehr/Einstellungen.tsx';
import { Fortschritt } from './mehr/Fortschritt.tsx';
import { Sicherung } from './mehr/Sicherung.tsx';

type Seite = 'alphabet' | 'fortschritt' | 'einstellungen' | 'sicherung' | 'datenschutz';

const EINTRAEGE: { seite: Seite; titel: string; text: string }[] = [
  { seite: 'alphabet', titel: 'Alphabet', text: 'Alle 33 Buchstaben mit Aussprache und Übung' },
  { seite: 'fortschritt', titel: 'Fortschritt', text: 'Lernserie, fällige Karten, Stand je Thema' },
  {
    seite: 'einstellungen',
    titel: 'Einstellungen',
    text: 'Themen, Richtung, Schriftgröße, Farben',
  },
  { seite: 'sicherung', titel: 'Sicherung', text: 'Lernstand exportieren, importieren, löschen' },
  { seite: 'datenschutz', titel: 'Datenschutz', text: 'Was gespeichert wird – und was nicht' },
];

export function Mehr() {
  const { starteTutorial } = useApp();
  const [seite, setSeite] = useState<Seite | null>(null);
  const zurueck = () => setSeite(null);

  if (seite === 'alphabet') return <Alphabet onZurueck={zurueck} />;
  if (seite === 'fortschritt') return <Fortschritt onZurueck={zurueck} />;
  if (seite === 'einstellungen') return <Einstellungen onZurueck={zurueck} />;
  if (seite === 'sicherung') return <Sicherung onZurueck={zurueck} />;
  if (seite === 'datenschutz') return <Datenschutz onZurueck={zurueck} />;

  return (
    <section class="ansicht" aria-labelledby="titel-mehr">
      <h2 id="titel-mehr" class="nur-sr">
        Mehr
      </h2>
      <nav class="menue" aria-label="Weitere Bereiche">
        {EINTRAEGE.map((e) => (
          <button
            key={e.seite}
            type="button"
            class="menue__eintrag"
            onClick={() => setSeite(e.seite)}
          >
            <span class="menue__titel">{e.titel}</span>
            <span class="menue__text">{e.text}</span>
            <span class="menue__pfeil" aria-hidden="true">
              ›
            </span>
          </button>
        ))}
        <button type="button" class="menue__eintrag" onClick={starteTutorial}>
          <span class="menue__titel">Einführung ansehen</span>
          <span class="menue__text">Kurzer Rundgang durch die App</span>
          <span class="menue__pfeil" aria-hidden="true">
            ›
          </span>
        </button>
      </nav>
    </section>
  );
}
