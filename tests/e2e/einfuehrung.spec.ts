import { expect, test } from '@playwright/test';
import { gespeichertesFeld } from './hilfen.ts';

// Bewusst ohne Test-Grundlage: echter erster Start
test('erscheint beim ersten Start, lässt sich durchblättern und beenden', async ({ page }) => {
  await page.goto('/');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Schritt 1 von 7')).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Karteikarten' })).toBeFocused();
  await expect(dialog.getByRole('button', { name: 'Zurück' })).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Weiter' }).click();
  await expect(dialog.getByText('Schritt 2 von 7')).toBeVisible();
  await dialog.getByRole('button', { name: 'Zurück' }).click();
  await expect(dialog.getByText('Schritt 1 von 7')).toBeVisible();
  for (let i = 0; i < 6; i++) await dialog.getByRole('button', { name: 'Weiter' }).click();
  await expect(dialog.getByRole('heading', { name: 'Datenschutz und Sicherung' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Los geht’s' }).click();
  await expect(dialog).toHaveCount(0);
  await expect.poll(() => gespeichertesFeld(page, 'tutorialGesehen')).toBe(true);
  await page.reload();
  await expect(page.getByTestId('marke-offen')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('Überspringen und Escape beenden die Einführung; über „Mehr" erneut aufrufbar', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Überspringen' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page
    .getByRole('navigation', { name: 'Bereiche' })
    .getByRole('button', { name: 'Mehr' })
    .click();
  await page.getByRole('button', { name: /Einführung ansehen/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
