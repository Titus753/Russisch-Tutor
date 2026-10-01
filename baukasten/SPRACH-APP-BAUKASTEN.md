# SPRACH-APP-BAUKASTEN

Masterdokument für Claude Code. Es baut eine **offlinefähige, sichere Sprachlern-App (PWA)** für eine beliebige Zielsprache, nach dem bewährten Muster von „Слово за слово“ (Russisch).

- **Version 1.0 · Stand 2026-10-01**
- **Referenzprojekt (öffentlich, lesbar):** <https://github.com/Titus753/Russisch-Tutor> (Stand: Commit `f625d5b`)
- **Sprache** aller Gespräche, Code-Kommentare, UI-Texte und Dokumente: **Deutsch**. Muttersprache der Lernenden: Deutsch.

> **Hinweis zu Rechtsfragen:** Alle Lizenz- und Datenschutzangaben in diesem Dokument sind sorgfältig recherchiert, aber **keine Rechtsberatung**. Lizenzen einzelner Stimmen und Datensätze ändern sich: vor jeder Nutzung neu prüfen (Abschnitt 7.2).

---

## 0. Kurzanleitung für die Person, die die App haben möchte

1. Neuen, leeren Projektordner anlegen und diese Datei hineinkopieren.
2. Claude Code im Ordner starten und zum Beispiel schreiben:

   > Lies SPRACH-APP-BAUKASTEN.md und baue die App für **Englisch**. Maskottchen: ein Fuchs namens Rufus mit Schiebermütze, das Bild liegt als `rufus.png` im Ordner.

3. Claude stellt zuerst Rückfragen (Abschnitt 2), legt dann einen Plan vor und arbeitet Phase für Phase. Nach jeder Phase laufen die Tests, es wird committet, nach GitHub gepusht und kurz berichtet.
4. Du antwortest mit „weiter“ oder gibst Korrekturen.

**Vorab bereithalten:**

- GitHub-Anmeldung im Terminal (`gh auth login`; der Zugriff `repo` genügt, der Zugriff `workflow` wird **nicht** gebraucht).
- Ein Netlify-Konto. Die Verbindung zum Repository machst du am Schluss selbst im Dashboard (Anleitung entsteht automatisch).
- Maskottchen: Bild (PNG/SVG/JPG) oder eine Beschreibung (Abschnitt 9 und Anhang C).

---

## 1. Auftrag an Claude Code (verbindlich)

### 1.1 Rolle

Du bist Entwickler:in **und** verantwortlich für IT-Sicherheit, Qualität und Rechtskonformität dieser App. Du arbeitest sorgfältig, wiederholbar und ehrlich. „100 % sicher“ versprichst du nie; du benennst Schutzschichten und Restrisiken.

### 1.2 Ablauf

| Schritt | Was                                                                                                                                                        |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0       | Projektordner ansehen (`ls`): Was liegt schon da? Dieses Dokument **vollständig** lesen, besonders Abschnitt 16 (Fallstricke). Nichts annehmen.            |
| 1       | Rückfragen nach Abschnitt 2 (strukturiert, höchstens zwei Runden).                                                                                         |
| 2       | Referenzprojekt klonen (Abschnitt 3), Werkzeuge prüfen: Node ≥ 22, git, gh (angemeldet), Python-Werkzeug später über `uv` (Abschnitt 7).                   |
| 3       | Umsetzungsplan (Abschnitt 15) vorlegen und auf ein Okay warten.                                                                                            |
| 4       | Phase für Phase arbeiten. **Vor jeder Phase** in 3–6 Zeilen offenlegen: Dateien, Netzwerk, Geheimnisse, Systemfunktionen, was ausdrücklich nicht passiert. |
| 5       | **Nach jeder Phase:** `npm run ci` und `npm run test:e2e` grün, Geheimnis-Suche im Diff, Commit, Push, Kurzbericht (Deutsch, höchstens 25 Zeilen).         |
| 6       | Abschlussbericht (Abschnitt 17) und neue Lernpunkte nach `docs/LEKTIONEN.md` schreiben (Abschnitt 16.9).                                                   |

### 1.3 Regeln

1. **Messen statt annehmen.** Versionen (`npm view`), Peer-Abhängigkeiten, Lizenzen (MODEL_CARD), Sprechtempo (Sekunden messen), Layout (Screenshot), Header (`curl -I`). Nie aus dem Gedächtnis.
2. **Nichts nach außen ohne Freigabe:** Repository anlegen oder öffentlich machen, Installationen außerhalb des Projektordners, `sudo`, Homebrew. Das Anlegen des Repositorys ist freigegeben, sobald die Person es in den Parametern bestätigt hat.
3. **Keine Geheimnisse** im Repository (es sollte keine geben). Vor jedem Commit den Diff durchsuchen.
4. **Ehrlich berichten:** Fehler, Fehlschläge und eigene Irrtümer nennen. Bemerkst du vor dem Commit einen eigenen Fehler (z. B. unnötiges Neu-Erzeugen aller Aufnahmen), mache ihn rückgängig und sage es.
5. **Tests nie abschwächen, um grün zu werden.** Erst die Ursache suchen. In diesem Projekt haben die Tests echte Produktionsfehler gefunden (Abschnitt 16).
6. **Zwei Versuche, dann den Ansatz wechseln.** Lange Läufe (Downloads, Tests) im Hintergrund starten, nicht in Schlafschleifen warten.
7. **Textersetzung per Skript:** immer `assert alt in text`. Nach einer Prettier-Formatierung sind Strings oft anders umbrochen; Datei vorher neu lesen oder das Edit-Werkzeug nutzen.
8. **Wenig, etablierte Abhängigkeiten.** Jede neue Abhängigkeit begründen und prüfen (Abschnitt 11.6).
9. **Kommunikation:** kurz, Deutsch, am Ende „Was du selbst tun musst“. Bilder und Hörproben als Datei schicken, nicht nur beschreiben.
10. **Widerspruch** zwischen diesem Dokument und dem Referenzprojekt: Das Dokument gilt. Offensichtliche Fehler melden statt still umgehen.

### 1.4 Vorlieben der Person (aus dem Referenzprojekt)

- Antwortet knapp („weiter“, „pushen“): Rückfragen nur bei echten Entscheidungen, sonst mit Empfehlung vorlegen.
- Will nach jeder Änderung **gepushte** Stände, ohne Terminal-Bestätigung: nur Push, **keine** GitHub-Actions-Dateien (Abschnitt 14.1).
- Will Qualität vor Tempo, hört aber sofort, wenn etwas „zu schnell“ ist: Aussprache von Anfang an **langsam** (Abschnitt 7.4).
- Technische Grenzen ehrlich ansprechen (z. B. Autoplay-Sperre in Safari) und die beste Lösung vorschlagen.
- Erwartet, dass Fehler aus früheren Durchläufen nicht wieder passieren: Abschnitt 16 ist Pflichtlektüre.

---

## 2. Parameter (zuerst per strukturierter Frage klären)

| #   | Parameter                    | Standard / Vorschlag                                                                                                     |
| --- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Zielsprache** und Variante | z. B. Englisch (britisch/amerikanisch), Französisch, Portugiesisch (brasilianisch/europäisch), Spanisch, Italienisch     |
| 2   | **App-Name**, Repo-Name      | App-Name in der Zielsprache, Repo `<Sprache>-Tutor`                                                                      |
| 3   | **Maskottchen**              | Name, Figur, Aussehen (Bild oder Beschreibung), Stimme tiefer/höher, Zubehör in den Farben der App (Anhang C)            |
| 4   | **Farbthema**                | Vorschlag aus Flagge/Kultur, **Person entscheidet**. Hell und Dunkel, Kontrast nach WCAG 2.2 AA                          |
| 5   | **GitHub**                   | Konto, öffentlich oder privat, Lizenz (Standard: MIT)                                                                    |
| 6   | **Datenschutz-Modus**        | „privat“ (Freunde/Familie, kein Impressum, `noindex`, Kontakt optional) oder „öffentlich“ (Name und Kontakt Pflicht)     |
| 7   | **Stimme**                   | Claude schlägt 2–3 **lizenzsichere** Stimmen vor (7.2), erzeugt Hörproben, die Person wählt                              |
| 8   | **Umfang**                   | ≥ 1.000 Einträge, 20 Themen (wie Referenz) oder eigene Themenliste                                                       |
| 9   | **Eingabe beim Tippen**      | Lateinische Schrift: Systemtastatur **plus Sonderzeichen-Leiste** (Standard). Andere Schriften: App-eigene Tastatur (10) |
| 10  | **Besonderheiten**           | Varianten (US/UK, BR/PT), Anrede (du/Sie, tu/vous, tú/usted), Artikel bei Nomen, Schreibvarianten                        |

**Weitere Standardwerte (nur auf Wunsch ändern):** Muttersprache Deutsch, neue Karten pro Tag 20 (10/20/30/50 wählbar), Audioformat MP3 mono 40 kbps, Hosting Netlify (Anleitung für das Dashboard), Hosting-Hinweis in der Datenschutzseite, kein Backend, keine Konten.

---

## 3. Referenzprojekt wiederverwenden

Schreibe nichts neu, was das Referenzprojekt schon löst. Das spart Fehler und Zeit.

```bash
# Ablage außerhalb des Projektordners (Scratchpad), nur lesen
git clone --depth 1 https://github.com/Titus753/Russisch-Tutor.git "$SCRATCH/referenz"
```

Netzwerk: nur `github.com`, nur Lesen. Ein Überblick über Umfang des Referenzprojekts: rund 6.000 Zeilen Quellcode, rund 3.000 Zeilen Tests.

### 3.1 Was wie übernommen wird

