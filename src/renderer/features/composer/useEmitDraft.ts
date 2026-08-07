import { useState } from 'react';

export type EmitDraft = {
  /** The name this send goes out under. */
  event: string;
  setEvent: (event: string) => void;
  /** Whether to ask the server to answer, and log the answer when it does. */
  ack: boolean;
  setAck: (ack: boolean) => void;
};

/**
 * The two things Socket.IO needs that a raw frame does not. The name starts as
 * the catalog entry's own, which is what it is for, and an edit is remembered
 * per event rather than globally: switching events and coming back should not
 * find someone else's name in the box. Overrides are kept instead of the value
 * itself so that renaming the entry still reaches an untouched field, without
 * an effect writing state on every selection.
 */
export function useEmitDraft(eventId: string | null, catalogName: string): EmitDraft {
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [ack, setAck] = useState(false);
  const override = eventId === null ? undefined : overrides[eventId];

  return {
    event: override ?? catalogName,
    setEvent: (next) => {
      if (eventId === null) return;
      setOverrides((current) => ({ ...current, [eventId]: next }));
    },
    ack,
    setAck,
  };
}
