import { readdirSync, readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';

export interface Eintrag {
  id: string;
  typ: string;
  russisch: string;
  deutsch: string;
  betonung?: string;
  genusvarianten?: { m: string; w: string };
}

export const vokabeln: Eintrag[] = readdirSync('data/vokabeln')
  .filter((n) => n.endsWith('.json'))
  .flatMap((n) => JSON.parse(readFileSync(`data/vokabeln/${n}`, 'utf8')) as Eintrag[]);

const anzeige = (e: Eintrag) =>
  e.genusvarianten ? `${e.genusvarianten.m} / ${e.genusvarianten.w}` : (e.betonung ?? e.russisch);

/** Findet den Eintrag zu einem angezeigten Fragetext (deutsch oder russisch). */
export function eintragZu(text: string): Eintrag {
  const t = text.trim();
  const e = vokabeln.find((v) => v.deutsch === t || anzeige(v) === t || v.russisch === t);
  if (!e) throw new Error(`Kein Eintrag zu „${t}"`);
  return e;
}

/** Heutiges Datum im Browser (lokale Zeit), wie die App es berechnet. */
export function heuteImBrowser(page: Page): Promise<string> {
  return page.evaluate(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
}

/** Schreibt einen Lernstand direkt in die IndexedDB der App (Standard: Einführung gesehen). */
export async function setzeStand(page: Page, teil: Record<string, unknown>) {
  const stand = {
    version: 1,
    karten: {},
    einstellungen: {},
    lerntage: [],
    neuHeute: null,
    tutorialGesehen: true,
    ...teil,
  };
  await page.evaluate(
    (w) =>
      new Promise<void>((fertig, fehler) => {
        const anfrage = indexedDB.open('slovo-za-slovo');
        anfrage.onerror = () => fehler(anfrage.error);
        anfrage.onsuccess = () => {
          const tx = anfrage.result.transaction('daten', 'readwrite');
          tx.objectStore('daten').put(w, 'stand');
          tx.oncomplete = () => {
            anfrage.result.close();
            fertig();
          };
        };
      }),
    stand,
  );
}

/**
 * Ersetzt die Sprachausgabe durch eine Attrappe, die gesprochene Texte mitschreibt.
 * `lokal` steuert, ob die russische Stimme lokal ist (sonst würde Text das Gerät verlassen).
 */
export async function falscheSprachausgabe(page: Page, lokal: boolean) {
  await page.addInitScript((istLokal) => {
    const gesprochen: string[] = [];
    (window as unknown as { __gesprochen: string[] }).__gesprochen = gesprochen;
    const stimme = {
      lang: 'ru-RU',
      localService: istLokal,
      default: true,
      name: 'Test',
      voiceURI: 'test',
    };
    class Aeusserung {
      voice: unknown = null;
      lang = '';
      rate = 1;
      constructor(public text: string) {}
    }
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      value: Aeusserung,
      configurable: true,
    });
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        getVoices: () => [stimme],
        cancel: () => undefined,
        speak: (a: Aeusserung) => gesprochen.push(`${a.text}|${a.rate}`),
        addEventListener: () => undefined,
      },
    });
  }, lokal);
}

export const gesprochen = (page: Page) =>
  page.evaluate(() => (window as unknown as { __gesprochen: string[] }).__gesprochen);

/** Anzahl gespeicherter Karten in der IndexedDB (wartet nicht auf die App). */
export function gespeicherteKarten(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      new Promise<number>((fertig) => {
        const anfrage = indexedDB.open('slovo-za-slovo');
        anfrage.onsuccess = () => {
          const get = anfrage.result.transaction('daten').objectStore('daten').get('stand');
          get.onsuccess = () => {
            anfrage.result.close();
            fertig(
              Object.keys((get.result as { karten?: object } | undefined)?.karten ?? {}).length,
            );
          };
        };
      }),
  );
}

/** Liest ein Feld des gespeicherten Lernstands direkt aus der IndexedDB. */
export function gespeichertesFeld(page: Page, feld: string): Promise<unknown> {
  return page.evaluate(
    (f) =>
      new Promise((fertig) => {
        const anfrage = indexedDB.open('slovo-za-slovo');
        anfrage.onsuccess = () => {
          const get = anfrage.result.transaction('daten').objectStore('daten').get('stand');
          get.onsuccess = () => {
            anfrage.result.close();
            fertig((get.result as Record<string, unknown> | undefined)?.[f]);
          };
        };
      }),
    feld,
  );
}
