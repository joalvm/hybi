import type { Inline } from './types.js';

/**
 * One alternation, tried left to right, so `**` wins over `*` and a code span
 * wins over everything inside it. Every branch demands at least one character,
 * which is what keeps the scanner below from standing still on an empty match.
 */
const TOKEN =
  /`([^`]+)`|\*\*([\s\S]+?)\*\*|__([\s\S]+?)__|\*([\s\S]+?)\*|_([\s\S]+?)_|\[([^\]]*)\]\(([^\s)]+)\)/;

/**
 * Only `http` and `https` survive. A `javascript:` href is a script rather than
 * a document, and the description this text came from is an imported file.
 */
function safeHref(href: string): string | null {
  return /^https?:\/\//i.test(href) ? href : null;
}

function tokenOf(match: RegExpExecArray): Inline {
  const [whole, code, strongStar, strongUnder, emStar, emUnder, linkText, linkHref] = match;
  if (code !== undefined) return { kind: 'code', text: code };

  const strong = strongStar ?? strongUnder;
  if (strong !== undefined) return { kind: 'strong', children: parseInline(strong) };

  const em = emStar ?? emUnder;
  if (em !== undefined) return { kind: 'em', children: parseInline(em) };

  const href = linkHref === undefined ? null : safeHref(linkHref);
  // A link this app refuses to open is still text the reader asked to see, so
  // the source is printed rather than dropped.
  if (href === null) return { kind: 'text', text: whole };
  return { kind: 'link', href, children: parseInline(linkText ?? '') };
}

/** Splits one line of markdown into runs. Unmatched syntax stays literal. */
export function parseInline(source: string): Inline[] {
  const out: Inline[] = [];
  let rest = source;

  while (rest !== '') {
    const match = TOKEN.exec(rest);
    if (match === null) {
      out.push({ kind: 'text', text: rest });
      break;
    }
    if (match.index > 0) out.push({ kind: 'text', text: rest.slice(0, match.index) });
    out.push(tokenOf(match));
    rest = rest.slice(match.index + match[0].length);
  }

  return out;
}
