import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import type { Plugin } from 'vite';

/** Dateien, die nicht in den Offline-Cache gehören (Server-Konfiguration, der SW selbst). */
const AUSGESCHLOSSEN = new Set(['sw.js', '_headers', 'robots.txt']);

function alleDateien(ordner: string): string[] {
  return readdirSync(ordner).flatMap((name) => {
    const pfad = join(ordner, name);
    return statSync(pfad).isDirectory() ? alleDateien(pfad) : [pfad];
  });
}

/**
 * Erzeugt nach dem Build dist/sw.js aus config/sw-vorlage.js mit fester Dateiliste und einer
 * Version aus den Dateiinhalten. Kein Laufzeit-Caching unbekannter Dateien.
 */
export function serviceWorkerPlugin(): Plugin {
  let ausgabe = 'dist';
  return {
    name: 'service-worker',
    apply: 'build',
    configResolved(config) {
      ausgabe = config.build.outDir;
    },
    closeBundle() {
      const dateien = alleDateien(ausgabe)
        .map((pfad) => relative(ausgabe, pfad).split(sep).join('/'))
        .filter((pfad) => !AUSGESCHLOSSEN.has(pfad) && !pfad.endsWith('.map'))
        .sort();
      const hash = createHash('sha256');
      let bytes = 0;
      for (const pfad of dateien) {
        const inhalt = readFileSync(join(ausgabe, pfad));
        bytes += inhalt.length;
        hash.update(pfad).update(inhalt);
      }
      const urls = dateien.map((p) => (p === 'index.html' ? '/' : `/${p}`));
      const vorlage = readFileSync('config/sw-vorlage.js', 'utf8');
      if (!vorlage.includes("'__VERSION__'") || !vorlage.includes('__DATEIEN__')) {
        throw new Error('config/sw-vorlage.js: Platzhalter fehlen');
      }
      const sw = vorlage
        .replace("'__VERSION__'", JSON.stringify(hash.digest('hex').slice(0, 16)))
        .replace('__DATEIEN__', JSON.stringify(urls));
      writeFileSync(join(ausgabe, 'sw.js'), sw);
      this.info?.(`Offline-Cache: ${urls.length} Dateien, ${(bytes / 1e6).toFixed(1)} MB`);
    },
  };
}
