import { describe, expect, it } from 'vitest';
import { plusTage, tageZwischen, tagVon } from '../../src/logik/datum.ts';
import { bewerte, ergebnisUebung, istFaellig, type KartenStand } from '../../src/logik/leitner.ts';

const T = '2026-03-10';
const stand = (stufe: number, faellig = T): KartenStand => ({
  stufe,
  faellig,
  zuletzt: '2026-03-01',
  wiederholungen: 3,
  fehler: 1,
});

describe('Datum', () => {
  it('rechnet Tage über Monats- und Jahresgrenzen und Zeitumstellung', () => {
    expect(plusTage('2026-01-31', 1)).toBe('2026-02-01');
    expect(plusTage('2026-12-31', 1)).toBe('2027-01-01');
    expect(plusTage('2026-03-28', 2)).toBe('2026-03-30'); // Sommerzeit am 29.03.
    expect(plusTage('2028-02-28', 1)).toBe('2028-02-29');
    expect(tageZwischen('2026-03-01', '2026-04-05')).toBe(35);
    expect(tagVon(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});

describe('bewerte (Leitner 0–5, Abstände 0/1/3/7/16/35)', () => {
  it.each([
    // [Ausgangsstufe, Bewertung, neue Stufe, Tage bis fällig]
    [undefined, 'gut', 1, 1],
    [undefined, 'leicht', 2, 3],
    [undefined, 'schwer', 1, 1],
    [undefined, 'nochmal', 0, 0],
    [0, 'gut', 1, 1],
    [1, 'gut', 2, 3],
    [2, 'gut', 3, 7],
    [3, 'gut', 4, 16],
    [4, 'gut', 5, 35],
    [5, 'gut', 5, 35],
    [3, 'leicht', 5, 35],
    [4, 'leicht', 5, 35],
    [0, 'schwer', 1, 1],
    [2, 'schwer', 2, 1],
    [3, 'schwer', 3, 3],
    [4, 'schwer', 4, 8],
    [5, 'schwer', 5, 17],
    [5, 'nochmal', 0, 0],
  ] as const)('Stufe %s + %s → Stufe %s, fällig in %s Tagen', (von, bewertung, stufe, tage) => {
    const neu = bewerte(von === undefined ? undefined : stand(von), bewertung, T);
    expect(neu.stufe).toBe(stufe);
    expect(neu.faellig).toBe(plusTage(T, tage));
    expect(neu.zuletzt).toBe(T);
  });

  it('zählt Wiederholungen und Fehler', () => {
    expect(bewerte(stand(2), 'nochmal', T)).toMatchObject({ wiederholungen: 4, fehler: 2 });
    expect(bewerte(stand(2), 'gut', T)).toMatchObject({ wiederholungen: 4, fehler: 1 });
    expect(bewerte(undefined, 'gut', T)).toMatchObject({ wiederholungen: 1, fehler: 0 });
  });
});

describe('istFaellig', () => {
  it('ist fällig am Fälligkeitstag und danach, neue Karten sind nicht „fällig"', () => {
    expect(istFaellig(stand(2, T), T)).toBe(true);
    expect(istFaellig(stand(2, '2026-03-09'), T)).toBe(true);
    expect(istFaellig(stand(2, '2026-03-11'), T)).toBe(false);
    expect(istFaellig(undefined, T)).toBe(false);
  });
});

describe('ergebnisUebung (Quiz, Tippen, Hören)', () => {
  it('falsch setzt auf Stufe 0', () => {
    expect(ergebnisUebung(stand(4, '2030-01-01'), false, T)?.stufe).toBe(0);
  });
  it('richtig zählt bei neuen und fälligen Karten als „Gut"', () => {
    expect(ergebnisUebung(undefined, true, T)?.stufe).toBe(1);
    expect(ergebnisUebung(stand(2, T), true, T)?.stufe).toBe(3);
  });
  it('richtig bei nicht fälligen Karten ändert nichts', () => {
    const s = stand(2, '2026-03-20');
    expect(ergebnisUebung(s, true, T)).toBe(s);
  });
});
