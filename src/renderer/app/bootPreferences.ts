import { bridge } from '@/ipc/bridge.js';
import { usePreferences } from '@/store/preferences.store.js';

/**
 * Runs before the first paint, so the window never opens in one theme and
 * corrects itself into the other. It is also where the other window's edits
 * arrive: one installation has one set of settings.
 */
export async function bootPreferences(): Promise<void> {
  try {
    usePreferences.getState().replace(await bridge.preferences.load());
  } catch {
    // Not worth a blank window. The store already holds the defaults, which is
    // what a fresh install runs with anyway.
  }

  // Never unsubscribed: it lives as long as the window that installed it.
  bridge.preferences.onChanged((preferences) => {
    usePreferences.getState().replace(preferences);
  });
}
