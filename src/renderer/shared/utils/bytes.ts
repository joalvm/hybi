/** One decimal at most: this reports an order of magnitude, not an audit. */
const NUMBER = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });

const UNITS = ['B', 'kB', 'MB', 'GB'] as const;

/** Thousands separators for a frame count, in the locale the interface uses. */
export function formatCount(value: number): string {
  return NUMBER.format(value);
}

/**
 * Decimal units, like every network tool. `maxMessageBytes` is written in KiB
 * because that is the ceiling the socket enforces, but what crossed the wire is
 * read against the figures a server reports, and those count in thousands.
 */
export function formatBytes(bytes: number): string {
  let value = bytes;
  let unit = 0;
  while (value >= 1000 && unit < UNITS.length - 1) {
    value /= 1000;
    unit += 1;
  }
  return `${NUMBER.format(value)} ${UNITS[unit] ?? 'B'}`;
}
