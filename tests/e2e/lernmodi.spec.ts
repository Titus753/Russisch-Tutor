import type { Page } from '@playwright/test';
import { expect, test } from './basis.ts';
import {
  eintragZu,
  falscheSprachausgabe,
  gespeicherteKarten,
  gesprochen,
  heuteImBrowser,
  setzeStand,
} from './hilfen.ts';

const tab = (page: Page, name: string) =>
  page.getByRole('navigation', { name: 'Bereiche' }).getByRole('button', { name });

/** Tippt Text über die App-Tastatur (Satzzeichen außer , und ? werden übersprungen). */
async function tippeMitAppTastatur(page: Page, text: string) {
  const tastatur = page.getByRole('group', { name: 'Russische Tastatur' });
  for (const z of text.toLowerCase()) {
    if (z === ' ') await tastatur.getByRole('button', { name: 'Leerzeichen' }).click();
    else if (z === ',') await tastatur.getByRole('button', { name: 'Komma' }).click();
    else if (z === '?') await tastatur.getByRole('button', { name: 'Fragezeichen' }).click();
    else if (/[а-яё]/.test(z)) await tastatur.getByRole('button', { name: z, exact: true }).click();
  }
}

test.describe('Karteikarten', () => {
  test('aufdecken, bewerten, Fortschritt bleibt nach Neuladen erhalten', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Noch 20 Karten in dieser Runde')).toBeVisible();
    await page.getByRole('button', { name: 'Aufdecken' }).click();
    await page.getByRole('button', { name: 'Gut' }).click();
    await expect(page.getByText('Noch 19 Karten in dieser Runde')).toBeVisible();
    await expect.poll(() => gespeicherteKarten(page)).toBe(1);
    await page.reload();
    await expect(page.getByTestId('marke-offen')).toHaveText('19 heute offen');
  });

  test('„Nochmal" behält die Karte in der Runde; Tastatur: Leertaste und 1–4', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Aufdecken' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Gut' })).toBeFocused();
    await page.keyboard.press('1');
    await expect(page.getByText('Noch 20 Karten in dieser Runde')).toBeVisible();
    await page.keyboard.press(' ');
    await page.keyboard.press('3');
    await expect(page.getByText('Noch 19 Karten in dieser Runde')).toBeVisible();
  });

  test('leerer Zustand „Молодец!" und 10 neue Karten dazunehmen', async ({ page }) => {
    await page.goto('/');
    const tag = await heuteImBrowser(page);
    await setzeStand(page, {
      version: 1,
      karten: {},
      einstellungen: { neueProTag: 10 },
      lerntage: [tag],
      neuHeute: {
        tag,
        ids: Array.from({ length: 10 }, (_, i) => `x${i}`).map(() => 'beg-001'),
        zusatz: 0,
      },
    });
    await page.reload();
    await expect(page.getByText('Молодец!')).toBeVisible();
    await expect(page.getByText('Gut gemacht. Für heute ist alles wiederholt.')).toBeVisible();
    await expect(page.getByTestId('marke-offen')).toHaveText('Heute erledigt');
    await page.getByRole('button', { name: '10 neue Karten dazunehmen' }).click();
    await expect(page.getByText('Noch 10 Karten in dieser Runde')).toBeVisible();
  });
});

