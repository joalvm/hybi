import { join } from 'node:path';
import { app } from 'electron';

export function workspacesDirectory(): string {
  return join(app.getPath('userData'), 'workspaces');
}
