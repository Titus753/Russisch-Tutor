import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LobListeSchema } from '../../src/daten/lob-schema.ts';

const roh = JSON.parse(readFileSync('data/lob.json', 'utf8')) as unknown;

describe('Lob-Pool', () => {
  it('ist gültig und abwechslungsreich (mindestens 15 verschiedene Sprüche)', () => {
    const ergebnis = LobListeSchema.safeParse(roh);
    expect(ergebnis.success).toBe(true);
    expect(ergebnis.success && ergebnis.data.length).toBeGreaterThanOrEqual(15);
  });

  it('hat für jeden Spruch eine Aufnahme', () => {
    for (const l of roh as { id: string }[])
      expect(existsSync(`public/audio/${l.id}.mp3`), l.id).toBe(true);
  });

  it('lehnt HTML und doppelte Sprüche ab', () => {
    const gut = { id: 'lob-001', russisch: 'Молодец!', deutsch: 'Gut gemacht!' };
    const liste = Array.from({ length: 10 }, (_, i) => ({
      ...gut,
      id: `lob-${String(i + 1).padStart(3, '0')}`,
      russisch: `Молодец${'!'.repeat(i + 1)}`,
    }));
    expect(LobListeSchema.safeParse(liste).success).toBe(true);
    expect(
      LobListeSchema.safeParse([...liste, { ...gut, id: 'lob-099', deutsch: '<b>x</b>' }]).success,
    ).toBe(false);
    expect(LobListeSchema.safeParse([...liste, { ...liste[0], id: 'lob-099' }]).success).toBe(
      false,
    );
  });
});
