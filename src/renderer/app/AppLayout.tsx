import { useState, type ReactNode } from 'react';
import { SplitPane } from '@/shared/ui/SplitPane.js';
import { StatusBar } from './StatusBar.js';

type Props = {
  titleBar: ReactNode;
  tabs: ReactNode;
  catalog: ReactNode;
  connectionBar: ReactNode;
  composer: ReactNode;
  activity: ReactNode;
};

/**
 * Structure only: no store, no state, no decisions about what goes inside.
 *
 * The connection bar spans the whole right side rather than sitting on top of
 * the composer: the URL belongs to the connection, not to the payload, and this
 * is what puts the payload and the activity log on the same line.
 */
export function AppLayout({ titleBar, tabs, catalog, connectionBar, composer, activity }: Props) {
  const [catalogVisible, setCatalogVisible] = useState(true);

  return (
    <div className="flex h-full min-h-0 flex-col bg-app">
      <div
        className="app-drag-region platform-titlebar flex h-titlebar shrink-0 items-center gap-2 border-b border-border bg-chrome pl-2"
        data-part="title-bar"
      >
        {titleBar}
      </div>
      <div className="min-h-0 flex-1">
        <SplitPane direction="row" initial={22} min={12} firstCollapsed={!catalogVisible}>
          <aside
            className="h-full min-h-0 min-w-0 overflow-hidden bg-chrome"
            id="catalog-rail"
            data-part="catalog-rail"
            hidden={!catalogVisible}
          >
            {catalog}
          </aside>
          <main
            className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-panel"
            data-part="connection-surface"
          >
            <div className="bg-panel">{tabs}</div>
            {connectionBar}
            <div className="min-h-0 flex-1">
              <SplitPane direction="row" initial={45} min={20}>
                <div className="h-full min-h-0">{composer}</div>
                <div className="h-full min-h-0">{activity}</div>
              </SplitPane>
            </div>
          </main>
        </SplitPane>
      </div>
      <StatusBar
        catalogVisible={catalogVisible}
        onToggleCatalog={() => {
          setCatalogVisible((visible) => !visible);
        }}
      />
    </div>
  );
}
