import type { RetryPolicy } from '@shared/domain/types.js';
import { nextDelay } from './backoff.js';

/**
 * The attempt counter and the timer behind a reconnection, kept out of the
 * session so that file stays the socket's state machine and nothing else.
 *
 * `schedule` returns the delay it booked, or `null` when the policy has nothing
 * left to give: announcing the retry belongs to the caller, which is the one
 * that owns the activity log.
 */
export class RetryScheduler {
  private timer: NodeJS.Timeout | null = null;
  private booked = 0;

  /** Attempts booked since the last reset. */
  get attempts(): number {
    return this.booked;
  }

  reset(): void {
    this.booked = 0;
  }

  schedule(policy: RetryPolicy, run: () => void): number | null {
    if (!policy.enabled || this.booked >= policy.attempts) return null;

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
