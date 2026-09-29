import { describe, expect, it } from 'vitest';
import {
  nachBewertung,
  nachUebung,
  neueDazunehmen,
  neueHeute,
  neueLimit,
} from '../../src/logik/stand.ts';
import { neuerStand, pruefeStand } from '../../src/speicher/schema.ts';
import { eintrag, karte } from './hilfen.ts';

const T = '2026-03-10';

describe('Stand-Übergänge', () => {
  it('neue Karte bewerten: Fortschritt, Lerntag und „heute neu" werden erfasst', () => {
    const k = karte(eintrag());
    const s = nachBewertung(neuerStand(), k, 'gut', T);
    expect(s.karten[k.schluessel]?.stufe).toBe(1);
    expect(s.lerntage).toEqual([T]);
    expect(neueHeute(s, T)).toEqual([k.eintrag.id]);
    expect(pruefeStand(s)?.verworfen).toBe(0);
  });

  it('bekannte Karte zählt nicht als neu; Lerntag wird nicht doppelt eingetragen', () => {
    const k = karte(eintrag());
    const s1 = nachBewertung(neuerStand(), k, 'gut', T);
    const s2 = nachBewertung(s1, k, 'gut', T);
    expect(neueHeute(s2, T)).toHaveLength(1);
    expect(s2.lerntage).toEqual([T]);
  });

  it('„heute neu" beginnt an einem neuen Tag leer', () => {
    const s = nachBewertung(neuerStand(), karte(eintrag()), 'gut', T);
    expect(neueHeute(s, '2026-03-11')).toEqual([]);
  });

  it('„10 neue Karten dazunehmen" erhöht nur das heutige Limit', () => {
    const s = neueDazunehmen(neuerStand(), T);
    expect(neueLimit(s, T)).toBe(30);
    expect(neueLimit(s, '2026-03-11')).toBe(20);
    expect(neueLimit(neueDazunehmen(s, T), T)).toBe(40);
  });

  it('Übung falsch setzt auf Stufe 0, richtig bei nicht fälliger Karte ändert nichts', () => {
    const k = karte(eintrag());
    const s1 = nachBewertung(neuerStand(), k, 'leicht', T);
    expect(nachUebung(s1, k, true, T).karten[k.schluessel]).toEqual(s1.karten[k.schluessel]);
    expect(nachUebung(s1, k, false, T).karten[k.schluessel]?.stufe).toBe(0);
  });

  it('verändert den Ausgangsstand nicht', () => {
    const start = neuerStand();
    nachBewertung(start, karte(eintrag()), 'gut', T);
    expect(start).toEqual(neuerStand());
  });
});
