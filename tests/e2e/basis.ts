import { test as basis, expect } from '@playwright/test';
import { setzeStand } from './hilfen.ts';

/**
 * Test-Grundlage für alle Tests außer der Einführung: Die App wurde schon einmal geöffnet und
 * die Einführung gesehen (so wie bei einem wiederkehrenden Nutzer).
 */
export const test = basis.extend({
  page: async ({ page }, verwenden) => {
    await page.goto('/');
    await expect(page.getByTestId('marke-offen')).toBeVisible();
    await setzeStand(page, {});
    await verwenden(page);
  },
});

export { expect };
