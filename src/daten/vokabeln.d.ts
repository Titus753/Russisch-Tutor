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
} | null;

declare module 'virtual:lob' {
  import type { Lob } from './lob-schema.ts';
  const lob: readonly Lob[];
  export default lob;
}

declare module 'virtual:baer' {
  import type { Baer } from './baer-schema.ts';
  const baer: Baer;
  export default baer;
}
