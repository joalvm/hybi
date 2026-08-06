import { messagesFor, type Messages } from '@lang/translate.js';
import type { Language } from '@shared/preferences/types.js';

/**
 * The main process reads the same catalogs the window does, but it cannot ask a
 * hook for them: an error thrown deep inside a socket has no React around it.
 * The language is therefore held here and pushed in by boot, which is the only
 * place that knows both the stored preference and the host locale.
 *
 * Deliberately free of `electron` and of the preferences service: the modules
 * that throw are plain functions, and importing either would drag the whole app
 * into their tests.
 */
let language: Language = 'en';

export function setMainLanguage(next: Language): void {
  language = next;
}

export function mainLanguage(): Language {
  return language;
}

export function mainMessages(): Messages {
  return messagesFor(language);
}
