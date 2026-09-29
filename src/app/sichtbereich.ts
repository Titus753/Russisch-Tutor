/**
 * Hält die CSS-Variablen --vv-hoehe und --vv-oben mit dem sichtbaren Bereich (visualViewport)
 * synchron. So kann die Tipp-Ansicht genau über einer geöffneten Systemtastatur liegen.
 */
export function beobachteSichtbereich(): () => void {
  const vv = globalThis.visualViewport;
  if (!vv) return () => undefined;
  const wurzel = document.documentElement;
  const aktualisieren = () => {
    wurzel.style.setProperty('--vv-hoehe', `${vv.height}px`);
    wurzel.style.setProperty('--vv-oben', `${vv.offsetTop}px`);
  };
  aktualisieren();
  vv.addEventListener('resize', aktualisieren);
  vv.addEventListener('scroll', aktualisieren);
  return () => {
    vv.removeEventListener('resize', aktualisieren);
    vv.removeEventListener('scroll', aktualisieren);
  };
}
