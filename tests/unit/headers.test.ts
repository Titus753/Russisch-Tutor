import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { cspFuerMeta, parseHeaders } from '../../config/headers.ts';

const header = parseHeaders(readFileSync('public/_headers', 'utf8'));
const csp = header['Content-Security-Policy'] ?? '';
const direktiven = new Map(
  csp.split(';').map((d) => {
    const [name = '', ...werte] = d.trim().split(/\s+/);
    return [name, werte.join(' ')] as const;
  }),
);

describe('Sicherheits-Header', () => {
  it.each([
    ['default-src', "'self'"],
    ['script-src', "'self'"],
    ['style-src', "'self'"],
    ['img-src', "'self' data:"],
    ['media-src', "'self'"],
    ['connect-src', "'self'"],
    ['object-src', "'none'"],
    ['base-uri', "'none'"],
    ['form-action', "'none'"],
    ['frame-ancestors', "'none'"],
    ['require-trusted-types-for', "'script'"],
  ])('CSP %s = %s', (name, wert) => {
    expect(direktiven.get(name)).toBe(wert);
  });

  it('erlaubt weder unsafe-inline noch unsafe-eval noch fremde Hosts', () => {
    expect(csp).not.toMatch(/unsafe-|https?:|\*/);
  });

  it('setzt alle weiteren Schutz-Header', () => {
    expect(header['Strict-Transport-Security']).toMatch(/max-age=\d{8,}/);
    expect(header['X-Content-Type-Options']).toBe('nosniff');
    expect(header['Referrer-Policy']).toBe('no-referrer');
    expect(header['Cross-Origin-Opener-Policy']).toBe('same-origin');
    for (const funktion of ['camera', 'microphone', 'geolocation', 'payment']) {
      expect(header['Permissions-Policy']).toContain(`${funktion}=()`);
    }
  });
});

describe('parseHeaders', () => {
  it('liest nur den gewünschten Pfad-Block und ignoriert Kommentare', () => {
    const text = '# Kommentar\n/*\n  A: 1\n  B: x: y\n/assets/*\n  A: 2\n';
    expect(parseHeaders(text)).toEqual({ A: '1', B: 'x: y' });
    expect(parseHeaders(text, '/assets/*')).toEqual({ A: '2' });
  });

  it('bricht bei kaputten Zeilen ab statt still weiterzumachen', () => {
    expect(() => parseHeaders('/*\n  kaputt\n')).toThrow();
  });
});

describe('cspFuerMeta', () => {
  it('entfernt Direktiven, die im Meta-Tag nicht gelten', () => {
    expect(cspFuerMeta("default-src 'self'; frame-ancestors 'none'; report-uri /x")).toBe(
      "default-src 'self'",
    );
  });
});

describe('Privates Angebot', () => {
  it('schließt Suchmaschinen aus (Header, robots.txt, Meta-Tag)', () => {
    expect(header['X-Robots-Tag']).toContain('noindex');
    expect(readFileSync('public/robots.txt', 'utf8')).toMatch(/Disallow: \/\s*$/);
    expect(readFileSync('index.html', 'utf8')).toContain('<meta name="robots" content="noindex');
  });
});
