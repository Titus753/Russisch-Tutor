import type { Stand } from '../speicher/schema.ts';
import { MAX_LERNTAGE } from '../speicher/schema.ts';
import type { Tag } from './datum.ts';
import type { Karte } from './karten.ts';
import { bewerte, ergebnisUebung, type Bewertung, type KartenStand } from './leitner.ts';

/** IDs der heute neu eingeführten Einträge (leer, wenn der gespeicherte Tag nicht heute ist). */
export function neueHeute(stand: Stand, tag: Tag): string[] {
  return stand.neuHeute?.tag === tag ? stand.neuHeute.ids : [];
}

/** Tageslimit für neue Einträge inklusive „10 neue Karten dazunehmen". */
export function neueLimit(stand: Stand, tag: Tag): number {
  return stand.einstellungen.neueProTag + (stand.neuHeute?.tag === tag ? stand.neuHeute.zusatz : 0);
}

export function neueDazunehmen(stand: Stand, tag: Tag, anzahl = 10): Stand {
  const bisher = stand.neuHeute?.tag === tag ? stand.neuHeute : { tag, ids: [], zusatz: 0 };
  return { ...stand, neuHeute: { ...bisher, zusatz: Math.min(1_000, bisher.zusatz + anzahl) } };
}

function mitErgebnis(stand: Stand, karte: Karte, neu: KartenStand | undefined, tag: Tag): Stand {
  if (neu === undefined) return stand;
  const warNeu = stand.karten[karte.schluessel] === undefined;
  const heuteNeu = neueHeute(stand, tag);
  const zusatz = stand.neuHeute?.tag === tag ? stand.neuHeute.zusatz : 0;
  return {
    ...stand,
    karten: { ...stand.karten, [karte.schluessel]: neu },
    lerntage: stand.lerntage.includes(tag)
      ? stand.lerntage
      : [...stand.lerntage, tag].sort().slice(-MAX_LERNTAGE),
    neuHeute:
      warNeu && !heuteNeu.includes(karte.eintrag.id)
        ? { tag, ids: [...heuteNeu, karte.eintrag.id], zusatz }
        : stand.neuHeute,
  };
}

/** Bewertung einer Karteikarte übernehmen. */
export function nachBewertung(stand: Stand, karte: Karte, bewertung: Bewertung, tag: Tag): Stand {
  return mitErgebnis(stand, karte, bewerte(stand.karten[karte.schluessel], bewertung, tag), tag);
}

/** Ergebnis aus Quiz, Tippen oder Hören übernehmen. */
export function nachUebung(stand: Stand, karte: Karte, richtig: boolean, tag: Tag): Stand {
  return mitErgebnis(
    stand,
    karte,
    ergebnisUebung(stand.karten[karte.schluessel], richtig, tag),
    tag,
  );
}
