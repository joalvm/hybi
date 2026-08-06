import { create } from 'zustand';
import { DEFAULT_PREFERENCES } from '@shared/preferences/defaults.js';
import type { AppPreferences } from '@shared/preferences/types.js';
import { applyTheme } from '@/shared/theme/apply.js';

/**
 * Actions are function properties, not methods. See the note on `UiSlice`.
 *
 * Its own store rather than a slice of the workspace one: `reset()` there
 * replaces the whole state on every document switch, and a setting of the
 * installation has no business disappearing with a document. Both windows load
 * this same module, and the welcome window has no workspace store at all.
 */
type PreferencesStore = AppPreferences & {
  /** What the main process answered — on boot and on the other window's edit. */
  replace: (next: AppPreferences) => void;
  /** Applies a change and answers with the whole shape, ready to be persisted. */
  patch: (changes: Partial<AppPreferences>) => AppPreferences;
};

/** The settings alone, without the two actions sharing the object with them. */
export function preferencesOf(state: PreferencesStore): AppPreferences {
  return {
    version: state.version,
    theme: state.theme,
    language: state.language,
    editorFontSize: state.editorFontSize,
    activityLimit: state.activityLimit,
    activityByteLimit: state.activityByteLimit,
    startup: state.startup,
  };
}

export const usePreferences = create<PreferencesStore>()((set, get) => ({
  ...DEFAULT_PREFERENCES,

  // The theme is painted here rather than by a subscriber, so every path that
  // changes it — boot, this window, the other one — repaints exactly once.
  replace: (next) => {
    applyTheme(next.theme);
    set(next);
  },

  patch: (changes) => {
    const next = { ...preferencesOf(get()), ...changes };
    applyTheme(next.theme);
    set(changes);
    return next;
  },
}));
