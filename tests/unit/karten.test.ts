import { describe, expect, it } from 'vitest';
import { antwortOptionen } from '../../src/logik/antworten.ts';
import {
  baueRunde,
  kartenFuer,
  nachBewertung,
  waehleUebungskarte,
  type Fortschritt,
} from '../../src/logik/karten.ts';
import type { KartenStand } from '../../src/logik/leitner.ts';
import { festerZufall, mischen } from '../../src/logik/zufall.ts';
import { eintrag, karte } from './hilfen.ts';

const T = '2026-03-10';
const st = (stufe: number, faellig: string): KartenStand => ({
  stufe,
  faellig,
  zuletzt: '2026-03-01',
  wiederholungen: 1,
  fehler: 0,
});

describe('kartenFuer', () => {
  const a = eintrag({ thema: 'einkaufen', typ: 'wort' });
  const b = eintrag({ thema: 'tiere', typ: 'wort' });
  const c = eintrag({ thema: 'einkaufen', typ: 'satz' });

  it('filtert nach Thema und Inhaltsart', () => {
    const k = kartenFuer([a, b, c], {
      themen: ['einkaufen'],
      inhaltsarten: ['wort'],
      richtung: 'de-ru',
    });
    expect(k.map((x) => x.schluessel)).toEqual([`${a.id}:de-ru`]);
  });

  it('erzeugt bei „gemischt" beide Richtungen', () => {
    const k = kartenFuer([a], {
      themen: ['einkaufen'],
      inhaltsarten: ['wort'],
      richtung: 'gemischt',
    });
    expect(k.map((x) => x.richtung)).toEqual(['de-ru', 'ru-de']);
  });
});

describe('baueRunde', () => {
  const e = Array.from({ length: 6 }, () => eintrag());
  const karten = e.flatMap((x) => [karte(x, 'de-ru'), karte(x, 'ru-de')]);

  it('bringt erst fällige Karten (älteste zuerst), dann neue bis zum Limit', () => {
    const fortschritt: Fortschritt = {
      [karten[2]!.schluessel]: st(2, '2026-03-09'),
      [karten[4]!.schluessel]: st(1, '2026-03-05'),
      [karten[6]!.schluessel]: st(3, '2026-03-30'), // nicht fällig
    };
    const runde = baueRunde({ karten, fortschritt, tag: T, neueLimit: 2, neueHeute: [] });
    expect(runde.map((k) => k.schluessel)).toEqual([
      karten[4]!.schluessel,
      karten[2]!.schluessel,
      karten[0]!.schluessel,
      // Eintrag 0 ist schon als neue Karte vergeben, seine zweite Richtung nicht am selben Tag
      karten[3]!.schluessel,
    ]);
  });

  it('zählt das Limit pro Eintrag und berücksichtigt heute schon eingeführte', () => {
    const runde = baueRunde({
      karten,
      fortschritt: {},
      tag: T,
      neueLimit: 3,
      neueHeute: [e[0]!.id, e[1]!.id],
    });
    expect(runde).toHaveLength(1);
    expect(runde[0]!.eintrag.id).toBe(e[2]!.id);
  });

  it('liefert keine neuen Karten, wenn das Limit erreicht ist', () => {
    expect(baueRunde({ karten, fortschritt: {}, tag: T, neueLimit: 1, neueHeute: ['x'] })).toEqual(
      [],
    );
  });
});

describe('nachBewertung (Runde)', () => {
  const [a, b, c, d, e] = Array.from({ length: 5 }, () => karte(eintrag()));
  it('entfernt die Karte bei Gut/Schwer/Leicht', () => {
    expect(nachBewertung([a!, b!, c!], 'gut')).toEqual([b, c]);
  });
  it('bringt die Karte bei „Nochmal" ca. 3 Karten später wieder', () => {
    expect(nachBewertung([a!, b!, c!, d!, e!], 'nochmal')).toEqual([b, c, d, a, e]);
    expect(nachBewertung([a!, b!], 'nochmal')).toEqual([b, a]);
    expect(nachBewertung([a!], 'nochmal')).toEqual([a]);
    expect(nachBewertung([], 'nochmal')).toEqual([]);
  });
});

