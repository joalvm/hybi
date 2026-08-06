import type { Language } from '@shared/preferences/types.js';

/**
 * `Intl` formatters are expensive to build and free to reuse, and these are read
 * on paths that run once per activity row. One per language, built on first use.
 */
const TIMES = new Map<Language, Intl.DateTimeFormat>();
const NUMBERS = new Map<Language, Intl.NumberFormat>();

function timeFormat(language: Language): Intl.DateTimeFormat {
  const cached = TIMES.get(language);
  if (cached !== undefined) return cached;
  const format = new Intl.DateTimeFormat(language, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  TIMES.set(language, format);
  return format;
}

function numberFormat(language: Language): Intl.NumberFormat {
  const cached = NUMBERS.get(language);
  if (cached !== undefined) return cached;
  const format = new Intl.NumberFormat(language);
  NUMBERS.set(language, format);
  return format;
}

/** Wall-clock time of a frame, in the convention the language reads it in. */
export function formatTime(language: Language, at: number): string {
  return timeFormat(language).format(new Date(at));
}

/** Group separators are a language decision too: `1,024` against `1.024`. */
export function formatNumber(language: Language, value: number): string {
  return numberFormat(language).format(value);
}
