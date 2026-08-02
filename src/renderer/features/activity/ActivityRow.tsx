import { memo, type ReactNode } from 'react';
import clsx from 'clsx';
import type { ActivityRecord } from '@shared/ipc/activity.js';
import { ErrorIcon, IncomingIcon, OutgoingIcon, StatusIcon } from '@/shared/ui/icons.js';
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
 * One line of the raw frame, or nothing when the label is already made of it.
 * `labelOf` only lifts a name out of an `{event, data}` envelope; every other
 * frame gets a truncated copy of its own body as a label, and printing that
 * twice in one row is noise.
 */
function preview(body: string, label: string): string {
  const flat = body.replace(/\s+/g, ' ').trim();
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
      className={clsx('activity-row', `activity-row--${record.kind}`, selected && 'is-selected')}
      onClick={() => {
        onSelect(record.id);
      }}
    >
      <span className="activity-row__icon" aria-label={glyph.label}>
        {glyph.icon}
      </span>
      <span className="activity-row__label">{record.label}</span>
      {body !== '' && <span className="activity-row__preview">{body}</span>}
      <span className="activity-row__time">{formatOffset(record.at, origin)}</span>
    </button>
  );
});
