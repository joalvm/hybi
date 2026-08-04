/**
 * What a frame is written in. This is a view setting, not a contract: the socket
 * carries the text either way, and nothing here refuses a payload for being the
 * wrong shape. It picks the editor's colouring and decides what "beautify" means.
 */
export type PayloadFormat = 'text' | 'json' | 'xml' | 'html' | 'binary';

export const PAYLOAD_FORMATS: { id: PayloadFormat; label: string }[] = [
  { id: 'text', label: 'Text' },
  { id: 'json', label: 'JSON' },
  { id: 'xml', label: 'XML' },
  { id: 'html', label: 'HTML' },
  { id: 'binary', label: 'Binary' },
];

/** Monaco's id for a format. Text and binary get no tokenizer at all. */
export function languageOf(format: PayloadFormat): string {
  if (format === 'json') return 'json';
  if (format === 'xml') return 'xml';
  if (format === 'html') return 'html';
  return 'plaintext';
}

/** Tags that never close, so an `<img>` must not indent everything after it. */
const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

/**
 * Indents by tag depth. Deliberately naive — it splits on angle brackets, so a
 * `>` inside a comment or an attribute value ends a token early. That is the
 * trade this button is for: a frame that arrived on one line, made readable.
 * Anything it cannot make sense of comes back unchanged by the caller.
 */
function beautifyMarkup(text: string, format: 'xml' | 'html'): string | null {
  const flat = text.replace(/>\s+</g, '><').trim();
  if (!flat.startsWith('<')) return null;

  const tokens = flat.split(/(<[^>]+>)/).filter((token) => token.trim() !== '');
  const lines: string[] = [];
  let depth = 0;

  for (const token of tokens) {
    const tag = token.startsWith('<');
    const closing = token.startsWith('</');
    if (closing) depth = Math.max(0, depth - 1);
    lines.push(`${'  '.repeat(depth)}${token.trim()}`);
    if (!tag || closing) continue;

    // A declaration, a doctype and a self-closing tag all open nothing.
    const standalone = token.endsWith('/>') || token.startsWith('<?') || token.startsWith('<!');
    const name = /^<\s*([\w:-]+)/.exec(token)?.[1]?.toLowerCase() ?? '';
    if (standalone || (format === 'html' && VOID_ELEMENTS.has(name))) continue;
    depth += 1;
  }

  return lines.join('\n');
}

/** True for whitespace only, without allocating a trimmed copy of the payload. */
const BLANK = /^\s*$/;

/** True when the first thing in the payload is a tag. */
const OPENS_WITH_TAG = /^\s*</;

/**
 * Whether the Formatear button has anything to do, decided without producing the
 * result. The button's disabled state is recomputed on every keystroke, and
 * producing the result to answer a yes-or-no question meant re-indenting the
 * whole payload — and, for JSON, allocating a second copy of it — per character
 * typed. The work now happens on the click that asked for it.
 */
export function canBeautify(text: string, format: PayloadFormat): boolean {
  if (BLANK.test(text)) return false;

  if (format === 'json') {
    try {
      JSON.parse(text);
      return true;
    } catch {
      return false;
    }
  }

  // `beautifyMarkup` refuses anything that does not open with a tag and re-indents
  // everything else, so this is exactly its own precondition.
  return (format === 'xml' || format === 'html') && OPENS_WITH_TAG.test(text);
}

/**
 * The re-indented text, or `null` when there is nothing this can do — a plain
 * text frame, a binary one, or JSON too broken to parse. Callers ask
 * `canBeautify` first; this is what runs when the user acts on the answer.
 */
export function beautify(text: string, format: PayloadFormat): string | null {
  if (BLANK.test(text)) return null;

  if (format === 'json') {
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      return null;
    }
  }

  if (format === 'xml' || format === 'html') return beautifyMarkup(text, format);
  return null;
}
