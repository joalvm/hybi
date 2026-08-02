import clsx from 'clsx';

/** Which face of the event is open: what it means, or what goes on the wire. */
export type ComposerTab = 'docs' | 'message';

type Props = {
  tab: ComposerTab;
  /** Marks `Message`, because the payload is the only thing an edit touches. */
  dirty: boolean;
  onChange: (tab: ComposerTab) => void;
};

const TABS: { id: ComposerTab; label: string }[] = [
  { id: 'docs', label: 'Docs' },
  { id: 'message', label: 'Message' },
];

export function ComposerTabs({ tab, dirty, onChange }: Props) {
  return (
    <div className="composer-tabs" role="tablist" aria-label="Vista del evento">
      {TABS.map((entry) => (
        <button
          key={entry.id}
          type="button"
          role="tab"
          aria-selected={entry.id === tab}
          className={clsx('composer-tab', entry.id === tab && 'composer-tab--active')}
          onClick={() => {
            onChange(entry.id);
          }}
        >
          {entry.label}
          {entry.id === 'message' && dirty && (
            <span className="composer-dot" aria-label="Cambios sin guardar" />
          )}
        </button>
      ))}
    </div>
  );
}
