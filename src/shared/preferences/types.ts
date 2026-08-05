/** What the stylesheet is told to paint. `system` is the absence of an override. */
export type ThemePreference = 'system' | 'light' | 'dark';

/** The two palettes a theme preference can end up as. */
export type ResolvedTheme = 'light' | 'dark';

/** Every language the interface ships with. `system` reads the host locale. */
export type LanguagePreference = 'system' | 'en' | 'es';

/** A language preference once the host locale has had its say. */
export type Language = 'en' | 'es';

/** What opens when the app is launched with no document named. */
export type StartupBehavior = 'welcome' | 'last-workspace';

/**
 * Settings that belong to the installation rather than to a document. They live
 * in their own file under `userData`: a workspace is something the user shares
 * or deletes, and none of this should travel with it.
 */
export type AppPreferences = {
  version: 1;
  theme: ThemePreference;
  language: LanguagePreference;
  /** Point size for every Monaco instance in the app. */
  editorFontSize: number;
  /** How many activity records one connection keeps. */
  activityLimit: number;
  /** How many bytes of frame bodies one connection keeps. */
  activityByteLimit: number;
  startup: StartupBehavior;
};
