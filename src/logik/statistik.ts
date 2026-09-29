import type { Eintrag } from '../daten/schema.ts';
import { THEMEN, type ThemaId } from '../daten/themen.ts';
import { plusTage, type Tag } from './datum.ts';
import type { Fortschritt, Karte } from './karten.ts';
import { GEFESTIGT_AB, istFaellig, kartenSchluessel } from './leitner.ts';

/**
 * Lernserie: aufeinanderfolgende Lerntage bis heute. Wurde heute noch nicht gelernt,
 * zählt die Serie bis gestern weiter (sie reißt erst, wenn ein ganzer Tag fehlt).
 */
export function lernserie(lerntage: readonly Tag[], tag: Tag): number {
  const tage = new Set(lerntage);
  let aktuell = tage.has(tag) ? tag : plusTage(tag, -1);
  let serie = 0;
  while (tage.has(aktuell)) {
    serie++;
    aktuell = plusTage(aktuell, -1);
  }
  return serie;
}

export interface ThemenFortschritt {
  thema: ThemaId;
  gesamt: number;
  begonnen: number;
  gefestigt: number;
}

/** Je Thema: begonnene Einträge (eine Richtung geübt) und gefestigte (eine Richtung ab Stufe 4). */
export function fortschrittJeThema(
  eintraege: readonly Eintrag[],
  fortschritt: Fortschritt,
): ThemenFortschritt[] {
  return THEMEN.map(({ id }) => {
    const liste = eintraege.filter((e) => e.thema === id);
    let begonnen = 0;
    let gefestigt = 0;
    for (const e of liste) {
      const staende = [
        fortschritt[kartenSchluessel(e.id, 'de-ru')],
        fortschritt[kartenSchluessel(e.id, 'ru-de')],
      ];
      const stufen = staende.flatMap((s) => (s ? [s.stufe] : []));
      if (stufen.length > 0) begonnen++;
      if (stufen.some((s) => s >= GEFESTIGT_AB)) gefestigt++;
    }
    return { thema: id, gesamt: liste.length, begonnen, gefestigt };
  });
}

export function anzahlFaellig(
  karten: readonly Karte[],
  fortschritt: Fortschritt,
  tag: Tag,
): number {
  return karten.filter((k) => istFaellig(fortschritt[k.schluessel], tag)).length;
}
