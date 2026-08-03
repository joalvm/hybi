import { afterEach, describe, expect, it, vi } from 'vitest';
import { RetryScheduler } from '../../src/main/connections/websocket/retry.js';

describe('RetryScheduler', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('owns at most one pending retry timer', () => {
    vi.useFakeTimers();
    const scheduler = new RetryScheduler();
    const run = vi.fn();
    const policy = { enabled: true, attempts: 3, baseMs: 10, maxMs: 20 };

    expect(scheduler.schedule(policy, run)).not.toBeNull();
    expect(scheduler.schedule(policy, run)).toBeNull();
    vi.runAllTimers();

    expect(run).toHaveBeenCalledOnce();
    expect(scheduler.attempts).toBe(1);
  });
});
