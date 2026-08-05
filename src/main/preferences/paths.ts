import { join } from 'node:path';
import { app } from 'electron';

/** Beside the workspaces directory, never inside it: this is not a document. */
export function preferencesFile(): string {
  return join(app.getPath('userData'), 'preferences.json');
}
