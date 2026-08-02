import { useEffect, useRef } from 'react';

/**
 * Ctrl+S writes the draft into the catalog, which is why the composer has no
 * save button any more. The listener sits on the window because the caret is
 * normally inside Monaco, which claims neither Ctrl+S nor Cmd+S and lets the
 * keystroke bubble. `preventDefault` runs even on a clean draft: swallowing the
 * combination is the point, so the browser's own save dialog never appears.
 */
export function useSaveShortcut(enabled: boolean, onSave: () => void): void {
  // A ref, so the listener is registered once and still calls the latest
  // closure over the draft.
  const latest = useRef(onSave);

  useEffect(() => {
    latest.current = onSave;
  }, [onSave]);

  useEffect(() => {
    const handle = (event: KeyboardEvent): void => {
      if (event.key.toLowerCase() !== 's') return;
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      if (enabled) latest.current();
    };

    window.addEventListener('keydown', handle);
    return () => {
      window.removeEventListener('keydown', handle);
    };
  }, [enabled]);
}
