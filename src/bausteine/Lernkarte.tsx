import type { ComponentChildren } from 'preact';
import type { Eintrag } from '../daten/schema.ts';
import { themaName, typName } from '../app/anzeige.ts';

/** Die Lernkarte mit doppeltem Porzellanrand: Thema/Inhaltsart oben, darunter der Inhalt. */
export function Lernkarte({
  eintrag,
  children,
}: {
  eintrag: Eintrag;
  children: ComponentChildren;
}) {
  return (
    <article class="karte">
      <p class="karte__meta">
        <span>{themaName(eintrag)}</span> · <span class="karte__typ">{typName(eintrag)}</span>
      </p>
      {children}
    </article>
  );
}

/** Russischer oder deutscher Text in passender Größe (Wörter groß, Sätze kleiner). */
export function KartenText({
  text,
  russisch,
  eintrag,
  gross = true,
}: {
  text: string;
  russisch: boolean;
  eintrag: Eintrag;
  gross?: boolean;
}) {
  const klasse = [
    'kartentext',
    russisch ? 'kartentext--ru' : 'kartentext--de',
    eintrag.typ === 'wort' ? 'kartentext--wort' : 'kartentext--satz',
    gross ? '' : 'kartentext--antwort',
  ].join(' ');
  return (
    <p class={klasse} lang={russisch ? 'ru' : 'de'}>
      {text}
    </p>
  );
}
