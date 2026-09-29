import { z } from 'zod';
import { BETONUNG } from './schema.ts';

const KYRILLISCH = /^[А-Яа-яЁё ]+$/u;
const DEUTSCH = /^[\p{L}0-9 .,;:„“"'()\-–]+$/u;

const BeispielSchema = z
  .object({
    id: z.string().regex(/^alb-\d{3}$/),
    russisch: z.string().min(1).max(40).regex(KYRILLISCH),
    betonung: z.string().max(60).optional(),
    deutsch: z.string().min(1).max(60).regex(DEUTSCH),
    audio: z
      .string()
      .regex(/^alb-\d{3}\.mp3$/)
      .optional(),
  })
  .strict()
  .refine((b) => b.betonung === undefined || b.betonung.split(BETONUNG).join('') === b.russisch, {
    message: 'betonung ohne Akzent ≠ russisch',
  });

export const BuchstabeSchema = z
  .object({
    id: z.string().regex(/^alf-\d{3}$/),
    gross: z.string().regex(/^[А-ЯЁ]$/u),
    klein: z.string().regex(/^[а-яё]$/u),
    /** Name des Buchstabens, wie er gesprochen wird (z. B. „бэ"). */
    sprechtext: z.string().min(1).max(30).regex(KYRILLISCH),
    aussprache: z.string().min(1).max(120).regex(DEUTSCH),
    beispiel: BeispielSchema,
    audio: z
      .string()
      .regex(/^alf-\d{3}\.mp3$/)
      .optional(),
  })
  .strict()
  .refine((b) => b.gross.toLowerCase() === b.klein, {
    message: 'Groß-/Kleinbuchstabe passen nicht',
  });

export type Buchstabe = z.infer<typeof BuchstabeSchema>;

/** Das russische Alphabet hat genau 33 Buchstaben, jeder genau einmal, in dieser Reihenfolge. */
const REIHENFOLGE = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';

export const AlphabetSchema = z
  .array(BuchstabeSchema)
  .length(33)
  .refine((liste) => liste.map((b) => b.klein).join('') === REIHENFOLGE, {
    message: 'Buchstaben fehlen, sind doppelt oder in falscher Reihenfolge',
  });
