import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { resolveText } from '@shared/variables/resolve.js';
import { useStore } from '@/store/index.js';
import {
  selectEffectivePayload,
  selectIsDirty,
  selectScopeFor,
  selectSelectedEvent,
} from '@/store/selectors.js';

export type ComposerDraft = {
  eventId: string | null;
  text: string;
  dirty: boolean;
  /** The exact text that goes on the wire, so callers never re-resolve. */
  resolved: string;
  /** Variables the scope has no value for. A note, never a refusal. */
  missing: string[];
  /** Nothing to send: the only thing about the payload that keeps Send down. */
  empty: boolean;
  setText: (next: string) => void;
  save: () => void;
};

/**
 * The draft lives in the runtime slice, never in local state: switching tabs
 * must not lose an edit. Resolution is derived during render through `useMemo`,
 * so no effect writes it back into the store.
 *
 * Nothing here inspects the shape of the payload. A workbench is where a tester
 * finds out what the server does with a frame nobody planned for, so the text is
 * carried to the socket exactly as written.
 */
export function useComposerDraft(connectionId: string): ComposerDraft {
  const event = useStore(selectSelectedEvent(connectionId));
  const text = useStore(selectEffectivePayload(connectionId)) ?? '';
  const dirty = useStore(selectIsDirty(connectionId));
  // `useShallow` keeps the scope map identity stable, so the resolution is not
  // recomputed every time an unrelated slice changes.
  const scope = useStore(useShallow(selectScopeFor(connectionId)));
  const setDraft = useStore((state) => state.setDraft);
  const clearDraft = useStore((state) => state.clearDraft);
  const upsertEventItem = useStore((state) => state.upsertEventItem);

  const resolution = useMemo(() => resolveText(text, scope), [text, scope]);
  const eventId = event?.id ?? null;

  return {
    eventId,
    text,
    dirty,
    resolved: resolution.text,
    missing: resolution.missing,
    empty: resolution.text.trim() === '',
    setText: (next) => {
      if (eventId !== null) setDraft(connectionId, eventId, next);
    },
    save: () => {
      if (event === null || eventId === null) return;
      upsertEventItem({ ...event, payload: text });
      clearDraft(connectionId, eventId);
    },
  };
}
