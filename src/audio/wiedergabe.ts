/**
 * Aussprache: vorab erzeugte MP3-Dateien über HTMLAudioElement (spielt auf dem iPhone auch im
 * Lautlos-Modus). Nur wenn eine Datei fehlt oder nicht abspielbar ist, Rückfall auf die
 * Sprachausgabe des Geräts – ausschließlich mit lokalen Stimmen (localService), damit kein
 * Text das Gerät verlässt.
 */
export type Abspielergebnis = 'ok' | 'keine-stimme';

/** Tempo für „Langsam" (Tonhöhe bleibt erhalten). */
export const LANGSAM = 0.8;

export interface Sprechbar {
  russisch: string;
  /** Dateiname in /audio/, vom Build geprüft (Format „abc-001.mp3"). */
  audio?: string | undefined;
}

const AUDIO_NAME = /^[a-z]{3}-\d{3,4}\.mp3$/;
let element: HTMLAudioElement | null = null;

/** Spielt die Aufnahme ab; ohne Aufnahme oder bei Fehler über die Gerätestimme. */
export async function spiele(ziel: Sprechbar, langsam = false): Promise<Abspielergebnis> {
  if (ziel.audio && AUDIO_NAME.test(ziel.audio) && typeof Audio !== 'undefined') {
    try {
      globalThis.speechSynthesis?.cancel();
      element ??= new Audio();
      element.pause();
      // defaultPlaybackRate überlebt das Laden einer neuen Quelle, playbackRate nicht
      element.defaultPlaybackRate = langsam ? LANGSAM : 1;
      element.playbackRate = element.defaultPlaybackRate;
      element.preservesPitch = true;
      element.src = `/audio/${ziel.audio}`;
      await element.play();
      return 'ok';
    } catch {
      // Datei fehlt, ist beschädigt oder nicht abspielbar: Gerätestimme versuchen
    }
  }
  return sprich(ziel.russisch, langsam);
}

let stimme: SpeechSynthesisVoice | null | undefined;

function russischeLokaleStimme(): SpeechSynthesisVoice | null {
  const stimmen = globalThis.speechSynthesis?.getVoices() ?? [];
  const russisch = stimmen.filter((v) => v.lang.toLowerCase().startsWith('ru') && v.localService);
  return russisch.find((v) => v.default) ?? russisch[0] ?? null;
}

async function findeStimme(): Promise<SpeechSynthesisVoice | null> {
  if (stimme !== undefined) return stimme;
  if (!globalThis.speechSynthesis) return (stimme = null);
  const sofort = russischeLokaleStimme();
  if (sofort) return (stimme = sofort);
  // Manche Browser laden die Stimmenliste verzögert
  await new Promise<void>((fertig) => {
    const ende = setTimeout(fertig, 1500);
    speechSynthesis.addEventListener(
      'voiceschanged',
      () => {
        clearTimeout(ende);
        fertig();
      },
      { once: true },
    );
  });
  return (stimme = russischeLokaleStimme());
}

async function sprich(text: string, langsam = false): Promise<Abspielergebnis> {
  const s = await findeStimme();
  if (!s) return 'keine-stimme';
  speechSynthesis.cancel();
  const aeusserung = new SpeechSynthesisUtterance(text);
  aeusserung.voice = s;
  aeusserung.lang = s.lang;
  aeusserung.rate = langsam ? 0.6 : 0.9;
  speechSynthesis.speak(aeusserung);
  return 'ok';
}
