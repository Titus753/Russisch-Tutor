// Platzhalter: zeigt das Grund-Design und die geprüften Vokabeldaten. Die Lernmodi folgen in Phase 4.
import vokabeln from 'virtual:vokabeln';

export function App() {
  return (
    <div class="app">
      <header class="kopf">
        <h1 class="kopf__titel">Слово за слово</h1>
        <span class="marke">{vokabeln.length} Einträge</span>
      </header>
      <main class="inhalt">
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
