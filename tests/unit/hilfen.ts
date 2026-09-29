import type { Eintrag } from '../../src/daten/schema.ts';
import type { Karte } from '../../src/logik/karten.ts';
import { kartenSchluessel, type Richtung } from '../../src/logik/leitner.ts';

let zaehler = 0;
export function eintrag(teil: Partial<Eintrag> = {}): Eintrag {
  zaehler++;
  return {
    id: `ein-${String(zaehler).padStart(3, '0')}`,
    typ: 'wort',
    thema: 'einkaufen',
    // Eindeutiger kyrillischer Text: Ziffern der Zählnummer als Buchstaben
    russisch: `слово ${String(zaehler).replace(/\d/g, (z) => 'абвгдежзик'[Number(z)] ?? '')}`,
    deutsch: `Wort ${zaehler}`,
    ...teil,
  };
}

export function karte(e: Eintrag, richtung: Richtung = 'de-ru'): Karte {
  return { eintrag: e, richtung, schluessel: kartenSchluessel(e.id, richtung) };
}
