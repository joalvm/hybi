import { DEFAULT_PREFERENCES } from '@shared/preferences/defaults.js';
import type { AppPreferences } from '@shared/preferences/types.js';
import { preferencesFile } from './paths.js';
import { PreferencesRepository } from './repository.js';

/**
 * One reader for the whole main process. The startup decision, the IPC handlers
 * and the native menu all need the same answer, and none of them should hit the
 * disk on its own.
 */
let repository: PreferencesRepository | null = null;
let cached: AppPreferences = DEFAULT_PREFERENCES;
const listeners = new Set<(preferences: AppPreferences) => void>();

// Built on first use, not at import: `app.getPath` is only answerable once the
// app is ready, and this module is imported long before that.
function store(): PreferencesRepository {
  repository ??= new PreferencesRepository(preferencesFile());
  return repository;
}

export async function loadPreferences(): Promise<AppPreferences> {
  cached = await store().load();
  return cached;
}

export async function savePreferences(next: AppPreferences): Promise<AppPreferences> {
  cached = await store().save(next);
  for (const listener of listeners) listener(cached);
  return cached;
}

/** What the last load or save left, without waiting on the disk. */
export function currentPreferences(): AppPreferences {
  return cached;
}

/** For the parts of the main process that have to rebuild when a setting moves. */
export function onPreferencesChanged(listener: (preferences: AppPreferences) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
