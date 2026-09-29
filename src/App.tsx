// Platzhalter bis Phase 4: Grund-Design plus echter Lernstand aus IndexedDB (Kopfzeilen-Marke).
import { useEffect, useState } from 'preact/hooks';
import vokabeln from 'virtual:vokabeln';
import { heute } from './logik/datum.ts';
import { baueRunde, kartenFuer } from './logik/karten.ts';
import { neueHeute, neueLimit } from './logik/stand.ts';
import type { Stand } from './speicher/schema.ts';
import {
  dauerhaftAnfragen,
  indexedDbAblage,
  laden,
  speicherAblage,
  type LadeHinweis,
} from './speicher/speicher.ts';

function offenHeute(stand: Stand): number {
  const tag = heute();
  return baueRunde({
    karten: kartenFuer(vokabeln, stand.einstellungen),
    fortschritt: stand.karten,
    tag,
    neueLimit: neueLimit(stand, tag),
    neueHeute: neueHeute(stand, tag),
  }).length;
}

export function App() {
  const [geladen, setGeladen] = useState<{ stand: Stand; hinweis: LadeHinweis } | null>(null);

  useEffect(() => {
    // Ohne IndexedDB (z. B. manche privaten Modi) läuft die App mit flüchtigem Speicher weiter
    const ablage = typeof indexedDB === 'undefined' ? speicherAblage() : indexedDbAblage();
    void laden(ablage).then(setGeladen);
    void dauerhaftAnfragen();
  }, []);

  const offen = geladen ? offenHeute(geladen.stand) : null;

  return (
    <div class="app">
      <header class="kopf">
        <h1 class="kopf__titel">Слово за слово</h1>
        {offen !== null && (
          <span class="marke" data-testid="marke-offen">
            {offen > 0 ? `${offen} heute offen` : 'Heute erledigt'}
          </span>
        )}
      </header>
      <main class="inhalt">
        {geladen?.hinweis === 'wiederhergestellt' && (
          <p role="status">
            Der letzte Lernstand war beschädigt. Der vorherige wurde wiederhergestellt.
          </p>
        )}
        {geladen?.hinweis === 'zurueckgesetzt' && (
          <p role="status">Der gespeicherte Lernstand war beschädigt und wurde zurückgesetzt.</p>
        )}
        <article class="karte" aria-label="Beispielkarte">
          <p class="karte__meta">
            <span>Begrüßung &amp; Höflichkeit</span> · <span class="karte__typ">Wort</span>
          </p>
          <p class="karte__frage" lang="ru">
            Привет!
          </p>
          <hr class="karte__trenner" />
          <p class="karte__loesung">Hallo! (informell)</p>
        </article>
      </main>
    </div>
  );
}
