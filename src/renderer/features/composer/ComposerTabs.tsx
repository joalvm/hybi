import { useMessages } from '@/shared/i18n/useMessages.js';
import { cn } from '@/shared/utils/cn.js';

/** Which face of the event is open: what it means, or what goes on the wire. */
export type ComposerTab = 'docs' | 'message';

type Props = {
  tab: ComposerTab;
  docsDirty: boolean;
  messageDirty: boolean;
  onChange: (tab: ComposerTab) => void;
};

const TAB_IDS: ComposerTab[] = ['docs', 'message'];

export function ComposerTabs({ tab, docsDirty, messageDirty, onChange }: Props) {
  const messages = useMessages().composer.tabs;

  return (
    <div
      className="flex min-w-0 flex-1 items-center gap-1"
      role="tablist"
      aria-label={messages.label}
    >
      {TAB_IDS.map((id) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={id === tab}
          className={cn(
            'inline-flex h-5.5 cursor-pointer items-center gap-1 rounded-worktab border-0 bg-transparent px-3 text-muted hover:bg-elevated focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent',
            id === tab && 'bg-selected text-foreground hover:bg-selected',
          )}
          onClick={() => {
            onChange(id);
          }}
        >
          {messages[id]}
          {((id === 'docs' && docsDirty) || (id === 'message' && messageDirty)) && (
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-label={messages.unsaved} />
          )}
        </button>
      ))}
    </div>
  );
}
