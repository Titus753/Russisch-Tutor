import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { expect, test } from './basis.ts';
import { gespeicherteKarten, heuteImBrowser, setzeStand } from './hilfen.ts';

const oeffne = async (page: Page, seite: string) => {
  await page
    .getByRole('navigation', { name: 'Bereiche' })
    .getByRole('button', { name: 'Mehr' })
    .click();
  await page.getByRole('button', { name: new RegExp(`^${seite}`) }).click();
  await expect(page.getByRole('heading', { name: seite, level: 2 })).toBeFocused();
};

const karte = {
  stufe: 4,
  faellig: '2020-01-01',
  zuletzt: '2019-12-01',
  wiederholungen: 5,
  fehler: 0,
};

test.describe('Einstellungen', () => {
  test('Schriftgröße, Farbmodus und Kontrast wirken sofort und bleiben gespeichert', async ({
    page,
  }) => {
    await page.goto('/');
    await oeffne(page, 'Einstellungen');
    const wurzelPx = () =>
      page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
    const normal = await wurzelPx();
    await page.getByRole('radio', { name: 'Sehr groß' }).click();
    await expect.poll(wurzelPx).toBeCloseTo(normal * 1.5, 0);
    await page.getByRole('radio', { name: 'Dunkel' }).click();
    await page.getByRole('switch', { name: 'Hoher Kontrast' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-farbmodus', 'dunkel');
    await expect(page.locator('html')).toHaveAttribute('data-kontrast', 'hoch');
    await page.reload();
    await expect.poll(wurzelPx).toBeCloseTo(normal * 1.5, 0);
    await expect(page.locator('html')).toHaveAttribute('data-farbmodus', 'dunkel');
  });

  test('Themenfilter: mindestens eines bleibt aktiv, Auswahl wirkt auf die Runde', async ({
    page,
  }) => {
    await page.goto('/');
    await oeffne(page, 'Einstellungen');
    const themen = page.getByRole('group', { name: 'Themen' }).getByRole('button');
    const anzahl = await themen.count();
    for (let i = 1; i < anzahl; i++) await themen.nth(i).click();
    await expect(
      page.getByRole('group', { name: 'Themen' }).locator('[aria-pressed="true"]'),
    ).toHaveCount(1);
    await themen.nth(0).click();
    await expect(page.getByText('Mindestens ein Thema muss aktiv bleiben.')).toBeVisible();
    await expect(themen.nth(0)).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('radio', { name: '10' }).click();
    await expect(page.getByTestId('marke-offen')).toHaveText('10 heute offen');
  });
});

test('Fortschritt zeigt Lernserie, fällige und gefestigte Einträge', async ({ page }) => {
  await page.goto('/');
  const tag = await heuteImBrowser(page);
  await setzeStand(page, {
    karten: { 'tie-001:de-ru': karte, 'tie-002:ru-de': { ...karte, stufe: 1 } },
    lerntage: [tag],
  });
  await page.reload();
  await oeffne(page, 'Fortschritt');
  await expect(page.locator('.kennzahl').filter({ hasText: 'Tag in Folge' })).toContainText('1');
  await expect(page.locator('.kennzahl').filter({ hasText: 'heute fällig' })).toContainText('2');
  await expect(page.locator('.kennzahl').filter({ hasText: 'gefestigt' })).toContainText('1');
  await expect(page.getByRole('progressbar', { name: 'Tiere: gefestigt' })).toHaveAttribute(
    'aria-valuenow',
    '5',
  );
});

test.describe('Sicherung', () => {
  test('Export erzeugt eine gültige Sicherungsdatei', async ({ page }) => {
    await page.goto('/');
    await setzeStand(page, { karten: { 'tie-001:de-ru': karte } });
    await page.reload();
    await oeffne(page, 'Sicherung');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Sicherung speichern' }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(
      /^slovo-za-slovo-sicherung-\d{4}-\d{2}-\d{2}\.json$/,
    );
    const inhalt = JSON.parse(readFileSync(await download.path(), 'utf8'));
    expect(inhalt.format).toBe('slovo-za-slovo-sicherung');
    expect(inhalt.stand.karten['tie-001:de-ru']).toEqual(karte);
  });

  test('Import: Vorschau, Bestätigung, alter Stand wiederherstellbar', async ({ page }) => {
    await page.goto('/');
    await setzeStand(page, { karten: { 'tie-001:de-ru': karte } });
    await page.reload();
    await oeffne(page, 'Sicherung');
    const sicherung = {
      format: 'slovo-za-slovo-sicherung',
      version: 1,
      erstellt: '2026-05-01T10:00:00.000Z',
      stand: {
        version: 1,
        karten: { 'beg-001:de-ru': karte, 'beg-002:de-ru': karte, 'kaputt:xx': 1 },
        einstellungen: {},
        lerntage: [],
        tutorialGesehen: true,
      },
    };
    await page.locator('#sicherung-datei').setInputFiles({
      name: 'sicherung.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(sicherung)),
    });
    const vorschau = page.getByRole('group', { name: 'Import bestätigen' });
    await expect(vorschau).toContainText('1 Karten werden ersetzt');
    await expect(vorschau).toContainText('durch 2 Karten');
    await expect(vorschau).toContainText('1 ungültige Einträge');
    await expect(vorschau.getByRole('button', { name: 'Importieren' })).toBeFocused();
    await vorschau.getByRole('button', { name: 'Importieren' }).click();
    await expect(page.getByText('Sicherung importiert.')).toBeVisible();
    await expect.poll(() => gespeicherteKarten(page)).toBe(2);
    await page
      .getByRole('button', { name: /Stand vor dem letzten Import wiederherstellen \(1 Karten\)/ })
      .click();
    await expect.poll(() => gespeicherteKarten(page)).toBe(1);
  });

  const angriffe: [string, string | Buffer][] = [
    ['kein JSON', 'das ist keine sicherung'],
    ['fremdes Format', JSON.stringify({ format: 'etwas-anderes', version: 1, stand: {} })],
    [
      'neuere Version',
      JSON.stringify({ format: 'slovo-za-slovo-sicherung', version: 99, stand: {} }),
    ],
    [
      'kaputter Stand',
      JSON.stringify({ format: 'slovo-za-slovo-sicherung', version: 1, stand: { karten: 'x' } }),
    ],
    [
      'Prototype Pollution',
      '{"format":"slovo-za-slovo-sicherung","version":1,"__proto__":{"admin":true},"stand":{"version":1,"karten":{}}}',
    ],
    ['zu groß', Buffer.alloc(6 * 1024 * 1024, 32)],
  ];
  for (const [name, inhalt] of angriffe) {
    test(`Import lehnt ab: ${name} – und ändert nichts`, async ({ page }) => {
      await page.goto('/');
      await setzeStand(page, { karten: { 'tie-001:de-ru': karte } });
      await page.reload();
      await oeffne(page, 'Sicherung');
      await page.locator('#sicherung-datei').setInputFiles({
        name: 'boese.json',
        mimeType: 'application/json',
        buffer: Buffer.isBuffer(inhalt) ? inhalt : Buffer.from(inhalt),
      });
      await expect(page.getByRole('alert')).toBeVisible();
      await expect(page.getByRole('group', { name: 'Import bestätigen' })).toHaveCount(0);
      expect(await page.evaluate(() => ({}) as Record<string, unknown>)).toEqual({});
      expect(await gespeicherteKarten(page)).toBe(1);
    });
  }

  test('Löschen nur nach zweiter Bestätigung, danach wiederherstellbar', async ({ page }) => {
    await page.goto('/');
    await setzeStand(page, { karten: { 'tie-001:de-ru': karte, 'tie-002:de-ru': karte } });
    await page.reload();
    await oeffne(page, 'Sicherung');
    await page.getByRole('button', { name: 'Fortschritt löschen …' }).click();
    const frage = page.getByRole('group', { name: 'Löschen bestätigen' });
    await expect(frage.getByRole('button', { name: 'Abbrechen' })).toBeFocused();
    await frage.getByRole('button', { name: 'Abbrechen' }).click();
    expect(await gespeicherteKarten(page)).toBe(2);
    await page.getByRole('button', { name: 'Fortschritt löschen …' }).click();
    await page.getByRole('button', { name: 'Endgültig löschen' }).click();
    await expect.poll(() => gespeicherteKarten(page)).toBe(0);
    await page
      .getByRole('button', { name: /Gelöschten Stand wiederherstellen \(2 Karten\)/ })
      .click();
    await expect.poll(() => gespeicherteKarten(page)).toBe(2);
  });
});

test.describe('Alphabet', () => {
  test('zeigt alle 33 Buchstaben mit Aussprache und spielt Buchstabe und Beispiel ab', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const log: string[] = [];
      (window as unknown as { __audio: string[] }).__audio = log;
      HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
        log.push(new URL(this.src).pathname);
        return Promise.resolve();
      };
    });
    await page.goto('/');
    await oeffne(page, 'Alphabet');
    const buchstaben = page.locator('.buchstabenliste > li');
    await expect(buchstaben).toHaveCount(33);
    await expect(buchstaben.nth(29)).toContainText('Weichheitszeichen');
    await buchstaben.nth(1).getByRole('button', { name: 'Б anhören' }).click();
    await buchstaben.nth(1).getByRole('button', { name: 'Beispiel' }).click();
    const log = await page.evaluate(() => (window as unknown as { __audio: string[] }).__audio);
    expect(log).toEqual(['/audio/alf-002.mp3', '/audio/alb-002.mp3']);
  });

  test('Übung: Buchstaben sehen und zuordnen', async ({ page }) => {
    await page.goto('/');
    await oeffne(page, 'Alphabet');
    const zeichen = (await page.locator('.buchstabe-gross').innerText()).trim();
    const aussprache = await page
      .locator('.buchstabenliste > li')
      .filter({ has: page.locator('.buchstabe__zeichen', { hasText: zeichen }) })
      .locator('.buchstabe__aussprache')
      .innerText();
    await page
      .getByRole('group', { name: 'Antworten' })
      .getByRole('button', { name: aussprache, exact: true })
      .click();
    await expect(page.getByRole('status').filter({ hasText: 'Richtig!' })).toBeVisible();
    await expect(page.getByText('1 von 1 richtig')).toBeVisible();
  });
});

test('Datenschutz nennt Speicherort, Hosting und Rechte, ohne Pflichtangaben', async ({ page }) => {
  await page.goto('/');
  await oeffne(page, 'Datenschutz');
  await expect(page.getByText('ausschließlich auf deinem Gerät')).toBeVisible();
  await expect(page.getByText(/Netlify, Inc\., 101 2nd Street/)).toBeVisible();
  await expect(page.getByText(/Art\. 77 DSGVO/)).toBeVisible();
  await expect(page.getByText('privates, kostenloses Angebot')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Kontakt' })).toHaveCount(0);
  const link = page.getByRole('link', { name: 'Datenschutzerklärung von Netlify' });
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
});
