import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from './basis.ts';
import { setzeStand } from './hilfen.ts';

/** Prüft die aktuelle Ansicht gegen WCAG 2.2 A/AA. */
async function pruefe(page: Page, name: string) {
  await page.waitForTimeout(250); // Einblend-Animationen abwarten (Kontrastmessung)
  const ergebnis = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const befunde = ergebnis.violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.nodes
        .map((n) => n.target.join(' '))
        .slice(0, 3)
        .join(', ')}`,
  );
  expect(befunde, `${name}:\n${befunde.join('\n')}`).toEqual([]);
}

const tab = (page: Page, name: string) =>
  page.getByRole('navigation', { name: 'Bereiche' }).getByRole('button', { name });

for (const modus of [
  { farbmodus: 'hell', kontrast: false },
  { farbmodus: 'dunkel', kontrast: false },
  { farbmodus: 'hell', kontrast: true },
] as const) {
  test(`WCAG 2.2 AA: alle Ansichten (${modus.farbmodus}${modus.kontrast ? ', hoher Kontrast' : ''})`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    // axe einmal pro Modus und Engine genügt
    test.skip(test.info().project.name === 'iPhone 15', 'gleiche Engine wie iPhone SE');
    await setzeStand(page, { einstellungen: { ...modus, begruessung: true } });
    await page.goto('/');
    await expect(page.getByRole('dialog')).toBeVisible();
    await pruefe(page, 'willkommen');
    await page.getByRole('button', { name: 'Los geht’s' }).click();
    await pruefe(page, 'karten');
    await page.getByRole('button', { name: 'Aufdecken' }).click();
    await pruefe(page, 'karten-aufgedeckt');

    await tab(page, 'Quiz').click();
    await pruefe(page, 'quiz');
    await page.getByRole('group', { name: 'Antworten' }).getByRole('button').first().click();
    await pruefe(page, 'quiz-aufgeloest');

    await tab(page, 'Tippen').click();
    await page.getByRole('textbox', { name: 'Deine Antwort auf Russisch' }).click();
    await pruefe(page, 'tippen-tastatur');
    await page.getByRole('button', { name: 'Lösung' }).click();
    await pruefe(page, 'tippen-loesung');

    await tab(page, 'Hören').click();
    await pruefe(page, 'hoeren');

    await tab(page, 'Mehr').click();
    await pruefe(page, 'mehr');
    for (const seite of ['Alphabet', 'Fortschritt', 'Einstellungen', 'Sicherung', 'Datenschutz']) {
      await page.getByRole('button', { name: new RegExp(`^${seite}`) }).click();
      await pruefe(page, seite);
      await page.getByRole('button', { name: '← Zurück' }).click();
    }
    await page.getByRole('button', { name: /Einführung ansehen/ }).click();
    await pruefe(page, 'einfuehrung');
  });
}
