import type { Page } from '@playwright/test';
import { expect, test } from './basis.ts';
import { eintragZu, falscheSprachausgabe, gesprochen, vokabeln } from './hilfen.ts';

const tab = (page: Page, name: string) =>
  page.getByRole('navigation', { name: 'Bereiche' }).getByRole('button', { name });

/** Protokolliert jede Wiedergabe eines Audio-Elements (Quelle, Tempo, Tonhöhe) statt abzuspielen. */
async function protokolliereAudio(page: Page) {
  await page.addInitScript(() => {
    const log: { src: string; rate: number; pitch: boolean }[] = [];
    (window as unknown as { __audio: typeof log }).__audio = log;
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      log.push({ src: this.src, rate: this.playbackRate, pitch: this.preservesPitch });
      return Promise.resolve();
    };
  });
}
const audioLog = (page: Page) =>
  page.evaluate(
    () =>
      (window as unknown as { __audio: { src: string; rate: number; pitch: boolean }[] }).__audio,
  );

test('Anhören spielt die passende MP3-Datei über das Audio-Element', async ({ page }) => {
  await protokolliereAudio(page);
  await falscheSprachausgabe(page, true);
  await page.goto('/');
  // Karte mit russischer Vorderseite finden (Richtung ist gemischt)
  for (let i = 0; i < 20; i++) {
    if (await page.locator('.karte').getByRole('button', { name: 'Anhören' }).count()) break;
    await page.getByRole('button', { name: 'Aufdecken' }).click();
    await page.getByRole('button', { name: 'Gut' }).click();
  }
  const text = await page.locator('.karte .kartentext').first().innerText();
  const e = eintragZu(text);
  await page.locator('.karte').getByRole('button', { name: 'Anhören' }).click();
  const [eintrag] = await audioLog(page);
  expect(new URL(eintrag!.src).pathname).toBe(`/audio/${e.id}.mp3`);
  expect(eintrag!.rate).toBe(1);
  expect(eintrag!.pitch).toBe(true);
  expect(await gesprochen(page)).toEqual([]); // keine Gerätestimme nötig
});

test('Hören: normal und langsam (0,8-fach, gleiche Tonhöhe) mit derselben Datei', async ({
  page,
}) => {
  await protokolliereAudio(page);
  await page.goto('/');
  await tab(page, 'Hören').click();
  await page.getByRole('button', { name: 'Anhören' }).click();
  await page.getByRole('button', { name: 'Langsam' }).click();
  const [normal, langsam] = await audioLog(page);
  expect(langsam!.src).toBe(normal!.src);
  expect(normal!.rate).toBe(1);
  expect(langsam!.rate).toBeCloseTo(0.8);
  expect(langsam!.pitch).toBe(true);
  // Auflösung: richtige Bedeutung anhand der gespielten Datei wählen
  const id = new URL(normal!.src).pathname.replace(/^\/audio\/|\.mp3$/g, '');
  const e = vokabeln.find((v) => v.id === id)!;
  await page
    .getByRole('group', { name: 'Antworten' })
    .getByRole('button', { name: e.deutsch })
    .first()
    .click();
  await expect(page.getByRole('status').filter({ hasText: 'Richtig!' })).toBeVisible();
});

test('Audiodatei wird vom eigenen Server als MP3 ausgeliefert', async ({ request }) => {
  const e = vokabeln[0]!;
  const antwort = await request.get(`/audio/${e.id}.mp3`);
  expect(antwort.status()).toBe(200);
  expect(antwort.headers()['content-type']).toContain('audio/mpeg');
  expect((await antwort.body()).length).toBeGreaterThan(1000);
});

test('fehlt eine Datei, springt die lokale Gerätestimme ein', async ({ page }) => {
  await falscheSprachausgabe(page, true);
  await page.route('**/audio/*.mp3', (route) => route.fulfill({ status: 404, body: '' }));
  await page.goto('/');
  await tab(page, 'Hören').click();
  await page.getByRole('button', { name: 'Anhören' }).click();
  await expect.poll(async () => (await gesprochen(page)).length).toBe(1);
});

test('echte Wiedergabe: die MP3 lässt sich im Browser dekodieren', async ({ page }) => {
  await page.goto('/');
  const dauer = await page.evaluate(async (id) => {
    const a = new Audio(`/audio/${id}.mp3`);
    a.muted = true;
    await new Promise((fertig, fehler) => {
      a.onloadedmetadata = fertig;
      a.onerror = () => fehler(new Error(`Fehler ${a.error?.code}`));
    });
    return a.duration;
  }, vokabeln[0]!.id);
  expect(dauer).toBeGreaterThan(0.3);
  expect(dauer).toBeLessThan(10);
});
