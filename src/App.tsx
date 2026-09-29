import { useEffect, useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { Auswahl } from './ansichten/Auswahl.tsx';
import { Karten, rundeFuer } from './ansichten/Karten.tsx';
import { Mehr } from './ansichten/Mehr.tsx';
import { Tippen } from './ansichten/Tippen.tsx';
import { Kontext, type AppKontext } from './app/kontext.ts';
import { beobachteSichtbereich } from './app/sichtbereich.ts';
import { IconHoeren, IconKarten, IconMehr, IconQuiz, IconTippen } from './bausteine/Icons.tsx';
import type { Stand } from './speicher/schema.ts';
import {
  dauerhaftAnfragen,
  erstelleSpeicherer,
  indexedDbAblage,
  laden,
  speicherAblage,
  type LadeHinweis,
} from './speicher/speicher.ts';

type Tab = 'karten' | 'quiz' | 'tippen' | 'hoeren' | 'mehr';

const TABS: { id: Tab; label: string; icon: () => JSX.Element }[] = [
  { id: 'karten', label: 'Karten', icon: IconKarten },
  { id: 'quiz', label: 'Quiz', icon: IconQuiz },
  { id: 'tippen', label: 'Tippen', icon: IconTippen },
  { id: 'hoeren', label: 'Hören', icon: IconHoeren },
  { id: 'mehr', label: 'Mehr', icon: IconMehr },
];

const LADE_HINWEIS: Partial<Record<LadeHinweis, string>> = {
  wiederhergestellt: 'Der letzte Lernstand war beschädigt. Der vorherige wurde wiederhergestellt.',
  zurueckgesetzt: 'Der gespeicherte Lernstand war beschädigt und wurde zurückgesetzt.',
};

export function App() {
  const [stand, setStand] = useState<Stand | null>(null);
  const [ladeHinweis, setLadeHinweis] = useState<LadeHinweis | null>(null);
  const [tab, setTab] = useState<Tab>('karten');
  const [tippt, setTippt] = useState(false);
  const [hinweis, setHinweis] = useState<{ text: string; nr: number } | null>(null);
  const speicherer = useRef<ReturnType<typeof erstelleSpeicherer> | null>(null);
  const standRef = useRef<Stand | null>(null);

  useEffect(() => {
    // Ohne IndexedDB (z. B. manche privaten Modi) läuft die App mit flüchtigem Speicher weiter
    const ablage = typeof indexedDB === 'undefined' ? speicherAblage() : indexedDbAblage();
    void laden(ablage).then((ergebnis) => {
      speicherer.current = erstelleSpeicherer(
        ablage,
        ergebnis.hinweis === 'ok' ? ergebnis.stand : null,
      );
      standRef.current = ergebnis.stand;
      setStand(ergebnis.stand);
      setLadeHinweis(ergebnis.hinweis);
    });
    void dauerhaftAnfragen();
    return beobachteSichtbereich();
  }, []);

  useEffect(() => {
    if (!hinweis) return;
    const t = setTimeout(() => setHinweis(null), 3500);
    return () => clearTimeout(t);
  }, [hinweis]);

  if (!stand) return <div class="app app--laedt" aria-busy="true" />;

  const kontext: AppKontext = {
    stand,
    aendere: (aenderung) => {
      const neu = aenderung(standRef.current ?? stand);
      standRef.current = neu;
      setStand(neu);
      speicherer.current?.speichern(neu).catch(() => {
        setHinweis({ text: 'Speichern fehlgeschlagen. Bitte die App neu laden.', nr: Date.now() });
      });
    },
    zeigeHinweis: (text) => setHinweis({ text, nr: Date.now() }),
    setTippt,
  };

  const offen = rundeFuer(stand).length;

  return (
    <Kontext.Provider value={kontext}>
      <div class={`app ${tippt ? 'app--tippt' : ''}`}>
        <header class="kopf">
          <h1 class="kopf__titel" lang="ru">
            Слово за слово
          </h1>
          <span class="marke" data-testid="marke-offen">
            {offen > 0 ? `${offen} heute offen` : 'Heute erledigt'}
          </span>
        </header>
        <main class="inhalt" id="inhalt">
          {ladeHinweis && LADE_HINWEIS[ladeHinweis] && (
            <p role="status" class="meldung meldung--falsch">
              {LADE_HINWEIS[ladeHinweis]}
            </p>
          )}
          {tab === 'karten' && <Karten />}
          {tab === 'quiz' && <Auswahl key="quiz" modus="quiz" />}
          {tab === 'tippen' && <Tippen />}
          {tab === 'hoeren' && <Auswahl key="hoeren" modus="hoeren" />}
          {tab === 'mehr' && <Mehr />}
        </main>
        <div class="toast" role="status" aria-live="polite">
          {hinweis && <p key={hinweis.nr}>{hinweis.text}</p>}
        </div>
        {!tippt && (
          <nav class="tabs" aria-label="Bereiche">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                class="tab"
                aria-current={tab === id ? 'page' : undefined}
                onClick={() => setTab(id)}
              >
                <Icon />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        )}
      </div>
    </Kontext.Provider>
  );
}
