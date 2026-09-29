"""Erzeugt die Aussprache-Dateien (MP3) mit Piper – vollständig offline.

  tools/audio/audio.sh erzeugen [--stimme dmitri]   nur fehlende/geänderte Dateien neu
  tools/audio/audio.sh proben                       Hörproben aller geladenen Stimmen

Liest:     data/vokabeln/*.json, data/alphabet.json (falls vorhanden), tools/audio/modelle/
Schreibt:  public/audio/<id>.mp3, data/audio-manifest.json, tools/audio/proben/
Kein Netzwerk, keine Shell-Aufrufe. Texte gehen nur als Python-Strings an Piper.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path

import lameenc
import numpy as np
from piper import PiperVoice, SynthesisConfig

WURZEL = Path(__file__).resolve().parents[2]
MODELLE = Path(__file__).resolve().parent / "modelle"
PROBEN = Path(__file__).resolve().parent / "proben"
AUSGABE = WURZEL / "public" / "audio"
MANIFEST = WURZEL / "data" / "audio-manifest.json"

# Bei Änderungen an Klang oder Verfahren erhöhen – dann wird alles neu erzeugt.
VERFAHREN = 1
BITRATE_KBPS = 40
STILLE_VORNE_S = 0.12
STILLE_HINTEN_S = 0.2
STILLE_ZWISCHEN_S = 0.35

# Strenge Allowlists: IDs werden zu Dateinamen, also nie Pfadzeichen zulassen.
ID_MUSTER = re.compile(r"^[a-z]{3}-\d{3,4}$")
TEXT_MUSTER = re.compile(r"^[А-Яа-яЁё0-9 .,!?:;«»()\-–—…\"'́/]{1,300}$")
STIMMEN = ("dmitri", "denis")


@dataclass(frozen=True)
class Aufgabe:
    id: str
    text: str


def sprechtext(eintrag: dict) -> str:
    """Was gesprochen wird: bei Genusvarianten beide Formen, sonst mit Betonungszeichen."""
    genus = eintrag.get("genusvarianten")
    if genus:
        return f"{genus['m']} {genus['w']}"
    return eintrag.get("betonung") or eintrag["russisch"]


def lade_aufgaben() -> list[Aufgabe]:
    aufgaben: list[Aufgabe] = []
    quellen = sorted((WURZEL / "data" / "vokabeln").glob("*.json"))
    alphabet = WURZEL / "data" / "alphabet.json"
    for datei in quellen:
        for e in json.loads(datei.read_text("utf-8")):
            aufgaben.append(Aufgabe(e["id"], sprechtext(e)))
    if alphabet.exists():
        for e in json.loads(alphabet.read_text("utf-8")):
            aufgaben.append(Aufgabe(e["id"], e["sprechtext"]))
    for a in aufgaben:
        if not ID_MUSTER.match(a.id):
            raise ValueError(f"Unzulässige ID: {a.id!r}")
        if not TEXT_MUSTER.match(a.text):
            raise ValueError(f"Unzulässiger Text bei {a.id}: {a.text!r}")
    ids = [a.id for a in aufgaben]
    if len(ids) != len(set(ids)):
        raise ValueError("Doppelte IDs in den Daten")
    return aufgaben


def sha256_datei(pfad: Path) -> str:
    return hashlib.sha256(pfad.read_bytes()).hexdigest()


def lade_stimme(stimme: str) -> tuple[PiperVoice, str]:
    modell = MODELLE / stimme / f"ru_RU-{stimme}-medium.onnx"
    if not modell.exists():
        raise SystemExit(f"Stimme {stimme} fehlt – zuerst: tools/audio/audio.sh stimmen")
    return PiperVoice.load(modell), sha256_datei(modell)


def synthese(voice: PiperVoice, text: str) -> bytes:
    """Text → MP3 (mono). Sätze werden mit kurzer Pause aneinandergehängt."""
    stuecke = list(voice.synthesize(text, SynthesisConfig(normalize_audio=True)))
    if not stuecke:
        raise RuntimeError(f"Keine Audiodaten für {text!r}")
    rate = stuecke[0].sample_rate
    stille = lambda s: np.zeros(int(rate * s), dtype=np.float32)  # noqa: E731
    teile = [stille(STILLE_VORNE_S)]
    for i, s in enumerate(stuecke):
        if i > 0:
            teile.append(stille(STILLE_ZWISCHEN_S))
        teile.append(s.audio_float_array.astype(np.float32))
    teile.append(stille(STILLE_HINTEN_S))
    pcm = (np.clip(np.concatenate(teile), -1.0, 1.0) * 32767).astype("<i2").tobytes()

    enc = lameenc.Encoder()
    enc.set_bit_rate(BITRATE_KBPS)
    enc.set_in_sample_rate(rate)
    enc.set_channels(1)
    enc.set_quality(2)
    return bytes(enc.encode(pcm) + enc.flush())


def schreibe_atomar(ziel: Path, daten: bytes) -> None:
    ziel.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=ziel.parent, delete=False, suffix=".tmp") as tmp:
        tmp.write(daten)
        tmp.flush()
    Path(tmp.name).replace(ziel)


def aufgaben_hash(stimme: str, modell_sha: str, text: str) -> str:
    schluessel = json.dumps(
        {"verfahren": VERFAHREN, "stimme": stimme, "modell": modell_sha, "text": text,
         "kbps": BITRATE_KBPS},
        ensure_ascii=False, sort_keys=True,
    )
    return hashlib.sha256(schluessel.encode("utf-8")).hexdigest()[:16]


def erzeugen(stimme_wahl: str | None) -> int:
    manifest = json.loads(MANIFEST.read_text("utf-8")) if MANIFEST.exists() else {}
    stimme = stimme_wahl or manifest.get("stimme")
    if stimme not in STIMMEN:
        print(f"Bitte Stimme wählen: --stimme {' | '.join(STIMMEN)}", file=sys.stderr)
        return 2
    aufgaben = lade_aufgaben()
    voice, modell_sha = lade_stimme(stimme)
    alt = manifest.get("dateien", {}) if manifest.get("stimme") == stimme else {}
    neu: dict[str, dict[str, str]] = {}
    erzeugt = 0
    for a in aufgaben:
        h = aufgaben_hash(stimme, modell_sha, a.text)
        ziel = AUSGABE / f"{a.id}.mp3"
        if alt.get(a.id, {}).get("hash") == h and ziel.exists():
            neu[a.id] = alt[a.id]
            continue
        schreibe_atomar(ziel, synthese(voice, a.text))
        neu[a.id] = {"hash": h, "text": a.text}
        erzeugt += 1
        if erzeugt % 25 == 0:
            print(f"  {erzeugt} erzeugt …", flush=True)

    # Verwaiste Dateien entfernen (nur eigene, streng benannte MP3s)
    entfernt = 0
    for datei in AUSGABE.glob("*.mp3"):
        if ID_MUSTER.match(datei.stem) and datei.stem not in neu:
            datei.unlink()
            entfernt += 1

    manifest = {
        "hinweis": "Automatisch erzeugt von tools/audio/erzeuge_audio.py – nicht von Hand ändern.",
        "stimme": stimme,
        "modell_sha256": modell_sha,
        "verfahren": VERFAHREN,
        "dateien": dict(sorted(neu.items())),
    }
    schreibe_atomar(MANIFEST, (json.dumps(manifest, ensure_ascii=False, indent=2) + "\n").encode())
    groesse = sum(f.stat().st_size for f in AUSGABE.glob("*.mp3"))
    print(f"Fertig: {erzeugt} neu, {len(neu) - erzeugt} unverändert, {entfernt} entfernt, "
          f"{groesse / 1_000_000:.1f} MB gesamt.")
    return 0


PROBETEXT = (
    "Здра́вствуйте! Меня зовут Анна. Ско́лько это сто́ит? "
    "Молоко́. Спаси́бо, всего доброго!"
)


def proben() -> int:
    for stimme in STIMMEN:
        if not (MODELLE / stimme).exists():
            continue
        voice, _ = lade_stimme(stimme)
        schreibe_atomar(PROBEN / f"probe-{stimme}.mp3", synthese(voice, PROBETEXT))
        # Betonungstest: gleiche Schreibung, unterschiedliche Betonung
        print(stimme, "Phoneme за́мок:", voice.phonemize("за́мок"), "замо́к:", voice.phonemize("замо́к"))
        print(f"Probe: {PROBEN / f'probe-{stimme}.mp3'}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("modus", choices=["erzeugen", "proben"])
    parser.add_argument("--stimme", choices=STIMMEN)
    args = parser.parse_args()
    return proben() if args.modus == "proben" else erzeugen(args.stimme)


if __name__ == "__main__":
    sys.exit(main())
