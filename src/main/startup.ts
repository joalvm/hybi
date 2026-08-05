import { loadPreferences } from './preferences/service.js';
import { openWelcome, openWorkspace } from './shell.js';
import { workspacesDirectory } from './workspace/paths.js';
import { WorkspaceRepository } from './workspace/repository.js';

/**
 * What the app opens with. The welcome window is the answer for a fresh install
 * and for anyone who never changed the setting; the other branch skips it and
 * lands in the document that was last saved.
 *
 * A `last-workspace` preference with nothing to open still shows welcome rather
 * than an empty editor: there is no document to go back to yet.
 */
export async function openStartupWindow(): Promise<void> {
  const preferences = await loadPreferences();
  if (preferences.startup !== 'last-workspace') {
    openWelcome();
    return;
  }

  // `list()` is sorted by `updatedAt`, so the first entry is the last one used.
  const [last] = await new WorkspaceRepository(workspacesDirectory()).list();
  if (last === undefined) {
    openWelcome();
    return;
  }

  openWorkspace(last.id, null);
}
