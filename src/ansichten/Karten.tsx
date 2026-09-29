import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import lobPool from 'virtual:lob';
import vokabeln from 'virtual:vokabeln';
import { russischAnzeige } from '../app/anzeige.ts';
import { useApp } from '../app/kontext.ts';
import { Anhoeren, vorlesenWennAktiv } from '../bausteine/Anhoeren.tsx';
import { KartenText, Lernkarte } from '../bausteine/Lernkarte.tsx';
import { heute } from '../logik/datum.ts';
import {
  baueRunde,
  kartenFuer,
  nachBewertung as rundeWeiter,
  type Karte,
} from '../logik/karten.ts';
import type { Bewertung } from '../logik/leitner.ts';
import { nachBewertung, neueDazunehmen, neueHeute, neueLimit } from '../logik/stand.ts';
import type { Stand } from '../speicher/schema.ts';

export function rundeFuer(stand: Stand): Karte[] {
  const tag = heute();
  return baueRunde({
    karten: kartenFuer(vokabeln, stand.einstellungen),
    fortschritt: stand.karten,
    tag,
    neueLimit: neueLimit(stand, tag),
    neueHeute: neueHeute(stand, tag),
    zufall: Math.random,
  });
}

/** Zuletzt gezeigtes Lob, damit nicht zweimal hintereinander derselbe Spruch kommt. */
let letztesLob: string | undefined;

function waehleLob() {
  const auswahl = lobPool.filter((l) => l.id !== letztesLob);
  const lob = auswahl[Math.floor(Math.random() * auswahl.length)] ?? lobPool[0];
  letztesLob = lob?.id;
  return lob;
}

const BEWERTUNGEN: { wert: Bewertung; label: string }[] = [
  { wert: 'nochmal', label: 'Nochmal' },
  { wert: 'schwer', label: 'Schwer' },
  { wert: 'gut', label: 'Gut' },
  { wert: 'leicht', label: 'Leicht' },
];

