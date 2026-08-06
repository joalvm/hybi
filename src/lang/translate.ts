import type { Language } from '@shared/preferences/types.js';
import { EN } from './en/index.js';
import { ES } from './es/index.js';
import type { Messages } from './types.js';

export type { Messages } from './types.js';

/**
 * Adding a language is adding a directory beside `en` and `es` and one entry
 * here. Nothing else in the app names a language.
 */
const CATALOGS: Record<Language, Messages> = { en: EN, es: ES };

export function messagesFor(language: Language): Messages {
  return CATALOGS[language];
}

/** What a countable message carries, so the caller never picks the form. */
export type PluralForms = { one: string; other: string };

export type FormatValues = Record<string, string | number>;

/**
 * `{name}` is replaced by the value under that key. A placeholder with nothing
 * to put in it is left as written rather than blanked: an untranslated slot is
 * a bug that has to be visible, and an empty gap hides it.
 */
export function format(template: string, values: FormatValues): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => {
    const value = values[key];
    return value === undefined ? whole : String(value);
  });
}

/**
 * English and Spanish share the same two plural categories, so the catalog
 * carries both forms and this picks one. A language with more of them gets its
 * own selector here, not a third field in every countable message.
 */
export function plural(forms: PluralForms, count: number, values: FormatValues = {}): string {
  return format(count === 1 ? forms.one : forms.other, { count, ...values });
}
