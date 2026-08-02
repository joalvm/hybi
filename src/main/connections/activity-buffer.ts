import type { ActivityRecord } from '@shared/ipc/activity.js';

/**
 * Coalesces activity into one IPC message per frame. A chatty server would
 * otherwise cost one round trip and one React commit per frame received.
 */
export class ActivityBuffer {
  private pending: ActivityRecord[] = [];
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly flush: (records: ActivityRecord[]) => void,
    private readonly intervalMs = 16,
  ) {}

  push(record: ActivityRecord): void {
    this.pending.push(record);
    this.timer ??= setTimeout(() => {
      this.drain();
    }, this.intervalMs);
  }

  dispose(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    this.pending = [];
  }

  private drain(): void {
    this.timer = null;
    if (this.pending.length === 0) return;
    const batch = this.pending;
    this.pending = [];
    this.flush(batch);
  }
}
