# Слово за слово – Russisch-Tutor

Offlinefähige Russisch-Lern-App fürs Handy (PWA): Karteikarten mit Wiederholungssystem,
Multiple Choice, Selbst-Eintippen, Hörverständnis und Alphabet.

**Datenschutz:** kein Backend, kein Konto, kein Tracking, keine Cookies, keine Anfragen an
Dritte. Der Lernfortschritt bleibt auf dem Gerät (IndexedDB) und kann als Datei gesichert werden.

## Entwicklung

Voraussetzung: Node.js ≥ 22 (empfohlen: Version aus `.nvmrc`).

```bash
npm ci                 # Abhängigkeiten exakt nach Lockfile (ohne Installationsskripte, siehe .npmrc)
npm run dev            # Entwicklungsserver
npm run check          # Lint, Typecheck, Unit-Tests, Build
npx playwright install chromium webkit   # einmalig für E2E-Tests
npm run test:e2e       # E2E-Tests (iPhone SE, iPhone 15, Pixel 7)
```

## Sicherheit

- Strikte Content-Security-Policy ohne `unsafe-inline`/`unsafe-eval`, mit Trusted Types
  (`public/_headers`, zusätzlich als Meta-Tag im Build)
- Kein `innerHTML`/`eval` – per ESLint-Regel erzwungen
- Abhängigkeiten gepinnt, Installationsskripte deaktiviert, Dependabot aktiv
- Jeder Netlify-Build (auch Deploy-Previews für Pull Requests) führt `npm run ci` aus:
  Lint, Typecheck, Unit-Tests, `npm audit` und Build – bei Fehlern wird nichts veröffentlicht
- E2E-Tests (`npm run test:e2e`) laufen vor jedem Commit lokal

Einrichtung von GitHub und Netlify: siehe [docs/EINRICHTUNG.md](docs/EINRICHTUNG.md).
Sicherheitslücken melden: siehe [SECURITY.md](SECURITY.md).

## Lizenz

[MIT](LICENSE)
