import type { Baer, BaerSatz } from '../daten/baer-schema.ts';

export type Tageszeit = 'morgen' | 'tag' | 'abend' | 'nacht';

/** Tageszeit nach lokaler Uhrzeit: 5–11 Morgen, 11–17 Tag, 17–23 Abend, sonst Nacht. */
export function tageszeit(stunde: number): Tageszeit {
  if (stunde >= 5 && stunde < 11) return 'morgen';
  if (stunde >= 11 && stunde < 17) return 'tag';
  if (stunde >= 17 && stunde < 23) return 'abend';
  return 'nacht';
}

/** Begrüßung zur Tageszeit plus ein wechselnder zweiter Satz (nicht derselbe wie beim letzten Mal). */
export function begruessung(
  baer: Baer,
  jetzt: Date,
  letzterSatz?: string,
  zufall: () => number = Math.random,
): [BaerSatz, BaerSatz] {
  const auswahl = baer.saetze.filter((s) => s.id !== letzterSatz);
  const liste = auswahl.length > 0 ? auswahl : baer.saetze;
  const satz = liste[Math.floor(zufall() * liste.length)] ?? baer.vorstellung;
  return [baer.zeiten[tageszeit(jetzt.getHours())], satz];
}
