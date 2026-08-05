import { resolveTheme } from '@shared/preferences/resolve.js';
import type { ResolvedTheme, ThemePreference } from '@shared/preferences/types.js';

const DARK_QUERY = '(prefers-color-scheme: dark)';

export function systemPrefersDark(): boolean {
  return window.matchMedia(DARK_QUERY).matches;
}

/**
 * `system` is not a value the stylesheet understands: it is the absence of an
 * override, so the attribute goes and `@media (prefers-color-scheme)` decides
 * again. The other two write the attribute the tokens key off.
 */
export function applyTheme(preference: ThemePreference): void {
  if (preference === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = preference;
}

/** What the palette actually is right now, for anything CSS cannot reach. */
export function currentTheme(preference: ThemePreference): ResolvedTheme {
  return resolveTheme(preference, systemPrefersDark());
}

/** Only matters while the preference is `system`; the caller decides that. */
export function watchSystemTheme(listener: () => void): () => void {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener('change', listener);
  return () => {
    query.removeEventListener('change', listener);
  };
}
