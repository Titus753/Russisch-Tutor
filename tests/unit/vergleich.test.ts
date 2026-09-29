import { describe, expect, it } from 'vitest';
import {
  abweichungen,
  levenshtein,
  MAX_EINGABE,
  normalisiere,
  pruefeEingabe,
  tipp,
  toleranz,
} from '../../src/logik/vergleich.ts';
import { eintrag } from './hilfen.ts';

describe('normalisiere', () => {
  it.each([
    ['Ещё раз!', 'еще раз'],
    ['  Сколько   это стоит? ', 'сколько это стоит'],
    ['по-русски', 'по русски'],
    ['Тише едешь — дальше будешь.', 'тише едешь дальше будешь'],
    ['«Привет», – сказал он.', 'привет сказал он'],
    ['молоко́', 'молоко'],
    ['ХЛЕБ', 'хлеб'],
  ])('%s → %s', (ein, aus) => {
    expect(normalisiere(ein)).toBe(aus);
  });
});

describe('levenshtein', () => {
  it.each([
    ['', '', 0],
    ['хлеб', 'хлеб', 0],
    ['хлеб', 'хлеп', 1],
    ['хлеб', 'хле', 1],
    ['хлеб', 'хлееб', 1],
    ['кошка', 'собака', 3],
    ['', 'да', 2],
  ])('%s ↔ %s = %i', (a, b, d) => {
    expect(levenshtein(a, b)).toBe(d);
    expect(levenshtein(b, a)).toBe(d);
  });
});

describe('pruefeEingabe', () => {
  const brot = eintrag({ russisch: 'хлеб', deutsch: 'das Brot' });
  const satz = eintrag({
    typ: 'satz',
    russisch: 'Сколько это стоит?',
    deutsch: 'Wie viel kostet das?',
  });
  const genus = eintrag({
    typ: 'satz',
    russisch: 'Я согласен.',
    deutsch: 'Ich bin einverstanden.',
    genusvarianten: { m: 'Я согласен.', w: 'Я согласна.' },
  });

  it('ist tolerant bei Groß-/Kleinschreibung, ё/е, Satzzeichen und Leerzeichen', () => {
    expect(pruefeEingabe('ХЛЕБ', brot).ergebnis).toBe('richtig');
    expect(pruefeEingabe('  сколько это   стоит ', satz).ergebnis).toBe('richtig');
    const noch = eintrag({ russisch: 'Ещё раз.', deutsch: 'Noch einmal.' });
    expect(pruefeEingabe('еще раз', noch).ergebnis).toBe('richtig');
  });

  it('wertet kleine Tippfehler als „fast richtig" (Toleranz max(1, Länge/12))', () => {
    expect(toleranz('хлеб')).toBe(1);
    expect(toleranz('Сколько это стоит?')).toBe(1);
    expect(toleranz('Я хочу отправить посылку в Германию.')).toBe(2);
    expect(pruefeEingabe('хлеп', brot).ergebnis).toBe('fast');
    expect(pruefeEingabe('хлепп', brot).ergebnis).toBe('falsch');
    expect(pruefeEingabe('сколко это стоит', satz).ergebnis).toBe('fast');
    expect(pruefeEingabe('сколко это стоид', satz).ergebnis).toBe('falsch');
  });

  it('akzeptiert beide Genusvarianten und nennt die passende als Ziel', () => {
    expect(pruefeEingabe('я согласна', genus)).toEqual({
      ergebnis: 'richtig',
      ziel: 'Я согласна.',
    });
    expect(pruefeEingabe('я согласен', genus)).toEqual({
      ergebnis: 'richtig',
      ziel: 'Я согласен.',
    });
  });

  it('wertet leere, nur aus Satzzeichen bestehende und lateinische Eingaben als falsch', () => {
    expect(pruefeEingabe('', brot).ergebnis).toBe('falsch');
    expect(pruefeEingabe(' ?! ', brot).ergebnis).toBe('falsch');
    expect(pruefeEingabe('hleb', brot).ergebnis).toBe('falsch');
  });

  it('bleibt bei riesigen Eingaben schnell (Eingabe wird begrenzt)', () => {
    const start = performance.now();
    expect(pruefeEingabe('х'.repeat(1_000_000), satz).ergebnis).toBe('falsch');
    expect(performance.now() - start).toBeLessThan(200);
    expect(MAX_EINGABE).toBeLessThanOrEqual(300);
  });
});

describe('abweichungen', () => {
  const fehlerText = (a: ReturnType<typeof abweichungen>) =>
    a.filter((x) => x.fehler).map((x) => x.text);

  it('markiert falsche und fehlende Buchstaben, nie Satz- oder Leerzeichen', () => {
    expect(fehlerText(abweichungen('хлеп', 'хлеб'))).toEqual(['б']);
    expect(fehlerText(abweichungen('сколко это стоит', 'Сколько это стоит?'))).toEqual(['ь']);
    expect(abweichungen('сколько это стоит', 'Сколько это стоит?').every((x) => !x.fehler)).toBe(
      true,
    );
  });

  it('setzt die Lösung vollständig und unverändert wieder zusammen', () => {
    const loesung = 'Ещё раз, пожалуйста!';
    expect(
      abweichungen('ишо рас', loesung)
        .map((x) => x.text)
        .join(''),
    ).toBe(loesung);
  });
});

describe('tipp', () => {
  it('zeigt schrittweise die ersten Buchstaben', () => {
    expect(tipp('Сколько это стоит?', 1)).toBe('С…');
    expect(tipp('Сколько это стоит?', 8)).toBe('Сколько э…');
    expect(tipp('да', 5)).toBe('да');
    expect(tipp('да', 0)).toBe('…');
  });
});
