declare module 'virtual:vokabeln' {
  import type { Eintrag } from './schema.ts';
  const eintraege: readonly Eintrag[];
  export default eintraege;
}

declare module 'virtual:alphabet' {
  import type { Buchstabe } from './alphabet-schema.ts';
  const alphabet: readonly Buchstabe[];
  export default alphabet;
}

declare const __VERANTWORTLICHER__: {
  name: string;
  kontakt: string;
  anschrift: string | null;
  platzhalter: boolean;
};
