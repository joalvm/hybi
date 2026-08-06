import { format } from '@lang/translate.js';
import type { WorkspaceDefect, WorkspaceSummary } from '@shared/domain/types.js';
import { useMessages } from '../../shared/i18n/useMessages.js';
import { Button } from '../../shared/ui/Button.js';

type Props = {
  summary: WorkspaceSummary;
  defect: WorkspaceDefect;
  /** Hands the defect back so the caller does not have to re-narrow it. */
  onDiscard: (defect: WorkspaceDefect) => void;
};

/**
 * A file that is on disk and does not open. It is not a button: there is
 * nothing to open. What it offers is the path — so the file can be inspected or
 * repaired outside the app — and the way to stop being asked about it.
 */
export function WelcomeBrokenRow({ summary, defect, onDiscard }: Props) {
  const messages = useMessages().welcome;

  return (
    <li className="border-b border-border-subtle">
      <div className="flex min-h-8.5 w-full items-center gap-2 px-2 py-2 text-left">
        <span className="h-px w-3 shrink-0 bg-error" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-error">
            {messages.broken}
          </span>
          <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-label text-muted">
            {defect.path}
          </span>
          <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-label text-muted">
            {defect.reason}
          </span>
        </span>
        <Button
          tone="danger"
          size="sm"
          aria-label={format(messages.discard, { name: summary.name })}
          onClick={() => {
            onDiscard(defect);
          }}
        >
          {messages.discardAction}
        </Button>
      </div>
    </li>
  );
}
