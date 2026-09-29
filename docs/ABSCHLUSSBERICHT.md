# Abschlussbericht „Слово за слово“

Stand: 29. September 2026 · Repository: `Titus753/Russisch-Tutor`

## Umfang

- 1.021 Vokabeln in 20 Themen (Wörter, Alltagssätze, Redewendungen), 33 Buchstaben
- Vier Lernmodi (Karten mit Wiederholungssystem, Quiz, Tippen, Hören), Alphabet mit Übung,
  Einführung, Einstellungen, Fortschritt, Sicherung, Datenschutzseite
- 1.087 Aussprache-Dateien (6,6 MB), offline erzeugt mit Piper (Stimme ru_RU-dmitri)
- Offline-fähige, installierbare Web-App (eigener Service Worker, 7 MB Offline-Cache)
- Tests: 175 Unit-Tests, 157 E2E-Tests auf iPhone SE, iPhone 15 und Pixel 7

## Worauf die App zugreift

| Bereich       | Zugriff                                                                              |
| ------------- | ------------------------------------------------------------------------------------ |
| Netzwerk      | Nur die eigene Adresse (App-Dateien, Aufnahmen). Keine Dritten, kein Tracking.       |
| Speicher      | IndexedDB im Browser: Lernstand, Einstellungen, interne Sicherungen. Nur lokal.      |
| Offline-Cache | Service Worker speichert die beim Build festgelegte Dateiliste der eigenen Adresse.  |
| Dateien       | Export (Download) und Import (Dateiauswahl) nur auf Tippen, nur lokal verarbeitet.   |
| Sprachausgabe | Eigene MP3-Dateien; Rückfall nur auf lokal installierte Gerätestimmen.               |
| System        | Keine Kamera, kein Mikrofon, kein Standort, keine Benachrichtigungen, keine Cookies. |

Das Audio-Werkzeug (`tools/audio`) läuft nur auf dem Entwicklungsrechner und nur bei Bedarf:
Es lädt einmalig Python-Pakete (PyPI) und Stimmmodelle (Hugging Face), jeweils per Prüfsumme
abgesichert, und arbeitet danach komplett offline.

## Aktive Schutzschichten

1. **Auslieferung (Netlify-Header):**
   - Strikte Content-Security-Policy ohne `unsafe-inline` und `unsafe-eval`, nur die eigene Adresse.
   - Trusted Types mit genau einer Policy, die nur `/sw.js` zulässt.
   - HSTS, `nosniff`, `frame-ancestors 'none'`/`X-Frame-Options: DENY`, COOP/CORP `same-origin`, `no-referrer`.
   - Restriktive Permissions-Policy; `noindex` über Header, Meta-Tag und `robots.txt`.
2. **Zweite CSP-Schicht:** Die CSP steht zusätzlich als Meta-Tag im Build, falls die Header fehlen.
3. **Code:**
   - Kein `eval`, kein `innerHTML` mit Daten, per ESLint erzwungen.
   - Alle Inhalte werden als Text gerendert; zod läuft ohne Code-Erzeugung (`jitless`).
4. **Eingaben (alle als feindlich behandelt):**
   - Speicher und Import werden mit zod geprüft: Allowlists, Wertebereiche, Größenlimits.
   - Schutz vor Prototype Pollution.
   - Kaputte Einzelwerte werden verworfen statt eines Absturzes; Rückfall auf den letzten gültigen Stand.
5. **Datenverlust:**
   - Automatische Sicherung vor Migration, Import und Löschen.
   - Zweistufiges Löschen mit Wiederherstellen.
   - `storage.persist()` gegen automatisches Löschen durch den Browser.
   - Serialisierte, vorab geprüfte Schreibvorgänge.
6. **Service Worker:**
   - Nur eigene GET-Anfragen; feste Dateiliste mit Inhalts-Hash.
   - Versionierter Cache, alte Caches werden gelöscht.
   - Nichts wird zur Laufzeit nachgeladen und gespeichert.
7. **Lieferkette:**
   - Drei Laufzeit-Abhängigkeiten (Preact, zod, idb-keyval), alle Versionen gepinnt, Lockfiles committet.
   - npm ohne Installationsskripte; Paketnamen und Herausgeber vor der Installation geprüft.
   - `npm audit` und `pip-audit` ohne Befund; Dependabot aktiv.
   - Eigener Service Worker statt vite-plugin-pwa (etwa 230 Pakete weniger).
8. **Build-Prüfungen:**
   - Vokabeln und Alphabet werden gegen das Schema geprüft.
   - Duplikate und mehrdeutige Übersetzungen werden abgelehnt.
   - Die Aufnahmen müssen vollständig und aktuell sein.
   - Kontaktangaben werden validiert.
