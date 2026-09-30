import type { Page } from '@playwright/test';
import { expect, test } from './basis.ts';

/** Schreibt einen Wert direkt in die IndexedDB der App (wie ein Angreifer oder kaputter Speicher). */
async function schreibe(page: Page, schluessel: string, wert: unknown) {
  await page.evaluate(
    ([s, w]) =>
      new Promise<void>((fertig, fehler) => {
        const anfrage = indexedDB.open('slovo-za-slovo');
        anfrage.onerror = () => fehler(anfrage.error);
        anfrage.onsuccess = () => {
          const tx = anfrage.result.transaction('daten', 'readwrite');
          tx.objectStore('daten').put(w, s as string);
          tx.oncomplete = () => {
            anfrage.result.close();
            fertig();
          };
          tx.onerror = () => fehler(tx.error);
        };
      }),
    [schluessel, wert] as const,
  );
}

async function lese(page: Page, schluessel: string): Promise<unknown> {
  return page.evaluate(
    (s) =>
      new Promise((fertig) => {
        const anfrage = indexedDB.open('slovo-za-slovo');
        anfrage.onsuccess = () => {
          const get = anfrage.result.transaction('daten').objectStore('daten').get(s);
          get.onsuccess = () => {
            anfrage.result.close();
            fertig(get.result);
          };
        };
      }),
    schluessel,
  );
}

const karte = {
  stufe: 2,
  faellig: '2020-01-01',
  zuletzt: '2019-12-29',
  wiederholungen: 2,
  fehler: 0,
};

test('erster Start: 20 neue Karten heute offen', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('marke-offen')).toHaveText('20 heute offen');
});

test('liest den Lernstand aus der echten IndexedDB', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('marke-offen')).toBeVisible();
  await schreibe(page, 'stand', {
    version: 1,
    karten: { 'beg-001:de-ru': karte, 'beg-002:ru-de': karte, 'tie-003:de-ru': karte },
    einstellungen: { neueProTag: 10, begruessung: false },
    lerntage: [],
    neuHeute: null,
    tutorialGesehen: true,
  });
  await page.reload();
  // 3 fällige + 10 neue
  await expect(page.getByTestId('marke-offen')).toHaveText('13 heute offen');
});

test('kaputter Speicher: App startet trotzdem und stellt den vorherigen Stand her', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('marke-offen')).toBeVisible();
  await schreibe(page, 'stand', '<img src=x onerror=alert(1)>');
  await schreibe(page, 'stand-vorher', {
    version: 1,
    karten: { 'beg-001:de-ru': karte },
    einstellungen: { neueProTag: 10, begruessung: false },
    tutorialGesehen: true,
  });
  await page.reload();
  await expect(
    page.getByRole('status').filter({ hasText: 'vorherige wurde wiederhergestellt' }),
  ).toBeVisible();
  await expect(page.getByTestId('marke-offen')).toHaveText('11 heute offen');
  expect(await lese(page, 'stand-kaputt')).toBe('<img src=x onerror=alert(1)>');
});

test('völlig unbrauchbarer Speicher: Zurücksetzen mit Hinweis statt Absturz', async ({ page }) => {
  const fehler: string[] = [];
  page.on('pageerror', (e) => fehler.push(e.message));
  await page.goto('/');
  await expect(page.getByTestId('marke-offen')).toBeVisible();
  await schreibe(page, 'stand', { version: 1, karten: 'kaputt' });
  await page.reload();
  // Zurückgesetzter Stand = wie ein Neustart: die Einführung erscheint und wird übersprungen
  await page.getByRole('button', { name: 'Überspringen' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'zurückgesetzt' })).toBeVisible();
  await expect(page.getByTestId('marke-offen')).toHaveText('20 heute offen');
  expect(fehler).toEqual([]);
});
