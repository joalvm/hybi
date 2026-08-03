import type { RetryPolicy } from '@shared/domain/types.js';
import { nextDelay } from './backoff.js';

/** Owns one adapter's reconnect counter and pending timer. */
export class RetryScheduler {
  private timer: NodeJS.Timeout | null = null;
  private booked = 0;

  get attempts(): number {
    return this.booked;
  }

  reset(): void {
    this.booked = 0;
  }

  schedule(policy: RetryPolicy, run: () => void): number | null {
    if (this.timer !== null || !policy.enabled || this.booked >= policy.attempts) return null;
    const delay = nextDelay(this.booked, policy);
    this.booked += 1;
    this.timer = setTimeout(() => {
      this.timer = null;
      run();
    }, delay);
    return delay;
  }

  cancel(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }
}
