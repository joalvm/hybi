import { useState } from 'react';
import type {
  ConnectionTransport,
  TransportKind,
} from '@shared/domain/connections/connection.js';
import { createTransport } from '@shared/domain/connections/factory.js';
import { isTransportPristine } from '@shared/domain/connections/pristine.js';

/**
 * Replacing a transport, and the question that has to come first when there is
 * something to lose.
 *
 * `createTransport` keeps nothing from the one being replaced — the settings do
 * not mean the same thing on both sides, and neither does the URL. That was a
 * deliberate act while the only way to reach it was a modal dialog. From a pill
 * inside the URL field it is one click, so a transport the user has written into
 * asks first; one still holding its factory defaults has nothing to ask about
 * and switches straight away, which is the common case for this control.
 */
export function useTransportSwitch(
  transport: ConnectionTransport,
  onChange: (transport: ConnectionTransport) => void,
) {
  const [pending, setPending] = useState<TransportKind | null>(null);

  return {
    /** The kind waiting on an answer, or null while nothing is being asked. */
    pending,
    select: (kind: TransportKind): void => {
      if (kind === transport.kind) return;
      if (isTransportPristine(transport)) {
        onChange(createTransport(kind));
        return;
      }
      setPending(kind);
    },
    // Read from the closure rather than from state, so it stays correct however
    // the dialog orders `onConfirm` against the `onClose` that follows it.
    confirm: (): void => {
      if (pending !== null) onChange(createTransport(pending));
      setPending(null);
    },
    dismiss: (): void => {
      setPending(null);
    },
  };
}
