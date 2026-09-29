# Audio-Werkzeug

Erzeugt die Aussprache-Dateien `public/audio/<id>.mp3` lokal und offline mit Piper.
Nur nötig, wenn sich Vokabeln ändern. Alles bleibt in diesem Ordner, es gibt keine
systemweite Installation.

## Einmalig einrichten

1. `uv` laden und prüfen (Prüfsumme aus demselben GitHub-Release):

   ```sh
   cd tools/audio && mkdir -p bin && cd bin
   T=$(curl -sI https://github.com/astral-sh/uv/releases/latest | sed -n 's#^location: .*/tag/\(.*\)\r#\1#p')
   A=uv-aarch64-apple-darwin.tar.gz
   curl -sSLfO "https://github.com/astral-sh/uv/releases/download/$T/$A"
   curl -sSLfO "https://github.com/astral-sh/uv/releases/download/$T/$A.sha256"
   shasum -a 256 -c $A.sha256 && tar -xzf $A --strip-components=1 && rm $A $A.sha256
   ```

2. Stimmen laden (fest gepinnter Stand, SHA-256-geprüft): `tools/audio/audio.sh stimmen`

Python 3.12 und die Pakete installiert `uv` beim ersten Aufruf nach `tools/audio/.python`
bzw. `.venv`, exakt nach `uv.lock` (mit Prüfsummen).

## Benutzen

```sh
tools/audio/audio.sh proben                    # Hörproben nach tools/audio/proben/
tools/audio/audio.sh erzeugen --stimme dmitri  # erstes Mal: Stimme festlegen
tools/audio/audio.sh erzeugen                  # danach: nur fehlende/geänderte Dateien
```

Das Manifest `data/audio-manifest.json` merkt sich pro Eintrag einen Hash aus Stimme, Modell,
Text und Verfahren. Ein Test prüft, dass zu jedem Eintrag eine aktuelle Datei existiert.

## Sicherheit

- Pakete gepinnt mit Prüfsummen (`uv.lock`), Prüfung auf bekannte Schwachstellen:
  `bin/uvx --from pip-audit pip-audit -r <(bin/uv export --locked --format requirements-txt --no-emit-project)`
- Das Erzeugungsskript nutzt kein Netzwerk und keine Shell. IDs und Texte werden per Allowlist
  geprüft, Dateien atomar geschrieben.
- Lizenzen: siehe [docs/LIZENZEN.md](../../docs/LIZENZEN.md).
