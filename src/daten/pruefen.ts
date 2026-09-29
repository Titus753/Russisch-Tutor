import { DateiSchema, type Eintrag } from './schema.ts';
import { THEMEN } from './themen.ts';

/** Vergleichsform für die Duplikat-Prüfung: klein, ё = е, nur Buchstaben/Ziffern/Leerzeichen. */
export function vergleichsform(text: string): string {
  return text
    .toLowerCase()
    .replaceAll('ё', 'е')
    .replace(/[^\p{L}\p{N} ]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Prüft alle Vokabeldateien. Liefert eine Liste von Fehlermeldungen (leer = alles gültig).
 * @param dateien Dateiname → geparster JSON-Inhalt
 */
export function pruefeVokabular(dateien: Record<string, unknown>): {
  fehler: string[];
  eintraege: Eintrag[];
} {
  const fehler: string[] = [];
  const eintraege: Eintrag[] = [];

  for (const [datei, inhalt] of Object.entries(dateien)) {
    const ergebnis = DateiSchema.safeParse(inhalt);
    if (!ergebnis.success) {
      for (const issue of ergebnis.error.issues) {
        const pfad = issue.path.join('.');
        const index = typeof issue.path[0] === 'number' ? issue.path[0] : -1;
        const id = Array.isArray(inhalt) ? (inhalt[index] as { id?: unknown } | undefined)?.id : '';
        fehler.push(`${datei} [${pfad}${id ? `, id ${String(id)}` : ''}]: ${issue.message}`);
      }
      continue;
    }
    // Dateiname muss zum Thema passen (data/vokabeln/<thema>.json)
    const erwartet = datei.replace(/^.*\//, '').replace(/\.json$/, '');
    for (const e of ergebnis.data) {
      if (e.thema !== erwartet) fehler.push(`${datei}: ${e.id} hat thema „${e.thema}"`);
      const kuerzel = THEMEN.find((t) => t.id === e.thema)?.kuerzel;
      if (!e.id.startsWith(`${kuerzel}-`)) {
        fehler.push(`${datei}: ${e.id} passt nicht zum Themenkürzel „${kuerzel}"`);
      }
    }
    eintraege.push(...ergebnis.data);
  }

  const ids = new Map<string, number>();
  const texte = new Map<string, string>();
  for (const e of eintraege) {
    ids.set(e.id, (ids.get(e.id) ?? 0) + 1);
    const schluessel = vergleichsform(e.russisch);
    const vorher = texte.get(schluessel);
    if (vorher) fehler.push(`Doppelter Eintrag: ${e.id} „${e.russisch}" = ${vorher}`);
    else texte.set(schluessel, e.id);
  }
  for (const [id, anzahl] of ids) if (anzahl > 1) fehler.push(`Doppelte ID: ${id} (${anzahl}×)`);

  return { fehler, eintraege };
}
