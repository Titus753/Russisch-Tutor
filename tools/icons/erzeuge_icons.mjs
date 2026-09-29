// Erzeugt die App-Icons (PNG) aus einer SVG-Vorlage mit dem lokalen Playwright-Chromium.
// Aufruf: node tools/icons/erzeuge_icons.mjs  – kein Netzwerk, schreibt nur nach public/icons/.
import { chromium } from '@playwright/test';

/** Gzhel-Kachel: Kobalt-Doppelrand, Serifen-„Сл“. `sicher` = Inhalt in der Maskable-Sicherheitszone. */
const svg = (sicher) => {
  const r = sicher ? 0 : 22; // maskable: vollflächig, das System schneidet selbst zu
  const rahmen = sicher ? 14 : 4;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="${r}" fill="#EEF2F9"/>
  <rect x="${rahmen}" y="${rahmen}" width="${100 - 2 * rahmen}" height="${100 - 2 * rahmen}" rx="${sicher ? 16 : 20}"
        fill="#FFFFFF" stroke="#1C3F9C" stroke-width="3.5"/>
  <rect x="${rahmen + 4.5}" y="${rahmen + 4.5}" width="${100 - 2 * rahmen - 9}" height="${100 - 2 * rahmen - 9}" rx="${sicher ? 12 : 16}"
        fill="none" stroke="#1C3F9C" stroke-width="1.2"/>
  <text x="50" y="${sicher ? 62 : 65}" font-family="Georgia, 'Times New Roman', serif" font-size="${sicher ? 34 : 44}"
        text-anchor="middle" fill="#1C3F9C">Сл</text>
</svg>`;
};

const ZIELE = [
  { datei: 'icon-192.png', groesse: 192, sicher: false },
  { datei: 'icon-512.png', groesse: 512, sicher: false },
  { datei: 'icon-maskable-512.png', groesse: 512, sicher: true },
  { datei: 'apple-touch-icon.png', groesse: 180, sicher: true },
];

const browser = await chromium.launch({ channel: 'chromium' });
try {
  for (const { datei, groesse, sicher } of ZIELE) {
    const seite = await browser.newPage({ viewport: { width: groesse, height: groesse } });
    await seite.setContent(
      `<html><body style="margin:0;background:transparent">${svg(sicher).replace('<svg ', `<svg width="${groesse}" height="${groesse}" `)}</body></html>`,
    );
    await seite.screenshot({ path: `public/icons/${datei}`, omitBackground: true });
    await seite.close();
    console.log(`public/icons/${datei}`);
  }
} finally {
  await browser.close();
}
