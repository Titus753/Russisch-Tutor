import { expect, test } from '@playwright/test';
import { gespeichertesFeld } from './hilfen.ts';

// Bewusst ohne Test-Grundlage: echter erster Start
test('erscheint beim ersten Start, lässt sich durchblättern und beenden', async ({ page }) => {
  await page.goto('/');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Schritt 1 von 8')).toBeVisible();
  // Seite 1: Mischa stellt sich auf Russisch vor, mit Übersetzung und Stimme
  await expect(dialog.getByRole('heading', { name: /Ми́ша/ })).toBeFocused();
  await expect(dialog.getByText(/Ich bin Mischa, der Bär/)).toBeVisible();
  await expect(dialog.getByRole('button', { name: /Mischa antippen/ })).toBeVisible();
  await expect(dialog.getByText('Tippe auf Mischa – er sagt dir Hallo!')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Zurück' })).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Weiter' }).click();
  await expect(dialog.getByText('Schritt 2 von 8')).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Karteikarten' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Zurück' }).click();
  await expect(dialog.getByText('Schritt 1 von 8')).toBeVisible();
  // Seite 3 erklärt, wie Bewertung und Wiederholung zusammenhängen
  await dialog.getByRole('button', { name: 'Weiter' }).click();
  await dialog.getByRole('button', { name: 'Weiter' }).click();
  await expect(dialog.getByText('Schritt 3 von 8')).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Wann kommt ein Wort wieder?' })).toBeFocused();
  await expect(dialog.getByText(/nach 1, 3, 7, 16 und schließlich 35 Tagen/)).toBeVisible();
  await expect(dialog.getByText(/bunt gemischt aus allen Themen/)).toBeVisible();
  for (let i = 0; i < 5; i++) await dialog.getByRole('button', { name: 'Weiter' }).click();
  await expect(dialog.getByRole('heading', { name: 'Datenschutz und Sicherung' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Los geht’s' }).click();
  await expect(dialog).toHaveCount(0);
  await expect.poll(() => gespeichertesFeld(page, 'tutorialGesehen')).toBe(true);
  await page.reload();
  await expect(page.getByTestId('marke-offen')).toBeVisible();
  // Ab jetzt begrüßt Mischa beim Öffnen – die Einführung kommt nicht erneut
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Los geht’s' })).toBeVisible();
  await expect(page.getByText(/Schritt \d von 8/)).toHaveCount(0);
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
