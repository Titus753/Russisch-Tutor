import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { expect, test } from './basis.ts';
import { setzeStand } from './hilfen.ts';

const baer = JSON.parse(readFileSync('data/baer.json', 'utf8')) as {
  zeiten: Record<string, { id: string; betonung: string; deutsch: string }>;
  saetze: { id: string; betonung: string; deutsch: string }[];
};

async function mitBegruessung(page: Page, uhrzeit: string) {
  await page.clock.setFixedTime(new Date(`2026-10-05T${uhrzeit}:00`));
  await setzeStand(page, { einstellungen: { begruessung: true } });
}

for (const [uhrzeit, zeit] of [
  ['08:00', 'morgen'],
  ['13:00', 'tag'],
  ['19:30', 'abend'],
  ['23:45', 'nacht'],
] as const) {
  test(`Mischa begrüßt um ${uhrzeit} mit „${baer.zeiten[zeit]!.deutsch}“`, async ({ page }) => {
    await mitBegruessung(page, uhrzeit);
    await page.goto('/');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('img', { name: /Mischa, der Bär/ })).toBeVisible();
    await expect(dialog.locator('[lang="ru"]').first()).toHaveText(baer.zeiten[zeit]!.betonung);
    await expect(dialog).toContainText(baer.zeiten[zeit]!.deutsch);
    // Zweiter Satz stammt aus dem Pool, mit Übersetzung
    const zweiter = await dialog.locator('[lang="ru"]').nth(1).innerText();
    const satz = baer.saetze.find((s) => s.betonung === zweiter);
    expect(satz, zweiter).toBeDefined();
    await expect(dialog).toContainText(satz!.deutsch);
    await expect(dialog.getByRole('button', { name: 'Los geht’s' })).toBeFocused();
    await dialog.getByRole('button', { name: 'Los geht’s' }).click();
    await expect(dialog).toHaveCount(0);
  });
}

test('spricht Begrüßung und zweiten Satz nacheinander mit der Bärenstimme', async ({ page }) => {
  await page.addInitScript(() => {
    const log: string[] = [];
    (window as unknown as { __audio: string[] }).__audio = log;
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      log.push(new URL(this.src).pathname);
      return Promise.resolve();
    };
  });
  await mitBegruessung(page, '08:00');
  await page.goto('/');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __audio: string[] }).__audio.length))
    .toBeGreaterThanOrEqual(2);
  const log = await page.evaluate(() => (window as unknown as { __audio: string[] }).__audio);
  expect(log[0]).toBe(`/audio/${baer.zeiten.morgen!.id}.mp3`);
  expect(log[1]).toMatch(/^\/audio\/bae-\d{3}\.mp3$/);
  // Antippen des Bären spricht erneut
  await page.getByRole('button', { name: 'Mischa sprechen lassen' }).click();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __audio: string[] }).__audio.length))
    .toBeGreaterThanOrEqual(3);
});

test('Escape schließt; abschaltbar in den Einstellungen', async ({ page }) => {
  await mitBegruessung(page, '13:00');
  await page.goto('/');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page
    .getByRole('navigation', { name: 'Bereiche' })
    .getByRole('button', { name: 'Mehr' })
    .click();
  await page.getByRole('button', { name: /^Einstellungen/ }).click();
  const schalter = page.getByRole('switch', { name: /Mischa begrüßt mich beim Start/ });
  await expect(schalter).toHaveAttribute('aria-checked', 'true');
  await schalter.click();
  await expect(schalter).toHaveAttribute('aria-checked', 'false');
  await page.waitForTimeout(300);
  await page.goto('/');
  await expect(page.getByTestId('marke-offen')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('beim allerersten Start übernimmt die Einführung (keine doppelte Begrüßung)', async ({
  page,
}) => {
  await setzeStand(page, { tutorialGesehen: false, einstellungen: { begruessung: true } });
  await page.goto('/');
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(page.getByText('Schritt 1 von 7')).toBeVisible();
});
