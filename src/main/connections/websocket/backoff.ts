export type BackoffOptions = {
  baseMs?: number;
  maxMs?: number;
  random?: () => number;
};

/** Exponential growth clamped at `maxMs`, plus up to 25 percent jitter. */
export function nextDelay(attempt: number, options: BackoffOptions = {}): number {
  const baseMs = options.baseMs ?? 500;
  const maxMs = options.maxMs ?? 8000;
  const random = options.random ?? Math.random;
  const raw = Math.min(baseMs * 2 ** attempt, maxMs);
  return Math.min(maxMs, Math.round(raw + raw * 0.25 * random()));
}
