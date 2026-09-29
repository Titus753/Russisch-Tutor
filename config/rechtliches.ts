/**
 * Optionale Kontaktangaben für die Datenschutzseite. Die App ist ein privates Angebot für
 * Freunde und Familie; ohne Angaben entfällt der Abschnitt. Die Angaben stehen nie im
 * öffentlichen Repository, sondern kommen – falls gewünscht – aus Umgebungsvariablen
 * (Netlify: Site configuration → Environment variables):
 *   VERANTWORTLICHER_NAME      Vor- und Nachname
 *   VERANTWORTLICHER_KONTAKT   E-Mail-Adresse
 *   VERANTWORTLICHER_ANSCHRIFT optional, z. B. „Musterstraße 1, 12345 Musterstadt"
 */
export interface Verantwortlicher {
  name: string;
  kontakt: string;
  anschrift: string | null;
}

const NAME = /^[\p{L}][\p{L} .'-]{1,79}$/u;
const EMAIL = /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,190}\.[A-Za-z]{2,24}$/;
const ANSCHRIFT = /^[\p{L}0-9 .,'/-]{5,200}$/u;

export function verantwortlicherAus(
  env: Record<string, string | undefined>,
): { ok: true; wert: Verantwortlicher } | { ok: false; fehler: string } {
  const name = env.VERANTWORTLICHER_NAME?.trim() ?? '';
  const kontakt = env.VERANTWORTLICHER_KONTAKT?.trim() ?? '';
  const anschrift = env.VERANTWORTLICHER_ANSCHRIFT?.trim() || null;
  if (!name && !kontakt) return { ok: false, fehler: 'VERANTWORTLICHER_NAME und _KONTAKT fehlen' };
  if (!NAME.test(name)) return { ok: false, fehler: 'VERANTWORTLICHER_NAME ist ungültig' };
  if (!EMAIL.test(kontakt))
    return { ok: false, fehler: 'VERANTWORTLICHER_KONTAKT ist keine gültige E-Mail' };
  if (anschrift !== null && !ANSCHRIFT.test(anschrift)) {
    return { ok: false, fehler: 'VERANTWORTLICHER_ANSCHRIFT ist ungültig' };
  }
  return { ok: true, wert: { name, kontakt, anschrift } };
}

/**
 * Gültige Angaben werden übernommen, fehlende lassen den Abschnitt entfallen.
 * Ungültige Angaben brechen den Build ab (Tippfehler sollen nicht unbemerkt online gehen).
 */
export function verantwortlicherFuerBuild(
  env: Record<string, string | undefined>,
): Verantwortlicher | null {
  if (!env.VERANTWORTLICHER_NAME?.trim() && !env.VERANTWORTLICHER_KONTAKT?.trim()) return null;
  const ergebnis = verantwortlicherAus(env);
  if (!ergebnis.ok) throw new Error(`Kontaktangaben ungültig: ${ergebnis.fehler}`);
  return ergebnis.wert;
}
