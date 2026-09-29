import type { Eintrag } from '../daten/schema.ts';
import type { Karte } from './karten.ts';
import type { Richtung } from './leitner.ts';
import { normalisiere } from './vergleich.ts';
import { mischen, type Zufall } from './zufall.ts';

/** Text, den die Karte als Antwort erwartet: bei DE→RU das Russische, sonst das Deutsche. */
export function antwortText(eintrag: Eintrag, richtung: Richtung): string {
  return richtung === 'de-ru' ? eintrag.russisch : eintrag.deutsch;
}

export function frageText(eintrag: Eintrag, richtung: Richtung): string {
  return richtung === 'de-ru' ? eintrag.deutsch : eintrag.russisch;
}

export interface Antwortwahl {
  optionen: string[];
  richtig: number;
}

/**
 * Vier Antworten für Multiple Choice/Hören: die richtige plus Ablenker derselben Inhaltsart,
 * bevorzugt aus demselben Thema, ohne doppelte Antworttexte.
 */
export function antwortOptionen(
  karte: Karte,
  alle: readonly Eintrag[],
  zufall: Zufall = Math.random,
  anzahl = 4,
): Antwortwahl {
  const richtigerText = antwortText(karte.eintrag, karte.richtung);
  const gesehen = new Set([normalisiere(richtigerText)]);
  const passend = alle.filter((e) => e.typ === karte.eintrag.typ && e.id !== karte.eintrag.id);
  const gleichesThema = mischen(
    passend.filter((e) => e.thema === karte.eintrag.thema),
    zufall,
  );
  const anderesThema = mischen(
    passend.filter((e) => e.thema !== karte.eintrag.thema),
    zufall,
  );

  const ablenker: string[] = [];
  for (const e of [...gleichesThema, ...anderesThema]) {
    if (ablenker.length >= anzahl - 1) break;
    const text = antwortText(e, karte.richtung);
    const schluessel = normalisiere(text);
    if (gesehen.has(schluessel)) continue;
    gesehen.add(schluessel);
    ablenker.push(text);
  }
  const optionen = mischen([richtigerText, ...ablenker], zufall);
  return { optionen, richtig: optionen.indexOf(richtigerText) };
}
