import { describe, expect, it } from 'vitest';
import {
  AKTUELLE_VERSION,
  MAX_KARTEN,
  neuerStand,
  pruefeStand,
  STANDARD_EINSTELLUNGEN,
  type Stand,
} from '../../src/speicher/schema.ts';
import {
  erstelleSpeicherer,
  laden,
  SCHLUESSEL,
  speicherAblage,
  type Ablage,
} from '../../src/speicher/speicher.ts';

const karte = {
  stufe: 2,
  faellig: '2026-03-12',
  zuletzt: '2026-03-09',
  wiederholungen: 2,
  fehler: 0,
};
const gueltig = (): Stand => ({ ...neuerStand(), karten: { 'ein-001:de-ru': { ...karte } } });

describe('pruefeStand', () => {
  it('akzeptiert einen gültigen Stand unverändert', () => {
    const s = gueltig();
    expect(pruefeStand(s)).toEqual({ stand: s, verworfen: 0 });
  });

  it.each([
    ['null', null],
    ['Zahl', 42],
    ['Array', []],
    ['String', '{"version":1}'],
    ['falsche Version', { ...gueltig(), version: 99 }],
    ['karten kein Objekt', { ...gueltig(), karten: [] }],
    [
      'zu viele Karten',
      {
        ...gueltig(),
        karten: Object.fromEntries(Array.from({ length: MAX_KARTEN + 1 }, (_, i) => [`k${i}`, 1])),
      },
    ],
  ])('lehnt kaputte Grundstruktur ab: %s', (_n, roh) => {
    expect(pruefeStand(roh)).toBeNull();
  });

  it('verwirft einzelne kaputte Karten statt alles', () => {
    const roh = {
      ...gueltig(),
      karten: {
        'ein-001:de-ru': karte,
        'ein-002:de-ru': { ...karte, stufe: 9 },
        'ein-003:de-ru': { ...karte, stufe: 1.5 },
        'ein-004:de-ru': { ...karte, faellig: '2026-02-30' },
        'ein-005:de-ru': { ...karte, extra: '<script>' },
        'ein-006:xx-yy': karte,
        'ein-007:de-ru': { ...karte, wiederholungen: -1 },
        'ein-008:de-ru': 'kaputt',
      },
    };
    const ergebnis = pruefeStand(roh);
    expect(Object.keys(ergebnis!.stand.karten)).toEqual(['ein-001:de-ru']);
    expect(ergebnis!.verworfen).toBe(7);
  });

  it('lässt keine Prototype Pollution zu', () => {
    const roh = JSON.parse(
      `{"version":${AKTUELLE_VERSION},"karten":{"__proto__":{"stufe":1},"constructor":{"x":1}},` +
        `"einstellungen":{"__proto__":{"vorlesen":true}}}`,
    ) as unknown;
    const ergebnis = pruefeStand(roh)!;
    expect(ergebnis.verworfen).toBe(2);
    expect(Object.keys(ergebnis.stand.karten)).toEqual([]);
    expect(({} as Record<string, unknown>).stufe).toBeUndefined();
    expect(ergebnis.stand.einstellungen.vorlesen).toBe(false);
  });

  it('setzt kaputte Einstellungen einzeln auf Standard zurück', () => {
    const roh = {
      ...gueltig(),
      einstellungen: {
        themen: ['tiere', 'tiere', 'weltraum'],
        inhaltsarten: [],
        richtung: 'rückwärts',
        neueProTag: 1_000_000,
        vorlesen: 'ja',
        schrift: 'sehr-gross',
        farbmodus: 'dunkel',
        unbekannt: true,
      },
    };
    const e = pruefeStand(roh)!.stand.einstellungen;
    expect(e.themen).toEqual(STANDARD_EINSTELLUNGEN.themen); // „weltraum" macht die Liste ungültig
    expect(e.inhaltsarten).toEqual(STANDARD_EINSTELLUNGEN.inhaltsarten); // mind. eins aktiv
    expect(e.richtung).toBe('gemischt');
    expect(e.neueProTag).toBe(20);
    expect(e.vorlesen).toBe(false);
    expect(e.schrift).toBe('sehr-gross');
    expect(e.farbmodus).toBe('dunkel');
    expect(e).not.toHaveProperty('unbekannt');
  });

  it('entfernt doppelte Themen und behält gültige Auswahl', () => {
    const roh = { ...gueltig(), einstellungen: { themen: ['tiere', 'bank', 'tiere'] } };
    expect(pruefeStand(roh)!.stand.einstellungen.themen).toEqual(['bank', 'tiere']);
  });

  it('bereinigt Lerntage (ungültige weg, sortiert, ohne Duplikate)', () => {
    const roh = {
      ...gueltig(),
      lerntage: ['2026-03-02', 'x', '2026-03-01', '2026-03-02', 7, '1800-01-01'],
    };
    expect(pruefeStand(roh)!.stand.lerntage).toEqual(['2026-03-01', '2026-03-02']);
  });
});

