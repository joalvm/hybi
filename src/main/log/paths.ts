import { join } from 'node:path';
import { app } from 'electron';

/** A directory and not a bare file: the rotated generation lives beside it. */
export function logDirectory(): string {
  return join(app.getPath('userData'), 'logs');
}

export function logFile(): string {
  return join(logDirectory(), 'hybi.log');
}