export function Karten() {
  const { stand, aendere } = useApp();
  const [runde, setRunde] = useState<Karte[]>(() => rundeFuer(stand));
  const [aufgedeckt, setAufgedeckt] = useState(false);
  const aufdeckenRef = useRef<HTMLButtonElement>(null);
  const gutRef = useRef<HTMLButtonElement>(null);
  const karte = runde[0];

  // Sofort aktualisierte Kopie des Rundenzustands: schnelle Doppeltipps oder Tastendrücke vor dem
  // nächsten Neuzeichnen sehen so schon den neuen Zustand (keine doppelte Bewertung).
  const zustand = useRef({ runde, aufgedeckt });

  const aufdecken = () => {
    const erste = zustand.current.runde[0];
    if (!erste || zustand.current.aufgedeckt) return;
    zustand.current.aufgedeckt = true;
    setAufgedeckt(true);
    vorlesenWennAktiv(stand.einstellungen.vorlesen, erste.eintrag);
  };

  const bewerten = (bewertung: Bewertung) => {
    const erste = zustand.current.runde[0];
    if (!erste || !zustand.current.aufgedeckt) return;
    const neueRunde = rundeWeiter(zustand.current.runde, bewertung);
    zustand.current = { runde: neueRunde, aufgedeckt: false };
    aendere((s) => nachBewertung(s, erste, bewertung, heute()));
    setRunde(neueRunde);
    setAufgedeckt(false);
  };

  // Fokus folgt dem Ablauf: nach dem Aufdecken auf „Gut", danach wieder auf „Aufdecken"
  useEffect(() => {
    (aufgedeckt ? gutRef : aufdeckenRef).current?.focus({ preventScroll: true });
  }, [aufgedeckt, karte?.schluessel]);

  // Tastatur: Leertaste deckt auf, 1–4 bewertet. Der Handler wird einmal angemeldet und liest
  // über die Referenz immer den aktuellen Stand (sonst kämen schnelle Tastendrücke beim alten an).
  const aktuell = useRef({ aufdecken, bewerten });
  aktuell.current = { aufdecken, bewerten };
  useEffect(() => {
    const beiTaste = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return;
      const gewaehlt = BEWERTUNGEN[['1', '2', '3', '4'].indexOf(e.key)];
      if (zustand.current.aufgedeckt && gewaehlt) {
        e.preventDefault();
        aktuell.current.bewerten(gewaehlt.wert);
      } else if (!zustand.current.aufgedeckt && e.key === ' ') {
        // Auch wenn ein Knopf fokussiert ist: sofort aufdecken statt erst beim Loslassen der Taste
        e.preventDefault();
        aktuell.current.aufdecken();
      }
    };
    document.addEventListener('keydown', beiTaste);
    return () => document.removeEventListener('keydown', beiTaste);
  }, []);

  if (!karte) {
    return (
      <Geschafft
        vorlesen={stand.einstellungen.vorlesen}
        onDazunehmen={() => {
          const neu = neueDazunehmen(stand, heute());
          aendere(() => neu);
          const neueRunde = rundeFuer(neu);
          zustand.current = { runde: neueRunde, aufgedeckt: false };
          setRunde(neueRunde);
        }}
      />
    );
  }

  const { eintrag, richtung } = karte;
  const russischOben = richtung === 'ru-de';
  const russisch = russischAnzeige(eintrag);

  return (
    <section class="ansicht" aria-labelledby="titel-karten">
      <h2 id="titel-karten" class="nur-sr">
        Karten
      </h2>
      <p class="fortschrittszeile" aria-live="polite">
        Noch {runde.length} {runde.length === 1 ? 'Karte' : 'Karten'} in dieser Runde
      </p>
      <Lernkarte eintrag={eintrag}>
        <KartenText
          text={russischOben ? russisch : eintrag.deutsch}
          russisch={russischOben}
          eintrag={eintrag}
        />
        {!russischOben && eintrag.hinweis && <p class="karte__hinweis">{eintrag.hinweis}</p>}
        {russischOben && <Anhoeren ziel={eintrag} />}
        {aufgedeckt && (
          <div class="karte__loesung">
            <hr class="karte__trenner" />
            <KartenText
              text={russischOben ? eintrag.deutsch : russisch}
              russisch={!russischOben}
              eintrag={eintrag}
              gross={false}
            />
            {russischOben && eintrag.hinweis && <p class="karte__hinweis">{eintrag.hinweis}</p>}
            {!russischOben && <Anhoeren ziel={eintrag} />}
          </div>
        )}
      </Lernkarte>
      <div class="aktionen">
        {aufgedeckt ? (
          <div class="bewertung" role="group" aria-label="Wie gut wusstest du es?">
            {BEWERTUNGEN.map((b, i) => (
              <button
                key={b.wert}
                type="button"
                ref={b.wert === 'gut' ? gutRef : null}
                class={b.wert === 'gut' ? 'knopf knopf--haupt' : 'knopf'}
                aria-keyshortcuts={String(i + 1)}
                onClick={() => bewerten(b.wert)}
              >
                {b.label}
              </button>
            ))}
          </div>
        ) : (
          <button
            ref={aufdeckenRef}
            type="button"
            class="knopf knopf--haupt knopf--breit"
            onClick={aufdecken}
          >
            Aufdecken
          </button>
        )}
      </div>
    </section>
  );
}

/** Runde geschafft: zufälliges russisches Lob mit Übersetzung; der Fortschritt ist gespeichert. */
function Geschafft({ vorlesen, onDazunehmen }: { vorlesen: boolean; onDazunehmen: () => void }) {
  // Pro Anzeige einmal ziehen (neue Runde geschafft → neues Lob)
  const lob = useMemo(waehleLob, []);
  useEffect(() => {
    if (lob) vorlesenWennAktiv(vorlesen, lob);
  }, []);
  return (
    <section class="ansicht leer" aria-labelledby="titel-karten">
      <h2 id="titel-karten" class="nur-sr">
        Karten – Runde geschafft
      </h2>
      {lob && (
        <div class="lob" data-testid="lob">
          <p class="leer__ru" lang="ru">
            {lob.betonung ?? lob.russisch}
          </p>
          <p class="lob__de">{lob.deutsch}</p>
          <Anhoeren ziel={lob} />
        </div>
      )}
      <p>Für heute ist alles wiederholt. Dein Fortschritt ist gespeichert.</p>
      <button type="button" class="knopf knopf--haupt" onClick={onDazunehmen}>
        10 neue Karten dazunehmen
      </button>
    </section>
  );
}
