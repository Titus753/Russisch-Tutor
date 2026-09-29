import { describe, expect, it } from 'vitest';
import { leseVokabelDateien } from '../../config/vokabel-plugin.ts';
import { pruefeVokabular, vergleichsform } from '../../src/daten/pruefen.ts';
import { EintragSchema } from '../../src/daten/schema.ts';
import { THEMEN } from '../../src/daten/themen.ts';

const gueltig = {
  id: 'ein-001',
  typ: 'wort',
  thema: 'einkaufen',
  russisch: 'хлеб',
  deutsch: 'das Brot',
};

describe('Vokabeldaten im Repo', () => {
  const { fehler, eintraege } = pruefeVokabular(leseVokabelDateien());

  it('sind fehlerfrei', () => {
    expect(fehler).toEqual([]);
  });

  it('umfassen mindestens 1.000 Einträge, jedes Thema mit mindestens 40', () => {
    expect(eintraege.length).toBeGreaterThanOrEqual(1000);
    for (const thema of THEMEN) {
      expect(eintraege.filter((e) => e.thema === thema.id).length, thema.id).toBeGreaterThanOrEqual(
        40,
      );
    }
  });

  it('decken alle Themen und alle Inhaltsarten ab', () => {
    for (const thema of THEMEN) {
      expect(
        eintraege.some((e) => e.thema === thema.id),
        thema.id,
      ).toBe(true);
    }
    for (const typ of ['wort', 'satz', 'redewendung']) {
      expect(
        eintraege.some((e) => e.typ === typ),
        typ,
      ).toBe(true);
    }
  });

  it('haben pro Inhaltsart genug Einträge für vier Antwortmöglichkeiten', () => {
    for (const typ of ['wort', 'satz', 'redewendung']) {
      expect(eintraege.filter((e) => e.typ === typ).length).toBeGreaterThanOrEqual(4);
    }
  });
});

describe('EintragSchema', () => {
  it('akzeptiert einen gültigen Eintrag', () => {
    expect(EintragSchema.safeParse(gueltig).success).toBe(true);
  });

  it.each([
    ['unbekanntes Feld', { ...gueltig, extra: 1 }],
    ['lateinische Buchstaben im Russischen', { ...gueltig, russisch: 'hleb' }],
    ['HTML im Russischen', { ...gueltig, russisch: '<b>хлеб</b>' }],
    ['HTML im Deutschen', { ...gueltig, deutsch: '<img src=x onerror=alert(1)>' }],
    ['unbekanntes Thema', { ...gueltig, thema: 'weltraum' }],
    ['unbekannter Typ', { ...gueltig, typ: 'buchstabe' }],
    ['falsches ID-Format', { ...gueltig, id: '1' }],
    ['leerer Text', { ...gueltig, deutsch: '' }],
    ['Leerzeichen am Rand', { ...gueltig, russisch: ' хлеб' }],
    ['zu langer Text', { ...gueltig, deutsch: 'a'.repeat(201) }],
    ['Betonung passt nicht zum Text', { ...gueltig, betonung: 'хле́бы' }],
    ['Betonung ohne Akzent', { ...gueltig, betonung: 'хлеб' }],
    ['Akzent nach Konsonant', { ...gueltig, russisch: 'молоко', betonung: 'мол́око' }],
    ['Audio mit Pfad', { ...gueltig, audio: '../geheim.mp3' }],
    ['Audio mit fremder ID', { ...gueltig, audio: 'ein-002.mp3' }],
    [
      'Genusvariante passt nicht',
      { ...gueltig, russisch: 'Я рад.', genusvarianten: { m: 'Я счастлив.', w: 'Я рада.' } },
    ],
    [
      '__proto__-Feld',
      JSON.parse(JSON.stringify(gueltig).replace('{', '{"__proto__":{"typ":"satz"},')) as object,
    ],
  ])('lehnt ab: %s', (_name, eintrag) => {
    expect(EintragSchema.safeParse(eintrag).success).toBe(false);
  });

  it('akzeptiert Betonung und Genusvarianten', () => {
    const e = {
      ...gueltig,
      typ: 'satz',
      russisch: 'Я рад.',
      genusvarianten: { m: 'Я рад.', w: 'Я рада.' },
    };
    expect(EintragSchema.safeParse(e).success).toBe(true);
    const b = { ...gueltig, russisch: 'молоко', betonung: 'молоко́' };
    expect(EintragSchema.safeParse(b).success).toBe(true);
  });
});

describe('pruefeVokabular', () => {
  it('findet doppelte IDs und doppelte Texte (auch mit ё/е und Satzzeichen)', () => {
    const { fehler } = pruefeVokabular({
      'data/vokabeln/einkaufen.json': [
        gueltig,
        { ...gueltig, russisch: 'Хлеб!' },
        { ...gueltig, id: 'ein-002', russisch: 'ёлка' },
        { ...gueltig, id: 'ein-003', russisch: 'елка' },
      ],
    });
    expect(fehler.some((f) => f.includes('Doppelte ID: ein-001'))).toBe(true);
    expect(fehler.filter((f) => f.startsWith('Doppelter Eintrag'))).toHaveLength(2);
  });

  it('meldet mehrdeutige deutsche Übersetzungen', () => {
    const { fehler } = pruefeVokabular({
      'data/vokabeln/einkaufen.json': [
        gueltig,
        { ...gueltig, id: 'ein-002', russisch: 'хлебушек' },
      ],
    });
    expect(fehler.some((f) => f.startsWith('Mehrdeutige Übersetzung'))).toBe(true);
  });

  it('prüft, dass Datei, Thema und ID-Kürzel zusammenpassen', () => {
    const { fehler } = pruefeVokabular({
      'data/vokabeln/tiere.json': [gueltig],
    });
    expect(fehler.some((f) => f.includes('hat thema'))).toBe(true);
  });

  it('meldet Schemafehler mit Datei und ID', () => {
    const { fehler } = pruefeVokabular({ 'data/vokabeln/einkaufen.json': [{ id: 'ein-009' }] });
    expect(fehler[0]).toContain('ein-009');
  });

  it('lehnt eine leere oder falsch geformte Datei ab', () => {
    expect(pruefeVokabular({ 'x.json': [] }).fehler).not.toEqual([]);
    expect(pruefeVokabular({ 'x.json': { a: 1 } }).fehler).not.toEqual([]);
  });
});

describe('vergleichsform', () => {
  it('normalisiert Groß-/Kleinschreibung, ё, Satzzeichen und Leerzeichen', () => {
    expect(vergleichsform('  Ещё  раз! ')).toBe('еще раз');
    expect(vergleichsform('Тише едешь — дальше будешь.')).toBe('тише едешь дальше будешь');
  });
});
