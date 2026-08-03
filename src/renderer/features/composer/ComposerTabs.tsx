import { cn } from '@/shared/utils/cn.js';

/** Which face of the event is open: what it means, or what goes on the wire. */
export type ComposerTab = 'docs' | 'message';

type Props = {
  tab: ComposerTab;
  docsDirty: boolean;
  messageDirty: boolean;
  onChange: (tab: ComposerTab) => void;
};

const TABS: { id: ComposerTab; label: string }[] = [
  { id: 'docs', label: 'Docs' },
  { id: 'message', label: 'Message' },
];

export function ComposerTabs({ tab, docsDirty, messageDirty, onChange }: Props) {
  return (
    <div
      className="flex min-w-0 flex-1 items-center gap-1"
      role="tablist"
      aria-label="Vista del evento"
    >
      {TABS.map((entry) => (
        <button
          key={entry.id}
          type="button"
          role="tab"
          aria-selected={entry.id === tab}
          className={cn(
            'inline-flex h-5.5 cursor-pointer items-center gap-1 rounded-worktab border-0 bg-transparent px-3 text-muted hover:bg-elevated focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent',
            entry.id === tab && 'bg-selected text-foreground hover:bg-selected',
          )}
          onClick={() => {
            onChange(entry.id);
          }}
        >
          {entry.label}
          {((entry.id === 'docs' && docsDirty) || (entry.id === 'message' && messageDirty)) && (
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-label="Cambios sin guardar" />
          )}
        </button>
      ))}
    </div>
  );
}
