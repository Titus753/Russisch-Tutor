import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import vokabeln from 'virtual:vokabeln';
import { spiele } from '../audio/wiedergabe.ts';
import { russischAnzeige } from '../app/anzeige.ts';
import { useApp } from '../app/kontext.ts';
import { Anhoeren, KEINE_STIMME } from '../bausteine/Anhoeren.tsx';
import { IconLautsprecher } from '../bausteine/Icons.tsx';
import { KartenText, Lernkarte } from '../bausteine/Lernkarte.tsx';
import { antwortOptionen, frageText, type Antwortwahl } from '../logik/antworten.ts';
import { heute } from '../logik/datum.ts';
import { kartenFuer, zieheUebungskarte, type Karte } from '../logik/karten.ts';
import { nachUebung } from '../logik/stand.ts';

interface Frage {
  karte: Karte;
  wahl: Antwortwahl;
}

/**
 * Multiple Choice („quiz") und Hörverständnis („hoeren"): vier Antworten, danach Auflösung.
 * Beim Hören wird das Russische erst nach der Antwort eingeblendet.
 */
export function Auswahl({ modus }: { modus: 'quiz' | 'hoeren' }) {
  const { stand, aendere, zeigeHinweis } = useApp();
  const hoeren = modus === 'hoeren';
  const titel = hoeren ? 'Hören' : 'Quiz';

  const karten = useMemo(
    () =>
      kartenFuer(vokabeln, {
        ...stand.einstellungen,
        // Beim Hören wird immer die deutsche Bedeutung gewählt
        richtung: hoeren ? 'ru-de' : stand.einstellungen.richtung,
      }),
    [stand.einstellungen, hoeren],
  );

  const neueFrage = (): Frage | null => {
    const karte = zieheUebungskarte(karten, stand.karten);
    return karte ? { karte, wahl: antwortOptionen(karte, vokabeln) } : null;
  };

  const [frage, setFrage] = useState<Frage | null>(() => neueFrage());
  const [gewaehlt, setGewaehlt] = useState<number | null>(null);
  const [zaehler, setZaehler] = useState({ richtig: 0, gesamt: 0 });
  const [gehoert, setGehoert] = useState(false);
  const weiterRef = useRef<HTMLButtonElement>(null);
  const ersteAntwortRef = useRef<HTMLButtonElement>(null);

  const abspielen = async (langsam = false) => {
    if (!frage) return;
    setGehoert(true);
    if ((await spiele(frage.karte.eintrag, langsam)) === 'keine-stimme') {
      zeigeHinweis(KEINE_STIMME);
    }
  };

  // Beim Hören ab der zweiten Frage automatisch abspielen (erst nach einer Nutzeraktion erlaubt)
  useEffect(() => {
    if (hoeren && gehoert && frage) void spiele(frage.karte.eintrag);
    if (gewaehlt === null) ersteAntwortRef.current?.focus({ preventScroll: true });
  }, [frage?.karte.schluessel]);

  useEffect(() => {
    if (gewaehlt !== null) weiterRef.current?.focus({ preventScroll: true });
  }, [gewaehlt]);

  if (!frage) {
    return (
      <section class="ansicht" aria-labelledby="titel-auswahl">
        <h2 id="titel-auswahl">{titel}</h2>
        <p>Für die gewählten Themen und Inhaltsarten gibt es keine Einträge.</p>
      </section>
    );
  }

  const { karte, wahl } = frage;
  const { eintrag, richtung } = karte;
  const antwortRussisch = richtung === 'de-ru';
  const beantwortet = gewaehlt !== null;

  const waehle = (index: number) => {
    if (beantwortet) return;
    const richtig = index === wahl.richtig;
    setGewaehlt(index);
    setZaehler((z) => ({ richtig: z.richtig + (richtig ? 1 : 0), gesamt: z.gesamt + 1 }));
    aendere((s) => nachUebung(s, karte, richtig, heute()));
  };

  const weiter = () => {
    setGewaehlt(null);
    setFrage(neueFrage());
  };

  return (
    <section class="ansicht" aria-labelledby="titel-auswahl">
      <h2 id="titel-auswahl" class="nur-sr">
        {titel}
      </h2>
      <p class="fortschrittszeile">
        {zaehler.gesamt === 0
          ? hoeren
            ? 'Hör zu und wähle die Bedeutung'
            : 'Wähle die richtige Antwort'
          : `${zaehler.richtig} von ${zaehler.gesamt} richtig`}
      </p>
      <Lernkarte eintrag={eintrag}>
        {hoeren ? (
          <div class="hoeren">
            <button
              type="button"
              class="knopf knopf--haupt knopf--rund"
              onClick={() => void abspielen()}
            >
              <IconLautsprecher />
              Anhören
            </button>
            <button type="button" class="knopf knopf--klein" onClick={() => void abspielen(true)}>
              Langsam
            </button>
            {beantwortet && (
              <KartenText
                text={russischAnzeige(eintrag)}
                russisch
                eintrag={eintrag}
                gross={false}
              />
            )}
          </div>
        ) : (
          <>
            <KartenText
              text={richtung === 'ru-de' ? russischAnzeige(eintrag) : frageText(eintrag, richtung)}
              russisch={richtung === 'ru-de'}
              eintrag={eintrag}
            />
            {richtung === 'de-ru' && eintrag.hinweis && (
              <p class="karte__hinweis">{eintrag.hinweis}</p>
            )}
            {richtung === 'ru-de' && <Anhoeren ziel={eintrag} />}
          </>
        )}
      </Lernkarte>

      <div class="antworten" role="group" aria-label="Antworten">
        {wahl.optionen.map((option, i) => {
          const zustand = !beantwortet
            ? ''
            : i === wahl.richtig
              ? 'antwort--richtig'
              : i === gewaehlt
                ? 'antwort--falsch'
                : 'antwort--aus';
          return (
            <button
              key={option}
              ref={i === 0 ? ersteAntwortRef : null}
              type="button"
              class={`knopf antwort ${zustand}`}
              lang={antwortRussisch ? 'ru' : 'de'}
              aria-disabled={beantwortet}
              onClick={() => waehle(i)}
            >
              {option}
              {beantwortet && i === wahl.richtig && <span class="nur-sr"> (richtig)</span>}
              {beantwortet && i === gewaehlt && i !== wahl.richtig && (
                <span class="nur-sr"> (deine Wahl, falsch)</span>
              )}
            </button>
          );
        })}
      </div>

      {beantwortet && (
        <div class="aufloesung">
          <p
            role="status"
            class={
              gewaehlt === wahl.richtig ? 'meldung meldung--richtig' : 'meldung meldung--falsch'
            }
          >
            {gewaehlt === wahl.richtig ? 'Richtig!' : 'Leider falsch.'}
          </p>
          {!hoeren && (
            <p class="aufloesung__ru">
              <span lang="ru">{russischAnzeige(eintrag)}</span> – {eintrag.deutsch}
            </p>
          )}
          <div class="aktionen aktionen--reihe">
            {!hoeren && <Anhoeren ziel={eintrag} />}
            <button ref={weiterRef} type="button" class="knopf knopf--haupt" onClick={weiter}>
              Weiter
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