test.describe('Quiz', () => {
  test('richtige Antwort wird grün, Zähler und Auflösung mit Anhören', async ({ page }) => {
    await page.goto('/');
    await tab(page, 'Quiz').click();
    const frage = await page.locator('.karte .kartentext').first().innerText();
    const e = eintragZu(frage);
    const richtig = frage.trim() === e.deutsch ? e.russisch : e.deutsch;
    const antworten = page.getByRole('group', { name: 'Antworten' }).getByRole('button');
    await expect(antworten).toHaveCount(4);
    await antworten.filter({ hasText: richtig }).first().click();
    await expect(page.getByRole('status').filter({ hasText: 'Richtig!' })).toBeVisible();
    await expect(page.getByText('1 von 1 richtig')).toBeVisible();
    await expect(page.locator('.antwort--richtig')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Weiter' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('.antwort--richtig')).toHaveCount(0);
  });

  test('falsche Antwort wird rot, die richtige grün markiert', async ({ page }) => {
    await page.goto('/');
    await tab(page, 'Quiz').click();
    const frage = await page.locator('.karte .kartentext').first().innerText();
    const e = eintragZu(frage);
    const richtig = frage.trim() === e.deutsch ? e.russisch : e.deutsch;
    const antworten = page.getByRole('group', { name: 'Antworten' }).getByRole('button');
    await antworten.filter({ hasNotText: richtig }).first().click();
    await expect(page.locator('.antwort--falsch')).toHaveCount(1);
    await expect(page.locator('.antwort--richtig')).toHaveCount(1);
    await expect(page.getByText('0 von 1 richtig')).toBeVisible();
  });
});

test.describe('Tippen mit App-Tastatur', () => {
  test('Systemtastatur bleibt zu, Tab-Leiste weg, alles Wichtige sichtbar', async ({ page }) => {
    await page.goto('/');
    await tab(page, 'Tippen').click();
    const feld = page.getByRole('textbox', { name: 'Deine Antwort auf Russisch' });
    await expect(feld).toHaveAttribute('inputmode', 'none');
    await feld.click();
    await expect(page.getByRole('navigation', { name: 'Bereiche' })).toHaveCount(0);
    const tastatur = page.getByRole('group', { name: 'Russische Tastatur' });
    await expect(tastatur).toBeVisible();
    for (const taste of await tastatur.getByRole('button').all()) {
      expect((await taste.boundingBox())!.height).toBeGreaterThanOrEqual(48);
    }
    await expect(page.locator('.tippen__aufgabe .kartentext')).toBeInViewport();
    await expect(feld).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Prüfen' })).toBeInViewport();
  });

  test('richtige Antwort eintippen, Enter prüft und geht weiter', async ({ page }) => {
    await page.goto('/');
    await tab(page, 'Tippen').click();
    const e = eintragZu(await page.locator('.tippen__aufgabe .kartentext').innerText());
    const feld = page.getByRole('textbox', { name: 'Deine Antwort auf Russisch' });
    await feld.click();
    await tippeMitAppTastatur(page, e.genusvarianten?.w ?? e.russisch);
    await expect(feld).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('status').filter({ hasText: 'Richtig!' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Bereiche' })).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(feld).toHaveValue('');
    await expect(feld).toBeFocused();
  });

  test('Tippfehler: „Fast richtig" mit markierter Stelle; Löschen-Taste', async ({ page }) => {
    await page.goto('/');
    await tab(page, 'Tippen').click();
    const e = eintragZu(await page.locator('.tippen__aufgabe .kartentext').innerText());
    const loesung = (e.genusvarianten?.m ?? e.russisch)
      .toLowerCase()
      .replace(/[-–—]/g, ' ')
      .replace(/[^а-яё ]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const falsch = loesung.slice(0, -1) + (loesung.endsWith('ы') ? 'и' : 'ы');
    await page.getByRole('textbox', { name: 'Deine Antwort auf Russisch' }).click();
    await tippeMitAppTastatur(page, `${falsch}ж`);
    await page.getByRole('button', { name: 'Löschen' }).click();
    await page.getByRole('button', { name: 'Prüfen' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Fast richtig' })).toBeVisible();
    await expect(page.locator('mark.abweichung')).toHaveCount(1);
  });

  test('Tipp zeigt die ersten Buchstaben, Lösung deckt auf', async ({ page }) => {
    await page.goto('/');
    await tab(page, 'Tippen').click();
    const e = eintragZu(await page.locator('.tippen__aufgabe .kartentext').innerText());
    await page.getByRole('button', { name: 'Tipp', exact: true }).click();
    await expect(page.locator('.tipp')).toContainText((e.genusvarianten?.m ?? e.russisch)[0]!);
    await page.getByRole('button', { name: 'Lösung' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Die Lösung lautet' })).toBeVisible();
  });
});

test.describe('Tippen mit Systemtastatur', () => {
  test('Feld und Prüfen bleiben über der (simulierten) Tastatur sichtbar', async ({ page }) => {
    await page.goto('/');
    await tab(page, 'Mehr').click();
    await page.getByRole('button', { name: /^Einstellungen/ }).click();
    await page.getByRole('radio', { name: 'Systemtastatur' }).click();
    await tab(page, 'Tippen').click();
    const feld = page.getByRole('textbox', { name: 'Deine Antwort auf Russisch' });
    await expect(feld).toHaveAttribute('inputmode', 'text');
    await expect(page.getByText('Russische Tastatur hinzufügen')).toBeVisible();
    const e = eintragZu(await page.locator('.tippen__aufgabe .kartentext').innerText());
    await feld.click();
    // Tastatur simulieren: sichtbarer Bereich schrumpft auf ~55 %
    const groesse = page.viewportSize()!;
    await page.setViewportSize({ width: groesse.width, height: Math.round(groesse.height * 0.55) });
    await expect(feld).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Prüfen' })).toBeInViewport();
    await expect(page.locator('.tippen__aufgabe .kartentext')).toBeInViewport();
    await page.keyboard.type(e.genusvarianten?.m ?? e.russisch);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('status').filter({ hasText: 'Richtig!' })).toBeVisible();
  });
});

test.describe('Hören', () => {
  test('ohne Aufnahme: lokale Stimme (normal/langsam), Russisch erst nach der Antwort', async ({
    page,
  }) => {
    await falscheSprachausgabe(page, true);
    await page.route('**/audio/*.mp3', (route) => route.fulfill({ status: 404, body: '' }));
    await page.goto('/');
    await tab(page, 'Hören').click();
    await expect(page.locator('.karte [lang="ru"]')).toHaveCount(0);
    await page.getByRole('button', { name: 'Anhören' }).click();
    await page.getByRole('button', { name: 'Langsam' }).click();
    // Erst scheitert die (fehlende) Aufnahme, dann spricht die Gerätestimme: auf beide warten
    await expect.poll(async () => (await gesprochen(page)).length).toBe(2);
    const [normal, langsam] = await gesprochen(page);
    const russisch = normal!.split('|')[0]!;
    expect(langsam).toBe(`${russisch}|0.6`);
    const e = eintragZu(russisch);
    await page
      .getByRole('group', { name: 'Antworten' })
      .getByRole('button', { name: e.deutsch })
      .first()
      .click();
    await expect(page.getByRole('status').filter({ hasText: 'Richtig!' })).toBeVisible();
    await expect(page.locator('.karte [lang="ru"]')).toBeVisible();
  });

  test('nutzt keine Stimmen, die Text an einen Server senden', async ({ page }) => {
    await falscheSprachausgabe(page, false);
    await page.route('**/audio/*.mp3', (route) => route.fulfill({ status: 404, body: '' }));
    await page.goto('/');
    await tab(page, 'Hören').click();
    await page.getByRole('button', { name: 'Anhören' }).click();
    await expect(page.getByText('Aussprache nicht verfügbar.', { exact: false })).toBeVisible();
    expect(await gesprochen(page)).toEqual([]);
  });
});
