import { z } from 'zod';
import { INHALTSARTEN, THEMA_IDS } from '../daten/themen.ts';
import { TAG_FORMAT } from '../logik/datum.ts';
import { MAX_STUFE } from '../logik/leitner.ts';

// zod erzeugt sonst zur Beschleunigung Code per `new Function` (eval). Die CSP und Trusted Types
// blockieren das ohnehin; so wird es gar nicht erst versucht.
z.config({ jitless: true });

/**
 * Format des gespeicherten Lernstands. Alles, was aus dem Speicher oder einer Import-Datei
 * kommt, gilt als feindlich und läuft durch diese Prüfung (Allowlists, Wertebereiche, Grenzen).
 */
export const AKTUELLE_VERSION = 1;

export const MAX_KARTEN = 20_000;
export const MAX_LERNTAGE = 1_000;
const MAX_ZAEHLER = 1_000_000;

export const TagSchema = z
  .string()
  .regex(TAG_FORMAT)
  .refine((t) => {
    const [j, m, d] = t.split('-').map(Number) as [number, number, number];
    const datum = new Date(j, m - 1, d);
    return j >= 2000 && j <= 2200 && datum.getMonth() === m - 1 && datum.getDate() === d;
  }, 'ungültiges Datum');

export const SCHLUESSEL_FORMAT = /^[a-z]{3}-\d{3,4}:(de-ru|ru-de)$/;

export const KartenStandSchema = z
  .object({
    stufe: z.number().int().min(0).max(MAX_STUFE),
    faellig: TagSchema,
    zuletzt: TagSchema,
    wiederholungen: z.number().int().min(0).max(MAX_ZAEHLER),
    fehler: z.number().int().min(0).max(MAX_ZAEHLER),
  })
  .strict();

const INHALTSART_IDS = INHALTSARTEN.map((a) => a.id) as ['wort', 'satz', 'redewendung'];

/** Ohne Duplikate, Reihenfolge der Allowlist. */
const ohneDoppelte = <T extends string>(erlaubt: readonly T[]) =>
  z
    .array(z.enum(erlaubt as [T, ...T[]]))
    .max(erlaubt.length * 2)
    .transform((liste) => erlaubt.filter((x) => liste.includes(x)))
    .refine((liste) => liste.length > 0, 'mindestens eins muss aktiv bleiben');

export const STANDARD_EINSTELLUNGEN = {
  themen: [...THEMA_IDS],
  inhaltsarten: [...INHALTSART_IDS],
  richtung: 'gemischt' as const,
  neueProTag: 20 as const,
  vorlesen: false,
  eingabe: 'app' as const,
  schrift: 'normal' as const,
  farbmodus: 'system' as const,
  kontrast: false,
  begruessung: true,
};

/** Jedes Feld fällt einzeln auf den Standard zurück, damit ein kaputter Wert nicht alles verwirft. */
export const EinstellungenSchema = z
  .object({
    themen: ohneDoppelte(THEMA_IDS).catch(STANDARD_EINSTELLUNGEN.themen),
    inhaltsarten: ohneDoppelte(INHALTSART_IDS).catch(STANDARD_EINSTELLUNGEN.inhaltsarten),
    richtung: z.enum(['de-ru', 'ru-de', 'gemischt']).catch(STANDARD_EINSTELLUNGEN.richtung),
    neueProTag: z
      .union([z.literal(10), z.literal(20), z.literal(30), z.literal(50)])
      .catch(STANDARD_EINSTELLUNGEN.neueProTag),
    vorlesen: z.boolean().catch(STANDARD_EINSTELLUNGEN.vorlesen),
    eingabe: z.enum(['app', 'system']).catch(STANDARD_EINSTELLUNGEN.eingabe),
    schrift: z
      .enum(['klein', 'normal', 'gross', 'sehr-gross'])
      .catch(STANDARD_EINSTELLUNGEN.schrift),
    farbmodus: z.enum(['system', 'hell', 'dunkel']).catch(STANDARD_EINSTELLUNGEN.farbmodus),
    kontrast: z.boolean().catch(STANDARD_EINSTELLUNGEN.kontrast),
    // Neu hinzugekommen: fehlt in älteren Ständen → Standard (keine Migration nötig)
    begruessung: z.boolean().catch(STANDARD_EINSTELLUNGEN.begruessung),
  })
  .strip();

const NeuHeuteSchema = z
  .object({
    tag: TagSchema,
    ids: z.array(z.string().regex(/^[a-z]{3}-\d{3,4}$/)).max(1_000),
    zusatz: z.number().int().min(0).max(1_000),
  })
  .strict();

export type KartenStandGespeichert = z.infer<typeof KartenStandSchema>;
export type Einstellungen = z.infer<typeof EinstellungenSchema>;

export interface Stand {
  version: typeof AKTUELLE_VERSION;
  karten: Record<string, KartenStandGespeichert>;
  einstellungen: Einstellungen;
  lerntage: string[];
  neuHeute: z.infer<typeof NeuHeuteSchema> | null;
  tutorialGesehen: boolean;
}

export function neuerStand(): Stand {
  return {
    version: AKTUELLE_VERSION,
    karten: {},
    einstellungen: EinstellungenSchema.parse({}),
    lerntage: [],
    neuHeute: null,
    tutorialGesehen: false,
  };
}

const istObjekt = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);

/**
 * Prüft einen Stand der aktuellen Version. Einzelne kaputte Karten oder Einstellungen werden
 * verworfen bzw. auf Standard gesetzt; ist die Grundstruktur kaputt, kommt `null` zurück.
 */
export function pruefeStand(roh: unknown): { stand: Stand; verworfen: number } | null {
  if (!istObjekt(roh) || roh.version !== AKTUELLE_VERSION || !istObjekt(roh.karten)) return null;

  const eintraege = Object.entries(roh.karten);
  if (eintraege.length > MAX_KARTEN) return null;
  const karten: Record<string, KartenStandGespeichert> = {};
  let verworfen = 0;
  for (const [schluessel, wert] of eintraege) {
    const karte = KartenStandSchema.safeParse(wert);
    // Nur Schlüssel aus der Allowlist: „__proto__" & Co. können nie hineingelangen
    if (SCHLUESSEL_FORMAT.test(schluessel) && karte.success) karten[schluessel] = karte.data;
    else verworfen++;
  }

  const lerntage = Array.isArray(roh.lerntage)
    ? [...new Set(roh.lerntage.filter((t) => TagSchema.safeParse(t).success) as string[])]
        .sort()
        .slice(-MAX_LERNTAGE)
    : [];
  const neuHeute = NeuHeuteSchema.safeParse(roh.neuHeute);

  return {
    stand: {
      version: AKTUELLE_VERSION,
      karten,
      einstellungen: EinstellungenSchema.parse(
        istObjekt(roh.einstellungen) ? roh.einstellungen : {},
      ),
      lerntage,
      neuHeute: neuHeute.success ? neuHeute.data : null,
      tutorialGesehen: roh.tutorialGesehen === true,
    },
    verworfen,
  };
}
