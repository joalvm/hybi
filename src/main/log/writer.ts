import { appendFile, mkdir, rename, rm, stat } from 'node:fs/promises';
import { dirname } from 'node:path';

export type LogLevel = 'info' | 'warn' | 'error';

/** Half a megabyte per generation: enough history to read, small enough to attach. */
const DEFAULT_MAX_BYTES = 512 * 1024;

/**
 * The application log. Plain lines so the file can be attached to an issue
 * without being reviewed first, which is only true because of what never
 * reaches it: no headers, no tokens and no message bodies — a URL without its
 * query, an error code and a connection state, and nothing else.
 *
 * The path is injected rather than read from Electron, the same way the
 * repositories take theirs, so the writer is testable without booting an app.
 */
export class AppLog {
  private queue: Promise<void> = Promise.resolve();

  constructor(
    private readonly path: string,
    private readonly maxBytes: number = DEFAULT_MAX_BYTES,
  ) {}

  /**
   * Fire and forget, and serialised: nothing waits on a log line, and a disk
   * that cannot take one must not break the connection that produced it.
   */
  append(level: LogLevel, scope: string, message: string): void {
    const line = `${new Date().toISOString()} ${level} ${scope} ${message}\n`;
    this.queue = this.queue.then(() => this.write(line)).catch(() => undefined);
  }

  /** Everything appended so far has reached disk, or has failed trying. */
  async settled(): Promise<void> {
    await this.queue;
  }

  private async write(line: string): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true });
    await this.rotate(Buffer.byteLength(line, 'utf8'));
    await appendFile(this.path, line, 'utf8');
  }

  /**
   * One previous generation and no more: a log that grows without a ceiling is
   * a disk leak, and one that keeps every generation is the same leak slower.
   */
  private async rotate(incoming: number): Promise<void> {
    const size = await this.size();
    if (size === 0 || size + incoming <= this.maxBytes) return;

    // `rename` refuses an existing destination on Windows, so the generation
    // being replaced goes first.
    await rm(`${this.path}.1`, { force: true });
    await rename(this.path, `${this.path}.1`);
  }

  private async size(): Promise<number> {
    try {
      return (await stat(this.path)).size;
    } catch {
      return 0;
    }
  }
}
