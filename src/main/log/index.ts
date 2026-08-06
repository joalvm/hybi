import { AppLog, type LogLevel } from './writer.js';

/**
 * Boot names the file; until it does, every call is a no-op. Deliberately free
 * of `electron` and of the path module that reads it: the code that logs is
 * plain functions deep inside a socket, and importing either would drag the
 * whole app into their tests.
 */
let current: AppLog | null = null;

export function startAppLog(path: string): AppLog {
  current = new AppLog(path);
  return current;
}

export function logEvent(level: LogLevel, scope: string, message: string): void {
  current?.append(level, scope, message);
}
