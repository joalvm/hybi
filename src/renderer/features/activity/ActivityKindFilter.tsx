import type { ActivityKind } from '@shared/ipc/activity.js';
import { ErrorIcon, IncomingIcon, OutgoingIcon, StatusIcon } from '@/shared/ui/icons.js';
import { cn } from '@/shared/utils/cn.js';
import type { HiddenActivityKinds } from '@/store/ui.slice.js';

/** The four kinds a row can be, in the colours the log already gives them. */
const KINDS = [
  { key: 'incoming', label: 'Entrantes', icon: <IncomingIcon />, tone: 'text-blue' },
  { key: 'outgoing', label: 'Salientes', icon: <OutgoingIcon />, tone: 'text-accent-text' },
  { key: 'status', label: 'Estado', icon: <StatusIcon />, tone: 'text-ok' },
  { key: 'error', label: 'Errores', icon: <ErrorIcon />, tone: 'text-error' },
] as const satisfies readonly { key: ActivityKind; label: string; icon: unknown; tone: string }[];

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
  return (
    <div className="flex items-center">
      {KINDS.map((kind) => {
        const shown = hidden[kind.key] !== true;
        return (
          <button
            key={kind.key}
            type="button"
            className={cn(
              'inline-flex min-h-control cursor-pointer items-center justify-center rounded-ui border border-transparent bg-transparent px-1 hover:bg-hover focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent',
              shown ? kind.tone : 'text-muted opacity-40',
            )}
            aria-label={kind.label}
            aria-pressed={shown}
            title={kind.label}
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
