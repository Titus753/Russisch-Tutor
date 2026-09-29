import type { Eintrag } from '../daten/schema.ts';

/**
 * Vergleichsform für getippte Antworten: klein, ё = е, ohne Betonungszeichen,
 * Satzzeichen weg, Binde-/Gedankenstriche als Leerzeichen, Leerzeichen normalisiert.
 */
export function normalisiere(text: string): string {
  return text
    .normalize('NFD')
    .replace(/́/g, '')
    .normalize('NFC')
    .toLowerCase()
    .replaceAll('ё', 'е')
    .replace(/[-‐‑–—]/g, ' ')
    .replace(/[^\p{L}\p{N} ]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Levenshtein-Abstand (Einfügen, Löschen, Ersetzen je 1). Eingaben sind kurz, O(n·m) genügt. */
export function levenshtein(a: string, b: string): number {
  const x = [...a];
  const y = [...b];
  let vorher = Array.from({ length: y.length + 1 }, (_, i) => i);
  for (let i = 1; i <= x.length; i++) {
    const zeile = [i];
    for (let j = 1; j <= y.length; j++) {
      const kosten = x[i - 1] === y[j - 1] ? 0 : 1;
      zeile[j] = Math.min(
        (vorher[j] ?? 0) + 1,
        (zeile[j - 1] ?? 0) + 1,
        (vorher[j - 1] ?? 0) + kosten,
      );
    }
    vorher = zeile;
  }
  return vorher[y.length] ?? 0;
}

/** Maximale Eingabelänge beim Tippen (Schutz vor riesigen Eingaben im O(n·m)-Vergleich). */
export const MAX_EINGABE = 300;

export type Pruefergebnis = 'richtig' | 'fast' | 'falsch';

/** Erlaubter Tippfehler-Abstand für „Fast richtig": max(1, Länge/12). */
export function toleranz(ziel: string): number {
  return Math.max(1, Math.floor([...normalisiere(ziel)].length / 12));
}

/** Prüft eine getippte Antwort (DE→RU). Bei Genusvarianten zählt jede Form. */
export function pruefeEingabe(
  eingabe: string,
  eintrag: Eintrag,
): { ergebnis: Pruefergebnis; ziel: string } {
  const ziele = eintrag.genusvarianten
    ? [eintrag.genusvarianten.m, eintrag.genusvarianten.w]
    : [eintrag.russisch];
  const ein = normalisiere(eingabe.slice(0, MAX_EINGABE));
  if (ein === '') return { ergebnis: 'falsch', ziel: eintrag.russisch };

  let bestes = { ergebnis: 'falsch' as Pruefergebnis, ziel: eintrag.russisch, abstand: Infinity };
  for (const ziel of ziele) {
    const abstand = levenshtein(ein, normalisiere(ziel));
    if (abstand < bestes.abstand) {
      const ergebnis = abstand === 0 ? 'richtig' : abstand <= toleranz(ziel) ? 'fast' : 'falsch';
      bestes = { ergebnis, ziel, abstand };
    }
  }
  return { ergebnis: bestes.ergebnis, ziel: bestes.ziel };
}

export interface Abschnitt {
  text: string;
  fehler: boolean;
}

const vergleichbar = (z: string) => z.toLowerCase().replace('ё', 'е');
const istBuchstabe = (z: string) => /[\p{L}\p{N}]/u.test(z);

/**
 * Markiert in der Lösung die Buchstaben, die in der Eingabe fehlen oder falsch sind
 * (für die Anzeige bei „Fast richtig"). Satzzeichen und Leerzeichen gelten nie als Fehler.
 */
export function abweichungen(eingabe: string, loesung: string): Abschnitt[] {
  const ziel = [...loesung];
  const zIdx = ziel.flatMap((z, i) => (istBuchstabe(z) ? [i] : []));
  const zb = zIdx.map((i) => vergleichbar(ziel[i] as string));
  const eb = [...eingabe.slice(0, MAX_EINGABE)].filter(istBuchstabe).map(vergleichbar);

  // Tabelle für Levenshtein mit Rückverfolgung
  const d: number[][] = Array.from({ length: zb.length + 1 }, (_, i) =>
    Array.from({ length: eb.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  const zelle = (i: number, j: number) => d[i]?.[j] ?? 0;
  for (let i = 1; i <= zb.length; i++) {
    for (let j = 1; j <= eb.length; j++) {
      const kosten = zb[i - 1] === eb[j - 1] ? 0 : 1;
      (d[i] as number[])[j] = Math.min(
        zelle(i - 1, j) + 1,
        zelle(i, j - 1) + 1,
        zelle(i - 1, j - 1) + kosten,
      );
    }
  }
  const falsch = new Set<number>();
  let i = zb.length;
  let j = eb.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && zelle(i, j) === zelle(i - 1, j - 1) + (zb[i - 1] === eb[j - 1] ? 0 : 1)) {
      if (zb[i - 1] !== eb[j - 1]) falsch.add(zIdx[i - 1] as number);
      i--;
      j--;
    } else if (i > 0 && zelle(i, j) === zelle(i - 1, j) + 1) {
      falsch.add(zIdx[i - 1] as number); // fehlt in der Eingabe
      i--;
    } else {
      j--; // überzähliger Buchstabe in der Eingabe
    }
  }

  const abschnitte: Abschnitt[] = [];
  ziel.forEach((zeichen, idx) => {
    const fehler = falsch.has(idx);
    const letzter = abschnitte.at(-1);
    if (letzter && letzter.fehler === fehler) letzter.text += zeichen;
    else abschnitte.push({ text: zeichen, fehler });
  });
  return abschnitte;
}

/** Tipp: die ersten `anzahl` Buchstaben der Lösung (Leer-/Satzzeichen dazwischen bleiben), dann „…". */
export function tipp(loesung: string, anzahl: number): string {
  let buchstaben = 0;
  let ende = 0;
  const zeichen = [...loesung];
  while (ende < zeichen.length && buchstaben < anzahl) {
    if (istBuchstabe(zeichen[ende] as string)) buchstaben++;
    ende++;
  }
  const teil = zeichen.slice(0, ende).join('');
  return ende < zeichen.length ? `${teil}…` : teil;
}
