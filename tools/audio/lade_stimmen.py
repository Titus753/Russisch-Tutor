"""Lädt die Piper-Stimmen für die Aussprache-Dateien – nur vom fest gepinnten Stand,
jede Datei per SHA-256 geprüft. Bei einer Abweichung wird nichts gespeichert.

Aufruf (aus dem Projektordner):  tools/audio/audio.sh stimmen
Netzwerk: ausschließlich https://huggingface.co (Repository rhasspy/piper-voices).
Schreibt nur nach tools/audio/modelle/.
"""

from __future__ import annotations

import hashlib
import sys
import tempfile
import urllib.request
from pathlib import Path

# Fester Commit des Repositorys rhasspy/piper-voices (MIT) – nie „main" verwenden.
REVISION = "c10ece1aade47bb51c153c893d14e5bf8e5b7117"
BASIS = f"https://huggingface.co/rhasspy/piper-voices/resolve/{REVISION}/ru/ru_RU"
ZIEL = Path(__file__).resolve().parent / "modelle"

# Nur Stimmen mit geprüfter Datenlizenz (CC0). irina (Lizenz unbekannt) und ruslan
# (CC BY-NC-SA) sind bewusst ausgeschlossen – siehe docs/LIZENZEN.md.
DATEIEN: dict[str, dict[str, str]] = {
    "dmitri": {
        "ru_RU-dmitri-medium.onnx": "f073356ebc4bd0f80c5af58df2953a5988bd5bdab1eb38635ce960b071fbefcb",
        "ru_RU-dmitri-medium.onnx.json": "667ef3117bc642c2892dff7690d8bdc8ca4228aeaa783b2dc1416df632855e0d",
        "MODEL_CARD": "6d59c756776d57860232cea6484e1b2ea1fc1c8d2c3446ef246f706fd9875821",
    },
    "denis": {
        "ru_RU-denis-medium.onnx": "15fab56e11a097858ee115545d0f697fc2a316c41a291a5362349fb870411b0a",
        "ru_RU-denis-medium.onnx.json": "831c860dac0b5073eaa81610a0a638ec23d90a6cf8e5f871b4485c2cec3767c8",
        "MODEL_CARD": "8b5d685dd80f8ad3f8dbbe1c56b16bb0809f00c144af3642dbcf3b707eb89c12",
    },
}

MAX_GROESSE = 100 * 1024 * 1024  # Schutz vor unerwartet großen Antworten


def sha256(pfad: Path) -> str:
    h = hashlib.sha256()
    with pfad.open("rb") as f:
        for block in iter(lambda: f.read(1 << 20), b""):
            h.update(block)
    return h.hexdigest()


def lade(stimme: str, name: str, erwartet: str) -> None:
    ziel = ZIEL / stimme / name
    if ziel.exists() and sha256(ziel) == erwartet:
        print(f"  vorhanden und geprüft: {stimme}/{name}")
        return
    ziel.parent.mkdir(parents=True, exist_ok=True)
    url = f"{BASIS}/{stimme}/medium/{name}"
    print(f"  lade {stimme}/{name} …", flush=True)
    # Erst in eine temporäre Datei im Zielordner, prüfen, dann atomar umbenennen
    with tempfile.NamedTemporaryFile(dir=ziel.parent, delete=False) as tmp:
        tmp_pfad = Path(tmp.name)
        try:
            with urllib.request.urlopen(url, timeout=120) as antwort:  # noqa: S310 (feste https-URL)
                gelesen = 0
                while block := antwort.read(1 << 20):
                    gelesen += len(block)
                    if gelesen > MAX_GROESSE:
                        raise RuntimeError("Datei größer als erwartet – abgebrochen")
                    tmp.write(block)
            tmp.flush()
        except BaseException:
            tmp_pfad.unlink(missing_ok=True)
            raise
    tatsaechlich = sha256(tmp_pfad)
    if tatsaechlich != erwartet:
        tmp_pfad.unlink(missing_ok=True)
        raise RuntimeError(f"Prüfsumme falsch für {stimme}/{name}: {tatsaechlich}")
    tmp_pfad.replace(ziel)
    print(f"  geprüft: {stimme}/{name}")


def main(stimmen: list[str]) -> int:
    for stimme in stimmen or list(DATEIEN):
        if stimme not in DATEIEN:
            print(f"Unbekannte Stimme: {stimme}", file=sys.stderr)
            return 2
        for name, erwartet in DATEIEN[stimme].items():
            lade(stimme, name, erwartet)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
