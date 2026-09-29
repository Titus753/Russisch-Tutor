import type { Eintrag } from '../daten/schema.ts';
import { INHALTSARTEN, THEMEN } from '../daten/themen.ts';

/** Russischer Anzeigetext: mit Betonungszeichen, Genusvarianten als „m / w". */
export function russischAnzeige(e: Eintrag): string {
  if (e.genusvarianten) return `${e.genusvarianten.m} / ${e.genusvarianten.w}`;
  return e.betonung ?? e.russisch;
}

export function themaName(e: Eintrag): string {
  return THEMEN.find((t) => t.id === e.thema)?.name ?? '';
}

export function typName(e: Eintrag): string {
  const namen = { wort: 'Wort', satz: 'Satz', redewendung: 'Redewendung' } as const;
  return INHALTSARTEN.some((a) => a.id === e.typ) ? namen[e.typ] : '';
}
