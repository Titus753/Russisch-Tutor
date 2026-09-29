import { IconLoeschen, IconRunter } from './Icons.tsx';

const REIHEN = [
  ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х', 'ъ'],
  ['ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'э'],
  ['я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю'],
];

/** Verhindert, dass ein Tastendruck den Fokus aus dem Eingabefeld nimmt. */
const fokusBehalten = (e: Event) => e.preventDefault();

/** App-eigene kyrillische Tastatur (ЙЦУКЕН). Tasten mind. 3 rem (48 px) hoch. */
export function Tastatur({
  onZeichen,
  onLoeschen,
  onAusblenden,
}: {
  onZeichen: (zeichen: string) => void;
  onLoeschen: () => void;
  onAusblenden: () => void;
}) {
  const taste = (zeichen: string, label?: string) => (
    <button
      key={zeichen}
      type="button"
      class="taste"
      lang="ru"
      aria-label={label}
      onPointerDown={fokusBehalten}
      onMouseDown={fokusBehalten}
      onClick={() => onZeichen(zeichen)}
    >
      {zeichen === ' ' ? 'Пробел' : zeichen}
    </button>
  );
  return (
    <div class="tastatur" role="group" aria-label="Russische Tastatur">
      {REIHEN.map((reihe, i) => (
        <div class="tastatur__reihe" key={i}>
          {reihe.map((z) => taste(z))}
          {i === 2 && (
            <button
              type="button"
              class="taste taste--breit"
              aria-label="Löschen"
              onPointerDown={fokusBehalten}
              onMouseDown={fokusBehalten}
              onClick={onLoeschen}
            >
              <IconLoeschen />
            </button>
          )}
        </div>
      ))}
      <div class="tastatur__reihe">
        <button
          type="button"
          class="taste taste--breit"
          aria-label="Tastatur ausblenden"
          onPointerDown={fokusBehalten}
          onMouseDown={fokusBehalten}
          onClick={onAusblenden}
        >
          <IconRunter />
        </button>
        {taste('ё')}
        {taste(',', 'Komma')}
        <span class="taste--leer">{taste(' ', 'Leerzeichen')}</span>
        {taste('?', 'Fragezeichen')}
      </div>
    </div>
  );
}
