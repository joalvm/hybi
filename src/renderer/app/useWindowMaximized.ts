import { useEffect, useState } from 'react';
import { bridge } from '@/ipc/bridge.js';

/**
 * Mirrors the window's own state instead of tracking it locally: the user can
 * also maximise by dragging to the top edge or double-clicking the title bar.
 */
export function useWindowMaximized(): boolean {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    let active = true;

    void bridge.window.isMaximized().then((value) => {
      if (active) setMaximized(value);
    });

    const unsubscribe = bridge.window.onMaximizedChange(setMaximized);

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return maximized;
}