describe('waehleUebungskarte', () => {
  const schwach = Array.from({ length: 5 }, () => karte(eintrag()));
  const stark = Array.from({ length: 5 }, () => karte(eintrag()));
  const fortschritt: Fortschritt = Object.fromEntries(
    stark.map((k) => [k.schluessel, st(4, '2030-01-01')]),
  );

  it('wählt zu ca. 70 % schwache Karten', () => {
    const zufall = festerZufall(42);
    let anzahlSchwach = 0;
    for (let i = 0; i < 2000; i++) {
      const k = waehleUebungskarte([...schwach, ...stark], fortschritt, undefined, zufall);
      if (schwach.includes(k!)) anzahlSchwach++;
    }
    expect(anzahlSchwach / 2000).toBeGreaterThan(0.65);
    expect(anzahlSchwach / 2000).toBeLessThan(0.75);
  });

  it('wiederholt nie direkt denselben Eintrag', () => {
    const zufall = festerZufall(7);
    let letzte: string | undefined;
    for (let i = 0; i < 500; i++) {
      const k = waehleUebungskarte([...schwach, ...stark], fortschritt, letzte, zufall)!;
      expect(k.eintrag.id).not.toBe(letzte);
      letzte = k.eintrag.id;
    }
  });

  it('kommt mit einer einzigen Karte und leerer Liste zurecht', () => {
    expect(waehleUebungskarte([schwach[0]!], {}, schwach[0]!.eintrag.id)).toBe(schwach[0]);
    expect(waehleUebungskarte([], {}, undefined)).toBeUndefined();
  });
});

describe('antwortOptionen', () => {
  it('liefert vier verschiedene Antworten derselben Inhaltsart, bevorzugt gleiches Thema', () => {
    const ziel = eintrag({ thema: 'tiere', typ: 'wort', deutsch: 'der Hund' });
    const gleich = Array.from({ length: 3 }, (_, i) =>
      eintrag({ thema: 'tiere', typ: 'wort', deutsch: `Tier ${i}` }),
    );
    const andere = Array.from({ length: 5 }, (_, i) =>
      eintrag({ thema: 'bank', typ: 'wort', deutsch: `Geld ${i}` }),
    );
    const saetze = Array.from({ length: 5 }, (_, i) =>
      eintrag({ thema: 'tiere', typ: 'satz', deutsch: `Satz ${i}` }),
    );
    const { optionen, richtig } = antwortOptionen(
      karte(ziel, 'ru-de'),
      [ziel, ...gleich, ...andere, ...saetze],
      festerZufall(1),
    );
    expect(optionen).toHaveLength(4);
    expect(new Set(optionen).size).toBe(4);
    expect(optionen[richtig]).toBe('der Hund');
    expect(optionen.filter((o) => o.startsWith('Tier'))).toHaveLength(3);
  });

  it('überspringt Ablenker mit gleichem Antworttext (auch mit е/ё und Satzzeichen)', () => {
    const ziel = eintrag({ russisch: 'ещё', deutsch: 'noch' });
    const gleichLautend = eintrag({ russisch: 'Еще!', deutsch: 'noch einmal' });
    const anders = eintrag({ russisch: 'да', deutsch: 'ja' });
    const { optionen } = antwortOptionen(
      karte(ziel, 'de-ru'),
      [ziel, gleichLautend, anders],
      festerZufall(3),
    );
    expect(optionen.sort()).toEqual(['да', 'ещё'].sort());
  });
});

describe('mischen', () => {
  it('verändert die Eingabe nicht und behält alle Elemente', () => {
    const liste = [1, 2, 3, 4, 5];
    const gemischt = mischen(liste, festerZufall(9));
    expect(liste).toEqual([1, 2, 3, 4, 5]);
    expect([...gemischt].sort()).toEqual(liste);
  });
});
