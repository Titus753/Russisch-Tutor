import { expect, test } from '@playwright/test';

test('lädt ohne Fremd-Requests, CSP-Verstöße oder Konsolenfehler', async ({ page }) => {
  const fremdeAnfragen: string[] = [];
  const fehler: string[] = [];
  page.on('request', (anfrage) => {
    const url = new URL(anfrage.url());
    if (url.origin !== 'http://localhost:4174' && url.protocol !== 'data:') {
      fremdeAnfragen.push(anfrage.url());
    }
  });
  page.on('console', (nachricht) => {
    if (nachricht.type() === 'error') fehler.push(nachricht.text());
  });
  page.on('pageerror', (e) => fehler.push(e.message));

  const antwort = await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Слово за слово' })).toBeVisible();

  expect(antwort?.headers()['content-security-policy']).toContain("script-src 'self'");
  expect(antwort?.headers()['x-content-type-options']).toBe('nosniff');
  expect(fremdeAnfragen).toEqual([]);
  expect(fehler).toEqual([]);
});

test('Build enthält CSP zusätzlich als Meta-Tag', async ({ page }) => {
  await page.goto('/');
  const meta = page.locator('meta[http-equiv="Content-Security-Policy"]');
  await expect(meta).toHaveAttribute('content', /default-src 'self'/);
});

test('eingeschleuste Skripte werden blockiert (Trusted Types oder CSP)', async ({ page }) => {
  await page.goto('/');
  const ergebnis = await page.evaluate(async () => {
    const verstoss = new Promise<string>((fertig) => {
      document.addEventListener(
        'securitypolicyviolation',
        (e) => fertig(`CSP: ${e.violatedDirective}`),
        { once: true },
      );
      setTimeout(() => fertig('kein Verstoß gemeldet'), 1000);
    });
    try {
      const s = document.createElement('script');
      s.textContent = 'window.__injiziert = true';
      document.body.append(s);
    } catch (e) {
      // Trusted Types verweigert bereits die Zuweisung des Skripttexts
      return `Trusted Types: ${(e as Error).name}`;
    }
    return verstoss;
  });
  expect(ergebnis).toMatch(/^(Trusted Types|CSP)/);
  expect(await page.evaluate(() => '__injiziert' in window)).toBe(false);
});

test('HTML mit Event-Handler wird nicht ausgeführt', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const div = document.createElement('div');
    try {
      // Genau das verbietet ESLint im App-Code; hier prüfen wir die Browser-Schutzschicht
      // eslint-disable-next-line no-restricted-syntax -- absichtlicher Angriffsversuch im Test
      div.innerHTML = '<img src="x" onerror="window.__injiziert = true">';
      document.body.append(div);
    } catch {
      // Trusted Types blockiert die Zuweisung – ebenfalls erwünscht
    }
  });
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => '__injiziert' in window)).toBe(false);
});
