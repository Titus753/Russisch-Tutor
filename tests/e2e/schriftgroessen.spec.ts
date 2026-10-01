import type { Page, TestInfo } from '@playwright/test';
import { expect, test } from './basis.ts';
import { setzeStand } from './hilfen.ts';

const STUFEN = ['klein', 'normal', 'gross', 'sehr-gross'] as const;

/** Prüft die aktuelle Ansicht auf Layoutfehler und hängt einen Screenshot an den Bericht. */
async function pruefeAnsicht(page: Page, info: TestInfo, name: string) {
  await page.waitForTimeout(150); // Einblend-Animationen abwarten
  const befund = await page.evaluate(() => {
    const breite = window.innerWidth;
    const probleme: string[] = [];
    if (document.documentElement.scrollWidth > breite + 1) {
      probleme.push(`waagerechtes Scrollen: ${document.documentElement.scrollWidth} > ${breite}`);
    }
    const sichtbar = (el: Element) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && !el.closest('.nur-sr, [aria-hidden="true"]');
    };
    const name = (el: Element) =>
      `${el.tagName.toLowerCase()}.${[...el.classList].join('.')} „${(el.textContent ?? '').trim().slice(0, 25)}“`;
    for (const el of document.querySelectorAll(
      'button, a, p, h1, h2, h3, li, span, input, label',
    )) {
      if (!sichtbar(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.right > breite + 1 || r.left < -1) probleme.push(`ragt aus dem Bild: ${name(el)}`);
      const stil = getComputedStyle(el);
      if (el.scrollWidth > el.clientWidth + 1 && stil.overflowX !== 'auto' && el.clientWidth > 0) {
        probleme.push(`Inhalt abgeschnitten/übersteht: ${name(el)}`);
      }
    }
    for (const el of document.querySelectorAll(
      'button, a, input, [role="switch"], [role="radio"]',
    )) {
      if (!sichtbar(el) || el.closest('.tutorial__bild, .demo')) continue;
      const r = el.getBoundingClientRect();
      const istTaste = el.classList.contains('taste');
      if (r.height < (istTaste ? 48 : 44) - 0.5)
        probleme.push(`zu niedrig (${r.height.toFixed(0)} px): ${name(el)}`);
      if (!istTaste && el.tagName !== 'A' && r.width < 43.5)
        probleme.push(`zu schmal (${r.width.toFixed(0)} px): ${name(el)}`);
    }
    // Nichts darf dauerhaft unter der Tab-Leiste verschwinden
    const tabs = document.querySelector('.tabs');
    const main = document.querySelector('main');
    if (tabs && main && !document.querySelector('dialog[open]')) {
      window.scrollTo(0, document.documentElement.scrollHeight);
      const unten = [...main.querySelectorAll('*')]
        .filter(sichtbar)
        .reduce((m, el) => Math.max(m, el.getBoundingClientRect().bottom), 0);
      if (unten > tabs.getBoundingClientRect().top + 1)
        probleme.push('Inhalt liegt unter der Tab-Leiste');
      window.scrollTo(0, 0);
    }
    return probleme;
  });
  await info.attach(`${name}.png`, {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
  expect(befund, `${name}: ${befund.join(' | ')}`).toEqual([]);
}

const tab = (page: Page, name: string) =>
  page.getByRole('navigation', { name: 'Bereiche' }).getByRole('button', { name });

for (const stufe of STUFEN) {
  test(`Schriftstufe „${stufe}“ bei 360 px: nichts abgeschnitten oder überlappend`, async ({
    page,
  }, info) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 360, height: 740 });
    await setzeStand(page, { einstellungen: { schrift: stufe, begruessung: true } });
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-schrift', stufe);
    await expect(page.getByRole('dialog')).toBeVisible();
    await pruefeAnsicht(page, info, `${stufe}-willkommen`);
    await page.getByRole('button', { name: 'Los geht’s' }).click();

    await page.getByRole('button', { name: 'Aufdecken' }).click();
    await pruefeAnsicht(page, info, `${stufe}-karten`);

    await tab(page, 'Quiz').click();
    await page.getByRole('group', { name: 'Antworten' }).getByRole('button').first().click();
    await pruefeAnsicht(page, info, `${stufe}-quiz`);

    await tab(page, 'Tippen').click();
    await page.getByRole('textbox', { name: 'Deine Antwort auf Russisch' }).click();
    // Aufgabe, Eingabefeld und Prüfen-Knopf müssen vollständig sichtbar sein
    await expect(page.locator('.tippen__aufgabe .kartentext')).toBeInViewport({ ratio: 1 });
    await expect(page.getByRole('button', { name: 'Prüfen' })).toBeInViewport({ ratio: 1 });
    await expect(page.getByRole('textbox', { name: 'Deine Antwort auf Russisch' })).toBeInViewport({
      ratio: 1,
    });
    await pruefeAnsicht(page, info, `${stufe}-tippen-tastatur`);
    await page.getByRole('button', { name: 'Tastatur ausblenden' }).click();

    await tab(page, 'Hören').click();
    await pruefeAnsicht(page, info, `${stufe}-hoeren`);

    await tab(page, 'Mehr').click();
    await pruefeAnsicht(page, info, `${stufe}-mehr`);
    for (const seite of ['Einstellungen', 'Fortschritt', 'Sicherung', 'Alphabet', 'Datenschutz']) {
      await page.getByRole('button', { name: new RegExp(`^${seite}`) }).click();
      await pruefeAnsicht(page, info, `${stufe}-${seite.toLowerCase()}`);
      await page.getByRole('button', { name: '← Zurück' }).click();
    }

    await page.getByRole('button', { name: /Einführung ansehen/ }).click();
    await pruefeAnsicht(page, info, `${stufe}-einfuehrung`);
    // Längster Text der Einführung: Erklärung der Wiederholung (Seite 3)
    await page.getByRole('button', { name: 'Weiter' }).click();
    await page.getByRole('button', { name: 'Weiter' }).click();
    await pruefeAnsicht(page, info, `${stufe}-einfuehrung-wiederholung`);
  });
}

test('ungünstigster Fall: „Sehr groß“, lange Sprichwörter, Tastatur offen – Aufgabe immer ganz sichtbar', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await setzeStand(page, {
    einstellungen: {
      schrift: 'sehr-gross',
      themen: ['redewendungen'],
      inhaltsarten: ['redewendung'],
    },
  });
  await page.goto('/');
  await tab(page, 'Tippen').click();
  const feld = page.getByRole('textbox', { name: 'Deine Antwort auf Russisch' });
  for (let i = 0; i < 10; i++) {
    await feld.click();
    await expect(page.locator('.tippen__aufgabe .kartentext')).toBeInViewport({ ratio: 1 });
    await expect(page.getByRole('button', { name: 'Prüfen' })).toBeInViewport({ ratio: 1 });
    await page.getByRole('button', { name: 'Lösung' }).click();
    await page.getByRole('button', { name: 'Weiter' }).click();
  }
});
