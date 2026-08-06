import { format } from '@lang/translate.js';
import type { WorkspaceSummary } from '@shared/domain/types.js';
import { useMessages } from '../../shared/i18n/useMessages.js';
import { cn } from '../../shared/utils/cn.js';

const recentWorkspaceButtonClassName = cn(
  'group flex min-h-8.5 w-full items-center gap-2 px-2 text-left',
  'cursor-pointer border-0 bg-transparent text-muted',
  'enabled:hover:bg-accent-soft enabled:hover:text-accent-text',
  'focus-visible:text-foreground focus-visible:outline focus-visible:outline-1',
  'focus-visible:-outline-offset-1 focus-visible:outline-accent',
);

type Props = {
  summaries: WorkspaceSummary[];
  status: 'loading' | 'ready' | 'error';
  error: string | null;
  onOpen: (workspaceId: string) => void;
};

/** The documents already on disk. Empty, loading and failed are all sayable. */
export function WelcomeRecent({ summaries, status, error, onOpen }: Props) {
  const messages = useMessages().welcome;

  return (
    <div className="mt-8 min-h-0 overflow-y-auto">
      <h2 className="border-b border-border-subtle pb-2 text-kicker font-semibold tracking-kicker text-muted uppercase">
        {messages.recent}
      </h2>

      {status === 'loading' && (
        <p className="py-3 text-label text-muted" role="status">
          {messages.loading}
        </p>
      )}
      {status === 'error' && (
        <p className="py-3 text-label text-error" role="alert">
          {format(messages.loadFailed, { error: error ?? '' })}
        </p>
      )}
      {status === 'ready' && summaries.length === 0 && (
        <p className="py-3 text-label text-muted">{messages.empty}</p>
      )}

      {summaries.length > 0 && (
        <nav aria-label={messages.recentNav}>
          <ul className="list-none p-0">
            {summaries.map((workspace) => (
              <li key={workspace.id} className="border-b border-border-subtle">
                <button
                  type="button"
                  className={recentWorkspaceButtonClassName}
                  aria-label={format(messages.open, { name: workspace.name })}
                  onClick={() => {
                    onOpen(workspace.id);
                  }}
                >
                  <span
                    className="h-px w-3 bg-border group-hover:bg-accent group-focus-visible:bg-accent"
                    aria-hidden="true"
                  />
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {workspace.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
