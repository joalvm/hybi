import { useCallback, useState } from 'react';
import type { EventItem } from '@shared/domain/types.js';
import { useStore } from '@/store/index.js';

export type DocsDraft = {
  text: string;
  dirty: boolean;
  setText: (next: string) => void;
  save: () => void;
};

/** Keeps one unsaved description per event while the composer remains open. */
export function useDocsDraft(event: EventItem | null): DocsDraft {
  const upsertEventItem = useStore((state) => state.upsertEventItem);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const eventId = event?.id ?? null;
  const saved = event?.description ?? '';
  const text = eventId === null ? '' : (drafts[eventId] ?? saved);

  const clear = useCallback((): void => {
    if (eventId === null) return;
    setDrafts((current) => {
      if (current[eventId] === undefined) return current;
      const { [eventId]: _discarded, ...next } = current;
      return next;
    });
  }, [eventId]);

  const setText = useCallback(
    (next: string): void => {
      if (eventId === null) return;
      setDrafts((current) => ({ ...current, [eventId]: next }));
    },
    [eventId],
  );

  const save = useCallback((): void => {
    if (event === null) return;
    if (text.trim() === '') {
      const { description: _description, ...withoutDescription } = event;
      upsertEventItem(withoutDescription);
    } else {
      upsertEventItem({ ...event, description: text });
    }
    clear();
  }, [clear, event, text, upsertEventItem]);

  return { text, dirty: text !== saved, setText, save };
}
