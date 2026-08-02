import { parseInline } from './inline.js';
import type { Block, Inline } from './types.js';

const FENCE = /^```(\w*)\s*$/;
const HEADING = /^(#{1,6})\s+(.*)$/;
const RULE = /^(?:-{3,}|\*{3,}|_{3,})$/;
const BULLET = /^[-*+]\s+(.*)$/;
const ORDERED = /^\d+[.)]\s+(.*)$/;
const QUOTE = /^>\s?(.*)$/;

/** A block and the line the walker resumes on. */
type Reading = { block: Block; next: number };

const at = (lines: string[], index: number): string => lines[index] ?? '';

/** True for any line that cannot be swallowed into the paragraph above it. */
function opensBlock(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed === '' ||
    FENCE.test(line) ||
    HEADING.test(line) ||
    RULE.test(trimmed) ||
    BULLET.test(line) ||
    ORDERED.test(line) ||
    QUOTE.test(line)
  );
}

/** An unterminated fence runs to the end of the text rather than being dropped. */
function readFence(lines: string[], start: number, language: string): Reading {
  const body: string[] = [];
  let index = start + 1;
  while (index < lines.length && !at(lines, index).startsWith('```')) {
    body.push(at(lines, index));
    index += 1;
  }
  return {
    block: { kind: 'fence', language, text: body.join('\n') },
    next: index + 1,
  };
}

function readList(lines: string[], start: number, ordered: boolean): Reading {
  const pattern = ordered ? ORDERED : BULLET;
  const items: Inline[][] = [];
  let index = start;
  let match = pattern.exec(at(lines, index));
  while (match !== null) {
    items.push(parseInline(match[1] ?? ''));
    index += 1;
    match = index < lines.length ? pattern.exec(at(lines, index)) : null;
  }
  return { block: { kind: 'list', ordered, items }, next: index };
}

function readQuote(lines: string[], start: number): Reading {
  const body: string[] = [];
  let index = start;
  let match = QUOTE.exec(at(lines, index));
  while (match !== null) {
    body.push(match[1] ?? '');
    index += 1;
    match = index < lines.length ? QUOTE.exec(at(lines, index)) : null;
  }
  return { block: { kind: 'quote', children: parseInline(body.join(' ')) }, next: index };
}

function readParagraph(lines: string[], start: number): Reading {
  const body: string[] = [at(lines, start)];
  let index = start + 1;
  while (index < lines.length && !opensBlock(at(lines, index))) {
    body.push(at(lines, index));
    index += 1;
  }
  return { block: { kind: 'paragraph', children: parseInline(body.join(' ')) }, next: index };
}

function readBlock(lines: string[], index: number): Reading {
  const line = at(lines, index);

  const fence = FENCE.exec(line);
  if (fence !== null) return readFence(lines, index, fence[1] ?? '');

  const heading = HEADING.exec(line);
  if (heading !== null) {
    return {
      block: {
        kind: 'heading',
        level: (heading[1] ?? '#').length,
        children: parseInline(heading[2] ?? ''),
      },
      next: index + 1,
    };
  }

  if (RULE.test(line.trim())) return { block: { kind: 'rule' }, next: index + 1 };
  if (QUOTE.test(line)) return readQuote(lines, index);
  if (ORDERED.test(line)) return readList(lines, index, true);
  if (BULLET.test(line)) return readList(lines, index, false);
  return readParagraph(lines, index);
}

/** Turns a description into blocks. Blank lines separate; nothing else does. */
export function parseBlocks(source: string): Block[] {
  const lines = source.replaceAll('\r\n', '\n').split('\n');
  const blocks: Block[] = [];
  let index = 0;

  while (index < lines.length) {
    if (at(lines, index).trim() === '') {
      index += 1;
      continue;
    }
    const reading = readBlock(lines, index);
    blocks.push(reading.block);
    index = reading.next;
  }

  return blocks;
}