9. **GitHub:**
   - Secret Scanning mit Push Protection.
   - Dependabot-Warnungen und -Updates.
   - Private Meldung von Sicherheitslücken.
   - Branch-Schutz für `main` (kein Löschen, kein Force-Push).

## Typische Schwachstellen schnell generierten Codes – geprüft

| Punkt                             | Ergebnis                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------- |
| Fehlende Autorisierung, IDOR      | Entfällt: kein Backend, keine Konten                                            |
| Schlüssel im Frontend             | Keine Geheimnisse vorhanden; Suche bei jedem Commit ohne Treffer                |
| Debug-/Testzugänge in Produktion  | Keine; Sourcemaps aus, Service Worker nur im Produktions-Build                  |
| CORS `*`                          | Nicht gesetzt; CORP `same-origin`                                               |
| Eingaben in SQL/Shell/Pfad/HTML   | Keine solchen Senken; Audio-Namen und IDs per Muster geprüft                    |
| Client-Werte ungeprüft übernommen | Speicher und Import vollständig validiert                                       |
| Fehlendes Rate-Limit              | Entfällt (statische Seite; Schutz auf Netlify-Ebene)                            |
| Race Conditions                   | Speichern serialisiert; Doppeltipp-Schutz; siehe offene Risiken                 |
| Verschluckte Fehler               | Jeder `catch` hat einen begründeten Rückfall; leere `catch` per ESLint verboten |
| Unbegrenzte Ressourcen            | Limits für Import (5 MB), Karten (20.000), Eingabe (300 Zeichen), Lerntage      |
| `Math.random` für Sicherheit      | Nur für Lernreihenfolgen, nicht sicherheitsrelevant                             |
| Erfundene/veraltete APIs          | Gegen installierte Pakete geprüft (Piper, zod, Playwright)                      |
| Unpassend kopierter Code          | Keiner                                                                          |

## Bewusst offene Risiken

- **Stimmlizenz:** Die Stimme dmitri ist aus „lessac“ (Forschungslizenz) weitertrainiert. Die
  rechtliche Wirkung ist ungeklärt; vertretbar für eine kostenlose, private Nutzung
  (siehe `docs/LIZENZEN.md`).
- **Öffentliche Adresse:** Die Netlify-Adresse ist für jeden erreichbar, der sie kennt.
  Suchmaschinen sind ausgeschlossen. Mehr Schutz gibt es nur mit Netlify-Passwortschutz
  (kostenpflichtig).
- **Mehrere Tabs gleichzeitig:** Beim Speichern gewinnt der zuletzt schreibende Tab.
- **Browserdaten gelöscht:** Dann ist der Lernstand weg, außer es gibt eine exportierte Sicherung.
- **Sprachqualität:** 40 Einträge stehen zur Kontrolle durch Muttersprachler in
  `data/pruefen.md`. Die Betonung der Sprachsynthese kann einzeln danebenliegen.
- **Offline in Safari:** Automatisch nur eingeschränkt testbar (Grenze des Test-Werkzeugs),
  deshalb in der Handtest-Liste.

## Was du selbst tun musst

1. **Netlify verbinden:** siehe `docs/EINRICHTUNG.md`. Kontaktangaben sind optional.
2. **Nach dem ersten Deploy prüfen:**
   - Header mit <https://securityheaders.com> und <https://developer.mozilla.org/en-US/observatory> testen.
   - In Chrome: DevTools → Lighthouse (Performance, Accessibility, Best Practices).
3. **Am echten Handy testen (iPhone und Android):**
   1. „Zum Home-Bildschirm“ hinzufügen, App öffnen, einmal alle Tabs besuchen.
   2. Flugmodus an: App neu öffnen; Karten, Quiz, Tippen und Hören inklusive Aufnahmen müssen gehen.
   3. iPhone mit Lautlos-Schalter: Ist „Anhören“ zu hören?
   4. „Langsam“: Ist es langsamer, bleibt die Tonhöhe gleich?
   5. Tippen: App-Tastatur und Systemtastatur. Bleiben Aufgabe, Feld und „Prüfen“ sichtbar?
   6. Einstellungen „Sehr groß“ und die Systemschriftgröße: Ist nichts abgeschnitten?
   7. Sicherung speichern, Fortschritt löschen, Sicherung importieren.
   8. Bluetooth-Kopfhörer: Wird der Wortanfang abgeschnitten?
4. **Inhalte:** `data/pruefen.md` von einer Person mit sehr gutem Russisch durchsehen lassen.
   Danach `tools/audio/audio.sh erzeugen` ausführen; es erzeugt nur Geändertes neu.
5. **Laufend:**
   - Dependabot-Pull-Requests prüfen und übernehmen (Netlify-Vorschau zeigt, ob alles läuft).
   - Freunden empfehlen, ab und zu eine Sicherung zu speichern.
