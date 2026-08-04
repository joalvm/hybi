/**
 * The DOM side of the URL field. React renders the `contenteditable` empty and
 * never owns what is inside it: the browser edits those nodes on every
 * keystroke — splitting, merging and dropping them — and a reconciler holding
 * references to nodes that moved under it throws on the next removal.
 *
 * So the field is repainted wholesale from the segments, and the caret, which
 * is a DOM position rather than a number, is read out as a character offset
 * before the repaint and written back onto the new nodes after it.
 */
import type { UrlSegment } from './urlSegments.js';

const TONE_CLASS: Record<UrlSegment['tone'], string> = {
  plain: '',
  resolved: 'wsw-url-var wsw-var-resolved',
  missing: 'wsw-url-var wsw-var-missing',
  pending: 'wsw-var-pending',
};

/** Replaces the field's contents. Plain runs stay bare text nodes. */
export function paintSegments(root: HTMLElement, segments: readonly UrlSegment[]): void {
  const doc = root.ownerDocument;
  root.replaceChildren(
    ...segments.map((segment) => {
      if (segment.tone === 'plain') return doc.createTextNode(segment.text);
      const span = doc.createElement('span');
      span.className = TONE_CLASS[segment.tone];
      if (segment.name !== undefined) span.dataset.variable = segment.name;
      span.textContent = segment.text;
      return span;
    }),
  );
}

/** Plain text of the field. Contenteditable pads trailing spaces with U+00A0. */
export function readText(root: HTMLElement): string {
  return root.textContent.replace(/\u00a0/g, ' ');
}

function offsetOf(root: HTMLElement, node: Node, nodeOffset: number): number {
  const range = root.ownerDocument.createRange();
  range.selectNodeContents(root);
  range.setEnd(node, nodeOffset);
  return range.toString().length;
}

/** Character offsets of the current selection, ordered start before end. */
export function readSelection(root: HTMLElement): { start: number; end: number } {
  const selection = root.ownerDocument.getSelection();
  const anchorNode = selection?.anchorNode ?? null;
  const focusNode = selection?.focusNode ?? null;
  if (selection === null || anchorNode === null || focusNode === null) return { start: 0, end: 0 };
  if (!root.contains(anchorNode) || !root.contains(focusNode)) return { start: 0, end: 0 };

  const anchor = offsetOf(root, anchorNode, selection.anchorOffset);
  const focus = offsetOf(root, focusNode, selection.focusOffset);
  return { start: Math.min(anchor, focus), end: Math.max(anchor, focus) };
}

/** Where the caret would land after typing: the moving end of the selection. */
export function readCaret(root: HTMLElement): number {
  const selection = root.ownerDocument.getSelection();
  const focusNode = selection?.focusNode ?? null;
  if (selection === null || focusNode === null || !root.contains(focusNode)) return 0;
  return offsetOf(root, focusNode, selection.focusOffset);
}

/** Collapses the caret at a character offset, clamped to the text that exists. */
export function writeCaret(root: HTMLElement, offset: number): void {
  const selection = root.ownerDocument.getSelection();
  if (selection === null) return;

  const range = root.ownerDocument.createRange();
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let remaining = offset;
  let node = walker.nextNode();

  while (node !== null) {
    const length = node.textContent?.length ?? 0;
    if (remaining <= length) {
      range.setStart(node, remaining);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }
    remaining -= length;
    node = walker.nextNode();
  }

  // Past the last character, or the field is empty and holds no text node yet.
  range.selectNodeContents(root);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}
