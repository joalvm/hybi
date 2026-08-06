import type { Workspace, WorkspaceSummary } from '@shared/domain/types.js';
import { bridge } from '@/ipc/bridge.js';
import { useStore } from '@/store/index.js';

/**
 * Installs a document before the main editor opens. The store is reset first so no
 * connection id from the previous workspace survives inside the record-shaped
 * slices, and autosave stays quiet: a load is not an edit.
 *
 * Whatever main hands over already has its starter connection, so nothing is
 * added here.
 */
export function install(workspace: Workspace): void {
  const store = useStore.getState();
  store.reset();
  store.setWorkspace(workspace);
  const first = workspace.connections[0];
  if (first !== undefined) store.setActiveConnection(first.id);
}

/**
 * Autosave is debounced, so the file can be up to a moment behind the store.
 * Anything that reads the file — switching away, duplicating — writes first.
 */
export async function flush(): Promise<void> {
  const current = useStore.getState().workspace;
  if (current !== null) await bridge.workspace.save(current);
}

/**
 * The menu switches documents, so it only offers the ones that open. A file
 * that could not be read is reported in the welcome window, which is where it
 * can also be discarded.
 */
export function openable(summaries: WorkspaceSummary[]): WorkspaceSummary[] {
  return summaries.filter((entry) => entry.broken === undefined);
}
