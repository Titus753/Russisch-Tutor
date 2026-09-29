import { createStore, del, get, setMany } from 'idb-keyval';
import { AKTUELLE_VERSION, neuerStand, pruefeStand, type Stand } from './schema.ts';

/** Minimale Schnittstelle zum Speicher; in Tests und ohne IndexedDB durch eine Map ersetzt. */
export interface Ablage {
  get(schluessel: string): Promise<unknown>;
  /** Schreibt alle Paare in einer Transaktion (alles oder nichts). */
  setMany(paare: [string, unknown][]): Promise<void>;
  del(schluessel: string): Promise<void>;
}

export const SCHLUESSEL = {
  stand: 'stand',
  vorher: 'stand-vorher',
  kaputt: 'stand-kaputt',
  vorMigration: (version: number) => `sicherung-vor-migration-v${version}`,
} as const;

export function indexedDbAblage(): Ablage {
  const store = createStore('slovo-za-slovo', 'daten');
  return {
    get: (s) => get(s, store),
    setMany: (paare) => setMany(paare, store),
    del: (s) => del(s, store),
  };
}

/** Flüchtige Ablage im Arbeitsspeicher (Tests, oder wenn IndexedDB z. B. im privaten Modus fehlt). */
export function speicherAblage(start: Record<string, unknown> = {}): Ablage & {
  daten: Map<string, unknown>;
} {
  const daten = new Map(Object.entries(start));
  return {
    daten,
    get: async (s) => structuredClone(daten.get(s)),
    setMany: async (paare) => {
      for (const [s, w] of paare) daten.set(s, structuredClone(w));
    },
    del: async (s) => {
      daten.delete(s);
    },
  };
}

/** Migration von Version n auf n + 1. Neue Einträge hier ergänzen, alte nie ändern. */
export type Migration = (alt: Record<string, unknown>) => Record<string, unknown>;
export const MIGRATIONEN: Readonly<Record<number, Migration>> = {};

export type LadeHinweis = 'neu' | 'ok' | 'wiederhergestellt' | 'zurueckgesetzt';

export interface LadeErgebnis {
  stand: Stand;
  hinweis: LadeHinweis;
  /** Anzahl verworfener, ungültiger Karteneinträge. */
  verworfen: number;
}

/** Bringt Rohdaten auf die aktuelle Version. Vorher wird der alte Stand gesichert. */
async function migriere(
  ablage: Ablage,
  roh: unknown,
  migrationen: Readonly<Record<number, Migration>>,
): Promise<unknown> {
  if (typeof roh !== 'object' || roh === null) return roh;
  let daten = roh as Record<string, unknown>;
  const version = daten.version;
  if (typeof version !== 'number' || !Number.isInteger(version) || version >= AKTUELLE_VERSION) {
    return daten;
  }
  await ablage.setMany([[SCHLUESSEL.vorMigration(version), roh]]);
  for (let v = version; v < AKTUELLE_VERSION; v++) {
    const schritt = migrationen[v];
    if (!schritt) return null;
    daten = { ...schritt(daten), version: v + 1 };
  }
  return daten;
}

async function versuche(
  ablage: Ablage,
  schluessel: string,
  migrationen: Readonly<Record<number, Migration>>,
) {
  try {
    const roh = await ablage.get(schluessel);
    if (roh === undefined) return { leer: true as const };
    return {
      leer: false as const,
      roh,
      ergebnis: pruefeStand(await migriere(ablage, roh, migrationen)),
    };
  } catch {
    // Kaputte Migration oder Lesefehler: wie ungültige Daten behandeln
    return { leer: false as const, roh: undefined, ergebnis: null };
  }
}

/**
 * Lädt den Lernstand. Rückfall-Kette: aktueller Stand → vorheriger gültiger Stand → neuer Stand.
 * Kaputte Daten werden nie stillschweigend gelöscht, sondern unter „stand-kaputt" aufbewahrt.
 */
export async function laden(
  ablage: Ablage,
  migrationen: Readonly<Record<number, Migration>> = MIGRATIONEN,
): Promise<LadeErgebnis> {
  const aktuell = await versuche(ablage, SCHLUESSEL.stand, migrationen);
  if (aktuell.leer) return { stand: neuerStand(), hinweis: 'neu', verworfen: 0 };
  if (aktuell.ergebnis) return { ...aktuell.ergebnis, hinweis: 'ok' };

  if (aktuell.roh !== undefined) {
    await ablage.setMany([[SCHLUESSEL.kaputt, aktuell.roh]]).catch(() => undefined);
  }
  const vorher = await versuche(ablage, SCHLUESSEL.vorher, migrationen);
  if (!vorher.leer && vorher.ergebnis) return { ...vorher.ergebnis, hinweis: 'wiederhergestellt' };
  return { stand: neuerStand(), hinweis: 'zurueckgesetzt', verworfen: 0 };
}

/**
 * Speichert Stände nacheinander (keine überholenden Schreibvorgänge). Vor dem Schreiben wird
 * geprüft; ungültige Stände werden abgelehnt. Der zuletzt gespeicherte gültige Stand wandert
 * in derselben Transaktion nach „stand-vorher".
 */
export function erstelleSpeicherer(ablage: Ablage, letzterGueltiger: Stand | null = null) {
  let kette: Promise<void> = Promise.resolve();
  let vorher = letzterGueltiger;
  return {
    speichern(stand: Stand): Promise<void> {
      const pruefung = pruefeStand(stand);
      if (!pruefung || pruefung.verworfen > 0) {
        return Promise.reject(new Error('Ungültiger Stand wird nicht gespeichert'));
      }
      const kopie = structuredClone(pruefung.stand);
      const schritt = kette.then(async () => {
        const paare: [string, unknown][] = [[SCHLUESSEL.stand, kopie]];
        if (vorher) paare.push([SCHLUESSEL.vorher, vorher]);
        await ablage.setMany(paare);
        vorher = kopie;
      });
      // Fehler eines Schritts dürfen die Kette für spätere Speicherungen nicht blockieren
      kette = schritt.catch(() => undefined);
      return schritt;
    },
  };
}

/**
 * Bittet den Browser, die Daten dauerhaft zu behalten. Ohne das darf z. B. Safari die Daten
 * einer nicht installierten Web-App nach längerer Nichtnutzung löschen.
 */
export async function dauerhaftAnfragen(): Promise<
  'dauerhaft' | 'nicht-dauerhaft' | 'nicht-unterstuetzt'
> {
  const storage = globalThis.navigator?.storage;
  if (!storage?.persist) return 'nicht-unterstuetzt';
  try {
    if (await storage.persisted()) return 'dauerhaft';
    return (await storage.persist()) ? 'dauerhaft' : 'nicht-dauerhaft';
  } catch {
    return 'nicht-dauerhaft';
  }
}
