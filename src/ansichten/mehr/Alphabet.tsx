import { useEffect, useRef, useState } from 'preact/hooks';
import alphabet from 'virtual:alphabet';
import { spiele } from '../../audio/wiedergabe.ts';
import { useApp } from '../../app/kontext.ts';
import { Anhoeren, KEINE_STIMME } from '../../bausteine/Anhoeren.tsx';
import { Abschnitt, ChipAuswahl, Unterseite } from '../../bausteine/Bedienelemente.tsx';
import { IconLautsprecher } from '../../bausteine/Icons.tsx';
import type { Buchstabe } from '../../daten/alphabet-schema.ts';
import { mischen } from '../../logik/zufall.ts';

type Art = 'sehen' | 'hoeren';

interface Aufgabe {
  buchstabe: Buchstabe;
  optionen: Buchstabe[];
}

/** Vier Buchstaben zur Auswahl, keiner direkt wiederholt. */
function neueAufgabe(letzter?: string): Aufgabe {
  const kandidaten = alphabet.filter((b) => b.id !== letzter);
  // Das Schema garantiert 33 Buchstaben; der Rückfall dient nur der Typsicherheit
  const buchstabe = (kandidaten[Math.floor(Math.random() * kandidaten.length)] ??
    alphabet[0]) as Buchstabe;
  const andere = mischen(alphabet.filter((b) => b.id !== buchstabe.id)).slice(0, 3);
  return { buchstabe, optionen: mischen([buchstabe, ...andere]) };
}

const sprechbar = (b: Buchstabe) => ({ russisch: b.sprechtext, audio: b.audio });

function Uebung() {
  const { zeigeHinweis } = useApp();
  const [art, setArt] = useState<Art>('sehen');
  const [aufgabe, setAufgabe] = useState<Aufgabe>(() => neueAufgabe());
  const [gewaehlt, setGewaehlt] = useState<string | null>(null);
  const [zaehler, setZaehler] = useState({ richtig: 0, gesamt: 0 });
  const weiterRef = useRef<HTMLButtonElement>(null);
  const b = aufgabe.buchstabe;

  const hoeren = async () => {
    if ((await spiele(sprechbar(b))) === 'keine-stimme') zeigeHinweis(KEINE_STIMME);
  };

  useEffect(() => {
    if (gewaehlt) weiterRef.current?.focus({ preventScroll: true });
  }, [gewaehlt]);

  const waehle = (id: string) => {
    if (gewaehlt) return;
    setGewaehlt(id);
    setZaehler((z) => ({ richtig: z.richtig + (id === b.id ? 1 : 0), gesamt: z.gesamt + 1 }));
  };

  return (
    <Abschnitt titel="Üben">
      <ChipAuswahl
        label="Übungsart"
        optionen={[
          ['sehen', 'Buchstabe sehen'],
          ['hoeren', 'Buchstabe hören'],
        ]}
        wert={art}
        onWahl={(w) => {
          setArt(w);
          setGewaehlt(null);
          setAufgabe(neueAufgabe(b.id));
        }}
      />
      <p class="fortschrittszeile">
        {zaehler.gesamt === 0
          ? art === 'sehen'
            ? 'Wie wird dieser Buchstabe ausgesprochen?'
            : 'Welchen Buchstaben hörst du?'
          : `${zaehler.richtig} von ${zaehler.gesamt} richtig`}
      </p>
      {art === 'sehen' ? (
        <p class="buchstabe-gross" lang="ru">
          {b.gross} {b.klein}
        </p>
      ) : (
        <div class="aktionen">
          <button type="button" class="knopf knopf--haupt" onClick={() => void hoeren()}>
            <IconLautsprecher />
            Buchstaben anhören
          </button>
        </div>
      )}
      <div class="antworten" role="group" aria-label="Antworten">
        {aufgabe.optionen.map((o) => {
          const zustand = !gewaehlt
            ? ''
            : o.id === b.id
              ? 'antwort--richtig'
              : o.id === gewaehlt
                ? 'antwort--falsch'
                : 'antwort--aus';
          return (
            <button
              key={o.id}
              type="button"
              class={`knopf antwort ${zustand}`}
              lang={art === 'hoeren' ? 'ru' : 'de'}
              aria-disabled={gewaehlt !== null}
              onClick={() => waehle(o.id)}
            >
              {art === 'sehen' ? o.aussprache : `${o.gross} ${o.klein}`}
            </button>
          );
        })}
      </div>
      {gewaehlt && (
        <div class="aufloesung">
          <p
            role="status"
            class={gewaehlt === b.id ? 'meldung meldung--richtig' : 'meldung meldung--falsch'}
          >
            {gewaehlt === b.id ? 'Richtig!' : 'Leider falsch.'}
          </p>
          <p class="aufloesung__ru">
            <span lang="ru">
              {b.gross} {b.klein}
            </span>{' '}
            – {b.aussprache}
          </p>
          <div class="aktionen aktionen--reihe">
            <Anhoeren ziel={sprechbar(b)} />
            <button
              ref={weiterRef}
              type="button"
              class="knopf knopf--haupt"
              onClick={() => {
                setGewaehlt(null);
                setAufgabe(neueAufgabe(b.id));
              }}
            >
              Weiter
            </button>
          </div>
        </div>
      )}
    </Abschnitt>
  );
}

