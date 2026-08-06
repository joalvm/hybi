import { currentPreferences } from './preferences/service.js';
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
 *
 * Reads the cache instead of the disk: boot has already loaded the file to
 * decide the language, and a second read would answer the same thing.
 */
export async function openStartupWindow(): Promise<void> {
  const preferences = currentPreferences();
  if (preferences.startup !== 'last-workspace') {
    openWelcome();
    return;
  }

  // `list()` is sorted by `updatedAt`, so the first entry is the last one used.
  // A file that could not be read is not a document to land in: welcome is the
  // window that reports it, and the one that can discard it.
  const summaries = await new WorkspaceRepository(workspacesDirectory()).list();
  const last = summaries.find((entry) => entry.broken === undefined);
  if (last === undefined) {
    openWelcome();
    return;
  }

  openWorkspace(last.id, null);
}
