import { bridge } from '@/ipc/bridge.js';
import { usePreferences } from '@/store/preferences.store.js';
import type { AppPreferences } from '@shared/preferences/types.js';

/**
 * One step: apply and persist. There is no Save button and no Cancel, like the
 * connection settings dialog — a preference is in effect the moment it is read,
 * so a form that held it back would be lying about the state of the app.
 *
 * What the main process answers with replaces what was sent: it is the side
 * that normalises, so a value it refused never survives on screen.
 */
export function usePreferenceActions(): (changes: Partial<AppPreferences>) => void {
  const patch = usePreferences((state) => state.patch);

  return (changes) => {
    const next = patch(changes);
    void bridge.preferences
      .save(next)
      .then((stored) => {
        usePreferences.getState().replace(stored);
      })
      .catch(() => {
        // The setting still applies to this session; only the file did not take
        // it. There is no log in this window that a preference belongs in.
      });
  };
}
