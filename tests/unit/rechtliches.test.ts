import { describe, expect, it } from 'vitest';
import { verantwortlicherAus, verantwortlicherFuerBuild } from '../../config/rechtliches.ts';

describe('Verantwortlicher (Datenschutzerklärung)', () => {
  const gueltig = {
    VERANTWORTLICHER_NAME: 'Erika Mustermann',
    VERANTWORTLICHER_KONTAKT: 'erika@example.org',
  };

  it('übernimmt gültige Angaben', () => {
    expect(verantwortlicherFuerBuild({ ...gueltig, NETLIFY: 'true' })).toEqual({
      name: 'Erika Mustermann',
      kontakt: 'erika@example.org',
      anschrift: null,
      platzhalter: false,
    });
  });

  it('bricht jeden Netlify-Build ohne Angaben ab', () => {
    expect(() => verantwortlicherFuerBuild({ NETLIFY: 'true' })).toThrow(/unvollständig/);
  });

  it('zeigt lokal Platzhalter', () => {
    expect(verantwortlicherFuerBuild({}).platzhalter).toBe(true);
  });

  it.each([
    ['HTML im Namen', { ...gueltig, VERANTWORTLICHER_NAME: '<script>alert(1)</script>' }],
    // eslint-disable-next-line no-script-url -- absichtlicher Angriffsversuch im Test
    ['keine E-Mail', { ...gueltig, VERANTWORTLICHER_KONTAKT: 'javascript:alert(1)' }],
    ['E-Mail mit Zeilenumbruch', { ...gueltig, VERANTWORTLICHER_KONTAKT: 'a@b.de\nBcc: x@y.de' }],
    ['Anschrift mit Steuerzeichen', { ...gueltig, VERANTWORTLICHER_ANSCHRIFT: 'Weg 1\u0000' }],
    ['viel zu langer Name', { ...gueltig, VERANTWORTLICHER_NAME: 'A'.repeat(200) }],
  ])('lehnt ab: %s', (_n, env) => {
    expect(verantwortlicherAus(env).ok).toBe(false);
  });
});
