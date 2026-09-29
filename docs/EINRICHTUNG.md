# Einrichtung GitHub und Netlify

## GitHub-Repository

Die folgenden Einstellungen wurden per `gh` gesetzt. Zur Kontrolle oder falls etwas fehlt,
von Hand unter **Settings** im Repository:

1. **Settings → Advanced Security** (bzw. „Code security")
   - Dependabot alerts: **Enable**
   - Dependabot security updates: **Enable**
   - Secret scanning: **Enable**, darunter **Push protection: Enable**
   - Private vulnerability reporting: **Enable**
2. **Settings → Branches → Add branch ruleset** (oder „Add classic branch protection rule")
   - Name/Muster: `main`
   - **Restrict deletions** und **Block force pushes** aktivieren
   - Optional nach der Netlify-Anbindung: **Require status checks to pass** mit
     „netlify/…/deploy-preview" – dann lassen sich nur geprüfte Pull Requests zusammenführen
   - Keine Pflicht-Reviews (Einzelprojekt); du als Admin darfst direkt auf `main` pushen.

Hinweis: Die Prüfungen laufen im Netlify-Build statt in GitHub Actions. So braucht das
Pushen keine zusätzliche `workflow`-Berechtigung.

## Netlify

1. Auf <https://app.netlify.com> anmelden → **Add new project → Import an existing project**.
2. **GitHub** wählen und Netlify nur Zugriff auf das Repository `Russisch-Tutor` geben
   (nicht „All repositories").
3. Build-Einstellungen werden aus `netlify.toml` gelesen. Kontrolle:
   - Build command: `npm run ci` (Lint, Typecheck, Tests, Audit, Build)
   - Publish directory: `dist`
4. **Deploy** klicken.
5. **Project configuration → Build & deploy → Deploy Previews**: „Any pull request against
   your production branch" aktivieren.
6. Optional **Domain management**: eigene Domain eintragen; HTTPS ist automatisch aktiv.

### Nach dem ersten Deploy prüfen

- <https://securityheaders.com> und <https://developer.mozilla.org/en-US/observatory> mit der
  Netlify-Adresse aufrufen – Ziel: Note A bzw. A+.
- In Chrome: DevTools → Lighthouse → Kategorien Performance, Accessibility, Best Practices.
