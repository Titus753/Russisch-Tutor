import { plusTage, type Tag } from './datum.ts';

/** Abstand in Tagen je Leitner-Stufe 0–5. */
export const ABSTAENDE = [0, 1, 3, 7, 16, 35] as const;
export const MAX_STUFE = 5;
/** Ab dieser Stufe gilt ein Eintrag als gefestigt. */
export const GEFESTIGT_AB = 4;
/** Unter dieser Stufe gilt eine Karte als schwach (Quiz/Tippen/Hören wählen sie bevorzugt). */
export const SCHWACH_UNTER = 3;

/** Abstand in Tagen für eine Stufe (Werte außerhalb 0–5 werden begrenzt). */
export function abstandFuer(stufe: number): number {
  return ABSTAENDE[Math.min(MAX_STUFE, Math.max(0, stufe))] ?? 0;
}

export type Richtung = 'de-ru' | 'ru-de';
export type Bewertung = 'nochmal' | 'schwer' | 'gut' | 'leicht';

export interface KartenStand {
  stufe: number;
  faellig: Tag;
  zuletzt: Tag;
  wiederholungen: number;
  fehler: number;
}

/** Schlüssel für den Fortschritt: pro Eintrag und Richtung, z. B. „ein-001:de-ru". */
export function kartenSchluessel(id: string, richtung: Richtung): string {
  return `${id}:${richtung}`;
}

export function istFaellig(stand: KartenStand | undefined, tag: Tag): boolean {
  return stand !== undefined && stand.faellig <= tag;
}

/** Berechnet den neuen Stand nach einer Bewertung. `stand` fehlt bei neuen Karten. */
export function bewerte(
  stand: KartenStand | undefined,
  bewertung: Bewertung,
  tag: Tag,
): KartenStand {
  const alt = stand?.stufe ?? 0;
  let stufe: number;
  let abstand: number;
  switch (bewertung) {
    case 'nochmal':
      stufe = 0;
      abstand = 0;
      break;
    case 'schwer':
      stufe = Math.max(1, alt);
      abstand = Math.max(1, Math.floor(abstandFuer(stufe) / 2));
      break;
    case 'gut':
      stufe = Math.min(MAX_STUFE, alt + 1);
      abstand = abstandFuer(stufe);
      break;
    case 'leicht':
      stufe = Math.min(MAX_STUFE, alt + 2);
      abstand = abstandFuer(stufe);
      break;
  }
  return {
    stufe,
    faellig: plusTage(tag, abstand),
    zuletzt: tag,
    wiederholungen: (stand?.wiederholungen ?? 0) + 1,
    fehler: (stand?.fehler ?? 0) + (bewertung === 'nochmal' ? 1 : 0),
  };
}

/**
 * Ergebnis aus Quiz, Tippen oder Hören: Falsch setzt auf Stufe 0.
 * Richtig zählt nur bei neuen oder fälligen Karten als „Gut", sonst bleibt der Stand.
 */
export function ergebnisUebung(
  stand: KartenStand | undefined,
  richtig: boolean,
  tag: Tag,
): KartenStand | undefined {
  if (!richtig) return bewerte(stand, 'nochmal', tag);
  if (stand === undefined || istFaellig(stand, tag)) return bewerte(stand, 'gut', tag);
  return stand;
}
