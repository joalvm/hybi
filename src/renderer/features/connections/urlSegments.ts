import { scanVariables } from '@shared/variables/scan.js';

export type UrlTone = 'plain' | 'resolved' | 'missing' | 'pending';
export type UrlSegment = { text: string; tone: UrlTone; name?: string };

/** Returns active variable query while the user is typing an interpolation. */
export function variableQuery(text: string): string | null {
  const start = text.lastIndexOf('{{');
  if (start < 0) return null;

  const query = text.slice(start + 2);
  if (query.includes('{') || query.includes('}') || query.includes('\n')) return null;
  return query;
}

/** Splits URL template into plain, complete and in-progress variable parts. */
export function urlSegments(text: string, missing: readonly string[]): UrlSegment[] {
  const segments: UrlSegment[] = [];
  let cursor = 0;
  const query = variableQuery(text);
  const pendingStart = query === null ? -1 : text.lastIndexOf('{{');

  for (const token of scanVariables(text)) {
    if (pendingStart >= cursor && token.start >= pendingStart) break;
    if (token.start > cursor) {
      segments.push({ text: text.slice(cursor, token.start), tone: 'plain' });
    }
    segments.push({
      text: text.slice(token.start, token.end),
      tone: missing.includes(token.name) ? 'missing' : 'resolved',
      name: token.name,
    });
    cursor = token.end;
  }

  if (pendingStart >= cursor) {
    if (pendingStart > cursor) {
      segments.push({ text: text.slice(cursor, pendingStart), tone: 'plain' });
    }
    segments.push({ text: text.slice(pendingStart), tone: 'pending' });
    cursor = text.length;
  }

  if (cursor < text.length) segments.push({ text: text.slice(cursor), tone: 'plain' });
  return segments;
}
