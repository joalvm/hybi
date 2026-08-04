import { memo, type ReactNode } from 'react';
import type { ActivityRecord } from '@shared/ipc/activity.js';
import { ErrorIcon, IncomingIcon, OutgoingIcon, StatusIcon } from '@/shared/ui/icons.js';
import { cn } from '@/shared/utils/cn.js';
import { formatOffset } from './useActivityFilter.js';

const GLYPH: Record<ActivityRecord['kind'], { icon: ReactNode; label: string }> = {
  outgoing: { icon: <OutgoingIcon />, label: 'saliente' },
  incoming: { icon: <IncomingIcon />, label: 'entrante' },
  status: { icon: <StatusIcon />, label: 'estado' },
  error: { icon: <ErrorIcon />, label: 'error' },
};

/**
 * Long enough to recognise a frame, short enough that the row never pays to lay
 * out text it will ellipsize anyway.
 */
const PREVIEW_LENGTH = 160;

/**
 * How much of the body the preview reads. A row shows 160 characters, so
 * flattening a whole frame to find them allocated a second copy of a body that
 * can be megabytes — per row, per render, while the log scrolls.
 */
const PREVIEW_WINDOW = PREVIEW_LENGTH * 8;

const TONE: Record<ActivityRecord['kind'], string> = {
  outgoing: 'text-accent-text',
  incoming: 'text-blue',
  status: 'text-ok',
  error: 'text-error',
};

/**
 * One line of the raw frame, or nothing when the label is already made of it.
 * `labelOf` only lifts a name out of an `{event, data}` envelope; every other
 * frame gets a truncated copy of its own body as a label, and printing that
 * twice in one row is noise.
 */
function preview(body: string, label: string): string {
  const flat = body.slice(0, PREVIEW_WINDOW).replace(/\s+/g, ' ').trim();
  if (flat === '' || flat.startsWith(label.replace(/…$/, ''))) return '';
  return flat.length > PREVIEW_LENGTH ? `${flat.slice(0, PREVIEW_LENGTH)}…` : flat;
}

type Props = {
  record: ActivityRecord;
  origin: number;
  selected: boolean;
  onSelect: (id: string) => void;
};

/**
 * Three columns: what happened, what it said, and when. The label is the event
 * name when the frame carries one, so the eye scans a column of names while the
 * body beside it stays dim — detail on demand, without opening the row.
 *
 * Primitives and one stable callback in, so `memo` actually holds.
 */
export const ActivityRow = memo(function ActivityRow({ record, origin, selected, onSelect }: Props) {
  const glyph = GLYPH[record.kind];
  const body = preview(record.body, record.label);
  return (
    <button
      type="button"
      className={cn(
        'flex h-full w-full cursor-pointer items-center gap-2 border-0 bg-transparent px-2 text-left font-ui text-ui text-foreground hover:bg-hover',
        selected && 'bg-selected',
      )}
      data-selected={selected}
      onClick={() => {
        onSelect(record.id);
      }}
    >
      <span className={cn('inline-flex shrink-0 items-center', TONE[record.kind])} aria-label={glyph.label}>
        {glyph.icon}
      </span>
      <span className="max-w-activity-label min-w-24 shrink overflow-hidden font-semibold text-ellipsis whitespace-nowrap">
        {record.label}
      </span>
      {body !== '' && (
        <span className="flex-1 overflow-hidden font-mono text-label text-ellipsis whitespace-nowrap text-muted">
          {body}
        </span>
      )}
      <span className="ml-auto shrink-0 font-mono text-label whitespace-nowrap text-muted tabular-nums">
        {formatOffset(record.at, origin)}
      </span>
    </button>
  );
});
