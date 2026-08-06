import type { ActivityKind } from '@shared/ipc/activity.js';
import { useMessages } from '@/shared/i18n/useMessages.js';
import { ErrorIcon, IncomingIcon, OutgoingIcon, StatusIcon } from '@/shared/ui/icons.js';
import { cn } from '@/shared/utils/cn.js';
import type { HiddenActivityKinds } from '@/store/ui.slice.js';

/** The four kinds a row can be, in the colours the log already gives them. */
const KINDS = [
  { key: 'incoming', icon: <IncomingIcon />, tone: 'text-blue' },
  { key: 'outgoing', icon: <OutgoingIcon />, tone: 'text-accent-text' },
  { key: 'status', icon: <StatusIcon />, tone: 'text-ok' },
  { key: 'error', icon: <ErrorIcon />, tone: 'text-error' },
] as const satisfies readonly { key: ActivityKind; icon: unknown; tone: string }[];

type Props = {
  hidden: HiddenActivityKinds;
  onToggle: (kind: ActivityKind) => void;
};

/**
 * Four switches rather than a dropdown: the state of the filter has to be
 * readable without opening anything, or a log that is hiding half its rows looks
 * like a socket that went quiet.
 */
export function ActivityKindFilter({ hidden, onToggle }: Props) {
  const messages = useMessages();

  return (
    <div className="flex items-center">
      {KINDS.map((kind) => {
        const shown = hidden[kind.key] !== true;
        const label = messages.activity.filters[kind.key];
        return (
          <button
            key={kind.key}
            type="button"
            className={cn(
              'inline-flex min-h-control cursor-pointer items-center justify-center rounded-ui border border-transparent bg-transparent px-1 hover:bg-hover focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent',
              shown ? kind.tone : 'text-muted opacity-40',
            )}
            aria-label={label}
            aria-pressed={shown}
            title={label}
            onClick={() => {
              onToggle(kind.key);
            }}
          >
            {kind.icon}
          </button>
        );
      })}
    </div>
  );
}
