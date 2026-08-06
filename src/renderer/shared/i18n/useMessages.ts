import { messagesFor, type Messages } from '@lang/translate.js';
import { resolveLanguage } from '@shared/preferences/resolve.js';
import type { Language } from '@shared/preferences/types.js';
import { usePreferences } from '@/store/preferences.store.js';

/**
 * Text is not feature state: every component draws some, and threading a catalog
 * down through props would put a `messages` argument on components that exist to
 * take one prop. This is the one place that reads the preference, and the
 * selector returns a string, so a component only repaints when the language
 * itself changes.
 */
export function useLanguage(): Language {
  return usePreferences((state) => resolveLanguage(state.language, navigator.language));
}

/** The catalog the interface is currently written in. */
export function useMessages(): Messages {
  return messagesFor(useLanguage());
}

/**
 * The same catalog for the one place a hook cannot go: React exposes no hook
 * for render errors, so the error boundary is a class and reads it this way.
 */
export function currentMessages(): Messages {
  const { language } = usePreferences.getState();
  return messagesFor(resolveLanguage(language, navigator.language));
}
