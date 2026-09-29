/** Kalendertage als „JJJJ-MM-TT" in lokaler Zeit – so zählt ein Lerntag bis Mitternacht vor Ort. */
export type Tag = string;

export const TAG_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

export function tagVon(datum: Date): Tag {
  const j = datum.getFullYear();
  const m = String(datum.getMonth() + 1).padStart(2, '0');
  const t = String(datum.getDate()).padStart(2, '0');
  return `${j}-${m}-${t}`;
}

export function heute(): Tag {
  return tagVon(new Date());
}

function alsDatum(tag: Tag): Date {
  const [j, m, t] = tag.split('-').map(Number) as [number, number, number];
  // 12 Uhr mittags: Sommerzeit-Umstellungen verschieben den Tag nicht
  return new Date(j, m - 1, t, 12);
}

export function plusTage(tag: Tag, tage: number): Tag {
  const d = alsDatum(tag);
  d.setDate(d.getDate() + tage);
  return tagVon(d);
}

export function tageZwischen(von: Tag, bis: Tag): number {
  return Math.round((alsDatum(bis).getTime() - alsDatum(von).getTime()) / 86_400_000);
}
