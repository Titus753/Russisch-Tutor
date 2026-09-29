/**
 * Liest die Netlify-Datei `_headers` und liefert die Header eines Pfad-Blocks.
 * Wird von vite.config.ts (Vorschau, CSP-Meta-Tag) und den Tests genutzt,
 * damit es nur eine Quelle für die Sicherheits-Header gibt.
 */
export function parseHeaders(text: string, pfad = '/*'): Record<string, string> {
  const ergebnis: Record<string, string> = {};
  let aktuell: string | null = null;
  for (const zeile of text.split('\n')) {
    if (zeile.trim() === '' || zeile.trimStart().startsWith('#')) continue;
    if (!/^\s/.test(zeile)) {
      aktuell = zeile.trim();
      continue;
    }
    if (aktuell !== pfad) continue;
    const trenner = zeile.indexOf(':');
    if (trenner === -1) throw new Error(`Ungültige Header-Zeile: ${zeile.trim()}`);
    ergebnis[zeile.slice(0, trenner).trim()] = zeile.slice(trenner + 1).trim();
  }
  return ergebnis;
}

/** CSP-Direktiven, die im <meta>-Tag nicht erlaubt sind und dort entfernt werden. */
const NUR_ALS_HEADER = ['frame-ancestors', 'report-uri', 'report-to', 'sandbox'];

export function cspFuerMeta(csp: string): string {
  return csp
    .split(';')
    .map((d) => d.trim())
    .filter((d) => d !== '' && !NUR_ALS_HEADER.includes(d.split(/\s+/)[0] ?? ''))
    .join('; ');
}
