/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import preact from '@preact/preset-vite';
import { cspFuerMeta, parseHeaders } from './config/headers.ts';
import { verantwortlicherFuerBuild } from './config/rechtliches.ts';
import { vokabelPlugin } from './config/vokabel-plugin.ts';

const sicherheitsHeader = parseHeaders(readFileSync('public/_headers', 'utf8'));
const cspHeader = sicherheitsHeader['Content-Security-Policy'];
if (!cspHeader) throw new Error('public/_headers enthält keine Content-Security-Policy');
const csp: string = cspHeader;

/**
 * Zweite Schutzschicht: CSP zusätzlich als <meta>-Tag in den Build schreiben,
 * falls die App einmal ohne die Netlify-Header ausgeliefert wird.
 * Nur im Build, weil der Dev-Server Inline-Skripte für Hot-Reload braucht.
 */
function cspMetaTag(): Plugin {
  return {
    name: 'csp-meta-tag',
    apply: 'build',
    transformIndexHtml(html) {
      // Direkt nach <meta charset>, damit die CSP vor allen geladenen Ressourcen gilt
      const tag = `<meta http-equiv="Content-Security-Policy" content="${cspFuerMeta(csp)}" />`;
      const ergebnis = html.replace(/(<meta charset="UTF-8" \/>)/, `$1\n    ${tag}`);
      if (ergebnis === html) throw new Error('index.html: <meta charset="UTF-8" /> nicht gefunden');
      return ergebnis;
    },
  };
}

export default defineConfig({
  // Angaben für die Datenschutzerklärung aus Umgebungsvariablen (nie im Repository)
  define: { __VERANTWORTLICHER__: JSON.stringify(verantwortlicherFuerBuild(process.env)) },
  plugins: [preact(), vokabelPlugin(), cspMetaTag()],
  build: {
    target: 'es2022',
    sourcemap: false,
    // Keine Inline-Assets als data:-URL in Skripten/Styles
    assetsInlineLimit: 0,
  },
  // Lokale Vorschau (und E2E-Tests) mit denselben Headern wie auf Netlify
  preview: { headers: sicherheitsHeader },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
