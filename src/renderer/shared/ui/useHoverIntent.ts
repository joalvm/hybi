import { useCallback, useEffect, useRef, useState } from 'react';

/** How long the pointer has to rest on a target before the panel appears. */
const OPEN_DELAY_MS = 350;
/** Grace for the pointer to cross the gap between the target and the panel. */
const CLOSE_DELAY_MS = 250;

export type HoverIntent<T> = {
  value: T | null;
  /**
   * The pointer is resting on a target. The thunk runs when the panel actually
   * opens, because an anchor rectangle read a delay early describes nothing.
   */
  point: (resolve: () => T | null) => void;
  keepOpen: () => void;
  release: () => void;
  close: () => void;
};

/**
 * The timing a hover panel needs in order to also be editable: it waits before
 * opening so sweeping across a token does not flash it, and it lingers on the
 * way out so the pointer can reach the panel it just opened.
 *
 * Both the URL field and the Monaco editor hang the same variable popover off
 * this, so the two surfaces cannot drift apart on delays or on cleanup.
 */
export function useHoverIntent<T>(): HoverIntent<T> {
  const [value, setValue] = useState<T | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inside = useRef(false);

  const clearTimers = useCallback((): void => {
    if (openTimer.current !== null) clearTimeout(openTimer.current);
    if (closeTimer.current !== null) clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  }, []);

  // Both timers outlive a render, so unmounting has to take them down.
  useEffect(() => clearTimers, [clearTimers]);

  return {
    value,
    point: useCallback(
      (resolve: () => T | null): void => {
        clearTimers();
        openTimer.current = setTimeout(() => {
          openTimer.current = null;
          setValue(resolve());
        }, OPEN_DELAY_MS);
      },
      [clearTimers],
    ),
    keepOpen: useCallback((): void => {
      inside.current = true;
      if (closeTimer.current !== null) clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }, []),
    release: useCallback((): void => {
      inside.current = false;
      clearTimers();
      closeTimer.current = setTimeout(() => {
        closeTimer.current = null;
        // A pointer that reached the panel during the grace wins the race.
        if (!inside.current) setValue(null);
      }, CLOSE_DELAY_MS);
    }, [clearTimers]),
    close: useCallback((): void => {
      inside.current = false;
      clearTimers();
      setValue(null);
    }, [clearTimers]),
  };
}
