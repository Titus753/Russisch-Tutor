/**
 * Registriert den Service Worker (nur im Produktions-Build) und meldet, wenn die App offline
 * bereit ist oder eine neue Version wartet.
 *
 * Wegen der CSP „require-trusted-types-for 'script'" braucht die Registrierung eine
 * Trusted-Types-Policy. Sie lässt ausschließlich die feste Adresse /sw.js zu.
 */
const SW_URL = '/sw.js';

interface TrustedTypesFabrik {
  createPolicy(
    name: string,
    regeln: { createScriptURL: (eingabe: string) => string },
  ): { createScriptURL: (eingabe: string) => unknown };
}

let policy: { createScriptURL: (eingabe: string) => unknown } | null | undefined;

function swAdresse(): string | URL {
  const tt = (globalThis as { trustedTypes?: TrustedTypesFabrik }).trustedTypes;
  if (!tt) return SW_URL;
  policy ??= tt.createPolicy('sw-registrierung', {
    createScriptURL: (eingabe) => {
      if (eingabe !== SW_URL) throw new TypeError('Nur /sw.js ist als Service Worker erlaubt');
      return eingabe;
    },
  });
  // TrustedScriptURL wird von register() akzeptiert; der Typ ist in lib.dom noch nicht enthalten
  return policy.createScriptURL(SW_URL) as string;
}

export interface OfflineEreignisse {
  /** Erste Installation abgeschlossen: App funktioniert jetzt ohne Netz. */
  bereit: () => void;
  /** Neue Version geladen; `aktualisieren` aktiviert sie und lädt die Seite neu. */
  update: (aktualisieren: () => void) => void;
}

export function starteOffline(ereignisse: OfflineEreignisse): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  const container = navigator.serviceWorker;
  let neuLaden = false;
  container.addEventListener('controllerchange', () => {
    if (neuLaden) window.location.reload();
  });

  const meldeWartend = (wartend: ServiceWorker) =>
    ereignisse.update(() => {
      neuLaden = true;
      wartend.postMessage('jetzt-aktualisieren');
    });

  void container
    .register(swAdresse(), { scope: '/', updateViaCache: 'none' })
    .then((registrierung) => {
      if (registrierung.waiting && container.controller) meldeWartend(registrierung.waiting);
      registrierung.addEventListener('updatefound', () => {
        const neu = registrierung.installing;
        neu?.addEventListener('statechange', () => {
          if (neu.state !== 'installed') return;
          // Mit bestehendem Controller: Update. Ohne: erste Installation.
          if (container.controller) meldeWartend(neu);
          else ereignisse.bereit();
        });
      });
      // Bei längerer Nutzung stündlich nach Updates sehen
      setInterval(() => void registrierung.update().catch(() => undefined), 60 * 60 * 1000);
    })
    .catch(() => {
      // Ohne Service Worker läuft die App trotzdem, nur nicht offline
    });
}
