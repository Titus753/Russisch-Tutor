import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

/** Einfachauswahl als Pillen-Chips (Radiogruppe). */
export function ChipAuswahl<T extends string | number>({
  label,
  optionen,
  wert,
  onWahl,
}: {
  label: string;
  optionen: readonly (readonly [T, string])[];
  wert: T;
  onWahl: (wert: T) => void;
}) {
  return (
    <div class="chips" role="radiogroup" aria-label={label}>
      {optionen.map(([w, text]) => (
        <button
          key={String(w)}
          type="button"
          role="radio"
          aria-checked={w === wert}
          class="chip"
          onClick={() => onWahl(w)}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

/** Mehrfachauswahl als Pillen-Chips (Umschaltknöpfe). */
export function ChipMehrfach<T extends string>({
  label,
  optionen,
  gewaehlt,
  onUmschalten,
}: {
  label: string;
  optionen: readonly (readonly [T, string])[];
  gewaehlt: readonly T[];
  onUmschalten: (wert: T) => void;
}) {
  return (
    <div class="chips" role="group" aria-label={label}>
      {optionen.map(([w, text]) => (
        <button
          key={w}
          type="button"
          aria-pressed={gewaehlt.includes(w)}
          class="chip"
          onClick={() => onUmschalten(w)}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

/** Ein/Aus-Schalter mit sichtbarer Beschriftung. */
export function Schalter({
  label,
  an,
  onWechsel,
  beschreibung,
}: {
  label: string;
  an: boolean;
  onWechsel: (an: boolean) => void;
  beschreibung?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={an}
      class="schalter"
      onClick={() => onWechsel(!an)}
    >
      <span class="schalter__text">
        <span>{label}</span>
        {beschreibung && <span class="kleingedruckt">{beschreibung}</span>}
      </span>
      <span class="schalter__spur" aria-hidden="true">
        <span class="schalter__knopf" />
      </span>
    </button>
  );
}

/** Abschnitt mit Serifen-Überschrift. */
export function Abschnitt({ titel, children }: { titel: string; children: ComponentChildren }) {
  return (
    <section class="abschnitt">
      <h3 class="abschnitt__titel">{titel}</h3>
      {children}
    </section>
  );
}

/** Unterseite von „Mehr" mit Zurück-Knopf; die Überschrift bekommt beim Öffnen den Fokus. */
export function Unterseite({
  titel,
  onZurueck,
  children,
}: {
  titel: string;
  onZurueck: () => void;
  children: ComponentChildren;
}) {
  const ueberschrift = useRef<HTMLHeadingElement>(null);
  useEffect(() => ueberschrift.current?.focus(), []);
  return (
    <section class="ansicht" aria-labelledby="titel-unterseite">
      <button type="button" class="knopf knopf--klein knopf--zurueck" onClick={onZurueck}>
        ← Zurück
      </button>
      <h2 id="titel-unterseite" class="seitentitel" tabIndex={-1} ref={ueberschrift}>
        {titel}
      </h2>
      {children}
    </section>
  );
}
