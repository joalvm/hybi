/**
 * The record-shaped slices are keyed by connection, by event or by collection,
 * so removing an entry always means removing a computed key. `delete` is not
 * available for that — `no-dynamic-delete` forbids it — and the obvious
 * workaround, `Object.fromEntries(Object.entries(source).filter(...))`, walks the
 * map three times and builds an array of pairs on the way. Rest destructuring
 * does it in one copy, which is what these helpers exist for.
 */

/** The map without one key, or the same map when the key was not there. */
export function without<T>(source: Record<string, T>, key: string): Record<string, T> {
  if (!(key in source)) return source;
  const { [key]: _dropped, ...rest } = source;
  return rest;
}

/** The map without every key under a prefix. Used for the composite draft keys. */
export function withoutPrefix<T>(source: Record<string, T>, prefix: string): Record<string, T> {
  const rest: Record<string, T> = {};
  for (const [key, value] of Object.entries(source)) {
    if (!key.startsWith(prefix)) rest[key] = value;
  }
  return rest;
}
