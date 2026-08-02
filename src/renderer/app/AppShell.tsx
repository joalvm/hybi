import { ActivityPanel } from '@/features/activity/ActivityPanel.js';
import { CatalogPanel } from '@/features/catalog/CatalogPanel.js';
import { ComposerPanel } from '@/features/composer/ComposerPanel.js';
import { ConnectionBar } from '@/features/connections/ConnectionBar.js';
import { ConnectionTabs } from '@/features/connections/ConnectionTabs.js';
import { useConnectionSocket } from '@/features/connections/useConnectionSocket.js';
import { VariablesDialog } from '@/features/workspace/VariablesDialog.js';
import { useStore } from '@/store/index.js';
import { AppLayout } from './AppLayout.js';
import { ErrorBoundary } from './ErrorBoundary.js';
import { TitleBar } from './TitleBar.js';
import { WindowChrome } from './WindowChrome.js';
import { useWorkspaceAutosave } from './useWorkspaceAutosave.js';
import { useWorkspaceBootstrap } from './useWorkspaceBootstrap.js';

/** Composition and the three top-level states. Nothing else lives here. */
export function AppShell() {
  useWorkspaceAutosave();
  useConnectionSocket();
  const bootstrap = useWorkspaceBootstrap();
  const workspace = useStore((state) => state.workspace);
  const connectionId = useStore((state) => state.activeConnectionId);

  // The document is opened by the welcome window, so this window only ever
  // waits for it or reports why it could not be read.
  if (workspace === null) {
    return (
      <ErrorBoundary>
        <WindowChrome resizable />
        {bootstrap.status === 'error' ? (
          <p className="app-state app-state--error">{bootstrap.message}</p>
        ) : (
          <p className="app-state">Abriendo workspace…</p>
        )}
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <AppLayout
        titleBar={<TitleBar />}
        tabs={<ConnectionTabs />}
        catalog={connectionId === null ? null : <CatalogPanel connectionId={connectionId} />}
        connectionBar={connectionId === null ? null : <ConnectionBar connectionId={connectionId} />}
        composer={
          connectionId === null ? (
            <p className="app-state">Crea una conexión para empezar.</p>
          ) : (
            <ComposerPanel connectionId={connectionId} />
          )
        }
        activity={connectionId === null ? null : <ActivityPanel connectionId={connectionId} />}
      />
      <VariablesDialog />
    </ErrorBoundary>
  );
}