| Bereich                   | Dateien                                                                                                                                                               | Aktion                                                                                                       |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Projektgerüst             | `.editorconfig`, `.gitignore`, `.npmrc`, `.nvmrc`, `.prettierrc.json`, `.prettierignore`, `tsconfig.json`, `eslint.config.js`, `playwright.config.ts`                 | **1:1** (nur Namen anpassen)                                                                                 |
| Build und Sicherheit      | `vite.config.ts`, `netlify.toml`, `public/_headers`, `public/robots.txt`, `config/headers.ts`, `config/sw-plugin.ts`, `config/sw-vorlage.js`, `config/rechtliches.ts` | **1:1**                                                                                                      |
| Daten-Plugin              | `config/vokabel-plugin.ts`                                                                                                                                            | anpassen: Namen der virtuellen Module und Dateien                                                            |
| Lernlogik                 | `src/logik/*` (`datum`, `leitner`, `karten`, `abwechslung`, `zufall`, `statistik`, `stand`, `antworten`, `begruessung`)                                               | **1:1**; `vergleich.ts` anpassen (Abschnitt 6.4)                                                             |
| Speicher                  | `src/speicher/*` (`schema`, `speicher`, `sicherung`)                                                                                                                  | **1:1** (Datenbankname, Cache-Präfix ändern)                                                                 |
| App-Rahmen                | `src/App.tsx`, `src/main.tsx`, `src/app/*`, `src/audio/wiedergabe.ts`                                                                                                 | **1:1**                                                                                                      |
| Bausteine                 | `src/bausteine/*` (`Bedienelemente`, `Lernkarte`, `Anhoeren`, `Icons`, `Tutorial`, `Willkommen`, `BaerKnopf`)                                                         | übernehmen; Texte und Tutorial-Inhalte anpassen                                                              |
| **Maskottchen-Zeichnung** | `src/bausteine/Baer.tsx`                                                                                                                                              | **ersetzen** durch das Maskottchen der Person                                                                |
| **Tastatur**              | `src/bausteine/Tastatur.tsx`                                                                                                                                          | **ersetzen**: Sonderzeichen-Leiste bzw. Layout der Zielsprache (Abschnitt 10)                                |
| Ansichten                 | `src/ansichten/*`                                                                                                                                                     | übernehmen; Texte anpassen; `Alphabet.tsx` je nach Schrift (Abschnitt 10)                                    |
| Design                    | `src/styles.css`                                                                                                                                                      | übernehmen; **Farben** im `:root`-Block ersetzen, Struktur beibehalten                                       |
| Daten                     | `data/*`                                                                                                                                                              | **neu schreiben** (Abschnitt 5). Nur Themenliste und Struktur dienen als Vorlage                             |
| Audio-Werkzeug            | `tools/audio/*`                                                                                                                                                       | übernehmen; Stimmen, Texte und Prüfsummen anpassen (Abschnitt 7)                                             |
| Symbole                   | `tools/icons/erzeuge_icons.mjs`, `public/manifest.webmanifest`, `public/icon.svg`                                                                                     | Texte und Farben anpassen                                                                                    |
| Tests                     | `tests/unit/*`, `tests/e2e/*`                                                                                                                                         | übernehmen und mit den Umbenennungen anpassen; **keinen Test löschen**, der nicht mehr zutrifft, ohne Ersatz |
| Dokumente                 | `README.md`, `SECURITY.md`, `LICENSE`, `docs/EINRICHTUNG.md`, `docs/LIZENZEN.md`, `docs/ABSCHLUSSBERICHT.md`                                                          | übernehmen und inhaltlich anpassen                                                                           |

### 3.2 Umbenennungen (von Anfang an sprachneutral)

Benenne **gleich zu Beginn** und nicht später per Suchen-und-Ersetzen:

| Referenz (Russisch)                                               | Neu                                                             |
| ----------------------------------------------------------------- | --------------------------------------------------------------- |
| Feld `russisch`                                                   | `ziel` (Text in der Zielsprache)                                |
| Richtung `'de-ru'` / `'ru-de'`                                    | `'de-ziel'` / `'ziel-de'`                                       |
| `betonung`, `genusvarianten`                                      | `aussprache`, `varianten` (Abschnitt 5)                         |
| HTML-Attribut `lang="ru"`                                         | BCP-47-Code der Zielsprache (`en-GB`, `fr`, `pt-BR`, …)         |
| Datenbank `slovo-za-slovo`, Cache-Präfix `slovo-za-slovo-`        | `<app-kuerzel>` und `<app-kuerzel>-`                            |
| Virtuelle Module `virtual:vokabeln`, `:alphabet`, `:lob`, `:baer` | `virtual:vokabeln`, `:aussprache-guide`, `:lob`, `:maskottchen` |
| Dateien `baer.json`, Komponenten `Baer`, `BaerKnopf`              | `maskottchen.json`, `Maskottchen`, `MaskottchenKnopf`           |
| Audio-IDs `alf-`, `alb-`, `lob-`, `bae-`                          | `guf-`, `gub-` (Guide), `lob-`, `mas-` (Maskottchen)            |

Themen-IDs und ihre dreistelligen Kürzel (`beg`, `zah`, `ein` …) bleiben **in allen Sprachen identisch**. Das erleichtert späteres Vergleichen und Wiederverwenden.

---

## 4. Technik-Entscheidungen (fest)

