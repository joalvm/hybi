import type { ReactNode } from 'react';
import { SplitPane } from '@/shared/ui/SplitPane.js';

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
  return (
    <div className="app">
      <div className="app__title-bar">{titleBar}</div>
      <div className="app__body">
        <SplitPane direction="row" initial={22} min={12}>
          <aside className="app__catalog-rail">{catalog}</aside>
          <main className="app__connection-surface">
            <div className="app__tabs">{tabs}</div>
            {connectionBar}
            <div className="app__connection-workspace">
              <SplitPane direction="row" initial={45} min={20}>
                <div className="app__region">{composer}</div>
                <div className="app__region">{activity}</div>
              </SplitPane>
            </div>
          </main>
        </SplitPane>
      </div>
    </div>
  );
}
