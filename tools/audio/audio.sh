#!/bin/sh
# Einstieg für das Audio-Werkzeug. Alles bleibt im Ordner tools/audio (Python, Pakete, Modelle).
#   tools/audio/audio.sh stimmen          Stimmmodelle laden und prüfen
#   tools/audio/audio.sh proben           Hörproben aller Stimmen erzeugen
#   tools/audio/audio.sh erzeugen         Aussprache-Dateien erzeugen (nur fehlende/geänderte)
set -eu
HIER=$(cd "$(dirname "$0")" && pwd)
export UV_PYTHON_INSTALL_DIR="$HIER/.python" UV_CACHE_DIR="$HIER/.cache" UV_PYTHON_PREFERENCE=only-managed UV_NO_CONFIG=1
UV="$HIER/bin/uv"
[ -x "$UV" ] || { echo "uv fehlt: siehe tools/audio/README.md" >&2; exit 1; }
case "${1:-}" in
  stimmen) shift; exec "$UV" run --locked --project "$HIER" python "$HIER/lade_stimmen.py" "$@" ;;
  proben|erzeugen) exec "$UV" run --locked --project "$HIER" python "$HIER/erzeuge_audio.py" "$@" ;;
  *) echo "Aufruf: $0 stimmen|proben|erzeugen" >&2; exit 2 ;;
esac
