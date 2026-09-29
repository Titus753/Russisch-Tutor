import type { Einstellungen } from '../speicher/schema.ts';

export const SCHRIFT_FAKTOR: Record<Einstellungen['schrift'], number> = {
  klein: 0.875,
  normal: 1,
  gross: 1.25,
  'sehr-gross': 1.5,
};

/** Grenzen, damit extreme Systemwerte das Layout nicht sprengen. */
const MIN_FAKTOR = 0.75;
const MAX_FAKTOR = 2.25;

/**
 * Faktor der Systemschriftgröße. Auf iOS liefert `font: -apple-system-body` die Größe aus
 * „Dynamische Schrift" (Standard 17 px); andere Systeme skalieren die Browser-Grundgröße
 * selbst, dort bleibt der Faktor 1 und die Prozentangabe übernimmt die Systemgröße.
 */
function systemFaktor(): number {
  if (!CSS.supports('font', '-apple-system-body')) return 1;
  const probe = document.createElement('span');
  probe.style.font = '-apple-system-body';
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  document.body.append(probe);
  const px = parseFloat(getComputedStyle(probe).fontSize);
  probe.remove();
  // Nur vergrößern: macOS meldet hier 13 px (kein „Dynamische Schrift"), das darf nichts verkleinern.
  // Kleinere Schrift wählt man über die Stufe „Klein".
  return Number.isFinite(px) && px > 17 ? px / 17 : 1;
}

/** Überträgt Schriftgröße, Farbmodus und Kontrast auf das Wurzelelement (nur CSSOM, CSP-konform). */
export function wendeDarstellungAn(e: Pick<Einstellungen, 'schrift' | 'farbmodus' | 'kontrast'>) {
  const wurzel = document.documentElement;
  const faktor = Math.min(
    MAX_FAKTOR,
    Math.max(MIN_FAKTOR, SCHRIFT_FAKTOR[e.schrift] * systemFaktor()),
  );
  wurzel.style.fontSize = `${(faktor * 100).toFixed(2)}%`;
  wurzel.dataset.schrift = e.schrift;
  if (e.farbmodus === 'system') delete wurzel.dataset.farbmodus;
  else wurzel.dataset.farbmodus = e.farbmodus;
  if (e.kontrast) wurzel.dataset.kontrast = 'hoch';
  else delete wurzel.dataset.kontrast;
}
