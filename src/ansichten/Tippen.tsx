import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import vokabeln from 'virtual:vokabeln';
import { russischAnzeige } from '../app/anzeige.ts';
import { useApp } from '../app/kontext.ts';
import { Anhoeren } from '../bausteine/Anhoeren.tsx';
import { KartenText, Lernkarte } from '../bausteine/Lernkarte.tsx';
import { Tastatur } from '../bausteine/Tastatur.tsx';
import { heute } from '../logik/datum.ts';
import { kartenFuer, waehleUebungskarte, type Karte } from '../logik/karten.ts';
import { nachUebung } from '../logik/stand.ts';
import {
  abweichungen,
  MAX_EINGABE,
  pruefeEingabe,
  tipp,
  type Pruefergebnis,
} from '../logik/vergleich.ts';

interface Ergebnis {
  ergebnis: Pruefergebnis;
  ziel: string;
  /** Lösung wurde ohne Versuch aufgedeckt. */
  aufgegeben: boolean;
}

const MELDUNG: Record<Pruefergebnis, string> = {
  richtig: 'Richtig!',
  fast: 'Fast richtig – achte auf die markierten Buchstaben.',
  falsch: 'Leider falsch.',
};

/** Selbst eintippen, immer Deutsch → Russisch. */
export function Tippen() {
  const { stand, aendere, setTippt, zeigeHinweis } = useApp();
  const appTastatur = stand.einstellungen.eingabe === 'app';
  const karten = useMemo(
    () => kartenFuer(vokabeln, { ...stand.einstellungen, richtung: 'de-ru' }),
    [stand.einstellungen],
  );

  const [karte, setKarte] = useState<Karte | undefined>(() =>
    waehleUebungskarte(karten, stand.karten, undefined),
  );
  const [eingabe, setEingabe] = useState('');
  const [tippStufe, setTippStufe] = useState(0);
  const [ergebnis, setErgebnis] = useState<Ergebnis | null>(null);
  const [tastaturOffen, setTastaturOffen] = useState(false);
  const feldRef = useRef<HTMLInputElement>(null);
  const weiterRef = useRef<HTMLButtonElement>(null);

  // Tab-Leiste ausblenden, solange getippt wird; beim Verlassen wieder einblenden
  useEffect(() => setTippt(tastaturOffen), [tastaturOffen]);
  useEffect(() => () => setTippt(false), []);

  useEffect(() => {
    if (ergebnis) {
      setTastaturOffen(false);
      weiterRef.current?.focus({ preventScroll: true });
    }
  }, [ergebnis]);

  if (!karte) {
    return (
      <section class="ansicht" aria-labelledby="titel-tippen">
        <h2 id="titel-tippen">Tippen</h2>
        <p>Für die gewählten Themen und Inhaltsarten gibt es keine Einträge.</p>
      </section>
    );
  }
  const { eintrag } = karte;

  const pruefen = () => {
    if (ergebnis) return;
    if (eingabe.trim() === '') {
      feldRef.current?.focus();
      zeigeHinweis('Gib zuerst eine Antwort ein.');
      return;
    }
    const { ergebnis: e, ziel } = pruefeEingabe(eingabe, eintrag);
    setErgebnis({ ergebnis: e, ziel, aufgegeben: false });
    aendere((s) => nachUebung(s, karte, e !== 'falsch', heute()));
  };

  const loesungZeigen = () => {
    if (ergebnis) return;
    setErgebnis({ ergebnis: 'falsch', ziel: eintrag.russisch, aufgegeben: true });
    aendere((s) => nachUebung(s, karte, false, heute()));
  };

  const weiter = () => {
    setKarte(waehleUebungskarte(karten, stand.karten, eintrag.id));
    setEingabe('');
    setTippStufe(0);
    setErgebnis(null);
    // Nächste Aufgabe: direkt weitertippen
    requestAnimationFrame(() => feldRef.current?.focus({ preventScroll: true }));
  };

  /** Fügt Text der App-Tastatur an der Cursorposition ein. */
  const einfuegen = (zeichen: string | null) => {
    const feld = feldRef.current;
    const start = feld?.selectionStart ?? eingabe.length;
    const ende = feld?.selectionEnd ?? eingabe.length;
    let neu: string;
    let cursor: number;
    if (zeichen === null) {
      const von = start === ende ? Math.max(0, start - 1) : start;
      neu = eingabe.slice(0, von) + eingabe.slice(ende);
      cursor = von;
    } else {
      neu = (eingabe.slice(0, start) + zeichen + eingabe.slice(ende)).slice(0, MAX_EINGABE);
      cursor = Math.min(start + zeichen.length, neu.length);
    }
    setEingabe(neu);
    requestAnimationFrame(() => feld?.setSelectionRange(cursor, cursor));
  };

  return (
    <section
      class={`ansicht tippen ${tastaturOffen ? 'tippen--offen' : ''} ${appTastatur ? 'tippen--app' : 'tippen--system'}`}
      aria-labelledby="titel-tippen"
    >
      <h2 id="titel-tippen" class="nur-sr">
        Tippen
      </h2>
      <div class="tippen__aufgabe">
        <Lernkarte eintrag={eintrag}>
          <KartenText text={eintrag.deutsch} russisch={false} eintrag={eintrag} />
          {eintrag.hinweis && <p class="karte__hinweis">{eintrag.hinweis}</p>}
          {tippStufe > 0 && !ergebnis && (
            <p class="tipp" lang="ru" aria-live="polite">
              <span class="nur-sr">Tipp: </span>
              {tipp(eintrag.russisch, tippStufe)}
            </p>
          )}
          {ergebnis && (
            <div class="karte__loesung">
              <hr class="karte__trenner" />
              <p
                role="status"
                class={`meldung ${ergebnis.ergebnis === 'falsch' ? 'meldung--falsch' : 'meldung--richtig'}`}
              >
                {ergebnis.aufgegeben ? 'Die Lösung lautet:' : MELDUNG[ergebnis.ergebnis]}
              </p>
              <p class="kartentext kartentext--ru kartentext--antwort" lang="ru">
                {ergebnis.ergebnis === 'fast'
                  ? abweichungen(eingabe, ergebnis.ziel).map((a, i) =>
                      a.fehler ? (
                        <mark key={i} class="abweichung">
                          {a.text}
                        </mark>
                      ) : (
                        a.text
                      ),
                    )
                  : eintrag.genusvarianten
                    ? russischAnzeige(eintrag)
                    : ergebnis.ziel}
              </p>
              {ergebnis.ergebnis !== 'richtig' && !ergebnis.aufgegeben && (
                <p class="karte__hinweis">
                  Deine Eingabe: <span lang="ru">{eingabe}</span>
                </p>
              )}
              <Anhoeren text={ergebnis.ziel} />
            </div>
          )}
        </Lernkarte>
      </div>

      <div class="tippen__eingabe">
        <label for="tipp-feld" class="nur-sr">
          Deine Antwort auf Russisch
        </label>
        <input
          id="tipp-feld"
          ref={feldRef}
          class="eingabe"
          type="text"
          lang="ru"
          value={eingabe}
          maxLength={MAX_EINGABE}
          placeholder="Auf Russisch …"
          autocomplete="off"
          autocapitalize="none"
          autocorrect="off"
          spellcheck={false}
          enterkeyhint="done"
          inputMode={appTastatur ? 'none' : 'text'}
          readOnly={ergebnis !== null}
          onInput={(e) => setEingabe((e.target as HTMLInputElement).value.slice(0, MAX_EINGABE))}
          onFocus={() => {
            if (!ergebnis) setTastaturOffen(true);
          }}
          onBlur={() => {
            if (!appTastatur) setTastaturOffen(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (ergebnis) weiter();
              else pruefen();
            }
          }}
        />
        {ergebnis ? (
          <div class="aktionen aktionen--reihe">
            <button ref={weiterRef} type="button" class="knopf knopf--haupt" onClick={weiter}>
              Weiter
            </button>
          </div>
        ) : (
          <div class="aktionen aktionen--reihe">
            <button
              type="button"
              class="knopf"
              onPointerDown={(e) => appTastatur && e.preventDefault()}
              onClick={() => setTippStufe((t) => t + 1)}
            >
              Tipp
            </button>
            <button type="button" class="knopf" onClick={loesungZeigen}>
              Lösung
            </button>
            <button
              type="button"
              class="knopf knopf--haupt"
              onPointerDown={(e) => appTastatur && e.preventDefault()}
              onClick={pruefen}
            >
              Prüfen
            </button>
          </div>
        )}
        {!appTastatur && !ergebnis && (
          <p class="kleingedruckt">
            Russische Tastatur hinzufügen: iPhone unter Einstellungen → Allgemein → Tastatur →
            Tastaturen; Android in den Einstellungen deiner Tastatur (z. B. Gboard) unter Sprachen.
          </p>
        )}
      </div>

      {appTastatur && tastaturOffen && !ergebnis && (
        <Tastatur
          onZeichen={(z) => einfuegen(z)}
          onLoeschen={() => einfuegen(null)}
          onAusblenden={() => {
            setTastaturOffen(false);
            feldRef.current?.blur();
          }}
        />
      )}
    </section>
  );
}
