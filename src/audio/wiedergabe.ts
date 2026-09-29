/**
 * Aussprache. Bis Phase 5 (vorab erzeugte Aufnahmen) nur über die Sprachausgabe des Geräts –
 * ausschließlich mit lokalen Stimmen (localService), damit kein Text das Gerät verlässt.
 */
export type Abspielergebnis = 'ok' | 'keine-stimme';

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

export async function sprich(text: string, langsam = false): Promise<Abspielergebnis> {
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
