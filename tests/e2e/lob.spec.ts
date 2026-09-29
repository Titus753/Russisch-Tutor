import { readFileSync } from 'node:fs';
import { expect, test } from './basis.ts';
import { gespeicherteKarten, setzeStand } from './hilfen.ts';

const pool = JSON.parse(readFileSync('data/lob.json', 'utf8')) as {
  russisch: string;
  betonung?: string;
  deutsch: string;
}[];

test('nach einer geschafften Runde: russisches Lob mit Übersetzung, Fortschritt bleibt', async ({
  page,
}) => {
  await setzeStand(page, { einstellungen: { neueProTag: 10 } });
  await page.goto('/');
  for (let i = 0; i < 10; i++) {
    await page.getByRole('button', { name: 'Aufdecken' }).click();
    await page.getByRole('button', { name: 'Gut' }).click();
  }
  const lob = page.getByTestId('lob');
  await expect(lob).toBeVisible();
  const russisch = await lob.locator('[lang="ru"]').innerText();
  const eintrag = pool.find((l) => (l.betonung ?? l.russisch) === russisch);
  expect(eintrag, `„${russisch}“ stammt aus dem Pool`).toBeDefined();
  await expect(lob).toContainText(eintrag!.deutsch);
  await expect(lob.getByRole('button', { name: 'Anhören' })).toBeVisible();
  await expect(page.getByText('Dein Fortschritt ist gespeichert.')).toBeVisible();
  await expect(page.getByTestId('marke-offen')).toHaveText('Heute erledigt');

  // Fortschritt überlebt das Neuladen; das Lob erscheint wieder
  await expect.poll(() => gespeicherteKarten(page)).toBe(10);
  await page.reload();
  await expect(page.getByTestId('lob')).toBeVisible();
  await expect(page.getByTestId('marke-offen')).toHaveText('Heute erledigt');
});

test('das Lob wechselt und wiederholt sich nicht direkt', async ({ page }) => {
  await setzeStand(page, { einstellungen: { neueProTag: 10 } });
  await page.goto('/');
  for (let i = 0; i < 10; i++) {
    await page.getByRole('button', { name: 'Aufdecken' }).click();
    await page.getByRole('button', { name: 'Gut' }).click();
  }
  const texte: string[] = [];
  for (let runde = 0; runde < 4; runde++) {
    texte.push(await page.getByTestId('lob').locator('[lang="ru"]').innerText());
    // Weitere Mini-Runde: 10 dazunehmen und durcharbeiten
    await page.getByRole('button', { name: '10 neue Karten dazunehmen' }).click();
    for (let i = 0; i < 10; i++) {
      await page.getByRole('button', { name: 'Aufdecken' }).click();
      await page.getByRole('button', { name: 'Leicht' }).click();
    }
  }
  for (let i = 1; i < texte.length; i++) expect(texte[i]).not.toBe(texte[i - 1]);
});
