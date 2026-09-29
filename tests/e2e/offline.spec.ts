import { readFileSync, writeFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { expect, test } from './basis.ts';

test.use({ serviceWorkers: 'allow' });

/** Wartet, bis der Service Worker aktiv ist, die Seite steuert und alles vorgeladen hat. */
async function offlineBereit(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // Neue Navigation statt reload(): WebKit in Playwright verträgt reload() mit aktivem SW schlecht
  await page.goto('/');
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);
}

const swQuelle = () => readFileSync('dist/sw.js', 'utf8');

test('nach dem ersten Laden funktioniert die App komplett offline – inklusive Audio', async ({
  page,
  context,
}) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await offlineBereit(page);
  const dateien = JSON.parse(/const DATEIEN = (\[.*?\]);/s.exec(swQuelle())![1]!) as string[];
  const imCache = await page.evaluate(async () => {
    const [name] = (await caches.keys()).filter((n) => n.startsWith('slovo-za-slovo-'));
    return (await (await caches.open(name!)).keys()).length;
  });
  expect(imCache).toBe(dateien.length);

  // Die Offline-Simulation von Playwright bricht in WebKit Navigationen ab (Werkzeug-Grenze,
  // nicht Safari). Dort prüfen wir Cache und Auslieferung durch den SW; echtes Offline am iPhone
  // steht in der Handtest-Liste.
  const echtOffline =
    test.info().project.use.browserName !== 'webkit' && !/iPhone/.test(test.info().project.name);
  if (echtOffline) {
    await context.setOffline(true);
    await page.goto('/');
    await expect(page.getByTestId('marke-offen')).toBeVisible();
    await page.getByRole('button', { name: 'Aufdecken' }).click();
    await expect(page.getByRole('button', { name: 'Gut' })).toBeVisible();
  }

  // Audio aus dem Cache, auch als Range-Anfrage (so lädt Safari Medien)
  const audio = await page.evaluate(async () => {
    const voll = await fetch('/audio/beg-001.mp3');
    const teil = await fetch('/audio/beg-001.mp3', { headers: { Range: 'bytes=0-99' } });
    return {
      voll: voll.status,
      typ: voll.headers.get('content-type'),
      teil: teil.status,
      bereich: teil.headers.get('content-range'),
      laenge: (await teil.arrayBuffer()).byteLength,
    };
  });
  expect(audio).toMatchObject({ voll: 200, teil: 206, laenge: 100 });
  expect(audio.typ).toContain('audio/mpeg');
  expect(audio.bereich).toMatch(/^bytes 0-99\/\d+$/);

  if (echtOffline) {
    // Aufruf mit Parametern offline: App-Hülle aus dem Cache
    await page.goto('/?irgendwas=1');
    await expect(page.getByTestId('marke-offen')).toBeVisible();
  }
});

test('der Service Worker fasst nur eigene GET-Anfragen an und nichts außerhalb der Liste', async ({
  page,
}) => {
  const quelle = swQuelle();
  expect(quelle).toContain("if (anfrage.method !== 'GET') return;");
  expect(quelle).toContain('if (url.origin !== self.location.origin) return;');
  expect(quelle).not.toMatch(/cache\.put\(/); // kein Nachspeichern zur Laufzeit
  expect(quelle).not.toMatch(/importScripts|eval\(|new Function/);
  await page.goto('/');
  await offlineBereit(page);
  // Unbekannte eigene Adresse geht ans Netz und wird nicht nachträglich gespeichert
  await page.evaluate(async () => (await fetch('/gibt-es-nicht.txt')).status);
  const gespeichert = await page.evaluate(async () => {
    const [name] = await caches.keys();
    return (await caches.open(name!)).match('/gibt-es-nicht.txt').then((r) => r !== undefined);
  });
  expect(gespeichert).toBe(false);
});

test('neue Version: Hinweis „Aktualisieren“ lädt die neue Version', async ({ page }) => {
  // Verändert kurz dist/sw.js – nur in einem Projekt, damit sich die Läufe nicht stören
  test.skip(test.info().project.name !== 'Pixel 7', 'nur einmal ausführen');
  await page.goto('/');
  await offlineBereit(page);
  const original = swQuelle();
  try {
    writeFileSync(
      'dist/sw.js',
      original.replace(/const VERSION = "[0-9a-f]+";/, 'const VERSION = "neueversion0000";'),
    );
    await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.update());
    await expect(page.getByText('Eine neue Version ist bereit.')).toBeVisible({ timeout: 30_000 });
    await page.getByRole('button', { name: 'Aktualisieren' }).click();
    // Die App lädt nach dem Aktualisieren neu; währenddessen kann evaluate scheitern
    await expect
      .poll(() =>
        page
          .evaluate(async () => (await caches.keys()).filter((n) => n.startsWith('slovo-')))
          .catch(() => []),
      )
      .toEqual(['slovo-za-slovo-neueversion0000']);
    await expect(page.getByTestId('marke-offen')).toBeVisible();
  } finally {
    writeFileSync('dist/sw.js', original);
  }
});

test('App-Manifest und Icons sind vollständig und erreichbar', async ({ request }) => {
  const manifest = await (await request.get('/manifest.webmanifest')).json();
  expect(manifest).toMatchObject({ display: 'standalone', start_url: '/', lang: 'de' });
  for (const icon of manifest.icons as { src: string }[]) {
    const antwort = await request.get(icon.src);
    expect(antwort.status(), icon.src).toBe(200);
    expect(antwort.headers()['content-type']).toBe('image/png');
  }
  expect(manifest.icons.some((i: { purpose: string }) => i.purpose === 'maskable')).toBe(true);
});