export function Alphabet({ onZurueck }: { onZurueck: () => void }) {
  return (
    <Unterseite titel="Alphabet" onZurueck={onZurueck}>
      <p>
        Das russische Alphabet hat 33 Buchstaben. Tippe auf „Anhören“ für Buchstabe und Beispiel.
      </p>

      <Uebung />

      <Abschnitt titel="Besonderheiten">
        <ul class="hinweisliste">
          <li>
            <strong lang="ru">ь</strong> (Weichheitszeichen) und <strong lang="ru">ъ</strong>{' '}
            (Härtezeichen) haben keinen eigenen Laut. ь macht den Konsonanten davor weich (соль), ъ
            trennt ihn vom folgenden Vokal (подъезд).
          </li>
          <li>
            <strong lang="ru">ы</strong> gibt es im Deutschen nicht: ein dumpfes „i“, bei dem die
            Zunge weit hinten liegt (сыр).
          </li>
          <li>
            Unbetontes <strong lang="ru">о</strong> klingt fast wie „a“: молоко́ spricht man etwa
            „malakó“. Deshalb zeigt die App die Betonung mit einem Akzent.
          </li>
          <li>
            Stimmhafte Konsonanten werden am Wortende und vor stimmlosen stimmlos: хлеб klingt wie
            „chlep“, друг wie „druk“ (б→п, в→ф, г→к, д→т, ж→ш, з→с).
          </li>
          <li>
            <strong lang="ru">е, ё, ю, я</strong> machen den Konsonanten davor weich; am Wortanfang
            oder nach Vokal beginnen sie mit „j“.
          </li>
        </ul>
      </Abschnitt>

      <Abschnitt titel="Alle Buchstaben">
        <ul class="buchstabenliste">
          {alphabet.map((b) => (
            <li key={b.id} class="buchstabe">
              <p class="buchstabe__zeichen" lang="ru">
                {b.gross} {b.klein}
              </p>
              <p class="buchstabe__aussprache">{b.aussprache}</p>
              <p class="buchstabe__beispiel">
                <span lang="ru">{b.beispiel.betonung ?? b.beispiel.russisch}</span> –{' '}
                {b.beispiel.deutsch}
              </p>
              <div class="aktionen aktionen--reihe">
                <Anhoeren ziel={sprechbar(b)} label={`${b.gross} anhören`} />
                <Anhoeren ziel={b.beispiel} label="Beispiel" />
              </div>
            </li>
          ))}
        </ul>
      </Abschnitt>
    </Unterseite>
  );
}
