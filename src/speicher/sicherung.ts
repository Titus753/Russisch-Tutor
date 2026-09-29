import { z } from 'zod';
import { neuerStand, pruefeStand, type Stand } from './schema.ts';
import { migriereDaten } from './speicher.ts';

/**
 * Sicherungsdatei: exportieren und – als feindliche Eingabe behandelt – importieren.
 * Format: { format, version, erstellt, stand }
 */
export const SICHERUNG_FORMAT = 'slovo-za-slovo-sicherung';
export const SICHERUNG_VERSION = 1;
/** Größenlimit vor dem Lesen: auch 20 000 Karten passen bequem hinein. */
export const MAX_SICHERUNG_BYTES = 5 * 1024 * 1024;

const HuelleSchema = z
  .object({
    format: z.literal(SICHERUNG_FORMAT),
    version: z.number().int().min(1).max(SICHERUNG_VERSION),
    erstellt: z.string().max(40).optional(),
    stand: z.unknown(),
  })
  .strict();

export function sicherungErstellen(stand: Stand, jetzt = new Date()): string {
  return JSON.stringify(
    { format: SICHERUNG_FORMAT, version: SICHERUNG_VERSION, erstellt: jetzt.toISOString(), stand },
    null,
    2,
  );
}

export function sicherungsDateiname(jetzt = new Date()): string {
  const d = `${jetzt.getFullYear()}-${String(jetzt.getMonth() + 1).padStart(2, '0')}-${String(jetzt.getDate()).padStart(2, '0')}`;
  return `slovo-za-slovo-sicherung-${d}.json`;
}

export type ImportErgebnis =
  | { ok: true; stand: Stand; verworfen: number; erstellt: Date | null }
  | { ok: false; fehler: string };

/** Prüft den Inhalt einer Sicherungsdatei. Wirft nie; jede Abweichung ergibt eine Fehlermeldung. */
export function sicherungPruefen(text: string): ImportErgebnis {
  if (new TextEncoder().encode(text).length > MAX_SICHERUNG_BYTES) {
    return { ok: false, fehler: 'Die Datei ist zu groß für eine Sicherung.' };
  }
  let roh: unknown;
  try {
    roh = JSON.parse(text);
  } catch {
    return { ok: false, fehler: 'Die Datei ist keine gültige Sicherung (kein JSON).' };
  }
  const huelle = HuelleSchema.safeParse(roh);
  if (!huelle.success) {
    return {
      ok: false,
      fehler: 'Die Datei ist keine Sicherung dieser App oder stammt aus einer neueren Version.',
    };
  }
  let migriert: unknown;
  try {
    migriert = migriereDaten(huelle.data.stand);
  } catch {
    migriert = null;
  }
  const geprueft = pruefeStand(migriert);
  if (!geprueft) return { ok: false, fehler: 'Der Lernstand in der Datei ist beschädigt.' };
  const erstellt = huelle.data.erstellt ? new Date(huelle.data.erstellt) : null;
  return {
    ok: true,
    stand: geprueft.stand,
    verworfen: geprueft.verworfen,
    erstellt: erstellt && !Number.isNaN(erstellt.getTime()) ? erstellt : null,
  };
}

/** Liest eine vom Nutzer gewählte Datei mit Größenprüfung vor dem Lesen. */
export async function sicherungLesen(datei: Blob): Promise<ImportErgebnis> {
  if (datei.size > MAX_SICHERUNG_BYTES) {
    return { ok: false, fehler: 'Die Datei ist zu groß für eine Sicherung.' };
  }
  try {
    return sicherungPruefen(await datei.text());
  } catch {
    return { ok: false, fehler: 'Die Datei konnte nicht gelesen werden.' };
  }
}

/** Fortschritt löschen: Karten, Lernserie und Tageszähler weg, Einstellungen bleiben. */
export function fortschrittGeloescht(stand: Stand): Stand {
  return {
    ...neuerStand(),
    einstellungen: stand.einstellungen,
    tutorialGesehen: stand.tutorialGesehen,
  };
}
