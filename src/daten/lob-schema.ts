import { z } from 'zod';
import { BETONUNG } from './schema.ts';

/** Russisches Lob nach einer geschafften Runde (data/lob.json). */
export const LobSchema = z
  .object({
    id: z.string().regex(/^lob-\d{3}$/),
    russisch: z
      .string()
      .min(1)
      .max(80)
      .regex(/^[А-Яа-яЁё ,.!?–-]+$/u),
    betonung: z.string().max(120).optional(),
    deutsch: z
      .string()
      .min(1)
      .max(80)
      .regex(/^[\p{L} ,.!?–-]+$/u),
    hinweis: z
      .string()
      .max(80)
      .regex(/^(?:[\p{L} ,.;:!?–-]|́)+$/u)
      .optional(),
    audio: z
      .string()
      .regex(/^lob-\d{3}\.mp3$/)
      .optional(),
  })
  .strict()
  .refine((l) => l.betonung === undefined || l.betonung.split(BETONUNG).join('') === l.russisch, {
    message: 'betonung ohne Akzent ≠ russisch',
  });

export type Lob = z.infer<typeof LobSchema>;

export const LobListeSchema = z
  .array(LobSchema)
  .min(10)
  .refine((liste) => new Set(liste.map((l) => l.id)).size === liste.length, 'doppelte IDs')
  .refine(
    (liste) => new Set(liste.map((l) => l.russisch)).size === liste.length,
    'doppelte Sprüche',
  );
