import type { JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import baer from 'virtual:baer';
import { BaerKnopf } from './BaerKnopf.tsx';
import {
  IconHoeren,
  IconKarten,
  IconLautsprecher,
  IconMehr,
  IconQuiz,
  IconTippen,
} from './Icons.tsx';

interface Schritt {
  titel: string;
  text: string;
  bild: () => JSX.Element;
  /** Russischer Titel (Mischas Begrüßung) – wird mit lang="ru" ausgezeichnet. */
  russisch?: boolean;
}

// Mini-Illustrationen aus echten App-Bausteinen (dekorativ, für Screenreader ausgeblendet)
const SCHRITTE: Schritt[] = [
  {
    titel: baer.vorstellung.betonung ?? baer.vorstellung.russisch,
    russisch: true,
    text: `${baer.vorstellung.deutsch} Ich zeige dir kurz, wie die App funktioniert.`,
    bild: () => <></>,
  },
  {
    titel: 'Karteikarten',
    text: 'Decke eine Karte auf und sag ehrlich, wie gut du sie wusstest. „Nochmal“ bringt sie gleich wieder, „Leicht“ schiebt sie weit nach hinten. So wiederholst du genau das, was du noch nicht kannst.',
    bild: () => (
      <div class="demo">
        <div class="karte demo__karte">
          <p class="kartentext kartentext--ru kartentext--wort" lang="ru">
            хлеб
          </p>
          <p>das Brot</p>
        </div>
        <div class="demo__reihe">
          <span class="knopf knopf--klein">Nochmal</span>
          <span class="knopf knopf--klein knopf--haupt">Gut</span>
        </div>
      </div>
    ),
  },
  {
    titel: 'Wann kommt ein Wort wieder?',
    text: '„Gut“ schiebt eine Karte eine Stufe weiter: Sie kommt nach 1, 3, 7, 16 und schließlich 35 Tagen wieder. „Leicht“ springt zwei Stufen, „Schwer“ bleibt auf der Stufe, „Nochmal“ beginnt von vorn. So siehst du, was du vergisst, öfter. Neue Wörter kommen bunt gemischt aus allen Themen.',
    bild: () => (
      <div class="demo">
        <div class="demo__stufen">
          {[
            ['1', '1 Tag'],
            ['2', '3 Tage'],
            ['3', '7 Tage'],
            ['4', '16 Tage'],
            ['5', '35 Tage'],
          ].map(([stufe, tage]) => (
            <span key={stufe} class={`demo__stufe demo__stufe--${stufe}`}>
              {tage}
            </span>
          ))}
        </div>
        <div class="demo__reihe">
          <span class="knopf knopf--klein">Nochmal</span>
          <span class="knopf knopf--klein">Schwer</span>
          <span class="knopf knopf--klein knopf--haupt">Gut</span>
          <span class="knopf knopf--klein">Leicht</span>
        </div>
      </div>
    ),
  },
  {
    titel: 'Quiz und Hören',
    text: 'Im Quiz wählst du aus vier Antworten, beim Hören erkennst du Wörter nach Gehör – bei Bedarf langsam. Überall, wo Russisch steht, gibt es „Anhören“.',
    bild: () => (
      <div class="demo">
        <span class="knopf antwort antwort--richtig">Wie viel kostet das?</span>
        <span class="knopf knopf--haupt knopf--rund">
          <IconLautsprecher />
          Anhören
        </span>
      </div>
    ),
  },
  {
    titel: 'Tippen',
    text: 'Schreib die Antwort auf Russisch. Die App bringt eine eigene kyrillische Tastatur mit; in den Einstellungen kannst du auf die Tastatur deines Handys umstellen. Kleine Tippfehler zählen als „Fast richtig“.',
    bild: () => (
      <div class="demo">
        <div class="demo__reihe" lang="ru">
          {['й', 'ц', 'у', 'к', 'е', 'н'].map((z) => (
            <span key={z} class="taste demo__taste">
              {z}
            </span>
          ))}
        </div>
      </div>
    ),
  },
  {
    titel: 'Alphabet',
    text: 'Unter „Mehr → Alphabet“ findest du alle 33 Buchstaben mit Aussprache, Beispielwort und einer kleinen Übung.',
    bild: () => (
      <div class="demo">
        <p class="buchstabe-gross" lang="ru">
          Аа Бб Вв
        </p>
      </div>
    ),
  },
  {
    titel: 'Einstellungen und Schriftgröße',
    text: 'Unter „Mehr → Einstellungen“ wählst du Themen, Abfragerichtung, neue Karten pro Tag, Schriftgröße, Farbmodus und hohen Kontrast.',
    bild: () => (
      <div class="demo demo__reihe demo__schrift" aria-hidden="true">
        <span>Aa</span>
        <span>Aa</span>
        <span>Aa</span>
      </div>
    ),
  },
  {
    titel: 'Datenschutz und Sicherung',
    text: 'Dein Lernstand bleibt nur auf diesem Gerät – ohne Konto, ohne Tracking. Speichere unter „Mehr → Sicherung“ ab und zu eine Sicherungsdatei, zum Beispiel vor einem Handywechsel.',
    bild: () => (
      <div class="demo demo__reihe">
        <IconKarten />
        <IconQuiz />
        <IconTippen />
        <IconHoeren />
        <IconMehr />
      </div>
    ),
  },
];

/** Einführung beim ersten Start; jederzeit überspringbar und über „Mehr" erneut aufrufbar. */
export function Tutorial({ onEnde }: { onEnde: () => void }) {
  const [nr, setNr] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const titel = useRef<HTMLHeadingElement>(null);
  const schritt = (SCHRITTE[nr] ?? SCHRITTE[0]) as Schritt;
  const letzter = nr === SCHRITTE.length - 1;

  useEffect(() => {
    const d = dialog.current;
    if (d && !d.open) d.showModal();
    // Escape schließt den Dialog: als „Überspringen" werten
    const beiAbbruch = (e: Event) => {
      e.preventDefault();
      onEnde();
    };
    d?.addEventListener('cancel', beiAbbruch);
    return () => d?.removeEventListener('cancel', beiAbbruch);
  }, []);

  useEffect(() => titel.current?.focus(), [nr]);

  return (
    <dialog
      ref={dialog}
      class="tutorial"
      aria-labelledby="tutorial-titel"
      aria-describedby="tutorial-text"
    >
      <div class="tutorial__kopf">
        <p class="kleingedruckt" aria-live="polite">
          Schritt {nr + 1} von {SCHRITTE.length}
        </p>
        <button type="button" class="knopf knopf--klein" onClick={onEnde}>
          Überspringen
        </button>
      </div>
      <div class="tutorial__punkte" aria-hidden="true">
        {SCHRITTE.map((_, i) => (
          <span key={i} class={i === nr ? 'punkt punkt--aktiv' : 'punkt'} />
        ))}
      </div>
      {/* Nur der Inhalt scrollt; Kopfzeile und Knöpfe bleiben immer sichtbar */}
      <div class="tutorial__inhalt" tabIndex={0}>
        {schritt.russisch ? (
          <BaerKnopf saetze={[baer.vorstellung]} />
        ) : (
          <div class="tutorial__bild" aria-hidden="true">
            {schritt.bild()}
          </div>
        )}
        <h2
          id="tutorial-titel"
          class={schritt.russisch ? 'seitentitel seitentitel--ru' : 'seitentitel'}
          lang={schritt.russisch ? 'ru' : undefined}
          tabIndex={-1}
          ref={titel}
        >
          {schritt.titel}
        </h2>
        <p id="tutorial-text">{schritt.text}</p>
      </div>
      <div class="aktionen aktionen--reihe tutorial__knoepfe">
        {nr > 0 && (
          <button type="button" class="knopf" onClick={() => setNr(nr - 1)}>
            Zurück
          </button>
        )}
        <button
          type="button"
          class="knopf knopf--haupt"
          onClick={() => (letzter ? onEnde() : setNr(nr + 1))}
        >
          {letzter ? 'Los geht’s' : 'Weiter'}
        </button>
      </div>
    </dialog>
  );
}
