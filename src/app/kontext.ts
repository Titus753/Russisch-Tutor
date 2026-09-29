import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import type { Stand } from '../speicher/schema.ts';
import type { Ablage } from '../speicher/speicher.ts';

export interface AppKontext {
  stand: Stand;
  /** Ändert den Lernstand und speichert ihn. */
  aendere: (aenderung: (stand: Stand) => Stand) => void;
  zeigeHinweis: (text: string) => void;
  /** Blendet die Tab-Leiste aus, solange getippt wird. */
  setTippt: (tippt: boolean) => void;
  starteTutorial: () => void;
  /** Für interne Sicherungen (vor Import/Löschen). */
  ablage: Ablage;
}

export const Kontext = createContext<AppKontext | null>(null);

export function useApp(): AppKontext {
  const kontext = useContext(Kontext);
  if (!kontext) throw new Error('App-Kontext fehlt');
  return kontext;
}
