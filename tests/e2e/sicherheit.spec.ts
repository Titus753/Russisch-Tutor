import { expect, test } from '@playwright/test';

test('lädt ohne Fremd-Requests, CSP-Verstöße oder Konsolenfehler', async ({ page }) => {
  const fremdeAnfragen: string[] = [];
  const fehler: string[] = [];
  page.on('request', (anfrage) => {
    const url = new URL(anfrage.url());
    if (url.origin !== 'http://localhost:4173' && url.protocol !== 'data:') {
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

test('Inline-Skripte werden von der CSP blockiert', async ({ page }) => {
  await page.goto('/');
  const verstoss = await page.evaluate(async () => {
    const verstoss = new Promise<boolean>((fertig) => {
      document.addEventListener('securitypolicyviolation', () => fertig(true), { once: true });
      setTimeout(() => fertig(false), 1000);
    });
    const s = document.createElement('script');
    s.textContent = 'window.__injiziert = true';
    document.body.append(s);
    return verstoss;
  });
  expect(verstoss).toBe(true);
  expect(await page.evaluate(() => '__injiziert' in window)).toBe(false);
});
