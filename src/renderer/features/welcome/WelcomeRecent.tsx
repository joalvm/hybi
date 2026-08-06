import { useState } from 'react';
import { format } from '@lang/translate.js';
import type { WorkspaceSummary } from '@shared/domain/types.js';
import { useMessages } from '../../shared/i18n/useMessages.js';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog.js';
import { WelcomeBrokenRow } from './WelcomeBrokenRow.js';
import { WelcomeWorkspaceRow } from './WelcomeWorkspaceRow.js';

type Discarding = { id: string; path: string };

type Props = {
  summaries: WorkspaceSummary[];
  status: 'loading' | 'ready' | 'error';
  error: string | null;
  onOpen: (workspaceId: string) => void;
  onDiscard: (workspaceId: string) => void;
};

/** The documents already on disk. Empty, loading and failed are all sayable. */
export function WelcomeRecent({ summaries, status, error, onOpen, onDiscard }: Props) {
  const messages = useMessages().welcome;
  const [discarding, setDiscarding] = useState<Discarding | null>(null);

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
            {summaries.map((summary) =>
              summary.broken === undefined ? (
                <WelcomeWorkspaceRow key={summary.id} summary={summary} onOpen={onOpen} />
              ) : (
                <WelcomeBrokenRow
                  key={summary.id}
                  summary={summary}
                  defect={summary.broken}
                  onDiscard={(defect) => {
                    setDiscarding({ id: summary.id, path: defect.path });
                  }}
                />
              ),
            )}
          </ul>
        </nav>
      )}

      {discarding !== null && (
        <ConfirmDialog
          open
          title={messages.discardTitle}
          message={format(messages.discardMessage, { path: discarding.path })}
          confirmLabel={messages.discardAction}
          onConfirm={() => {
            onDiscard(discarding.id);
          }}
          onClose={() => {
            setDiscarding(null);
          }}
        />
      )}
    </div>
  );
}
