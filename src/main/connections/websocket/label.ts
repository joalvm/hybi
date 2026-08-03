const PREVIEW_LENGTH = 48;

/** Derives a display hint without changing the exact body sent or received. */
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
