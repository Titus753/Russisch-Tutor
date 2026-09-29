# Lizenzen und Herkunft

## App-Code

MIT-Lizenz, siehe [LICENSE](../LICENSE).

## Vokabeln

Eigene Zusammenstellung dieses Projekts, lizenziert wie der Code (MIT).
Sprichwörter und Redewendungen sind gemeinfreies Sprachgut.

## Aussprache-Dateien (`public/audio/`)

Die MP3-Dateien wurden lokal mit **Piper** und der Stimme **ru_RU-dmitri-medium** bzw.
**ru_RU-denis-medium** erzeugt (Auswahl siehe `data/audio-manifest.json`).

| Bestandteil                  | Herkunft                                                                               | Lizenz                                          |
| ---------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Stimmmodell                  | [rhasspy/piper-voices](https://huggingface.co/rhasspy/piper-voices), Commit `c10ece1a` | Repository: MIT                                 |
| Sprachdaten dmitri/denis     | [OHF-Voice/voice-datasets](https://github.com/OHF-Voice/voice-datasets)                | CC0                                             |
| Basismodell (Feinabstimmung) | en_US-lessac-medium, Datensatz Blizzard 2013 (Lessac Technologies)                     | Forschungslizenz                                |
| Piper (Werkzeug)             | [OHF-Voice/piper1-gpl](https://github.com/OHF-voice/piper1-gpl)                        | GPL-3.0, nur lokal genutzt, nicht Teil der App  |
| lameenc (MP3-Encoder)        | [chrisstaite/lameenc](https://github.com/chrisstaite/lameenc)                          | LGPL-3.0, nur lokal genutzt, nicht Teil der App |

**Bewusst ausgeschlossen:** `ru_RU-irina` (Datenlizenz unbekannt) und `ru_RU-ruslan`
(CC BY-NC-SA 4.0, nicht kommerziell).

**Offenes Restrisiko:** Die russischen Piper-Stimmen sind aus der englischen Stimme „lessac"
weitertrainiert, deren Trainingsdaten unter einer Forschungslizenz stehen. Ob sich diese
Einschränkung auf weitertrainierte Modelle und damit erzeugte Audiodateien überträgt, ist
rechtlich nicht geklärt. Die App ist kostenlos und nicht kommerziell. Soll sie kommerziell
genutzt werden, vorher rechtlich prüfen lassen oder die Stimme wechseln
(`tools/audio/audio.sh erzeugen --stimme …` erzeugt alle Dateien neu).

Die Werkzeuge (Piper, lameenc, eSpeak NG) werden nicht mit der App ausgeliefert. Die erzeugten
Audiodateien enthalten keinen Programmcode dieser Werkzeuge.
