import { useCallback, useState } from 'react';
import type { ActivityRecord } from '@shared/ipc/activity.js';
import { useStore } from '@/store/index.js';
import { selectIsDirty } from '@/store/selectors.js';

export type ActivityResend = {
  /** False while no event is open: the composer would have nowhere to put it. */
  canResend: boolean;
  /** The frame waiting for an answer about overwriting an unsaved draft. */
  pending: ActivityRecord | null;
  resend: (record: ActivityRecord) => void;
  confirm: () => void;
  dismiss: () => void;
};

/**
 * Loading a frame back into the composer, and the one question that has to be
 * asked first. Its own file because the panel is already at the size this repo
 * allows, and this is the only part of it that owns state of its own.
 *
 * The draft is stored per connection and event, so the target is whatever event
 * the composer has open — read at call time, not closed over, which is what
 * keeps `resend` stable across every batch the socket delivers.
 */
export function useActivityResend(connectionId: string): ActivityResend {
  const canResend = useStore(
    (state) => state.selectedEventByConnection[connectionId] !== undefined,
  );
  const [pending, setPending] = useState<ActivityRecord | null>(null);

  const load = useCallback(
    (record: ActivityRecord) => {
      const state = useStore.getState();
      const eventId = state.selectedEventByConnection[connectionId];
      if (eventId === undefined) return;
      state.setDraft(connectionId, eventId, record.body);
    },
    [connectionId],
  );

  // An unsaved payload is the one thing this action can destroy for good, so it
  // is the one case that stops to ask.
  const resend = useCallback(
    (record: ActivityRecord) => {
      if (selectIsDirty(connectionId)(useStore.getState())) {
        setPending(record);
        return;
      }
      load(record);
    },
    [connectionId, load],
  );

  return {
    canResend,
    pending,
    resend,
    confirm: () => {
      if (pending !== null) load(pending);
    },
    dismiss: () => {
      setPending(null);
    },
  };
}
