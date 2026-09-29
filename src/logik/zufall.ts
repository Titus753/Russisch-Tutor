/** Zufallsquelle, in Tests durch eine feste Folge ersetzbar. Nur für Lernreihenfolgen, nicht für Sicherheit. */
export type Zufall = () => number;

export function mischen<T>(liste: readonly T[], zufall: Zufall = Math.random): T[] {
  const kopie = [...liste];
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(zufall() * (i + 1));
    [kopie[i], kopie[j]] = [kopie[j] as T, kopie[i] as T];
  }
  return kopie;
}

/** Deterministischer Zufall für Tests (mulberry32). */
export function festerZufall(saat: number): Zufall {
  let a = saat >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
