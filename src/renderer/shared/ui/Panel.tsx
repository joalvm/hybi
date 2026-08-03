import type { ReactNode } from 'react';
import { cn } from '../utils/cn.js';

type Props = {
  /** Optional: the catalog puts a toolbar where a title used to be. */
  title?: string | undefined;
  actions?: ReactNode;
  surface?: 'panel' | 'chrome';
  children: ReactNode;
};

export function Panel({ title, actions, surface = 'panel', children }: Props) {
  const header = title !== undefined || actions !== undefined;

  return (
    <section
      className={cn(
        'flex h-full min-h-0 min-w-0 flex-col overflow-hidden',
        surface === 'chrome' ? 'bg-chrome' : 'bg-panel',
      )}
    >
      {header && (
        <header className="flex min-h-9 items-center gap-2 px-3">
          {title !== undefined && (
            <h2 className="flex-1 text-label font-semibold tracking-wide text-muted uppercase">
              {title}
            </h2>
          )}
          {actions !== undefined && <div className="flex items-center gap-1">{actions}</div>}
        </header>
      )}
      <div className="min-h-0 flex-1 overflow-auto" data-part="panel-body">
        {children}
      </div>
    </section>
  );
}
