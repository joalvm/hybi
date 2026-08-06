import { format } from '@lang/translate.js';
import type { WorkspaceSummary } from '@shared/domain/types.js';
import { useMessages } from '../../shared/i18n/useMessages.js';
import { cn } from '../../shared/utils/cn.js';

const buttonClassName = cn(
  'group flex min-h-8.5 w-full items-center gap-2 px-2 text-left',
  'cursor-pointer border-0 bg-transparent text-muted',
  'enabled:hover:bg-accent-soft enabled:hover:text-accent-text',
  'focus-visible:text-foreground focus-visible:outline focus-visible:outline-1',
  'focus-visible:-outline-offset-1 focus-visible:outline-accent',
);

type Props = { summary: WorkspaceSummary; onOpen: (workspaceId: string) => void };

/** A document that opens. The whole row is the target, so nothing else is. */
export function WelcomeWorkspaceRow({ summary, onOpen }: Props) {
  const messages = useMessages().welcome;

  return (
    <li className="border-b border-border-subtle">
      <button
        type="button"
        className={buttonClassName}
        aria-label={format(messages.open, { name: summary.name })}
        onClick={() => {
          onOpen(summary.id);
        }}
      >
        <span
          className="h-px w-3 bg-border group-hover:bg-accent group-focus-visible:bg-accent"
          aria-hidden="true"
        />
        <span className="overflow-hidden text-ellipsis whitespace-nowrap">{summary.name}</span>
      </button>
    </li>
  );
}
