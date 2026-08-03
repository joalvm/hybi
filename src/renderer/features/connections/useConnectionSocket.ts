import { useEffect } from 'react';
import { bridge } from '@/ipc/bridge.js';
import { useStore } from '@/store/index.js';

/**
 * Bridges the two push channels into the runtime slice. Actions are pulled from
 * `getState()` rather than subscribed to, so the effect has no dependencies and
 * the listeners are registered exactly once for the app's lifetime.
 */
export function useConnectionSocket(): void {
  useEffect(() => {
    const { setConnectionState, appendActivity } = useStore.getState();
    const offState = bridge.connection.onState((event) => {
      setConnectionState(event.connectionId, event.state);
    });
    const offActivity = bridge.connection.onActivity((records) => {
      appendActivity(records);
    });
    return () => {
      offState();
      offActivity();
    };
  }, []);
}
