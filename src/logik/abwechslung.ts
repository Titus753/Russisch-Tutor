import type { Eintrag } from '../daten/schema.ts';
import type { Fortschritt, Karte } from './karten.ts';
import { kartenSchluessel } from './leitner.ts';
import { mischen, type Zufall } from './zufall.ts';

/**
 * Abwechslung beim Lernen: Neue Wörter kommen reihum aus allen gewählten Themen, ganz neue
 * Wörter vor „zweiten Richtungen" schon bekannter Wörter, neue und fällige Karten werden
 * gemischt, und gleiche Themen stehen möglichst nie direkt hintereinander.
 */

/** Verteilt die Karten reihum auf ihre Themen (je Durchgang eine Karte pro Thema). */
function reihumNachThema(karten: readonly Karte[], zufall?: Zufall): Karte[] {
  const gruppen = new Map<string, Karte[]>();
  for (const karte of zufall ? mischen(karten, zufall) : karten) {
    const liste = gruppen.get(karte.eintrag.thema) ?? [];
    liste.push(karte);
    gruppen.set(karte.eintrag.thema, liste);
  }
  const reihenfolge = zufall ? mischen([...gruppen.values()], zufall) : [...gruppen.values()];
  const ergebnis: Karte[] = [];
  for (let runde = 0; ergebnis.length < karten.length; runde++) {
    let genommen = false;
    for (const gruppe of reihenfolge) {
      const karte = gruppe[runde];
      if (karte) {
        ergebnis.push(karte);
        genommen = true;
      }
    }
    if (!genommen) break;
  }
  return ergebnis;
}

/**
 * Wählt neue Karten fürs Tageslimit: erst Einträge, von denen noch keine Richtung geübt wurde,
 * dann zweite Richtungen bekannter Einträge; innerhalb davon reihum aus allen Themen.
 * Pro Eintrag höchstens eine neue Karte (`vergeben` = heute schon eingeführte Einträge).
 */
export function waehleNeue(
  unbekannt: readonly Karte[],
  fortschritt: Fortschritt,
  anzahl: number,
  vergeben: ReadonlySet<string>,
  zufall?: Zufall,
): Karte[] {
  const gesperrt = new Set(vergeben);
  const ganzNeu = (k: Karte) =>
    (['de-ru', 'ru-de'] as const).every(
      (richtung) => fortschritt[kartenSchluessel(k.eintrag.id, richtung)] === undefined,
    );
  const ergebnis: Karte[] = [];
  for (const nurGanzNeue of [true, false]) {
    const kandidaten = unbekannt.filter((k) => ganzNeu(k) === nurGanzNeue);
    for (const karte of reihumNachThema(kandidaten, zufall)) {
      if (ergebnis.length >= anzahl) return ergebnis;
      if (gesperrt.has(karte.eintrag.id)) continue;
      gesperrt.add(karte.eintrag.id);
      ergebnis.push(karte);
    }
  }
  return ergebnis;
}

/**
 * Ordnet Karten so um, dass derselbe Eintrag und dasselbe Thema nicht direkt aufeinander folgen,
 * soweit es sich vermeiden lässt. Gewählt wird jeweils aus dem Thema mit den meisten übrigen
 * Karten (verhindert, dass am Ende ein langer Block eines Themas übrig bleibt).
 */
export function entzerren(karten: readonly Karte[]): Karte[] {
  const rest = [...karten];
  const uebrig = new Map<string, number>();
  for (const k of rest) uebrig.set(k.eintrag.thema, (uebrig.get(k.eintrag.thema) ?? 0) + 1);
  const ergebnis: Karte[] = [];
  while (rest.length > 0) {
    const letzte = ergebnis.at(-1);
    let beste = -1;
    for (let i = 0; i < rest.length; i++) {
      const k = rest[i] as Karte;
      if (
        letzte &&
        (k.eintrag.id === letzte.eintrag.id || k.eintrag.thema === letzte.eintrag.thema)
      ) {
        continue;
      }
      if (
        beste === -1 ||
        (uebrig.get(k.eintrag.thema) ?? 0) > (uebrig.get((rest[beste] as Karte).eintrag.thema) ?? 0)
      ) {
        beste = i;
      }
    }
    // Notlösung: wenigstens nicht denselben Eintrag direkt wiederholen
    if (beste === -1) beste = rest.findIndex((k) => k.eintrag.id !== letzte?.eintrag.id);
    if (beste === -1) beste = 0;
    const [karte] = rest.splice(beste, 1);
    if (!karte) break;
    uebrig.set(karte.eintrag.thema, (uebrig.get(karte.eintrag.thema) ?? 1) - 1);
    ergebnis.push(karte);
  }
  return ergebnis;
}

/** Mischt neue Karten gleichmäßig zwischen die fälligen und entzerrt die Reihenfolge. */
export function mischeAbwechselnd(faellige: readonly Karte[], neue: readonly Karte[]): Karte[] {
  const gesamt = faellige.length + neue.length;
  const gemischt: Karte[] = [];
  let f = 0;
  let n = 0;
  for (let i = 0; i < gesamt; i++) {
    const sollNeu = Math.round(((i + 1) * neue.length) / gesamt);
    const nimmNeu = f >= faellige.length || (n < neue.length && n < sollNeu);
    gemischt.push((nimmNeu ? neue[n++] : faellige[f++]) as Karte);
  }
  return entzerren(gemischt);
}

// ---------- Gedächtnis für Quiz, Tippen und Hören ----------

/** Wie viele zuletzt gezeigte Einträge beim Üben gemieden werden. */
export const VERLAUF_LAENGE = 12;

export type VerlaufEintrag = Pick<Eintrag, 'id' | 'thema'>;

let verlauf: VerlaufEintrag[] = [];

/** Merkt sich einen gezeigten Eintrag (nur für die laufende Sitzung, nichts wird gespeichert). */
export function merkeGezeigt(eintrag: VerlaufEintrag): void {
  verlauf = [
    ...verlauf.filter((v) => v.id !== eintrag.id),
    { id: eintrag.id, thema: eintrag.thema },
  ].slice(-VERLAUF_LAENGE);
}

export function aktuellerVerlauf(): readonly VerlaufEintrag[] {
  return verlauf;
}

export function verlaufLeeren(): void {
  verlauf = [];
}

/** Zieht eine Karte zufällig, schwerer gewichtet bei vielen bisherigen Fehlern. */
export function gewichtetZiehen(
  karten: readonly Karte[],
  fortschritt: Fortschritt,
  zufall: Zufall,
): Karte | undefined {
  const gewichte = karten.map((k) => 1 + Math.min(fortschritt[k.schluessel]?.fehler ?? 0, 5) * 0.5);
  const summe = gewichte.reduce((a, b) => a + b, 0);
  let wurf = zufall() * summe;
  for (let i = 0; i < karten.length; i++) {
    wurf -= gewichte[i] ?? 0;
    if (wurf < 0) return karten[i];
  }
  return karten.at(-1);
}
