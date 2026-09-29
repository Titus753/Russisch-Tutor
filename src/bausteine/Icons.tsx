// Einfache Linien-Icons (dekorativ, für Screenreader ausgeblendet).
import type { JSX } from 'preact';

function Icon({ children }: { children: JSX.Element | JSX.Element[] }) {
  return (
    <svg
      class="icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      {children}
    </svg>
  );
}

export const IconKarten = () => (
  <Icon>
    <rect x="3" y="6" width="14" height="14" rx="2.5" />
    <path d="M7 3h11.5A2.5 2.5 0 0 1 21 5.5V17" />
  </Icon>
);
export const IconQuiz = () => (
  <Icon>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.4" />
    <path d="M12 17h.01" />
  </Icon>
);
export const IconTippen = () => (
  <Icon>
    <rect x="2.5" y="6" width="19" height="12" rx="2.5" />
    <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
  </Icon>
);
export const IconHoeren = () => (
  <Icon>
    <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
    <rect x="3" y="14" width="4" height="6" rx="1.5" />
    <rect x="17" y="14" width="4" height="6" rx="1.5" />
  </Icon>
);
export const IconMehr = () => (
  <Icon>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icon>
);
export const IconLautsprecher = () => (
  <Icon>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
    <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" />
  </Icon>
);
export const IconLoeschen = () => (
  <Icon>
    <path d="M9 6h11v12H9l-6-6z" />
    <path d="M12.5 9.5l5 5M17.5 9.5l-5 5" />
  </Icon>
);
export const IconRunter = () => (
  <Icon>
    <path d="M6 9l6 6 6-6" />
  </Icon>
);
