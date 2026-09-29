import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { leseVokabelDateien } from '../../config/vokabel-plugin.ts';
import { pruefeVokabular } from '../../src/daten/pruefen.ts';
import type { Eintrag } from '../../src/daten/schema.ts';

interface Manifest {
  stimme: string;
  dateien: Record<string, { hash: string; text: string }>;
}

const manifest = JSON.parse(readFileSync('data/audio-manifest.json', 'utf8')) as Manifest;
const { eintraege } = pruefeVokabular(leseVokabelDateien());

/** Muss exakt der Regel in tools/audio/erzeuge_audio.py entsprechen. */
const sprechtext = (e: Eintrag) =>
  e.genusvarianten ? `${e.genusvarianten.m} ${e.genusvarianten.w}` : (e.betonung ?? e.russisch);

describe('Aussprache-Dateien', () => {
  it('verwenden nur eine lizenzrechtlich freigegebene Stimme', () => {
    expect(['dmitri', 'denis']).toContain(manifest.stimme);
  });

  it('existieren für jeden Eintrag und passen zum aktuellen Text (sonst: audio.sh erzeugen)', () => {
    const veraltet = eintraege
      .filter(
        (e) =>
          manifest.dateien[e.id]?.text !== sprechtext(e) || !existsSync(`public/audio/${e.id}.mp3`),
      )
      .map((e) => e.id);
    expect(veraltet).toEqual([]);
  });

  it('sind gültige, kleine MP3-Dateien', () => {
    for (const name of readdirSync('public/audio')) {
      expect(name).toMatch(/^[a-z]{3}-\d{3,4}\.mp3$/);
      const daten = readFileSync(`public/audio/${name}`);
      const id3 = daten.subarray(0, 3).toString('latin1') === 'ID3';
      const frame = daten[0] === 0xff && ((daten[1] ?? 0) & 0xe0) === 0xe0;
      expect(id3 || frame, name).toBe(true);
      expect(statSync(`public/audio/${name}`).size).toBeLessThan(150_000);
    }
  });

  it('enthalten keine verwaisten Dateien', () => {
    const ids = new Set(Object.keys(manifest.dateien));
    const dateien = readdirSync('public/audio').map((n) => n.replace(/\.mp3$/, ''));
    expect(dateien.filter((id) => !ids.has(id))).toEqual([]);
  });
});
