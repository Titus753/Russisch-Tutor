/**
 * Mischa, der Bär: schlichte Vektorzeichnung mit kobaltblauem Wollschal (Gzhel-Farben).
 * Nur Präsentationsattribute, keine style-Attribute (CSP-konform).
 */
export function Baer({ groesse = 9 }: { groesse?: number }) {
  return (
    <svg
      class="baer"
      viewBox="0 0 200 200"
      width={`${groesse}rem`}
      height={`${groesse}rem`}
      role="img"
      aria-label="Mischa, der Bär, mit blauem Wollschal"
    >
      {/* Körper */}
      <ellipse cx="100" cy="168" rx="62" ry="40" fill="#8B5A3C" />
      <ellipse cx="100" cy="176" rx="36" ry="24" fill="#D9B08C" />
      {/* Ohren */}
      <circle cx="52" cy="44" r="22" fill="#8B5A3C" />
      <circle cx="52" cy="44" r="11" fill="#D9B08C" />
      <circle cx="148" cy="44" r="22" fill="#8B5A3C" />
      <circle cx="148" cy="44" r="11" fill="#D9B08C" />
      {/* Kopf */}
      <circle cx="100" cy="86" r="56" fill="#9C6644" />
      {/* Schnauze */}
      <ellipse cx="100" cy="104" rx="27" ry="21" fill="#E6C29D" />
      <ellipse cx="100" cy="94" rx="10" ry="7" fill="#3B2418" />
      <path
        d="M100 101 v7 M90 111 q10 8 20 0"
        stroke="#3B2418"
        stroke-width="3"
        fill="none"
        stroke-linecap="round"
      />
      {/* Augen mit Glanzpunkt */}
      <circle cx="78" cy="76" r="6" fill="#3B2418" />
      <circle cx="80" cy="74" r="2" fill="#FFFFFF" />
      <circle cx="122" cy="76" r="6" fill="#3B2418" />
      <circle cx="124" cy="74" r="2" fill="#FFFFFF" />
      {/* Wangen */}
      <circle cx="66" cy="100" r="7" fill="#E8A0A0" opacity="0.55" />
      <circle cx="134" cy="100" r="7" fill="#E8A0A0" opacity="0.55" />
      {/* Wollschal */}
      <path d="M52 136 q48 22 96 0 l4 16 q-52 24 -104 0 z" fill="#1C3F9C" />
      <path d="M120 146 l10 40 l-18 4 l-6 -40 z" fill="#1C3F9C" />
      <path
        d="M62 142 l6 10 M82 148 l4 10 M104 150 l0 10 M126 146 l-4 10"
        stroke="#FFFFFF"
        stroke-width="3"
        stroke-linecap="round"
      />
      <path
        d="M114 162 l14 -3 M117 174 l14 -3"
        stroke="#FFFFFF"
        stroke-width="3"
        stroke-linecap="round"
      />
    </svg>
  );
}
