import type {
  Language,
  LanguagePreference,
  ResolvedTheme,
  ThemePreference,
} from './types.js';

/**
 * The host is consulted only while the preference defers to it. The caller
 * passes what it observed — `matchMedia` in the renderer, `nativeTheme` in the
 * main process — so this stays a pure decision either side of the bridge.
 */
export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (preference !== 'system') return preference;
  return systemPrefersDark ? 'dark' : 'light';
}

/**
 * English is the fallback rather than the primary: a Spanish machine gets
 * Spanish, and everything else gets the language the rest of the world reads
 * tooling in.
 */
export function resolveLanguage(preference: LanguagePreference, hostLocale: string): Language {
  if (preference !== 'system') return preference;
  return hostLocale.toLowerCase().startsWith('es') ? 'es' : 'en';
}
