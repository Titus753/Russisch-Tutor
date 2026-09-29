declare module 'virtual:vokabeln' {
  import type { Eintrag } from './schema.ts';
  const eintraege: readonly Eintrag[];
  export default eintraege;
}
