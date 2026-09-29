import { z } from 'zod';
import { THEMA_IDS } from './themen.ts';

/** Kombinierendes Betonungszeichen (U+0301), z. B. „молоко́". */
export const BETONUNG = '́';

/** Erlaubte Zeichen in russischem Text: Kyrillisch, Ziffern, Leerzeichen, übliche Satzzeichen. */
const RUSSISCH = /^[А-Яа-яЁё0-9 .,!?:;«»()\-–—…"']+$/u;
/** Deutscher Text: Buchstaben (inkl. Umlaute), Ziffern, Leerzeichen, übliche Satzzeichen. */
const DEUTSCH = /^[\p{L}0-9 .,!?:;„“"'’()\-–—…/&%€+]+$/u;

const russischerText = z
  .string()
  .min(1)
  .max(200)
  .regex(RUSSISCH, 'enthält Zeichen außer Kyrillisch/Satzzeichen')
  .refine((s) => /[А-Яа-яЁё]/u.test(s), 'enthält keinen kyrillischen Buchstaben')
  .refine((s) => s === s.trim() && !s.includes('  '), 'überflüssige Leerzeichen');

export const EintragSchema = z
  .object({
    /** Stabile ID, unabhängig vom Text, z. B. „beg-001". Nie ändern oder wiederverwenden. */
    id: z.string().regex(/^[a-z]{3}-\d{3,4}$/, 'Format „abc-001"'),
    typ: z.enum(['wort', 'satz', 'redewendung']),
    thema: z.enum(THEMA_IDS),
    russisch: russischerText,
    deutsch: z
      .string()
      .min(1)
      .max(200)
      .regex(DEUTSCH, 'unerlaubte Zeichen')
      .refine((s) => s === s.trim() && !s.includes('  '), 'überflüssige Leerzeichen'),
    // Zeichen werden unten geprüft: ohne Akzente muss betonung exakt russisch entsprechen
    betonung: z.string().max(300).optional(),
    genusvarianten: z.object({ m: russischerText, w: russischerText }).strict().optional(),
    // Hinweise dürfen russische Wörter mit Betonungszeichen enthalten (z. B. „му́ка“)
    hinweis: z
      .string()
      .min(1)
      .max(80)
      .regex(/^(?:[\p{L}0-9 .,!?:;„“"'’()\-–—…/&%€+]|\u0301)+$/u)
      .optional(),
    audio: z
      .string()
      .regex(/^[a-z]{3}-\d{3,4}\.mp3$/, 'Format „abc-001.mp3"')
      .optional(),
  })
  .strict()
  .superRefine((e, ctx) => {
    if (e.betonung !== undefined) {
      if (e.betonung.split(BETONUNG).join('') !== e.russisch) {
        ctx.addIssue({ code: 'custom', message: 'betonung ohne Akzent ≠ russisch' });
      }
      if (!e.betonung.includes(BETONUNG)) {
        ctx.addIssue({ code: 'custom', message: 'betonung enthält kein Betonungszeichen' });
      }
      if (/[^АЕЁИОУЫЭЮЯаеёиоуыэюя]́/u.test(e.betonung) || e.betonung.startsWith(BETONUNG)) {
        ctx.addIssue({ code: 'custom', message: 'Betonungszeichen steht nicht nach einem Vokal' });
      }
    }
    if (e.genusvarianten && ![e.genusvarianten.m, e.genusvarianten.w].includes(e.russisch)) {
      ctx.addIssue({
        code: 'custom',
        message: 'russisch muss der m.- oder w.-Variante entsprechen',
      });
    }
    if (e.audio !== undefined && e.audio !== `${e.id}.mp3`) {
      ctx.addIssue({ code: 'custom', message: 'audio muss „<id>.mp3" heißen' });
    }
  });

export type Eintrag = z.infer<typeof EintragSchema>;
export const DateiSchema = z.array(EintragSchema).min(1);
