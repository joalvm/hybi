import { memo, type KeyboardEvent, type ReactNode } from 'react';
import type { ActivityRecord } from '@shared/ipc/activity.js';
import { useMessages } from '@/shared/i18n/useMessages.js';
import { ContextMenu } from '@/shared/ui/ContextMenu.js';
import {
  DuplicateIcon,
  ErrorIcon,
  IncomingIcon,
  OutgoingIcon,
  SendIcon,
  StatusIcon,
} from '@/shared/ui/icons.js';
import { cn } from '@/shared/utils/cn.js';
import type { CopyScope } from './copy-text.js';
import { previewOf } from './preview.js';
import { formatOffset } from './useActivityFilter.js';

const GLYPH: Record<ActivityRecord['kind'], ReactNode> = {
  outgoing: <OutgoingIcon />,
  incoming: <IncomingIcon />,
  status: <StatusIcon />,
  error: <ErrorIcon />,
};

const TONE: Record<ActivityRecord['kind'], string> = {
  outgoing: 'text-accent-text',
  incoming: 'text-blue',
  status: 'text-ok',
  error: 'text-error',
};

type Props = {
  record: ActivityRecord;
  origin: number;
  selected: boolean;
  onSelect: (id: string) => void;
  onCopy: (record: ActivityRecord, scope: CopyScope) => void;
  onResend: (record: ActivityRecord) => void;
  /** False while no event is open: the composer would have nowhere to put it. */
  canResend: boolean;
};

/**
 * Three columns: what happened, what it said, and when. The label is the event
 * name when the frame carries one, so the eye scans a column of names while the
 * body beside it stays dim — detail on demand, without opening the row.
 *
 * Primitives and two stable callbacks in, so `memo` actually holds.
 */
export const ActivityRow = memo(function ActivityRow({
  record,
  origin,
  selected,
  onSelect,
  onCopy,
  onResend,
  canResend,
}: Props) {
  const messages = useMessages();
  const body = previewOf(record);
  // A status note or an error is the app talking, not a frame: there is nothing
  // in either that the composer could put back on the wire.
  const replayable = record.kind === 'incoming' || record.kind === 'outgoing';

  // The log is walked with the keyboard, so the shortcut answers where the focus
  // already is instead of making the user open the menu to reach it.
  const shortcut = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key !== 'c' || !(event.ctrlKey || event.metaKey)) return;
    event.preventDefault();
    onCopy(record, 'body');
  };

  return (
    <ContextMenu
      label={messages.activity.rowActions}
      items={[
        {
          label: messages.activity.copyBody,
          icon: <DuplicateIcon />,
          onSelect: () => {
            onCopy(record, 'body');
          },
        },
        {
          label: messages.activity.copyRow,
          icon: <DuplicateIcon />,
          onSelect: () => {
            onCopy(record, 'row');
          },
        },
        ...(replayable
          ? [
              {
                label: messages.activity.resend,
                icon: <SendIcon />,
                disabled: !canResend,
                onSelect: () => {
                  onResend(record);
                },
              },
            ]
          : []),
      ]}
    >
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
        onKeyDown={shortcut}
      >
        <span
          className={cn('inline-flex shrink-0 items-center', TONE[record.kind])}
          aria-label={messages.activity.glyphs[record.kind]}
        >
          {GLYPH[record.kind]}
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
    </ContextMenu>
  );
});
