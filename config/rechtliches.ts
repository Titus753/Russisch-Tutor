/**
 * Angaben zum Verantwortlichen (Art. 13 DSGVO) für die Datenschutzerklärung.
 * Sie stehen bewusst NICHT im öffentlichen Repository, sondern werden beim Build aus
 * Umgebungsvariablen gelesen (Netlify: Site configuration → Environment variables):
 *   VERANTWORTLICHER_NAME      Vor- und Nachname
 *   VERANTWORTLICHER_KONTAKT   E-Mail-Adresse
 *   VERANTWORTLICHER_ANSCHRIFT optional, z. B. „Musterstraße 1, 12345 Musterstadt"
 */
export interface Verantwortlicher {
  name: string;
  kontakt: string;
  anschrift: string | null;
  platzhalter: boolean;
}

const NAME = /^[\p{L}][\p{L} .'-]{1,79}$/u;
const EMAIL = /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,190}\.[A-Za-z]{2,24}$/;
const ANSCHRIFT = /^[\p{L}0-9 .,'/-]{5,200}$/u;

export const PLATZHALTER: Verantwortlicher = {
  name: '[Name – in Netlify als VERANTWORTLICHER_NAME eintragen]',
  kontakt: '[E-Mail – in Netlify als VERANTWORTLICHER_KONTAKT eintragen]',
  anschrift: null,
  platzhalter: true,
};

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
  return { ok: true, wert: { name, kontakt, anschrift, platzhalter: false } };
}

/**
 * Auf Netlify (Live und Vorschau – beide sind öffentlich erreichbar) sind gültige Angaben Pflicht,
 * sonst bricht der Build ab. Lokal werden Platzhalter angezeigt.
 */
export function verantwortlicherFuerBuild(
  env: Record<string, string | undefined>,
): Verantwortlicher {
  const ergebnis = verantwortlicherAus(env);
  if (ergebnis.ok) return ergebnis.wert;
  if (env.NETLIFY === 'true') {
    throw new Error(
      `Datenschutzerklärung unvollständig: ${ergebnis.fehler}. Siehe docs/EINRICHTUNG.md.`,
    );
  }
  return PLATZHALTER;
}
