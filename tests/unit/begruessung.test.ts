import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BaerSchema } from '../../src/daten/baer-schema.ts';
import { begruessung, tageszeit } from '../../src/logik/begruessung.ts';
import { EinstellungenSchema } from '../../src/speicher/schema.ts';

const baer = BaerSchema.parse(JSON.parse(readFileSync('data/baer.json', 'utf8')));

describe('Begrüßung durch Mischa', () => {
  it.each([
    [5, 'morgen'],
    [10, 'morgen'],
    [11, 'tag'],
    [16, 'tag'],
    [17, 'abend'],
    [22, 'abend'],
    [23, 'nacht'],
    [0, 'nacht'],
    [4, 'nacht'],
  ] as const)('%i Uhr → %s', (stunde, erwartet) => {
    expect(tageszeit(stunde)).toBe(erwartet);
  });

  it('kombiniert Tageszeit-Gruß mit einem Satz aus dem Pool, ohne direkte Wiederholung', () => {
    const [gruss, satz] = begruessung(baer, new Date(2026, 9, 5, 8), undefined, () => 0);
    expect(gruss.id).toBe(baer.zeiten.morgen.id);
    expect(baer.saetze).toContain(satz);
    const [, naechster] = begruessung(baer, new Date(2026, 9, 5, 8), satz.id, () => 0);
    expect(naechster.id).not.toBe(satz.id);
  });

  it('hat für jeden Satz eine Aufnahme', () => {
    const alle = [baer.vorstellung, ...Object.values(baer.zeiten), ...baer.saetze];
    for (const s of alle) expect(existsSync(`public/audio/${s.id}.mp3`), s.id).toBe(true);
  });

  it('ist in älteren Ständen ohne das Feld standardmäßig eingeschaltet', () => {
    expect(EinstellungenSchema.parse({}).begruessung).toBe(true);
    expect(EinstellungenSchema.parse({ begruessung: 'ja' }).begruessung).toBe(true);
    expect(EinstellungenSchema.parse({ begruessung: false }).begruessung).toBe(false);
  });
});
