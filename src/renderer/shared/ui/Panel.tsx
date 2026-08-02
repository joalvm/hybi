import type { ReactNode } from 'react';

type Props = {
  /** Optional: the catalog puts a toolbar where a title used to be. */
  title?: string | undefined;
  actions?: ReactNode;
  children: ReactNode;
};

export function Panel({ title, actions, children }: Props) {
  const header = title !== undefined || actions !== undefined;

  return (
    <section className="panel">
      {header && (
        <header className="panel-header">
          {title !== undefined && <h2 className="panel-title">{title}</h2>}
          {actions !== undefined && <div className="panel-actions">{actions}</div>}
        </header>
      )}
      <div className="panel-body">{children}</div>
    </section>
  );
}
