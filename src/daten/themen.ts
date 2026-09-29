/**
 * Alle Themen der App. Die ID ist stabil und steht in den Vokabeldaten;
 * der Name darf geändert werden. Neue Themen hier ergänzen.
 */
export const THEMEN = [
  { id: 'begruessung', kuerzel: 'beg', name: 'Begrüßung & Höflichkeit' },
  { id: 'zahlen-zeit', kuerzel: 'zah', name: 'Zahlen & Zeit' },
  { id: 'einkaufen', kuerzel: 'ein', name: 'Einkaufen' },
  { id: 'kleidung-farben', kuerzel: 'kle', name: 'Kleidung & Farben' },
  { id: 'restaurant-cafe', kuerzel: 'res', name: 'Restaurant & Café' },
  { id: 'unterwegs', kuerzel: 'unt', name: 'Unterwegs & Verkehr' },
  { id: 'wohnen-hotel', kuerzel: 'woh', name: 'Wohnen & Hotel' },
  { id: 'gesundheit', kuerzel: 'ges', name: 'Gesundheit & Notfall' },
  { id: 'familie', kuerzel: 'fam', name: 'Familie & Menschen' },
  { id: 'arbeit', kuerzel: 'arb', name: 'Arbeit & Studium' },
  { id: 'wetter-natur', kuerzel: 'wet', name: 'Wetter & Natur' },
  { id: 'freizeit', kuerzel: 'fre', name: 'Freizeit & Smalltalk' },
  { id: 'redewendungen', kuerzel: 'red', name: 'Redewendungen & Sprichwörter' },
  { id: 'behoerden', kuerzel: 'beh', name: 'Behörden & Post' },
  { id: 'telefon', kuerzel: 'tel', name: 'Telefon & Internet' },
  { id: 'bank', kuerzel: 'ban', name: 'Bank & Geld' },
  { id: 'gefuehle', kuerzel: 'gef', name: 'Gefühle & Meinungen' },
  { id: 'kochen', kuerzel: 'koc', name: 'Kochen & Küche' },
  { id: 'koerper', kuerzel: 'koe', name: 'Körper' },
  { id: 'tiere', kuerzel: 'tie', name: 'Tiere' },
] as const;

export type ThemaId = (typeof THEMEN)[number]['id'];
export const THEMA_IDS = THEMEN.map((t) => t.id) as [ThemaId, ...ThemaId[]];

export const INHALTSARTEN = [
  { id: 'wort', name: 'Wörter' },
  { id: 'satz', name: 'Sätze' },
  { id: 'redewendung', name: 'Redewendungen' },
] as const;

export type Inhaltsart = (typeof INHALTSARTEN)[number]['id'];
