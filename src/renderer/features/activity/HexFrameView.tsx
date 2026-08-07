import { useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { base64ToBytes } from '@shared/binary/base64.js';
import { dumpRow, dumpRowCount } from '@shared/binary/dump.js';
import { useMessages } from '@/shared/i18n/useMessages.js';

/** Matches the monospace line height the rows are drawn at. */
const ROW_HEIGHT = 20;

type Props = { body: string };

/**
 * The frame as bytes: offset, sixteen hex columns and what those bytes spell
 * where they spell anything.
 *
 * Virtualized on the rows, not on the frame. A megabyte is sixty-five thousand
 * lines, and the only way that frame stays scrollable is to lay out the twenty
 * on screen and build each line the moment it is asked for.
 */
export function HexFrameView({ body }: Props) {
  const messages = useMessages().activity;
  const scrollRef = useRef<HTMLDivElement>(null);
  // The decode happens once per selected frame; the rows read the same array.
  const bytes = useMemo(() => base64ToBytes(body), [body]);
  const rows = bytes === null ? 0 : dumpRowCount(bytes.length);

  const virtualizer = useVirtualizer({
    count: rows,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  // Nothing said a peer's binary frame has to be well formed on this side of
  // the bridge, and an empty dump would read as an empty frame.
  if (bytes === null) return <p className="p-3 text-muted">{messages.binaryUnreadable}</p>;

  return (
    <div
      className="activity-list-runtime h-full overflow-auto font-mono text-label"
      data-testid="hex-view"
      data-rows={rows}
      ref={scrollRef}
    >
      <div className="activity-canvas-runtime relative w-full" data-height={virtualizer.getTotalSize()}>
        {virtualizer.getVirtualItems().map((item) => {
          const row = dumpRow(bytes, item.index);
          return (
            <div
              key={row.offset}
              className="activity-slot-runtime absolute top-0 left-0 flex w-full items-center gap-4 px-3"
              data-height={item.size}
              data-start={item.start}
            >
              <span className="shrink-0 text-muted tabular-nums">{row.offset}</span>
              <span className="shrink-0 whitespace-pre">{row.hex}</span>
              <span className="shrink-0 whitespace-pre text-blue">{row.ascii}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