describe('laden', () => {
  it('liefert beim ersten Start einen neuen Stand', async () => {
    const e = await laden(speicherAblage());
    expect(e.hinweis).toBe('neu');
    expect(e.stand).toEqual(neuerStand());
  });

  it('lädt einen gültigen Stand', async () => {
    const e = await laden(speicherAblage({ [SCHLUESSEL.stand]: gueltig() }));
    expect(e.hinweis).toBe('ok');
    expect(e.stand.karten['ein-001:de-ru']?.stufe).toBe(2);
  });

  it('fällt bei kaputtem Stand auf den vorherigen zurück und bewahrt den kaputten auf', async () => {
    const vorher = gueltig();
    const ablage = speicherAblage({ [SCHLUESSEL.stand]: 'Müll', [SCHLUESSEL.vorher]: vorher });
    const e = await laden(ablage);
    expect(e.hinweis).toBe('wiederhergestellt');
    expect(e.stand).toEqual(vorher);
    expect(ablage.daten.get(SCHLUESSEL.kaputt)).toBe('Müll');
  });

  it('setzt zurück, wenn auch der vorherige Stand kaputt ist – ohne Absturz', async () => {
    const e = await laden(
      speicherAblage({ [SCHLUESSEL.stand]: { version: 1 }, [SCHLUESSEL.vorher]: null }),
    );
    expect(e.hinweis).toBe('zurueckgesetzt');
    expect(e.stand).toEqual(neuerStand());
  });

  it('übersteht Lesefehler der Ablage', async () => {
    const kaputt: Ablage = {
      get: () => Promise.reject(new Error('IndexedDB kaputt')),
      setMany: () => Promise.reject(new Error('IndexedDB kaputt')),
      del: () => Promise.resolve(),
    };
    expect((await laden(kaputt)).hinweis).toBe('zurueckgesetzt');
  });

  it('sichert vor einer Migration den alten Stand und migriert dann', async () => {
    const alt = { version: 0, fortschritt: { 'ein-001:de-ru': karte } };
    const ablage = speicherAblage({ [SCHLUESSEL.stand]: alt });
    const e = await laden(ablage, {
      0: (d) => ({ ...d, karten: d.fortschritt, fortschritt: undefined }),
    });
    expect(e.hinweis).toBe('ok');
    expect(e.stand.version).toBe(AKTUELLE_VERSION);
    expect(e.stand.karten['ein-001:de-ru']).toEqual(karte);
    expect(ablage.daten.get(SCHLUESSEL.vorMigration(0))).toEqual(alt);
  });

  it('behandelt eine fehlschlagende Migration wie kaputte Daten (Sicherung bleibt erhalten)', async () => {
    const alt = { version: 0, x: 1 };
    const ablage = speicherAblage({ [SCHLUESSEL.stand]: alt, [SCHLUESSEL.vorher]: gueltig() });
    const e = await laden(ablage, {
      0: () => {
        throw new Error('Migration kaputt');
      },
    });
    expect(e.hinweis).toBe('wiederhergestellt');
    expect(ablage.daten.get(SCHLUESSEL.vorMigration(0))).toEqual(alt);
  });

  it('bricht ab, wenn eine Migrationsstufe fehlt', async () => {
    const ablage = speicherAblage({ [SCHLUESSEL.stand]: { version: 0 } });
    expect((await laden(ablage, {})).hinweis).toBe('zurueckgesetzt');
    expect(ablage.daten.has(SCHLUESSEL.vorMigration(0))).toBe(true);
  });
});

describe('erstelleSpeicherer', () => {
  it('speichert und schiebt den vorherigen gültigen Stand nach „stand-vorher"', async () => {
    const ablage = speicherAblage();
    const speicherer = erstelleSpeicherer(ablage);
    const a = gueltig();
    const b = { ...gueltig(), tutorialGesehen: true };
    await speicherer.speichern(a);
    expect(ablage.daten.has(SCHLUESSEL.vorher)).toBe(false);
    await speicherer.speichern(b);
    expect(ablage.daten.get(SCHLUESSEL.stand)).toEqual(b);
    expect(ablage.daten.get(SCHLUESSEL.vorher)).toEqual(a);
  });

  it('schreibt in Aufrufreihenfolge, auch wenn Schreibvorgänge unterschiedlich lange dauern', async () => {
    const reihenfolge: boolean[] = [];
    const basis = speicherAblage();
    let langsam = true;
    const ablage: Ablage = {
      ...basis,
      setMany: async (paare) => {
        const warte = langsam;
        langsam = false;
        await new Promise((r) => setTimeout(r, warte ? 30 : 0));
        reihenfolge.push((paare[0]![1] as Stand).tutorialGesehen);
        await basis.setMany(paare);
      },
    };
    const speicherer = erstelleSpeicherer(ablage);
    await Promise.all([
      speicherer.speichern(gueltig()),
      speicherer.speichern({ ...gueltig(), tutorialGesehen: true }),
    ]);
    expect(reihenfolge).toEqual([false, true]);
    expect((basis.daten.get(SCHLUESSEL.stand) as Stand).tutorialGesehen).toBe(true);
  });

  it('verweigert ungültige Stände (fail closed) und läuft danach normal weiter', async () => {
    const ablage = speicherAblage();
    const speicherer = erstelleSpeicherer(ablage);
    const kaputt = { ...gueltig(), karten: { 'ein-001:de-ru': { ...karte, stufe: 99 } } };
    await expect(speicherer.speichern(kaputt)).rejects.toThrow();
    expect(ablage.daten.size).toBe(0);
    await speicherer.speichern(gueltig());
    expect(ablage.daten.has(SCHLUESSEL.stand)).toBe(true);
  });

  it('speichert eine Kopie – spätere Änderungen am Objekt wirken nicht nach', async () => {
    const ablage = speicherAblage();
    const s = gueltig();
    await erstelleSpeicherer(ablage).speichern(s);
    s.karten['ein-001:de-ru']!.stufe = 5;
    expect((ablage.daten.get(SCHLUESSEL.stand) as Stand).karten['ein-001:de-ru']!.stufe).toBe(2);
  });
});