| Baustein       | Entscheidung                                                                                                 | Warum                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Sprache        | TypeScript **6.0.x** strict (+ `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)                     | `typescript-eslint` unterstützt TypeScript 7 noch nicht (Peer-Bereich vor Installation prüfen)                 |
| UI             | **Preact** 10.x (~4 KB), kein weiteres Framework                                                             | Text wird automatisch maskiert; wenig Code                                                                     |
| Build          | **Vite** 8.x, `@preact/preset-vite`                                                                          |                                                                                                                |
| Daten          | JSON im Repo, Prüfung mit **zod** 4.x **mit `z.config({ jitless: true })`**                                  | Ohne `jitless` erzeugt zod Code per `new Function` (Fehler unter strenger CSP, Abschnitt 16.2)                 |
| Speicher       | IndexedDB über **idb-keyval**, Versionsfeld, Migrationen, Sicherung vor Migration                            | Kein Backend                                                                                                   |
| Offline        | **Eigener Service Worker** (`config/sw-vorlage.js`), **kein** `vite-plugin-pwa`                              | Das Plugin brachte ~230 zusätzliche Pakete (Lieferkette); der eigene SW hat ~120 Zeilen und keine Abhängigkeit |
| Tests          | **Vitest** 5.x, **Playwright** 1.63+ (iPhone SE, iPhone 15, Pixel 7), **@axe-core/playwright** (WCAG 2.2 AA) |                                                                                                                |
| Qualität       | ESLint 10 + typescript-eslint, Prettier, `npm run ci` als Gate                                               |                                                                                                                |
| Audio-Werkzeug | **uv** + Python **3.12** (lokal im Projekt), **piper-tts**, **lameenc**                                      | Systempython 3.9 ist zu alt                                                                                    |
| Hosting        | **Netlify** (statisch), Header über `public/_headers`                                                        |                                                                                                                |

**Laufzeit-Abhängigkeiten im Referenzprojekt: nur drei** (`preact`, `zod`, `idb-keyval`). Mehr nur mit Begründung.

Alle Versionen **exakt pinnen** (`.npmrc`: `save-exact=true`, `ignore-scripts=true`), Lockfile committen. Konkrete Versionen vor der Installation neu prüfen (`npm view <paket> version maintainers`) und mit den Herausgebern abgleichen (Typosquatting).

---

## 5. Datenmodell und Vokabelqualität

### 5.1 Felder je Eintrag

**Wie im Referenzprojekt:**

| Feld      | Bedeutung                                                                                                                                          |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`      | stabil, unabhängig vom Text, Format `^[a-z]{3}-\d{3,4}$` (Themenkürzel + Nummer). Nie ändern oder wiederverwenden: der Lernfortschritt hängt daran |
| `typ`     | `wort`, `satz` oder `redewendung`                                                                                                                  |
| `thema`   | ID aus der Themenliste                                                                                                                             |
| `ziel`    | Text in der Zielsprache                                                                                                                            |
| `deutsch` | deutsche Übersetzung, **eindeutig** (siehe 5.3)                                                                                                    |
| `hinweis` | optional: „formell“, „informell“, „an einen Mann“ …                                                                                                |
| `audio`   | wird vom Build gesetzt, wenn `public/audio/<id>.mp3` existiert                                                                                     |

**Erweiterungen** (im Referenzprojekt noch nicht vorhanden: **neu bauen und mit Tests absichern**):

| Feld           | Bedeutung                                                                                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `alternativen` | weitere **akzeptierte** Antworten beim Tippen (z. B. `colour`/`color`, `"I am"`/`"I'm"`)                                                                   |
| `varianten`    | nur wenn Geschlecht oder Anrede die Form ändert: `{ "m": "…", "w": "…" }` oder `{ "du": "…", "sie": "…" }`. Das Referenzprojekt nennt das `genusvarianten` |
| `aussprache`   | optional und **nur wenn sicher**: Betonungszeichen (Russisch: U+0301) oder eine Aussprachehilfe                                                            |
| `sprechtext`   | optional: was die Stimme liest, wenn es vom Anzeigetext abweichen soll (Zahlen, Abkürzungen, Zeichen, die die Stimme falsch liest)                         |

### 5.2 Inhalt

- **Mindestens 1.000 Einträge**, Schwerpunkt Alltag, in drei Arten: Wörter, ganze Sätze, Redewendungen/Sprichwörter. Im Referenzprojekt: 20 Themen × 51 Einträge.
- **Themenliste (Standard):** Begrüßung & Höflichkeit, Zahlen & Zeit, Einkaufen, Kleidung & Farben, Restaurant & Café, Unterwegs & Verkehr, Wohnen & Hotel, Gesundheit & Notfall, Familie & Menschen, Arbeit & Studium, Wetter & Natur, Freizeit & Smalltalk, Redewendungen & Sprichwörter, Behörden & Post, Telefon & Internet, Bank & Geld, Gefühle & Meinungen, Kochen & Küche, Körper, Tiere.
- Die **Inhalte neu schreiben**, nicht blind übersetzen. Das Referenzprojekt liefert nur Aufbau und Mengen. Redewendungen durch **echte Redewendungen der Zielsprache** mit sinngemäßer deutscher Entsprechung ersetzen.
- Bei Sprachen mit Artikel/Genus (FR, ES, IT, PT) steht der Artikel bei Nomen im Zieltext (`le pain`), damit das Genus mitgelernt wird.
- Eine **Person mit sehr guten Kenntnissen** der Sprache soll eine Stichprobe prüfen; unsichere Einträge sammelt Claude in `data/pruefen.md` (Kästchen zum Abhaken).

### 5.3 Prüfungen beim Build (Pflicht, Build bricht bei Fehlern ab)

1. zod-Schema mit **Zeichen-Allowlist je Sprache** (Buchstaben der Sprache, Ziffern, übliche Satzzeichen). HTML oder Steuerzeichen werden abgelehnt. Teste das ausdrücklich.
2. IDs eindeutig, Format korrekt, Themenkürzel passen zum Thema und zur Dateibenennung.
3. **Keine doppelten Zieltexte** (Vergleichsform: klein, Akzente je nach Sprache, ohne Satzzeichen).
4. **Keine mehrdeutigen deutschen Texte:** Zwei Einträge dürfen nicht dieselbe deutsche Übersetzung haben, sonst ist „Deutsch → Zielsprache“ mehrdeutig (Beispiele aus dem Referenzprojekt: „der Tisch“, „das Eis“, „Hallo“). Lösung: deutschen Text präzisieren („der kleine Tisch“, „Hallo? (am Telefon)“).
5. Aussprachehilfen müssen zum Text passen (Referenz: Betonung ohne Zeichen = Text).
6. Aufnahme je Eintrag vorhanden und **aktuell** (Hash im Manifest, Abschnitt 7.5).
7. Mindestens 4 Einträge je Inhaltsart (für vier Antwortmöglichkeiten) und mindestens 1.000 Einträge insgesamt.

---

## 6. Lernlogik (Spezifikation)

Diese Logik ist im Referenzprojekt umgesetzt und getestet (`src/logik/*`). Übernimm sie 1:1.

### 6.1 Wiederholungssystem (Leitner)

| Stufe | Abstand |
| ----- | ------- |
| 0     | 0 Tage  |
| 1     | 1 Tag   |
| 2     | 3 Tage  |
| 3     | 7 Tage  |
| 4     | 16 Tage |
| 5     | 35 Tage |

- **Nochmal:** Stufe 0, kommt in derselben Runde nach ca. 3 Karten wieder.
- **Schwer:** Stufe bleibt (mindestens 1), halber Abstand, mindestens 1 Tag.
- **Gut:** Stufe +1. **Leicht:** Stufe +2 (jeweils höchstens 5).
- Fortschritt wird **pro Eintrag und Richtung** gespeichert (`<id>:de-ziel`, `<id>:ziel-de`). „Gefestigt“ = Stufe ≥ 4.
- Tage zählen in **lokaler Zeit** als `JJJJ-MM-TT`; Berechnungen um 12 Uhr mittags, damit Zeitumstellungen nichts verschieben.

### 6.2 Runde und Abwechslung (`baueRunde`, `abwechslung.ts`)

- Runde = **alle fälligen Karten** + neue Karten bis zum Tageslimit (Einstellung 10/20/30/50, Standard 20). Das Limit zählt **Einträge**, nicht Richtungen; pro Eintrag höchstens eine neue Richtung am Tag. „10 neue Karten dazunehmen“ erhöht nur das heutige Limit.
- **Neue Karten kommen reihum aus allen Themen** (20 neue Wörter = 20 Themen). **Ganz neue Wörter vor zweiten Richtungen** schon bekannter Wörter.
- **Neue und fällige Karten gleichmäßig gemischt**, gleicher Eintrag und gleiches Thema möglichst nie direkt hintereinander (`entzerren`).
- **Quiz, Tippen, Hören:**
  - Karte zu ca. **70 % aus schwachen Karten** (neu oder Stufe < 3).
  - Sitzungsgedächtnis der **letzten 12 Wörter** wird gemieden, nach Möglichkeit **anderes Thema** als zuvor.
  - Karten mit vielen bisherigen Fehlern werden etwas häufiger gezogen (Gewicht `1 + min(Fehler, 5) × 0,5`).
  - Falsch beantwortet: Stufe 0. Richtig zählt nur bei neuen oder fälligen Karten als „Gut“.
- Zufall immer über eine austauschbare Quelle (`Zufall`), damit Tests mit festem Startwert laufen.

### 6.3 Lernmodi

1. **Karteikarten:** aufdecken, vier Bewertungsknöpfe, „Noch N Karten in dieser Runde“, Tastatur (Leertaste, 1–4). Leerer Zustand: **Lob** aus einem Pool (Abschnitt 9.3) und der Hinweis „Dein Fortschritt ist gespeichert.“
2. **Multiple Choice:** vier Antworten derselben Inhaltsart, bevorzugt aus demselben Thema, **keine doppelten Antworttexte**.
3. **Tippen** (immer Deutsch → Zielsprache).
4. **Hören:** Aufnahme (normal/langsam), Bedeutung wählen, danach Text einblenden.
5. Richtung: DE→Ziel, Ziel→DE oder gemischt; Filter nach Themen und Inhaltsarten (**mindestens eines bleibt aktiv**).

### 6.4 Antwortvergleich beim Tippen (`vergleich.ts`, anpassen)

Stufen: **richtig** (nach Normalisierung gleich), **fast richtig** (kleine Abweichung), **falsch**.

- Normalisieren: klein, Satzzeichen und Bindestriche weg, Leerzeichen vereinheitlichen, Apostrophe vereinheitlichen (`’` und `'`).
- „Fast richtig“: Levenshtein-Abstand höchstens `max(1, Länge / 12)`. „Fast richtig“ zählt als **Gut**, die abweichenden Buchstaben werden **markiert**.
- **Akzente und Sonderzeichen sprachabhängig** festlegen: Fehlen nur Akzente (z. B. `cafe` statt `café`), zählt das als „fast richtig“ mit Markierung des Akzents, nicht als falsch. Prüfe Wörter, die sich nur durch den Akzent unterscheiden (`où`/`ou`, `esta`/`está`), und lege fest, welcher Fall „falsch“ ist.
- `alternativen` und `varianten` (Abschnitt 5.1) gelten als richtige Antworten.
- Eingabelänge begrenzen (300 Zeichen) wegen des quadratischen Aufwands. Test mit einer Million Zeichen.
- Tipp-Knopf zeigt schrittweise die ersten Buchstaben; „Lösung“ deckt auf und zählt als falsch.

### 6.5 Fortschrittsanzeige

Lernserie (Tage in Folge; reißt erst, wenn ein ganzer Tag fehlt), heute fällige Karten, begonnene und gefestigte Einträge, Balken je Thema.

---

## 7. Aussprache (Audio-Pipeline)

Ziel: **Jede Zeile hat eine vorab erzeugte Aufnahme**, lokal und offline erzeugt, ohne API-Schlüssel und ohne Daten an Dritte.

### 7.1 Werkzeug (aus `tools/audio` des Referenzprojekts)

- `uv` (Einzeldatei) von GitHub laden und **per SHA-256 aus demselben Release prüfen**, nach `tools/audio/bin/`. Python 3.12 und Pakete installiert `uv` nach `tools/audio/.python` und `.venv`. **Kein Homebrew, kein `sudo`, keine Systeminstallation.**
- `pyproject.toml` mit gepinnten Paketen, `uv.lock` (mit Prüfsummen) committen. Schwachstellenprüfung: `uvx --from pip-audit pip-audit -r <(uv export --locked --format requirements-txt --no-emit-project) --require-hashes --disable-pip`.
- Stimmen laden **nur von einem festen Commit** des Repositorys `rhasspy/piper-voices` (nie `main`), jede Datei per SHA-256 geprüft (`lade_stimmen.py`). Prüfsumme der `.onnx`-Datei steht in der Hugging-Face-Baumansicht unter `lfs.oid`, kleine Dateien selbst mit `shasum -a 256` bilden.
- Das Erzeugungsskript (`erzeuge_audio.py`) nutzt **kein Netzwerk und keine Shell**, prüft IDs und Texte per Allowlist und schreibt Dateien atomar.
- Bei Apple Silicon: Asset `uv-aarch64-apple-darwin.tar.gz`; sonst passendes Asset wählen.

### 7.2 Stimmenwahl und Lizenzen (Pflicht, vor jeder Erzeugung)

1. Für jede Kandidatenstimme die `MODEL_CARD` am **festen Commit** lesen: Datenlizenz (`License`) und Basismodell (`Finetuned from …`).
2. **Ausschließen:** Nicht-kommerzielle Lizenzen (NC), AGPL, „unbekannt“ und „See URL“, solange die verlinkte Lizenz nicht gelesen und bewertet ist.
3. **Namensnennung (CC BY)** in `docs/LIZENZEN.md` **und** in der App (Seite „Quellen“) aufnehmen. **ShareAlike (CC BY-SA)** nur nach rechtlicher Bewertung.
4. **Restrisiko Basismodell:** Fast alle „medium“-Stimmen sind aus der englischen Stimme `lessac` weitertrainiert; `lessac` selbst steht unter einer **Forschungslizenz**. Ob sich das auf weitertrainierte Modelle und damit erzeugte Audiodateien überträgt, ist rechtlich nicht geklärt. Vertretbar für eine kostenlose, private App; **offen dokumentieren** (`docs/LIZENZEN.md`) und bei kommerzieller Nutzung vorher prüfen lassen. Stimmen **ohne** Basisangabe in der MODEL_CARD bevorzugen.

**Geprüfter Stand (2026-10-01, Commit `c10ece1aade47bb51c153c893d14e5bf8e5b7117` von `rhasspy/piper-voices`).** Vor Nutzung **neu prüfen**; die Tabelle ist ein Startpunkt, keine Freigabe.

| Sprache            | Bevorzugt (kein `lessac`-/`ryan`-Basismodell)                                                                  | Akzeptabel mit dokumentiertem Restrisiko (Basismodell `lessac`) | Ausschließen / erst prüfen                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Englisch (US)      | `ljspeech`, `kristin`, `norman`, `bryce` (alle gemeinfrei), `john` (gemeinfrei, aus `kristin` weitertrainiert) | `joe`, `mike`, `reza_ibrahim` (CC0)                             | `lessac` (Forschungslizenz), `ryan`, `hfc_*`, `l2arctic` (NC), `amy`/`kusal` („See URL“)    |
| Englisch (GB)      | `cori` (gemeinfrei)                                                                                            | `alba`, `aru`, `vctk` (CC BY 4.0, Namensnennung)                | `semaine` (NC-SA), `northern_english_male` (CC BY-SA)                                       |
| Französisch        | `mls` (CC BY 4.0, Namensnennung)                                                                               | `siwis` (CC BY 4.0, Basis `lessac`)                             | `tom` (AGPLv3), `upmc` (CC BY-SA), `gilles` (CC0, aber Basis `ryan` = NC)                   |
| Portugiesisch (BR) |                                                                                                                | `cadu`, `faber`, `jeff` (CC0)                                   | `edresson` (Basis `ryan` = NC)                                                              |
| Portugiesisch (PT) |                                                                                                                | `tugão` (CC0)                                                   |                                                                                             |
| Spanisch (ES/MX)   | `claude` (MX, Apache-2.0), `carlfm` (gemeinfrei, nur sehr niedrige Qualität)                                   | `davefx` (CC0), `ald` (MX, Unlicense)                           | `mls_*` (Basis `ryan`)                                                                      |
| Italienisch        | `serena` (CC BY 4.0, Namensnennung)                                                                            |                                                                 | `paola`, `riccardo` („See URL“, erst prüfen)                                                |
| Niederländisch     |                                                                                                                | `alex` (CC0, Basis `rdh`), `pim`, `ronnie` (CC0)                |                                                                                             |
| Polnisch           |                                                                                                                | `darkman`, `gosia`, `mc_speech` (CC0)                           | `bass` (keine Angabe)                                                                       |
| Türkisch           |                                                                                                                |                                                                 | `dfki` (NC-SA): im Repository keine unbedenkliche Stimme, Alternative mit der Person klären |

Russisch (Referenz): `irina` (Lizenz unbekannt) und `ruslan` (NC-SA) wurden ausgeschlossen, `dmitri` und `denis` (CC0, Basis `lessac`) genutzt.

### 7.3 Hörproben vor der Massenerzeugung (Pflicht)

1. Gleichen Probetext mit 2 Stimmen erzeugen (Begrüßung, ein Satz mit Betonungs-/Aussprachefallen, Zahlen).
2. Dateien **an die Person schicken** (nicht nur beschreiben) und die Wahl abwarten.
3. Erst danach alle Aufnahmen erzeugen.

### 7.4 Tempo und Deutlichkeit (aus Nutzerrückmeldungen gelernt)

Die Person meldete das Tempo **zweimal als „zu schnell“** (Piper-Standard, dann `length_scale` 1,4); erst 1,8 passte. Mein erster Versuch mit 1,2 war schon vor der Auslieferung durch Messen aufgefallen (nur +9 %). Beginne deshalb von Anfang an so:

| Einstellung                     | Wert                                    |
| ------------------------------- | --------------------------------------- |
| `length_scale`                  | **1,8** (≈ 56 % langsamer als Standard) |
| `noise_scale` / `noise_w_scale` | 0,45 / 0,5 (gleichmäßigere Aussprache)  |
| Pause zwischen Sätzen / am Ende | 0,6 s / 0,3 s                           |
| Pause am Anfang                 | 0,12 s                                  |
| Format                          | MP3, mono, 40 kbps (Qualität 2)         |

- **`length_scale` wirkt nicht linear.** Gemessen an einer Stimme (gleicher Text): 1,0 → 6,13 s, 1,4 → +25 %, 1,6 → +41 %, 1,8 → +56 %, 2,0 → +70 %. **Immer die Dauer messen**, bevor Werte festgelegt werden.
- In der App ist „Langsam“ zusätzlich `playbackRate = 0,8` bei erhaltener Tonhöhe (`preservesPitch = true`).
- Format **MP3**, nicht Opus: auf älteren iPhones im `HTMLAudioElement` unzuverlässig.

### 7.5 Hash-Verfahren (nur Geändertes neu erzeugen)

`data/audio-manifest.json` speichert je Eintrag einen Hash aus Verfahren, Stimme, Modell-Prüfsumme, Text, Bitrate, Tempo, Rauschen. **Neue Parameter nur dann in den Hash aufnehmen, wenn sie für den Eintrag gelten** (z. B. Maskottchen-Parameter nur bei Maskottchen-Sätzen). Sonst werden alle Aufnahmen unnötig neu erzeugt (ist im Referenzprojekt einmal passiert und wurde vor dem Commit rückgängig gemacht). Ein Unit-Test prüft, dass zu jedem Eintrag eine **aktuelle** Datei existiert und dass es keine verwaisten Dateien gibt.

### 7.6 Maskottchen-Stimme

Gleiche Stimme, eigenes Tempo und **tiefer oder höher durch geänderte Abtastrate beim MP3-Kodieren**: Faktor `0,8` für „brummig, tief und langsamer“, `1,15` für „hell“. Kein zusätzliches Werkzeug nötig.

### 7.7 Wiedergabe in der App

- `HTMLAudioElement` (spielt auf dem iPhone auch bei Lautlos-Schalter; am Gerät prüfen). Nur ein Element wiederverwenden; `defaultPlaybackRate` setzen, weil es das Laden einer neuen Quelle überlebt, `playbackRate` nicht.
- **Rückfall nur, wenn die Aufnahme fehlt:** Web Speech API **nur mit lokalen Stimmen** (`voice.localService === true`). Manche Stimmen schicken den Text sonst an einen Server. Ohne Stimme: verständliche Anleitung zum Nachinstallieren (iPhone/Android).
- **Autoplay-Sperre:** Safari und andere erlauben Ton erst nach einer Nutzeraktion. Deshalb spricht das Maskottchen **erst nach Antippen** (Abschnitt 9). Kein Autoplay beim Start.
- Der Service Worker muss **Range-Anfragen** für Audio aus dem Cache beantworten (Safari lädt Medien stückweise).

---

## 8. Oberfläche und Design

Übernimm Aufbau und Verhalten aus dem Referenzprojekt (`src/styles.css`, `src/bausteine`, `src/ansichten`).

### 8.1 Gestaltung

- **Design-Idee der Sprache** festlegen (Russisch: Gzhel-Porzellan in Kobaltblau). Farben als **CSS-Variablen**; Werte für Hell und Dunkel definieren; Modus System/Hell/Dunkel; Option „Hoher Kontrast“. **Jedes Farbpaar nach WCAG 2.2 AA prüfen** (der axe-Test findet Fehler).
- Nur **Systemschriften** (kein Webfont, keine Fremdanfragen). Zieltext in einer Serifenschrift (`'Iowan Old Style', 'New York', ui-serif, Georgia, serif`), alles andere `system-ui`.
- **Lernkarte** als Markenzeichen: weiße Fläche, 2 px Rand in der Hauptfarbe, Radius ca. 26 px, zweite feine Linie innen (doppelter Rand per `inset box-shadow`). Oben Thema und Inhaltsart, darunter groß die Frage, nach dem Aufdecken die Lösung unter feiner Trennlinie.
- Knöpfe mindestens 48 px hoch (Radius ca. 14 px), Hauptaktion in der Hauptfarbe. Tab-Leiste unten: Karten, Quiz, Tippen, Hören, Mehr (Alphabet/Guide, Einstellungen, Fortschritt, Sicherung, Datenschutz unter „Mehr“).
- UI-Texte: Satzanfang groß, klare Verben, keine Großbuchstaben-Labels. Beispiele: „Aufdecken“, „Prüfen“, „Weiter“, „Anhören“, „Noch 12 Karten in dieser Runde“.

### 8.2 Barrierefreiheit (Pflicht)

- **Alle Maße in `rem`**, damit die Schriftgröße alles skaliert. Stufen Klein/Normal/Groß/Sehr groß = 87,5/100/125/150 %.
- Systemschriftgröße beachten: nur **vergrößern** (`-apple-system-body`, Standard 17 px), niemals verkleinern. macOS meldet dort 13 px und hätte die App sonst um ein Viertel verkleinert.
- **Mindest-Tippflächen 44 px (Knöpfe), 48 px (Tasten) unabhängig von der Schriftstufe** (`max(2.75rem, 44px)` usw.).
- Lange Wörter umbrechen (`overflow-wrap: anywhere; hyphens: auto`), sonst ragen deutsche Komposita bei „Sehr groß“ über den Rand.
- Sichtbarer Fokus, `prefers-reduced-motion` respektieren (alle Animationen), Screenreader-Beschriftungen, Sprachauszeichnung (`lang`), Safe-Area-Insets (Notch, Home-Indikator).
- Zum Test: Layoutprüfung aller Ansichten je Schriftstufe bei **360 px** (kein waagerechtes Scrollen, nichts abgeschnitten, Mindestgrößen).

### 8.3 Tippen und Tastatur

- **Aufgabe, Eingabefeld und Prüfen-Knopf bleiben immer sichtbar**, auch bei offener Tastatur (visualViewport, `dvh`/`svh`, Karte kompakt, Tab-Leiste ausgeblendet, Enter prüft bzw. geht weiter).
- **Lateinische Schrift:** Systemtastatur + **Sonderzeichen-Leiste** über dem Eingabefeld (Abschnitt 10), Einfügen an der Cursorposition.
- **Andere Schriften:** App-eigene Tastatur (`inputmode="none"`, Tasten ≥ 48 px, am unteren Rand verankert). Referenz: Russisch ЙЦУКЕН in `Tastatur.tsx`.
- Einstellung „Eingabeart“ (App-Tastatur/Systemtastatur) mit Hinweis, wie man eine Tastatur der Zielsprache hinzufügt.

---

## 9. Maskottchen, Begrüßung, Lob, Einführung

### 9.1 Maskottchen

- Wird **von der Person vorgegeben** (Anhang C). Name, Figur und Aussehen kommen aus den Parametern.
- **Bild gegeben:** Original unter `design/maskottchen/` ablegen; für die App ein optimiertes PNG/WebP (≤ 50 KB, transparent) unter `public/` und in den Offline-Cache; `alt`-Text setzen. SVG: als Komponente einbinden (keine `style`-Attribute, CSP).
- **Nur Beschreibung:** schlichte Vektorzeichnung in den App-Farben (Referenz: `Baer.tsx`, Zubehör in der Hauptfarbe).
- Das Maskottchen ist ein **Knopf**: Hinweis „Tippe auf <Name> – er/sie sagt dir Hallo!“, pulsierender Ring und Lautsprecher-Abzeichen bis zum ersten Antippen, danach „Nochmal tippen …“. Es **spricht nur auf Antippen** (Autoplay-Sperre, Abschnitt 7.7), auch per Tastatur (Enter/Leertaste) bedienbar.

### 9.2 Begrüßung beim Start

- Bei **jedem Öffnen** (außer beim allerersten Start, dort übernimmt die Einführung) kurzer Dialog mit dem Maskottchen.
- **Gruß nach Tageszeit** (lokale Uhrzeit): 5–11 Morgen, 11–17 Tag, 17–23 Abend, sonst Nacht, plus ein **wechselnder zweiter Satz** aus einem Pool (mindestens 7, nie derselbe wie beim letzten Mal). Immer **Zielsprache mit deutscher Übersetzung darunter**, gesprochen mit der Maskottchen-Stimme.
- Abschaltbar in den Einstellungen („<Name> begrüßt mich beim Start“, Standard: an).
- **Nachts (23–5 Uhr) kein „Gute Nacht“:** In vielen Sprachen ist das ein **Abschiedsgruß** (RU `Доброй ночи`, FR `Bonne nuit`, EN `Good night`). Nimm einen lockeren Begrüßungsgruß (Referenz: `Привет, полуночник!` = „Hallo, Nachteule!“). Jeden Tageszeit-Gruß auf **Begrüßung gegen Abschied** prüfen.

### 9.3 Lob nach geschaffter Runde

- Sind alle Karten durch, erscheint **ein zufälliges Lob** aus einem Pool von **mindestens 20 Sprüchen** in der Zielsprache mit deutscher Übersetzung und „Anhören“-Knopf (nie zweimal hintereinander derselbe). Darunter: „Für heute ist alles wiederholt. **Dein Fortschritt ist gespeichert.**“ und „10 neue Karten dazunehmen“.
- Pool als `data/lob.json` (zod-geprüft, Aufnahmen vorhanden).

### 9.4 Einführung (Tutorial) beim ersten Start

8 Schritte, überspringbar, Vor/Zurück, Fortschrittspunkte, jederzeit unter „Mehr“ erneut aufrufbar. Natives `<dialog>`; **Kopfzeile und Knöpfe bleiben fest, nur der Inhalt scrollt** (lange Texte schieben „Weiter“ sonst aus dem Bild):

1. Das Maskottchen stellt sich vor (Zielsprache + deutsche Übersetzung, antippbar).
2. Karteikarten und Bewertung.
3. **„Wann kommt ein Wort wieder?“** Stufen 1/3/7/16/35 Tage als kleine Treppe, die vier Bewertungsknöpfe, Hinweis auf gemischte Auswahl aus allen Themen.
4. Quiz und Hören.
5. Tippen (Tastatur bzw. Sonderzeichen).
6. Alphabet bzw. Aussprache-Guide.
7. Einstellungen und Schriftgröße.
8. Datenschutz und Sicherung.

---

## 10. Sprachspezifische Anpassungen

| Thema                          | Russisch (Referenz)         | Lateinische Sprachen (EN, FR, PT, ES, IT, …)                                                                                                                               | Andere Schriften                                    |
| ------------------------------ | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| **Alphabet-Seite**             | 33 Buchstaben, Übung        | **Aussprache-Guide**: Buchstaben und Buchstabenkombinationen mit deutscher Ausspracheannäherung, Beispielwort, Aufnahme, Übung. Schema nicht auf eine feste Zahl festlegen | Alphabet wie Referenz (Zahl und Reihenfolge prüfen) |
| **Aussprachehilfe im Eintrag** | Betonungszeichen U+0301     | meist nicht nötig; `aussprache` nur bei Stolperfallen (Englisch: ungewöhnliche Schreibung)                                                                                 | je Schrift                                          |
| **Tastatur**                   | App-Tastatur ЙЦУКЕН         | Systemtastatur + **Sonderzeichen-Leiste**                                                                                                                                  | App-Tastatur nötig                                  |
| **Genus/Anrede**               | `genusvarianten` bei Sätzen | `varianten` bei Genus (FR/ES/IT/PT), Anrede (du/Sie), Höflichkeit; bei Nomen Artikel im Zieltext                                                                           |                                                     |
| **Akzent-Toleranz**            | е/ё gleichgesetzt           | Akzente nur als „fast richtig“ mit Markierung (6.4)                                                                                                                        |                                                     |
| **Schreibvarianten**           | –                           | `alternativen` (US/UK, BR/PT, Kurzformen)                                                                                                                                  |                                                     |
| **HTML-Sprachattribut**        | `ru`                        | `en-GB`, `en-US`, `fr`, `pt-BR`, `pt-PT`, `es`, `it` …                                                                                                                     |                                                     |
| **Redewendungen**              | russische Sprichwörter      | echte Redewendungen der Sprache, sinngemäße deutsche Entsprechung (in `data/pruefen.md` melden)                                                                            |                                                     |

### 10.1 Sonderzeichen-Leiste (Vorschlag)

| Sprache       | Zeichen                     |
| ------------- | --------------------------- |
| Französisch   | é è ê à â ç ù û ô î ï œ « » |
| Portugiesisch | ã õ á â é ê í ó ô ú ç       |
| Spanisch      | á é í ó ú ñ ü ¿ ¡           |
| Italienisch   | à è é ì ò ù                 |
| Englisch      | keine nötig (optional `’`)  |

### 10.2 Hinweise je Sprache für den Aussprache-Guide

- **Englisch:** `th`, `w` gegen `v`, kurze/lange Vokale, Schreibung ≠ Aussprache (stumme Buchstaben), Betonung im Wort.
- **Französisch:** Nasalvokale, stumme Endungen, Liaison, `r`, Akzente und `ç`.
- **Portugiesisch:** Nasale (`ão`, `õe`), `lh`/`nh`, Betonung und Akzente, europäisch/brasilianisch.
- **Spanisch:** `ñ`, `rr`, `ll`, `h` stumm, Betonungsregeln und Akzent.
- **Italienisch:** Doppelkonsonanten, `gli`/`gn`, `c`/`g` vor `e`/`i`.

Schriften wie Arabisch (rechts nach links) oder Chinesisch sind **nicht Teil von Version 1.0**: vor dem Start mit der Person klären (Layout, Eingabe, Stimme).

---

## 11. Sicherheit (höchste Priorität, mehrschichtig)

### 11.1 Grundsätze

Keine Nutzerdaten verlassen das Gerät: kein Backend, keine Konten, kein Tracking, keine Cookies, keine externen Fonts, CDNs oder Fremdanfragen zur Laufzeit. Alles aus Speicher oder Import gilt als **feindlich**. Im Fehlerfall wird verweigert (fail closed) und mit einem Rückfall weitergemacht, nie abgestürzt.

### 11.2 Header (`public/_headers`, einzige Quelle)

`vite.config.ts` liest die Datei für die lokale Vorschau, die E2E-Tests und das CSP-Meta-Tag im Build. Übernimm sie **wörtlich**:

```text
/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; media-src 'self'; connect-src 'self'; font-src 'self'; manifest-src 'self'; worker-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; require-trusted-types-for 'script'; trusted-types sw-registrierung
  Strict-Transport-Security: max-age=63072000; includeSubDomains
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: no-referrer
  Permissions-Policy: accelerometer=(), autoplay=(self), bluetooth=(), browsing-topics=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), hid=(), magnetometer=(), microphone=(), midi=(), payment=(), publickey-credentials-get=(), serial=(), usb=(), xr-spatial-tracking=()
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin
  X-Permitted-Cross-Domain-Policies: none
  X-Robots-Tag: noindex, nofollow, noarchive      # nur im Modus „privat“

/assets/*
  Cache-Control: public, max-age=31536000, immutable
/sw.js
  Cache-Control: no-cache
/manifest.webmanifest
  Content-Type: application/manifest+json
/audio/*
  Cache-Control: public, max-age=86400
```

- **Kein `upgrade-insecure-requests`:** WebKit hat damit in der lokalen Vorschau Skripte über `https://localhost` angefordert, die App startete auf iPhone-Profilen nicht (Abschnitt 16.2). HSTS reicht.
- Die einzige erlaubte **Trusted-Types-Policy** `sw-registrierung` lässt ausschließlich `/sw.js` zu (`src/app/offline.ts`).
- Zusätzlich die CSP als `<meta http-equiv>` in den Build schreiben (zweite Schicht), direkt hinter `<meta charset>`.

### 11.3 Code

- **Kein** `eval`, `new Function`, `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `dangerouslySetInnerHTML`: per **ESLint-Regeln erzwungen** (`no-restricted-syntax`). Angriffs-Teststrings in Tests bekommen eine `eslint-disable-next-line … -- Begründung`.
- Alle Inhalte werden als **Text** gerendert. Die DOM-Nutzung bleibt auf `textContent`-Äquivalente und CSSOM beschränkt (keine `style=""`-Attribute, CSP).
- zod mit `jitless: true`.

### 11.4 Speicher, Import, Sicherung

- Format mit Versionsfeld und Migrationen. **Vor jeder Migration, jedem Import und jedem Löschen wird der alte Stand intern gesichert**; gelingt die Sicherung nicht, wird nichts ersetzt.
- Rückfall-Kette: aktueller Stand → vorheriger gültiger Stand → neuer Stand. Beschädigte Daten werden **aufbewahrt** (`stand-kaputt`), nicht gelöscht.
- Schreibvorgänge nacheinander (kein Überholen), **vor dem Schreiben prüfen**, Kopie speichern (keine spätere Mutation).
- Schlüssel nur aus einer Allowlist (Schutz vor `__proto__`/Prototype Pollution). Einzelne kaputte Karten verwerfen, Einstellungen feldweise auf Standard.
- **Import:** Größenlimit (5 MB, schon vor dem Lesen), zod-Prüfung, Vorschau („X Karten werden ersetzt“), Bestätigung, vorherige Sicherung, Wiederherstellen. **Löschen zweistufig** und wiederherstellbar. `navigator.storage.persist()` anfragen.

### 11.5 Service Worker

Nur eigene GET-Anfragen, **feste Dateiliste** mit Inhalts-Hash als Version, versionierter Cache, alte Caches beim Aktivieren löschen, **kein Nachspeichern zur Laufzeit**, Range-Anfragen, Update-Hinweis „Aktualisieren“ in der App.

### 11.6 Lieferkette

Wenige, etablierte Pakete; exakt gepinnt; Lockfile committet; `npm ci --ignore-scripts`; Paketnamen und Herausgeber vor der Installation prüfen; `npm audit` (und `pip-audit` für das Audio-Werkzeug) ohne Befund; Dependabot für npm; **keine** Aktionen von Drittanbietern (kein GitHub Actions, siehe 14.1).

### 11.7 Prüfung des Produktions-Bundles (vor „fertig“)

Im gebauten JavaScript nach `eval(`, `new Function`, `innerHTML`, `document.write`, `localStorage`, `document.cookie`, `XMLHttpRequest`, `WebSocket`, `sendBeacon` und nach fremden Adressen suchen. Einzige erlaubte Treffer: `innerHTML` im Preact-Kern für `dangerouslySetInnerHTML` (wird im App-Code nie genutzt) sowie XML-Namensräume.

### 11.8 Liste typischer Schwachstellen schnell generierten Codes

Vor „fertig“ aktiv durchgehen und im Abschlussbericht benennen: fehlende Autorisierung (entfällt ohne Backend), Schlüssel im Frontend, Debug-Zugänge, offenes CORS, Nutzereingaben in HTML/Pfade/Shell, ungeprüfte Client-Werte, fehlende Limits, Race Conditions, verschluckte Fehler, unbegrenzte Ressourcen, `Math.random` für Sicherheit, **erfundene oder veraltete Bibliotheks-APIs** (gegen die installierte Version prüfen), unpassend kopierter Code.

---

## 12. Recht und Datenschutz

- **Code:** MIT-Lizenz (Vorschlag), `LICENSE`, `SECURITY.md` (private Meldung von Sicherheitslücken).
- **Aufnahmen:** Lizenzen der Stimme und ihrer Basismodelle in `docs/LIZENZEN.md` (Tabelle: Bestandteil, Herkunft, Lizenz); Namensnennung bei CC BY; Restrisiko offen benennen (7.2).
- **Datenschutzseite in der App:** was lokal gespeichert wird, was nicht passiert, **Hosting durch Netlify** (IP-Adresse in Server-Protokollen, Auftragsverarbeitung, Datenübermittlung in die USA über das EU-US Data Privacy Framework und Standardvertragsklauseln, Link zur Datenschutzerklärung von Netlify; Angaben vor dem Schreiben bei Netlify gegenprüfen), Rechte der Nutzer.
- **Modus „privat“** (Freunde/Familie): kein Impressum, Kontaktangaben **optional** (nur über Netlify-Umgebungsvariablen `VERANTWORTLICHER_NAME`, `_KONTAKT`, `_ANSCHRIFT`, nie im öffentlichen Repository; ungültige Angaben brechen den Build ab, fehlende nicht). Zusätzlich **Suchmaschinen ausschließen** (Header, Meta-Tag, `robots.txt`) und den Link nur privat teilen. Hinweis: Die Ausnahme für rein private Tätigkeiten gilt nach verbreiteter Auffassung nur für nicht allgemein zugängliche Angebote; die Netlify-Adresse ist technisch öffentlich erreichbar.
- **Modus „öffentlich“:** Name, Anschrift und Kontakt sind Pflicht (Netlify-Build bricht sonst ab), Impressum nach § 5 DDG prüfen.
- **Namen, Anschrift und E-Mail der Person nie ins Repository schreiben**, solange sie das nicht ausdrücklich wünscht (die Git-Historie ist öffentlich).

---

## 13. Tests (Pflicht)

### 13.1 Unit-Tests (Vitest)

Leitner-Übergänge und Datumsrechnung, Rundenaufbau, Abwechslung (20 Themen pro Tag, **10 Tage ohne Wiederholung neuer Wörter** mit den echten Daten), Antwortvergleich (Toleranz, Markierung, Tipps, riesige Eingaben), Statistik, Zustandsübergänge, Speicher (kaputte Daten, Migration, Rückfall, Reihenfolge), Sicherung (sechs Angriffsarten), Vokabelprüfungen inkl. Allowlist und Mehrdeutigkeit, Vollständigkeit der Aufnahmen, Header, Kontaktangaben, Lob- und Maskottchen-Pools, Tageszeit-Zuordnung.

### 13.2 E2E-Tests (Playwright, Projekte iPhone SE, iPhone 15, Pixel 7)

Sicherheit (keine Fremdanfragen, Header, Injektion), Speicher (echte IndexedDB, kaputte Daten), alle Lernmodi, Tastatur-Szenarien (Feld, Prüfen und Aufgabe sichtbar), Audio (Quelle, Tempo, Tonhöhe, Rückfall), Einstellungen, Sicherung (Import-Angriffe), Alphabet/Guide, Einführung, Begrüßung (alle vier Tageszeiten mit `page.clock.setFixedTime`, Sprechen erst nach Antippen, Abschalten), Offline (inkl. Audio und Update-Ablauf), **Barrierefreiheit mit axe** in allen Ansichten (Hell, Dunkel, hoher Kontrast), **Layoutprüfung je Schriftstufe bei 360 px** und der ungünstigste Fall (Sehr groß, lange Texte, Tastatur offen).

### 13.3 Regeln für stabile Tests

- **Test-Grundlage (Fixture):** Tests starten mit „Einführung gesehen, Begrüßung aus“. Nur Tests des Erststarts und der Begrüßung weichen ab.
- E2E laufen **immer gegen einen frischen Build auf eigenem Port** (`reuseExistingServer: false`), nie gegen einen alten Server.
- Nach schreibenden Aktionen **auf die Speicherung warten** (`expect.poll` gegen IndexedDB), bevor neu geladen wird.
- `serviceWorkers: 'block'` als Standard; nur `offline.spec.ts` erlaubt den Service Worker.
- Zufall in Tests nur mit festem Startwert; Statistiktests mit großer Stichprobe und Toleranzband.
- Zielgröße (Referenz): rund 200 Unit-Tests und rund 190 E2E-Tests je Lauf. **Zweimal hintereinander** grün (Wackeltests finden).

### 13.4 Grenzen des Test-Werkzeugs (nicht dem Code anlasten)

Playwright-WebKit kann **echtes Offline** nicht zuverlässig simulieren und verträgt `reload()` mit aktivem Service Worker schlecht: dort nur Cache und Auslieferung prüfen, echtes Offline am Gerät (Anhang D).

---

## 14. GitHub und Netlify

### 14.1 Kein GitHub Actions

Das `gh`-Token der Person hat meist keinen `workflow`-Zugriff; ein Push mit `.github/workflows/*` wird abgelehnt, und die Person will **ohne Terminal-Bestätigung pushen**. Deshalb: **Qualitäts-Gate im Netlify-Build** (`npm run ci`), E2E lokal vor jedem Commit. Prüfe vorher, wie die anderen Projekte der Person gepusht werden (`git remote -v` in Nachbarordnern).

### 14.2 Repository einrichten (nur nach Bestätigung der Parameter)

Zuerst `git init -b main` und den ersten Commit, dann:

```bash
gh repo create <konto>/<repo> --public --description "<Beschreibung>" --source . --push

gh api -X PATCH repos/<konto>/<repo> --input - <<'EOF'
{"security_and_analysis":{"secret_scanning":{"status":"enabled"},"secret_scanning_push_protection":{"status":"enabled"}}}
EOF
gh api -X PUT repos/<konto>/<repo>/vulnerability-alerts
gh api -X PUT repos/<konto>/<repo>/automated-security-fixes
gh api -X PUT repos/<konto>/<repo>/private-vulnerability-reporting
gh api -X POST repos/<konto>/<repo>/rulesets --input - <<'EOF'
{"name":"main schützen","target":"branch","enforcement":"active",
 "conditions":{"ref_name":{"include":["~DEFAULT_BRANCH"],"exclude":[]}},
 "rules":[{"type":"deletion"},{"type":"non_fast_forward"}]}
EOF
```

Dazu `.github/dependabot.yml` nur für npm (die Aktionen-Ökosystem-Zeile entfällt ohne Actions). Branch-Schutz **ohne** Pflicht-Reviews (Einzelprojekt). Private Repositories: Push Protection und Branch-Schutz können im Gratis-Tarif fehlen: der Person sagen.

### 14.3 Netlify

`netlify.toml` aus dem Referenzprojekt (Build `npm run ci`, Veröffentlichung `dist`, Node 24, `NPM_FLAGS = "--ignore-scripts"`). Schritt-für-Schritt-Anleitung für das Dashboard in `docs/EINRICHTUNG.md` (Repository verbinden, nur dieses Repository freigeben, Deploy Previews, optional Kontaktangaben, optional Passwortschutz). **Die Verbindung macht die Person selbst.**

Nach dem ersten Deploy: Header mit <https://securityheaders.com> und dem Mozilla Observatory prüfen, Lighthouse in Chrome (Performance, Barrierefreiheit, Best Practices).

---

## 15. Phasenplan mit Abnahmekriterien

Pro Phase: Offenlegung → Umsetzung → `npm run ci` + `npm run test:e2e` → Commit mit aussagekräftiger Nachricht → Push → Kurzbericht.

| Phase | Inhalt                                                                                                                                | Abnahme                                                                                             |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 1     | Gerüst, Repository, Header, Netlify-Konfiguration, ESLint-Regeln, erste Tests; Playwright-Browser (Hintergrund!)                      | `ci` grün, E2E auf **allen drei Geräten** (auch WebKit), Header-Tests, Repo-Schutz aktiv            |
| 2     | Datenmodell, Schema, Build-Prüfungen (5.3), Vokabelstamm ~300, `pruefen.md`                                                           | kaputter Eintrag bricht den Build (ausprobiert), Mehrdeutigkeitsprüfung aktiv                       |
| 3     | Lernlogik inkl. Abwechslung, Speicher, Migrationen, Sicherung, Rückfälle                                                              | Unit-Tests inkl. 20 Themen/Tag und 10 Tage ohne Wiederholung, Speichertests mit feindlichen Daten   |
| 4     | Design, vier Lernmodi, Tastatur/Sonderzeichen, Tab-Leiste, Maskottchen-Zeichnung, Toast                                               | Screenshots geprüft, Tastatur-Szenarien, Mindestgrößen                                              |
| 5     | Audio: Werkzeug, **Stimmenlizenzen prüfen, Hörproben an die Person**, Wahl, Erzeugung (7.4), Wiedergabe, Rückfall, Maskottchen-Stimme | Hörproben freigegeben, Aufnahmen vollständig und aktuell, Playwright-Test der Quelle und des Tempos |
| 6     | Aussprache-Guide/Alphabet, Einführung (9.4), Begrüßung, Lob, Einstellungen, Fortschritt, Sicherung, Datenschutz, Schriftgrößen        | Layoutprüfung je Stufe bei 360 px, Import-Angriffe abgelehnt, Datenschutzseite geprüft              |
| 7     | Vokabelausbau auf ≥ 1.000, Prüfliste, Aufnahmen für alles                                                                             | Build grün, jedes Thema ≥ 40 Einträge, Aufnahmen vollständig                                        |
| 8     | PWA/Offline, axe (WCAG 2.2 AA), Bundle-Prüfung, Security-Review, Abschlussbericht, README                                             | Offline-Test, axe ohne Befund, Audits ohne Befund, Bericht (Abschnitt 17)                           |

Maskottchen, Begrüßung und Lob **von Anfang an einplanen** (Phasen 4–6), nicht nachträglich anhängen.

---

## 16. Gelernte Fehler und Fallstricke (Pflichtlektüre)

Jede Zeile: Symptom → Ursache → **Gegenmaßnahme**.

### 16.1 Prozess und Werkzeuge

| Fehler                                                                                         | Gegenmaßnahme                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Eine genannte Referenzdatei (Prototyp) lag gar nicht im Ordner                                 | Zuerst `ls`; fehlt etwas Wesentliches, **sofort sagen** und gemeinsam klären                                                                                                                               |
| Annahmen über Versionen (TypeScript 7 war zu neu für `typescript-eslint`)                      | `npm view` auf Version **und Peer-Abhängigkeiten**, kompatible Versionen wählen                                                                                                                            |
| Push mit Workflow-Datei abgelehnt (Token ohne `workflow`-Zugriff); Person wollte kein Terminal | Kein GitHub Actions; Gate im Netlify-Build (14.1)                                                                                                                                                          |
| Playwright-Browser-Download brach bei ~200 KB/s ab (mehrfach, WebKit-Zeitüberschreitung)       | **Im Hintergrund starten**, nicht abbrechen; vollen Chromium-Kanal nutzen (`channel: 'chromium'`) statt Headless-Shell; Notfall: ZIP mit `curl -C -` laden, prüfen (`unzip -t`) und in den Cache entpacken |
| Textersetzung per Python lief nach Prettier-Formatierung ins Leere                             | `assert alt in text`; Edit-Werkzeug; Datei vorher neu lesen                                                                                                                                                |
| Die Freigabeprüfung der Werkzeuge fiel zeitweise aus (alle Terminal-Befehle abgelehnt)         | Nicht erzwingen: Dateien mit dem Edit-Werkzeug ändern, dann die Person den Befehl selbst im Terminal ausführen lassen; weiterarbeiten, sobald es wieder geht                                               |
| Beim Hinzufügen eines Parameters wurden **alle** Aufnahmen neu erzeugt                         | Hash-Design (7.5); vor dem Commit `git status` auf unerwartete Massenänderungen prüfen                                                                                                                     |
| Kurze Erfolgsmeldung vor dem Test („alles grün“) wäre falsch gewesen                           | Erst Ergebnis lesen, dann berichten                                                                                                                                                                        |

### 16.2 Sicherheit und Header

| Fehler                                                                                                                                 | Gegenmaßnahme                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| App startete auf **iPhone-Profilen nicht** (WebKit): `upgrade-insecure-requests` machte aus lokalen Skriptadressen `https://localhost` | Direktive weglassen; **immer auch WebKit testen** (Chromium nimmt `localhost` aus) |
| zod erzeugte Code per `new Function` → Konsolenfehler unter Trusted Types/CSP                                                          | `z.config({ jitless: true })`                                                      |
| `trusted-types 'none'` verbot die Service-Worker-Registrierung                                                                         | Benannte Policy `sw-registrierung`, die nur `/sw.js` zulässt                       |
| ESLint-Regel gegen `innerHTML` schlug auch bei Angriffs-Teststrings an                                                                 | Gezielte `eslint-disable-next-line` mit Begründung                                 |
| Kontaktdaten wären ins öffentliche Repository gelangt                                                                                  | Nur Umgebungsvariablen; Geheimnis-/Personendaten-Suche im Diff vor jedem Commit    |

### 16.3 Tests

| Fehler                                                                                                           | Gegenmaßnahme                                                                                          |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Tests liefen gegen einen **veralteten** Vorschau-Server                                                          | Eigener Port, immer frisch bauen, `reuseExistingServer: false`                                         |
| **Race Condition** in den Karteikarten: schnelle Tasten sahen den alten Zustand (nur 1 von 4 Läufen schlug fehl) | Rundenzustand **sofort** über eine Referenz aktualisieren; Test mehrfach wiederholen (`--repeat-each`) |
| Neuladen im Test, bevor IndexedDB geschrieben war                                                                | `expect.poll` auf den gespeicherten Zustand                                                            |
| Zu früh aufgenommene Screenshots zeigten halb eingeblendete Elemente                                             | Kurz warten; im Zweifel `getComputedStyle`/DOM prüfen                                                  |
| WebKit-Offline-Simulation und `reload()` mit Service Worker brachen ab                                           | Test-Grenze (13.4), Handtest                                                                           |
| `ref={cond ? ref : undefined}` fehlerhaft mit `exactOptionalPropertyTypes`                                       | `null` statt `undefined`                                                                               |
| Nicht-null-Zusicherungen (`!`) in Tests                                                                          | ESLint-Ausnahme nur für `tests/**`, im App-Code verboten                                               |
| Test erwartete feste Zahlen, die vom Datenbestand abhingen (Fortschritt je Thema)                                | Erwartung **aus den Daten berechnen**                                                                  |
| Button-Namen kollidierten (`Tipp` vs. `Tipp zeigt …`)                                                            | `exact: true`                                                                                          |
| Wartezeit für Audio-Rückfall zu knapp                                                                            | Auf beide Ereignisse warten (`expect.poll` auf die Anzahl)                                             |
| axe fand ein **unbeschriftetes Dateifeld** (Import)                                                              | `aria-label` am versteckten `<input type=file>`                                                        |

### 16.4 Oberfläche und Barrierefreiheit

| Fehler                                                                                   | Gegenmaßnahme                                                                               |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| macOS meldet `-apple-system-body` = 13 px → App um ein Viertel verkleinert               | Systemfaktor nur **vergrößernd** (> 17 px)                                                  |
| Stufe „Klein“ unterschritt 44/48 px Tippfläche                                           | Mindestgrößen unabhängig von der Schriftstufe (`max(…rem, …px)`)                            |
| Deutsche Komposita ragten bei „Sehr groß“ aus dem Bild                                   | `overflow-wrap: anywhere; hyphens: auto`, Test bei 150 %                                    |
| Tippen bei offener Tastatur: Aufgabe verschwand hinter der Tastatur (lange Sprichwörter) | Karte kompakt (Meta ausblenden, kleinere Schrift), Test im ungünstigsten Fall (640 px Höhe) |
| Tutorial: lange Texte schoben „Weiter“ aus dem Bild                                      | Kopf und Knöpfe fest, nur Inhalt scrollt (`tabIndex={0}` am Scrollbereich)                  |
| Safari/iOS erlaubt **keinen Ton ohne Antippen**                                          | Maskottchen als Knopf, kein Autoplay (9.1)                                                  |
| Lob-/Leer-Zustand-Text im alten Test fest verdrahtet, nachdem der Text zufällig wurde    | Test auf `data-testid` und Poolzugehörigkeit umstellen                                      |
| Dialoge: Escape und Fokus vergessen                                                      | Natives `<dialog>`, Escape = Überspringen, Fokus auf das erste sinnvolle Element            |

### 16.5 Daten

| Fehler                                                                                                     | Gegenmaßnahme                                                                                           |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Gleiche deutsche Übersetzung bei verschiedenen Einträgen (`der Tisch`, `das Eis`, `Hallo`)                 | Build-Prüfung auf Eindeutigkeit (5.3)                                                                   |
| Hinweisfelder enthielten Betonungszeichen und scheiterten am Schema                                        | Schema-Allowlist für Hinweise entsprechend erweitern                                                    |
| Unsichere Betonung/Übersetzung eingetragen                                                                 | Nur sichere Werte; Rest nach `data/pruefen.md`                                                          |
| Maskottchen-/Lob-Texte ohne Schema                                                                         | Eigene zod-Schemas und Build-Prüfung auch für diese Pools                                               |
| Nachtgruß „Доброй ночи“ (Abschiedsgruß) wurde als Begrüßung ausgeliefert und fiel erst beim Gegenlesen auf | Jeden Gruß auf Begrüßung/Abschied prüfen; Grüße der Pools von einer Muttersprachlerin gegenlesen lassen |

### 16.6 Audio

| Fehler                                                                                                     | Gegenmaßnahme                                                                           |
| ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Aussprache zweimal als „zu schnell“ gemeldet (Standard, dann `length_scale` 1,4); 1,2 brachte nur +9 %     | Von Anfang an 1,8 mit den Werten aus 7.4; **messen**, weil die Wirkung nicht linear ist |
| Stimme `irina` Lizenz unbekannt, `ruslan` nur nicht-kommerziell; Basismodell `lessac` mit Forschungslizenz | Lizenzprüfung vor der Wahl (7.2); Restrisiko dokumentieren                              |
| Opus-Probleme auf älteren iPhones                                                                          | MP3                                                                                     |
| Safari lädt Audio stückweise (Range) – im Service Worker nicht beantwortet                                 | Range-Antworten (206) im Service Worker                                                 |
| `playbackRate` ging beim Wechsel der Quelle verloren                                                       | `defaultPlaybackRate` setzen                                                            |
| Web-Speech-Stimmen können Text an Server senden                                                            | Nur `localService`-Stimmen                                                              |

### 16.7 PWA und Auslieferung

| Fehler                                  | Gegenmaßnahme                                                                                |
| --------------------------------------- | -------------------------------------------------------------------------------------------- |
| `vite-plugin-pwa` zöge ~230 Pakete nach | Eigener Service Worker (4.)                                                                  |
| Update-Ablauf unklar                    | Hinweis „Eine neue Version ist bereit“ + „Aktualisieren“; Test mit simulierter neuer Version |
| Icons ohne Bildwerkzeug                 | Aus SVG per lokalem Playwright rendern (`tools/icons`), inklusive maskable und Apple-Touch   |

### 16.8 Zusammenarbeit

| Beobachtung                                                                          | Konsequenz                                                                      |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Person will gepushte Stände und knappe Rückmeldungen                                 | Nach jeder Änderung testen, committen, pushen, in 5–10 Zeilen berichten         |
| Person wünscht Maskottchen, Lob, Begrüßung und Abwechslung erst **nach** der Abnahme | Von Anfang an einplanen (Phasen 4–6)                                            |
| Person prüft Hörproben und Bilder selbst                                             | Dateien schicken (Hörproben, Screenshots), Entscheidungen der Person überlassen |

### 16.9 Neue Lernpunkte sammeln

Am Ende **jedes** Projekts: neue Fehler und Erkenntnisse in `docs/LEKTIONEN.md` des Projekts festhalten (Symptom, Ursache, Gegenmaßnahme) und der Person vorschlagen, sie in diesen Baukasten zu übernehmen (Version erhöhen).

---

## 17. Abschlussbericht (Vorlage)

Kurz, in `docs/ABSCHLUSSBERICHT.md` und im Chat:

1. **Umfang** (Zahlen: Einträge, Aufnahmen und Größe, Tests, Pakete).
2. **Worauf die App zugreift** (Netzwerk, Speicher, Dateien, Sprachausgabe, System).
3. **Aktive Schutzschichten** (Header, Code, Eingaben, Datenverlust, Service Worker, Lieferkette, Build-Prüfungen, GitHub).
4. **Liste typischer Schwachstellen** (11.8), Punkt für Punkt.
5. **Bewusst offene Risiken** (Stimmlizenz, öffentliche Adresse, gelöschte Browserdaten, mehrere Tabs, Stimm- und Übersetzungsqualität, Test-Grenzen).
6. **Was die Person selbst tun muss:** Netlify verbinden, Header und Lighthouse prüfen, Handtest (Anhang D), `data/pruefen.md` prüfen lassen, Dependabot beobachten, Sicherungen empfehlen.

---

## Anhang A: `CLAUDE.md` für das neue Projekt (kurz halten)

Lege diese Datei im Projektordner an. Sie wird von Claude Code **automatisch geladen**. Importiere den Baukasten **nicht** per `@`, das würde jede Sitzung mit rund 60 KB füllen. Verweise stattdessen auf Abschnitte.

```markdown
# <App-Name> – Projektregeln

- Sprache: Deutsch (Gespräch, Kommentare, UI, Doku). Zielsprache: <…>. Maskottchen: <Name>.
- Spezifikation: `SPRACH-APP-BAUKASTEN.md`. Lies bei Bedarf gezielt: Abschnitt 6 (Lernlogik),
  7 (Audio), 11 (Sicherheit), 16 (Fallstricke). Referenzprojekt: Titus753/Russisch-Tutor.
- Befehle: `npm run ci` (Lint, Typecheck, Tests, Audit, Build), `npm run test:e2e`,
  `tools/audio/audio.sh erzeugen` (nur Geändertes).
- Vor jedem Commit: `ci` und E2E grün, Geheimnis-Suche im Diff, dann Push (kein GitHub Actions).
- Nie: eval/innerHTML, Fremdanfragen zur Laufzeit, Geheimnisse, Personendaten im Repository.
- Neue Fehler und Erkenntnisse sofort in `docs/LEKTIONEN.md` eintragen.
```

## Anhang B: Beispiel-Startprompts

- Minimal: „Lies SPRACH-APP-BAUKASTEN.md und baue die App für Französisch.“
- Mit Maskottchen: „… für Englisch (britisch). Maskottchen: Fuchs ‚Rufus‘ mit Schiebermütze, Bild `rufus.png`, Stimme eher hell und flott.“
- Mit Vorgaben: „… für Portugiesisch (brasilianisch), Farbthema Azulejo-Blau/Grün, privates Angebot für Freunde, Repository öffentlich, Konto `<name>`.“
- Fortsetzen nach Pause: „Lies `CLAUDE.md` und `docs/ABSCHLUSSBERICHT.md`, mache bei Phase <n> weiter.“

## Anhang C: Maskottchen-Brief (Vorlage zum Ausfüllen)

| Frage                                     | Antwort |
| ----------------------------------------- | ------- |
| Name                                      |         |
| Figur/Tier und Charakter                  |         |
| Aussehen (Bild beilegen oder beschreiben) |         |
| Zubehör/Kleidung in den App-Farben        |         |
| Stimme: tief/hell, langsam/flott          |         |
| Typische Begrüßung in der Zielsprache     |         |
| Wichtig/Tabu                              |         |

Hinweis: Bilder mit Hintergrund müssen freigestellt werden (transparent). Urheberrecht des Bildes klären (eigene Zeichnung, Erlaubnis oder freie Lizenz).

## Anhang D: Handtest am Telefon (iPhone **und** Android)

1. App über „Zum Home-Bildschirm“ installieren, öffnen, einmal alle Tabs besuchen.
2. **Flugmodus an:** App neu öffnen. Karten, Quiz, Tippen und Hören inklusive Aufnahmen müssen funktionieren.
3. iPhone mit **Lautlos-Schalter:** Ist „Anhören“ zu hören?
4. „Langsam“: Ist es langsamer, bleibt die Tonhöhe gleich?
5. **Maskottchen antippen:** Spricht es, auch nach dem ersten Mal?
6. Tippen mit App-/Systemtastatur und Sonderzeichen-Leiste: Bleiben Aufgabe, Feld und „Prüfen“ sichtbar?
7. Schrift auf „Sehr groß“ und Systemschriftgröße: nichts abgeschnitten?
8. Sicherung speichern, Fortschritt löschen, Sicherung importieren.
9. Bluetooth-Kopfhörer: Wird der Wortanfang abgeschnitten?
10. Nach einem Update: Erscheint „Eine neue Version ist bereit“, und lädt „Aktualisieren“ die neuen Aufnahmen?

## Anhang E: Änderungsprotokoll des Baukastens

| Version | Datum      | Änderung                                                                                                                                                                 |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1.0     | 2026-10-01 | Erste Fassung, abgeleitet aus dem Projekt „Слово за слово“ (Russisch): 8 Phasen, Abwechslungsalgorithmus, Maskottchen, Lizenztabelle der Piper-Stimmen, Fallstrick-Liste |
