const PREVIEW_LENGTH = 48;

/**
 * A display hint only. When the payload happens to be a `{event, data}`
 * envelope the event name reads better in the list than the raw JSON, but
 * nothing is unwrapped: `ActivityRecord.body` keeps the exact bytes.
 */
export function labelOf(body: string): string {
  try {
    const parsed: unknown = JSON.parse(body);
    if (typeof parsed === 'object' && parsed !== null && 'event' in parsed) {
      const { event } = parsed;
      if (typeof event === 'string' && event.length > 0) return event;
    }
  } catch {
    // Not JSON. Fall through to the truncated preview.
  }

  const preview = body.replace(/\s+/g, ' ').trim();
  return preview.length > PREVIEW_LENGTH ? `${preview.slice(0, PREVIEW_LENGTH)}…` : preview;
}
