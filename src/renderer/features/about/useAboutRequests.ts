import { useEffect, useState } from 'react';
import { bridge } from '@/ipc/bridge.js';

/** The Help menu lives in the main process, so the dialog opens on its request. */
export function useAboutRequests(): { open: boolean; close: () => void } {
  const [open, setOpen] = useState(false);

  useEffect(
    () =>
      bridge.app.onAboutRequested(() => {
        setOpen(true);
      }),
    [],
  );

  return {
    open,
    close: () => {
      setOpen(false);
    },
  };
}
