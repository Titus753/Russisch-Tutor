import { describe, expect, it } from 'vitest';
import { anzahlFaellig, fortschrittJeThema, lernserie } from '../../src/logik/statistik.ts';
import type { KartenStand } from '../../src/logik/leitner.ts';
import { eintrag, karte } from './hilfen.ts';

const st = (stufe: number, faellig = '2026-03-10'): KartenStand => ({
  stufe,
  faellig,
  zuletzt: '2026-03-01',
  wiederholungen: 1,
  fehler: 0,
});

describe('lernserie', () => {
  it('zählt aufeinanderfolgende Tage bis heute', () => {
    expect(lernserie(['2026-03-08', '2026-03-09', '2026-03-10'], '2026-03-10')).toBe(3);
  });
  it('reißt nicht, wenn heute noch nicht gelernt wurde', () => {
    expect(lernserie(['2026-03-08', '2026-03-09'], '2026-03-10')).toBe(2);
  });
  it('reißt nach einem ausgelassenen Tag', () => {
    expect(lernserie(['2026-03-07', '2026-03-08'], '2026-03-10')).toBe(0);
    expect(lernserie(['2026-03-06', '2026-03-08', '2026-03-09', '2026-03-10'], '2026-03-10')).toBe(
      3,
    );
  });
  it('geht über Monatsgrenzen', () => {
    expect(lernserie(['2026-02-28', '2026-03-01'], '2026-03-01')).toBe(2);
  });
  it('ist 0 ohne Lerntage', () => {
    expect(lernserie([], '2026-03-10')).toBe(0);
  });
});

describe('fortschrittJeThema', () => {
  it('zählt begonnene und gefestigte Einträge (Stufe ≥ 4 in einer Richtung)', () => {
    const a = eintrag({ thema: 'tiere' });
    const b = eintrag({ thema: 'tiere' });
    const c = eintrag({ thema: 'tiere' });
    const ergebnis = fortschrittJeThema([a, b, c], {
      [`${a.id}:de-ru`]: st(4),
      [`${a.id}:ru-de`]: st(1),
      [`${b.id}:ru-de`]: st(2),
    });
    expect(ergebnis.find((t) => t.thema === 'tiere')).toEqual({
      thema: 'tiere',
      gesamt: 3,
      begonnen: 2,
      gefestigt: 1,
    });
    expect(ergebnis.find((t) => t.thema === 'bank')).toMatchObject({ gesamt: 0, begonnen: 0 });
  });
});

describe('anzahlFaellig', () => {
  it('zählt nur fällige Karten', () => {
    const k = [karte(eintrag()), karte(eintrag()), karte(eintrag())];
    expect(
      anzahlFaellig(
        k,
        { [k[0]!.schluessel]: st(1, '2026-03-09'), [k[1]!.schluessel]: st(1, '2026-03-11') },
        '2026-03-10',
      ),
    ).toBe(1);
  });
});
