import { z } from 'zod';
import { BETONUNG } from './schema.ts';

/** Sätze von Mischa, dem Bären (data/baer.json). */
const SatzSchema = z
  .object({
    id: z.string().regex(/^bae-\d{3}$/),
    russisch: z
      .string()
      .min(1)
      .max(120)
      .regex(/^[А-Яа-яЁё ,.!?–-]+$/u),
    betonung: z.string().max(160).optional(),
    deutsch: z
      .string()
      .min(1)
      .max(120)
      .regex(/^[\p{L} ,.!?–-]+$/u),
    audio: z
      .string()
      .regex(/^bae-\d{3}\.mp3$/)
      .optional(),
  })
  .strict()
  .refine((s) => s.betonung === undefined || s.betonung.split(BETONUNG).join('') === s.russisch, {
    message: 'betonung ohne Akzent ≠ russisch',
  });

export type BaerSatz = z.infer<typeof SatzSchema>;

export const BaerSchema = z
  .object({
    vorstellung: SatzSchema,
    zeiten: z
      .object({ morgen: SatzSchema, tag: SatzSchema, abend: SatzSchema, nacht: SatzSchema })
      .strict(),
    saetze: z.array(SatzSchema).min(3),
  })
  .strict();

export type Baer = z.infer<typeof BaerSchema>;
