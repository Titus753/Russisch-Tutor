import { describe, expect, it } from 'vitest';
import { THEMEN, type ThemaId } from '../../src/daten/themen.ts';
import {
  aktuellerVerlauf,
  entzerren,
  merkeGezeigt,
  mischeAbwechselnd,
  VERLAUF_LAENGE,
  verlaufLeeren,
  waehleNeue,
} from '../../src/logik/abwechslung.ts';
import { baueRunde, kartenFuer, type Fortschritt } from '../../src/logik/karten.ts';
import { festerZufall } from '../../src/logik/zufall.ts';
import { leseVokabelDateien } from '../../config/vokabel-plugin.ts';
import { pruefeVokabular } from '../../src/daten/pruefen.ts';
import { eintrag, karte } from './hilfen.ts';

const themaKarten = (thema: ThemaId, anzahl: number) =>
  Array.from({ length: anzahl }, () => karte(eintrag({ thema })));
const themen = (liste: readonly { eintrag: { thema: string } }[]) =>
  liste.map((k) => k.eintrag.thema);

describe('waehleNeue', () => {
  const a = themaKarten('tiere', 5);
  const b = themaKarten('bank', 5);
  const c = themaKarten('kochen', 5);
  const d = themaKarten('familie', 5);
  const alle = [...a, ...b, ...c, ...d];

  it('nimmt neue Karten reihum aus allen Themen', () => {
    for (const zufall of [undefined, festerZufall(1), festerZufall(2)]) {
      const neue = waehleNeue(alle, {}, 8, new Set(), zufall);
      expect(neue).toHaveLength(8);
      const proThema = new Map<string, number>();
      for (const t of themen(neue)) proThema.set(t, (proThema.get(t) ?? 0) + 1);
      expect([...proThema.values()]).toEqual([2, 2, 2, 2]);
    }
  });

  it('wählt mit Zufall verschiedene Wörter, ohne die Themenverteilung zu verlieren', () => {
    const x = waehleNeue(alle, {}, 8, new Set(), festerZufall(1)).map((k) => k.schluessel);
    const y = waehleNeue(alle, {}, 8, new Set(), festerZufall(99)).map((k) => k.schluessel);
    expect(x).not.toEqual(y);
  });

  it('überspringt heute schon eingeführte Einträge und liefert nie zwei Karten desselben Eintrags', () => {
    const e = eintrag({ thema: 'tiere' });
    const beide = [karte(e, 'de-ru'), karte(e, 'ru-de')];
    const neue = waehleNeue([...beide, ...b], {}, 10, new Set([a[0]!.eintrag.id]));
    const ids = neue.map((k) => k.eintrag.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(neue.filter((k) => k.eintrag.id === e.id)).toHaveLength(1);
  });

  it('liefert weniger Karten, wenn es nicht genug gibt, und nichts bei Limit 0', () => {
    expect(waehleNeue(a, {}, 50, new Set())).toHaveLength(5);
    expect(waehleNeue(a, {}, 0, new Set())).toEqual([]);
  });
});

describe('entzerren', () => {
  it('trennt gleiche Themen, wenn möglich, und behält alle Karten', () => {
    const karten = [
      ...themaKarten('tiere', 4),
      ...themaKarten('bank', 4),
      ...themaKarten('kochen', 4),
    ];
    const ergebnis = entzerren(karten);
    expect(ergebnis).toHaveLength(12);
    expect(new Set(ergebnis)).toEqual(new Set(karten));
    for (let i = 1; i < ergebnis.length; i++) {
      expect(ergebnis[i]!.eintrag.thema).not.toBe(ergebnis[i - 1]!.eintrag.thema);
    }
  });

  it('lässt sich nicht von einem dominanten Thema aus dem Tritt bringen', () => {
    const karten = [...themaKarten('tiere', 7), ...themaKarten('bank', 3)];
    const ergebnis = entzerren(karten);
    expect(ergebnis).toHaveLength(10);
    expect(new Set(ergebnis).size).toBe(10);
  });

  it('wiederholt denselben Eintrag nicht direkt, auch bei nur einem Thema', () => {
    const e = eintrag({ thema: 'tiere' });
    const f = eintrag({ thema: 'tiere' });
    const ergebnis = entzerren([karte(e, 'de-ru'), karte(e, 'ru-de'), karte(f, 'de-ru')]);
    for (let i = 1; i < ergebnis.length; i++) {
      expect(ergebnis[i]!.eintrag.id).not.toBe(ergebnis[i - 1]!.eintrag.id);
    }
  });

  it('kommt mit leerer Liste und einer Karte zurecht', () => {
    expect(entzerren([])).toEqual([]);
    const k = karte(eintrag());
    expect(entzerren([k])).toEqual([k]);
  });
});

describe('mischeAbwechselnd', () => {
  it('verteilt neue Karten gleichmäßig zwischen die fälligen (statt am Ende)', () => {
    const faellig = themaKarten('tiere', 6);
    const neu = themaKarten('tiere', 3);
    const ergebnis = mischeAbwechselnd(faellig, neu);
    const positionen = ergebnis.flatMap((k, i) => (neu.includes(k) ? [i] : []));
    expect(positionen).toEqual([1, 4, 7]);
    expect(ergebnis).toHaveLength(9);
  });

  it('funktioniert ohne fällige oder ohne neue Karten', () => {
    const n = themaKarten('tiere', 3);
    expect(new Set(mischeAbwechselnd([], n))).toEqual(new Set(n));
    expect(new Set(mischeAbwechselnd(n, []))).toEqual(new Set(n));
    expect(mischeAbwechselnd([], [])).toEqual([]);
  });
});

describe('Sitzungsgedächtnis', () => {
  it('merkt sich höchstens die letzten Einträge und doppelte nur einmal', () => {
    verlaufLeeren();
    const alle = Array.from({ length: VERLAUF_LAENGE + 5 }, () => eintrag());
    for (const e of alle) merkeGezeigt(e);
    expect(aktuellerVerlauf()).toHaveLength(VERLAUF_LAENGE);
    expect(aktuellerVerlauf().at(-1)?.id).toBe(alle.at(-1)?.id);
    merkeGezeigt(alle.at(-1)!);
    expect(aktuellerVerlauf()).toHaveLength(VERLAUF_LAENGE);
    verlaufLeeren();
    expect(aktuellerVerlauf()).toEqual([]);
  });
});

describe('mit den echten Vokabeln', () => {
  const { eintraege } = pruefeVokabular(leseVokabelDateien());
  const alleKarten = kartenFuer(eintraege, {
    themen: THEMEN.map((t) => t.id),
    inhaltsarten: ['wort', 'satz', 'redewendung'],
    richtung: 'gemischt',
  });

  it('die 20 neuen Karten eines Tages stammen aus allen 20 Themen', () => {
    const runde = baueRunde({
      karten: alleKarten,
      fortschritt: {},
      tag: '2026-03-10',
      neueLimit: 20,
      neueHeute: [],
      zufall: festerZufall(8),
    });
    expect(runde).toHaveLength(20);
    expect(new Set(themen(runde)).size).toBe(20);
    for (let i = 1; i < runde.length; i++) {
      expect(runde[i]!.eintrag.thema).not.toBe(runde[i - 1]!.eintrag.thema);
    }
  });

  it('an 10 aufeinanderfolgenden Tagen kommt kein Wort doppelt neu dran', () => {
    const zufall = festerZufall(21);
    let fortschritt: Fortschritt = {};
    const gesehen = new Set<string>();
    for (let tag = 1; tag <= 10; tag++) {
      const datum = `2026-03-${String(tag).padStart(2, '0')}`;
      const neue = baueRunde({
        karten: alleKarten,
        fortschritt,
        tag: datum,
        neueLimit: 20,
        neueHeute: [],
        zufall,
      }).filter((k) => fortschritt[k.schluessel] === undefined);
      expect(neue).toHaveLength(20);
      for (const k of neue) {
        expect(gesehen.has(k.eintrag.id), `${k.eintrag.id} an Tag ${tag} erneut neu`).toBe(false);
        gesehen.add(k.eintrag.id);
      }
      // Alle als „gelernt" (heute geübt, erst in einer Woche fällig) markieren
      fortschritt = {
        ...fortschritt,
        ...Object.fromEntries(
          neue.map((k) => [
            k.schluessel,
            { stufe: 2, faellig: '2026-12-31', zuletzt: datum, wiederholungen: 1, fehler: 0 },
          ]),
        ),
      };
    }
    expect(gesehen.size).toBe(200);
  });
});
