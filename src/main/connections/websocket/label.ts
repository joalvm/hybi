const PREVIEW_LENGTH = 48;

/**
 * Above this, a frame is never parsed to read one field. `maxMessageBytes`
 * allows a hundred megabytes: building the whole object graph of such a frame,
 * on every frame, to print a 48-character hint costs more in the main process
 * than the socket itself and leaves the garbage collector to clean up after it.
 */
export const LABEL_PARSE_LIMIT = 64 * 1024;

/**
 * How much of the body the flattened preview looks at. Bounded for the same
 * reason: collapsing the whitespace of a whole frame allocates a second copy of
 * it. Wide enough that only a body of thousands of leading blanks loses text.
 */
const PREVIEW_WINDOW = 4096;

/** Derives a display hint without changing the exact body sent or received. */
export function labelOf(body: string): string {
  const named = eventName(body);
  if (named !== null) return named;

  const preview = body.slice(0, PREVIEW_WINDOW).replace(/\s+/g, ' ').trim();
  return preview.length > PREVIEW_LENGTH ? `${preview.slice(0, PREVIEW_LENGTH)}…` : preview;
}

/**
 * The `event` of an `{event, data}` envelope, or `null` for anything else.
 *
 * Reading the field correctly means parsing, so the parse is gated twice: on the
 * size of the frame, and on the text containing the key at all. A valid JSON
 * object with an `event` member always carries the literal `"event"` — only an
 * escaped spelling of the same name would slip past, which no encoder emits.
 */
function eventName(body: string): string | null {
  if (body.length > LABEL_PARSE_LIMIT || !body.includes('"event"')) return null;

  try {
    const parsed: unknown = JSON.parse(body);
    if (typeof parsed === 'object' && parsed !== null && 'event' in parsed) {
      const { event } = parsed;
      if (typeof event === 'string' && event.length > 0) return event;
    }
  } catch {
    // Not JSON. The caller falls through to the truncated preview.
  }

  return null;
}
