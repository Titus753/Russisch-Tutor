import type { Eintrag } from '../daten/schema.ts';
import type { Inhaltsart, ThemaId } from '../daten/themen.ts';
import type { Tag } from './datum.ts';
import {
  istFaellig,
  kartenSchluessel,
  SCHWACH_UNTER,
  type Bewertung,
  type KartenStand,
  type Richtung,
} from './leitner.ts';
import { mischen, type Zufall } from './zufall.ts';

export type RichtungsWahl = Richtung | 'gemischt';

export interface Karte {
  eintrag: Eintrag;
  richtung: Richtung;
  schluessel: string;
}

export interface Filter {
  themen: readonly ThemaId[];
  inhaltsarten: readonly Inhaltsart[];
  richtung: RichtungsWahl;
}

export type Fortschritt = Readonly<Record<string, KartenStand>>;

/** Alle Karten zum Filter; bei „gemischt" jede Richtung als eigene Karte. */
export function kartenFuer(eintraege: readonly Eintrag[], filter: Filter): Karte[] {
  const richtungen: Richtung[] =
    filter.richtung === 'gemischt' ? ['de-ru', 'ru-de'] : [filter.richtung];
  const karten: Karte[] = [];
  for (const eintrag of eintraege) {
    if (!filter.themen.includes(eintrag.thema) || !filter.inhaltsarten.includes(eintrag.typ))
      continue;
    for (const richtung of richtungen) {
      karten.push({ eintrag, richtung, schluessel: kartenSchluessel(eintrag.id, richtung) });
    }
  }
  return karten;
}

export interface RundenEingabe {
  karten: readonly Karte[];
  fortschritt: Fortschritt;
  tag: Tag;
  /** Wie viele neue Einträge heute insgesamt erlaubt sind (Einstellung + „dazunehmen"). */
  neueLimit: number;
  /** IDs der Einträge, die heute schon neu eingeführt wurden. */
  neueHeute: readonly string[];
  zufall?: Zufall;
}

/**
 * Stellt die Karteikarten-Runde zusammen: erst alle fälligen Karten (älteste zuerst),
 * dann neue bis zum Tageslimit. Das Limit zählt Einträge, nicht Richtungen; pro Eintrag
 * kommt höchstens eine neue Richtung am Tag dazu.
 */
export function baueRunde(e: RundenEingabe): Karte[] {
  const faellige = e.karten
    .filter((k) => istFaellig(e.fortschritt[k.schluessel], e.tag))
    .sort((a, b) => {
      const sa = e.fortschritt[a.schluessel] as KartenStand;
      const sb = e.fortschritt[b.schluessel] as KartenStand;
      return sa.faellig.localeCompare(sb.faellig) || sa.stufe - sb.stufe;
    });

  const frei = Math.max(0, e.neueLimit - e.neueHeute.length);
  const vergeben = new Set(e.neueHeute);
  const neue: Karte[] = [];
  const unbekannt = e.karten.filter((k) => e.fortschritt[k.schluessel] === undefined);
  for (const karte of e.zufall ? mischen(unbekannt, e.zufall) : unbekannt) {
    if (neue.length >= frei) break;
    if (vergeben.has(karte.eintrag.id)) continue;
    vergeben.add(karte.eintrag.id);
    neue.push(karte);
  }
  return [...faellige, ...neue];
}

/** Abstand, mit dem „Nochmal" eine Karte in derselben Runde wiederbringt. */
export const NOCHMAL_ABSTAND = 3;

/** Nimmt die vorderste Karte aus der Runde; bei „Nochmal" kommt sie ca. 3 Karten später wieder. */
export function nachBewertung(runde: readonly Karte[], bewertung: Bewertung): Karte[] {
  const [aktuell, ...rest] = runde;
  if (!aktuell || bewertung !== 'nochmal') return rest;
  const stelle = Math.min(NOCHMAL_ABSTAND, rest.length);
  return [...rest.slice(0, stelle), aktuell, ...rest.slice(stelle)];
}

/** Anteil schwacher Karten bei der Auswahl für Quiz, Tippen und Hören. */
export const ANTEIL_SCHWACH = 0.7;

/**
 * Wählt die nächste Übungskarte: zu ca. 70 % eine schwache (neu oder Stufe < 3),
 * nie derselbe Eintrag wie direkt davor (außer es gibt nur einen).
 */
export function waehleUebungskarte(
  karten: readonly Karte[],
  fortschritt: Fortschritt,
  letzteId: string | undefined,
  zufall: Zufall = Math.random,
): Karte | undefined {
  if (karten.length === 0) return undefined;
  const ohneLetzte = karten.filter((k) => k.eintrag.id !== letzteId);
  const moeglich = ohneLetzte.length > 0 ? ohneLetzte : [...karten];
  const schwach = moeglich.filter((k) => (fortschritt[k.schluessel]?.stufe ?? 0) < SCHWACH_UNTER);
  const stark = moeglich.filter((k) => (fortschritt[k.schluessel]?.stufe ?? 0) >= SCHWACH_UNTER);
  const topf =
    schwach.length > 0 && (stark.length === 0 || zufall() < ANTEIL_SCHWACH) ? schwach : stark;
  return topf[Math.floor(zufall() * topf.length)];
}
