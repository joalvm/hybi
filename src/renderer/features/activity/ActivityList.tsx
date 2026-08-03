import { useEffect, useRef, type UIEvent } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { ActivityRecord } from '@shared/ipc/activity.js';
import { ActivityRow } from './ActivityRow.js';

/** How close to the top still counts as "following the head", in pixels. */
const PIN_THRESHOLD = 24;

type Props = {
  records: ActivityRecord[];
  origin: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function ActivityList({ records, origin, selectedId, onSelect }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // A ref, not state: this flips on every scroll frame and must never re-render.
  const pinned = useRef(true);

  const virtualizer = useVirtualizer({
    count: records.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 26,
    overscan: 12,
  });

  // The list arrives newest first, so following it means staying at the top —
  // and only while the user has not scrolled away, so reading an old frame is
  // not yanked out from under them by the next batch.
  useEffect(() => {
    if (!pinned.current || records.length === 0) return;
    virtualizer.scrollToIndex(0);
  }, [records.length, virtualizer]);

  const trackPin = (event: UIEvent<HTMLDivElement>): void => {
    pinned.current = event.currentTarget.scrollTop < PIN_THRESHOLD;
  };

  return (
    <div
      className="activity-list-runtime h-full overflow-auto"
      ref={scrollRef}
      onScroll={trackPin}
    >
      <div
        className="activity-canvas-runtime relative w-full"
        data-height={virtualizer.getTotalSize()}
      >
        {virtualizer.getVirtualItems().map((row) => {
          const record = records[row.index];
          if (record === undefined) return null;
          return (
            <div
              key={record.id}
              className="activity-slot-runtime absolute top-0 left-0 w-full"
              data-height={row.size}
              data-start={row.start}
            >
              <ActivityRow
                record={record}
                origin={origin}
                selected={record.id === selectedId}
                onSelect={onSelect}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
