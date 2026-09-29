import { describe, expect, it } from 'vitest';
import { neuerStand, type Stand } from '../../src/speicher/schema.ts';
import {
  fortschrittGeloescht,
  MAX_SICHERUNG_BYTES,
  sicherungErstellen,
  sicherungLesen,
  sicherungPruefen,
  sicherungsDateiname,
} from '../../src/speicher/sicherung.ts';

const karte = {
  stufe: 3,
  faellig: '2026-04-01',
  zuletzt: '2026-03-25',
  wiederholungen: 4,
  fehler: 1,
};
const stand = (): Stand => ({
  ...neuerStand(),
  karten: { 'tie-001:de-ru': karte },
  lerntage: ['2026-03-24', '2026-03-25'],
  tutorialGesehen: true,
});

describe('Sicherung', () => {
  it('Export und Import ergeben exakt denselben Stand', () => {
    const s = stand();
    const ergebnis = sicherungPruefen(sicherungErstellen(s, new Date('2026-03-25T08:00:00Z')));
    expect(ergebnis).toEqual({
      ok: true,
      stand: s,
      verworfen: 0,
      erstellt: new Date('2026-03-25T08:00:00Z'),
    });
  });

  it('Dateiname enthält das Datum', () => {
    expect(sicherungsDateiname(new Date(2026, 2, 5))).toBe(
      'slovo-za-slovo-sicherung-2026-03-05.json',
    );
  });

  it.each([
    ['leerer Text', ''],
    ['kein JSON', '{kaputt'],
    ['JSON-Zahl', '42'],
    ['null', 'null'],
    ['Array', '[]'],
    ['falsches Format', JSON.stringify({ format: 'x', version: 1, stand: {} })],
    ['Version 0', JSON.stringify({ format: 'slovo-za-slovo-sicherung', version: 0, stand: {} })],
    [
      'neuere Version',
      JSON.stringify({ format: 'slovo-za-slovo-sicherung', version: 2, stand: {} }),
    ],
    [
      'Zusatzfeld',
      JSON.stringify({ format: 'slovo-za-slovo-sicherung', version: 1, stand: {}, x: 1 }),
    ],
    ['Stand fehlt', JSON.stringify({ format: 'slovo-za-slovo-sicherung', version: 1 })],
    [
      'Stand kaputt',
      JSON.stringify({
        format: 'slovo-za-slovo-sicherung',
        version: 1,
        stand: { version: 1, karten: [] },
      }),
    ],
  ])('lehnt ab: %s', (_n, text) => {
    const ergebnis = sicherungPruefen(text);
    expect(ergebnis.ok).toBe(false);
  });

  it('verwirft ungültige Karten, meldet ihre Anzahl und lässt keine Prototype Pollution zu', () => {
    const text = `{"format":"slovo-za-slovo-sicherung","version":1,"stand":{"version":1,"karten":{
      "tie-001:de-ru":${JSON.stringify(karte)},"__proto__":{"stufe":1},"tie-002:de-ru":{"stufe":99}}}}`;
    const ergebnis = sicherungPruefen(text);
    expect(ergebnis.ok && ergebnis.verworfen).toBe(2);
    expect(ergebnis.ok && Object.keys(ergebnis.stand.karten)).toEqual(['tie-001:de-ru']);
    expect(({} as Record<string, unknown>).stufe).toBeUndefined();
  });

  it('ignoriert ein ungültiges Erstellungsdatum statt abzubrechen', () => {
    const text = JSON.stringify({
      format: 'slovo-za-slovo-sicherung',
      version: 1,
      erstellt: 'gestern',
      stand: stand(),
    });
    const ergebnis = sicherungPruefen(text);
    expect(ergebnis.ok && ergebnis.erstellt).toBeNull();
  });

  it('lehnt zu große Dateien schon vor dem Lesen ab', async () => {
    const riesig = new Blob([new Uint8Array(MAX_SICHERUNG_BYTES + 1)]);
    expect(await sicherungLesen(riesig)).toEqual({
      ok: false,
      fehler: 'Die Datei ist zu groß für eine Sicherung.',
    });
  });

  it('Fortschritt löschen behält Einstellungen und Einführungs-Status', () => {
    const s = {
      ...stand(),
      einstellungen: { ...stand().einstellungen, schrift: 'gross' as const },
    };
    const geloescht = fortschrittGeloescht(s);
    expect(geloescht.karten).toEqual({});
    expect(geloescht.lerntage).toEqual([]);
    expect(geloescht.einstellungen.schrift).toBe('gross');
    expect(geloescht.tutorialGesehen).toBe(true);
  });
});
