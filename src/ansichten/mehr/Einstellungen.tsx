import { useApp } from '../../app/kontext.ts';
import {
  Abschnitt,
  ChipAuswahl,
  ChipMehrfach,
  Schalter,
  Unterseite,
} from '../../bausteine/Bedienelemente.tsx';
import { INHALTSARTEN, THEMEN, type Inhaltsart, type ThemaId } from '../../daten/themen.ts';
import type { Einstellungen as E } from '../../speicher/schema.ts';

export function Einstellungen({ onZurueck }: { onZurueck: () => void }) {
  const { stand, aendere, zeigeHinweis, starteTutorial } = useApp();
  const e = stand.einstellungen;
  const setze = <K extends keyof E>(schluessel: K, wert: E[K]) =>
    aendere((s) => ({ ...s, einstellungen: { ...s.einstellungen, [schluessel]: wert } }));

  /** Umschalten in einer Liste; mindestens ein Eintrag muss aktiv bleiben. */
  const umschalten = <T extends string>(
    liste: readonly T[],
    wert: T,
    alle: readonly T[],
    was: string,
  ) => {
    if (liste.includes(wert)) {
      if (liste.length === 1) {
        zeigeHinweis(`Mindestens ${was} muss aktiv bleiben.`);
        return null;
      }
      return liste.filter((x) => x !== wert);
    }
    return alle.filter((x) => x === wert || liste.includes(x));
  };

  const themenIds = THEMEN.map((t) => t.id);
  const artenIds = INHALTSARTEN.map((a) => a.id);

  return (
    <Unterseite titel="Einstellungen" onZurueck={onZurueck}>
      <Abschnitt titel="Themen">
        <div class="aktionen aktionen--reihe">
          <button
            type="button"
            class="knopf knopf--klein"
            onClick={() => setze('themen', [...themenIds])}
          >
            Alle wählen
          </button>
        </div>
        <ChipMehrfach<ThemaId>
          label="Themen"
          optionen={THEMEN.map((t) => [t.id, t.name] as const)}
          gewaehlt={e.themen}
          onUmschalten={(id) => {
            const neu = umschalten(e.themen, id, themenIds, 'ein Thema');
            if (neu) setze('themen', neu);
          }}
        />
      </Abschnitt>

      <Abschnitt titel="Inhaltsarten">
        <ChipMehrfach<Inhaltsart>
          label="Inhaltsarten"
          optionen={INHALTSARTEN.map((a) => [a.id, a.name] as const)}
          gewaehlt={e.inhaltsarten}
          onUmschalten={(id) => {
            const neu = umschalten(e.inhaltsarten, id, artenIds, 'eine Inhaltsart');
            if (neu) setze('inhaltsarten', neu);
          }}
        />
      </Abschnitt>

      <Abschnitt titel="Abfragerichtung">
        <ChipAuswahl
          label="Abfragerichtung"
          optionen={[
            ['de-ru', 'Deutsch → Russisch'],
            ['ru-de', 'Russisch → Deutsch'],
            ['gemischt', 'Gemischt'],
          ]}
          wert={e.richtung}
          onWahl={(w) => setze('richtung', w)}
        />
        <p class="kleingedruckt">Beim Tippen wird immer Deutsch → Russisch abgefragt.</p>
      </Abschnitt>

      <Abschnitt titel="Neue Karten pro Tag">
        <ChipAuswahl
          label="Neue Karten pro Tag"
          optionen={[
            [10, '10'],
            [20, '20'],
            [30, '30'],
            [50, '50'],
          ]}
          wert={e.neueProTag}
          onWahl={(w) => setze('neueProTag', w)}
        />
      </Abschnitt>

      <Abschnitt titel="Aussprache">
        <Schalter
          label="Automatisch vorlesen"
          beschreibung="Beim Aufdecken einer Karte das Russische abspielen"
          an={e.vorlesen}
          onWechsel={(an) => setze('vorlesen', an)}
        />
        <p class="kleingedruckt">
          Die Aufnahmen sind in der App enthalten. Nur falls eine fehlt, nutzt die App eine
          russische Stimme deines Geräts – ausschließlich lokal. Stimme installieren – iPhone:
          Einstellungen → Bedienungshilfen → Gesprochene Inhalte → Stimmen → Russisch. Android:
          Einstellungen → System → Sprache → Text-in-Sprache → Sprachdaten installieren → Russisch.
        </p>
      </Abschnitt>

      <Abschnitt titel="Eingabe beim Tippen">
        <ChipAuswahl
          label="Eingabeart"
          optionen={[
            ['app', 'App-Tastatur'],
            ['system', 'Systemtastatur'],
          ]}
          wert={e.eingabe}
          onWahl={(w) => setze('eingabe', w)}
        />
      </Abschnitt>

      <Abschnitt titel="Darstellung">
        <p class="feldtitel">Schriftgröße</p>
        <ChipAuswahl
          label="Schriftgröße"
          optionen={[
            ['klein', 'Klein'],
            ['normal', 'Normal'],
            ['gross', 'Groß'],
            ['sehr-gross', 'Sehr groß'],
          ]}
          wert={e.schrift}
          onWahl={(w) => setze('schrift', w)}
        />
        <p class="feldtitel">Farbmodus</p>
        <ChipAuswahl
          label="Farbmodus"
          optionen={[
            ['system', 'System'],
            ['hell', 'Hell'],
            ['dunkel', 'Dunkel'],
          ]}
          wert={e.farbmodus}
          onWahl={(w) => setze('farbmodus', w)}
        />
        <Schalter
          label="Hoher Kontrast"
          an={e.kontrast}
          onWechsel={(an) => setze('kontrast', an)}
        />
      </Abschnitt>

      <Abschnitt titel="Einführung">
        <button type="button" class="knopf" onClick={starteTutorial}>
          Einführung erneut starten
        </button>
      </Abschnitt>
    </Unterseite>
  );
}
