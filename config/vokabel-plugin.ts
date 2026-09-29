import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';
import { pruefeVokabular } from '../src/daten/pruefen.ts';

const ORDNER = 'data/vokabeln';
const MODUL = 'virtual:vokabeln';

/** Liest alle Vokabeldateien als Rohdaten (Dateiname → JSON). */
export function leseVokabelDateien(ordner = ORDNER): Record<string, unknown> {
  const dateien: Record<string, unknown> = {};
  for (const name of readdirSync(ordner)
    .filter((n) => n.endsWith('.json'))
    .sort()) {
    const pfad = join(ordner, name);
    try {
      dateien[pfad] = JSON.parse(readFileSync(pfad, 'utf8'));
    } catch (e) {
      throw new Error(`${pfad}: kein gültiges JSON – ${(e as Error).message}`, { cause: e });
    }
  }
  return dateien;
}

/**
 * Prüft beim Build (und im Dev-Server) alle Vokabeln gegen das Schema.
 * Bei Fehlern bricht der Build ab. Die geprüften Daten sind als `virtual:vokabeln` importierbar.
 */
export function vokabelPlugin(): Plugin {
  return {
    name: 'vokabeln',
    resolveId: (id) => (id === MODUL ? `\0${MODUL}` : null),
    load(id) {
      if (id !== `\0${MODUL}`) return null;
      const dateien = leseVokabelDateien();
      for (const pfad of Object.keys(dateien)) this.addWatchFile(pfad);
      const { fehler, eintraege } = pruefeVokabular(dateien);
      if (fehler.length > 0) {
        this.error(`Vokabeldaten ungültig (${fehler.length} Fehler):\n  ${fehler.join('\n  ')}`);
      }
      // Aufnahme nur verknüpfen, wenn die Datei wirklich existiert (sonst Gerätestimme)
      const mitAudio = eintraege.map((e) =>
        existsSync(join('public/audio', `${e.id}.mp3`)) ? { ...e, audio: `${e.id}.mp3` } : e,
      );
      return `export default ${JSON.stringify(mitAudio)};`;
    },
  };
}
