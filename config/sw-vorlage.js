/**
 * Service Worker von „Слово за слово". Wird beim Build aus dieser Vorlage erzeugt
 * (config/sw-plugin.ts setzt VERSION und DATEIEN ein).
 *
 * - Lädt beim Installieren alle App-Dateien inkl. Aufnahmen in einen versionierten Cache.
 * - Beantwortet nur GET-Anfragen an die eigene Adresse; alles andere geht unverändert ans Netz.
 * - Speichert nie etwas zur Laufzeit nach: nur die beim Build festgelegte Dateiliste.
 * - Löscht beim Aktivieren alte Caches dieser App.
 * - Unterstützt Range-Anfragen (Safari lädt Audio stückweise, auch aus dem Cache).
 */
const VERSION = '__VERSION__';
/** @type {string[]} */
const DATEIEN = __DATEIEN__;
const PRAEFIX = 'slovo-za-slovo-';
const CACHE = `${PRAEFIX}${VERSION}`;

self.addEventListener('install', (ereignis) => {
  ereignis.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // addAll ist „alles oder nichts": eine fehlerhafte Datei bricht die Installation ab,
      // die bisherige Version bleibt dann aktiv.
      await cache.addAll(
        DATEIEN.map((url) => new Request(url, { cache: 'no-cache', credentials: 'omit' })),
      );
    })(),
  );
});

self.addEventListener('activate', (ereignis) => {
  ereignis.waitUntil(
    (async () => {
      for (const name of await caches.keys()) {
        if (name.startsWith(PRAEFIX) && name !== CACHE) await caches.delete(name);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (ereignis) => {
  // Nur Nachrichten von eigenen Fenstern annehmen
  if (ereignis.origin && ereignis.origin !== self.location.origin) return;
  if (ereignis.data === 'jetzt-aktualisieren') self.skipWaiting();
});

/** Beantwortet eine Range-Anfrage aus einer vollständigen Antwort (206 Partial Content). */
async function teilantwort(anfrage, antwort) {
  const bereich = /^bytes=(\d*)-(\d*)$/.exec(anfrage.headers.get('range') ?? '');
  if (!bereich) return antwort;
  const daten = await antwort.arrayBuffer();
  const groesse = daten.byteLength;
  let start = bereich[1] === '' ? NaN : Number(bereich[1]);
  let ende = bereich[2] === '' ? groesse - 1 : Number(bereich[2]);
  if (Number.isNaN(start)) {
    // „bytes=-500": die letzten 500 Byte
    start = Math.max(0, groesse - ende);
    ende = groesse - 1;
  }
  ende = Math.min(ende, groesse - 1);
  if (start > ende || start >= groesse) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${groesse}` } });
  }
  return new Response(daten.slice(start, ende + 1), {
    status: 206,
    headers: {
      'Content-Type': antwort.headers.get('Content-Type') ?? 'application/octet-stream',
      'Content-Range': `bytes ${start}-${ende}/${groesse}`,
      'Content-Length': String(ende - start + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}

self.addEventListener('fetch', (ereignis) => {
  const anfrage = ereignis.request;
  if (anfrage.method !== 'GET') return;
  const url = new URL(anfrage.url);
  if (url.origin !== self.location.origin) return;

  ereignis.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      // Seitenaufrufe (auch mit Parametern) bekommen immer die App-Hülle
      const schluessel = anfrage.mode === 'navigate' ? '/' : url.pathname;
      const treffer = await cache.match(schluessel);
      if (treffer) return anfrage.headers.has('range') ? teilantwort(anfrage, treffer) : treffer;
      return fetch(anfrage);
    })(),
  );
});
