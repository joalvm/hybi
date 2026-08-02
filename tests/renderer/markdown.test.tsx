import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { parseBlocks } from '@/shared/markdown/blocks.js';
import { parseInline } from '@/shared/markdown/inline.js';
import { Markdown } from '@/shared/markdown/Markdown.js';

describe('parseInline', () => {
  it('reads code, emphasis and links', () => {
    expect(parseInline('un `token` **obligatorio** y *opcional*')).toEqual([
      { kind: 'text', text: 'un ' },
      { kind: 'code', text: 'token' },
      { kind: 'text', text: ' ' },
      { kind: 'strong', children: [{ kind: 'text', text: 'obligatorio' }] },
      { kind: 'text', text: ' y ' },
      { kind: 'em', children: [{ kind: 'text', text: 'opcional' }] },
    ]);
  });

  it('keeps a link only when the scheme is one a browser can be handed', () => {
    expect(parseInline('[docs](https://example.test/a)')).toEqual([
      {
        kind: 'link',
        href: 'https://example.test/a',
        children: [{ kind: 'text', text: 'docs' }],
      },
    ]);
    // Refused, and printed as the characters that were typed: the source of a
    // link this app will not open is still text the reader asked to see.
    const refused = parseInline('[x](javascript:alert(1))');
    expect(refused.some((node) => node.kind === 'link')).toBe(false);
    expect(refused.map((node) => (node.kind === 'text' ? node.text : '')).join('')).toBe(
      '[x](javascript:alert(1))',
    );
  });

  it('leaves unmatched syntax as the characters that were typed', () => {
    expect(parseInline('2 * 3 * 4 = 24')).toEqual([
      { kind: 'text', text: '2 ' },
      { kind: 'em', children: [{ kind: 'text', text: ' 3 ' }] },
      { kind: 'text', text: ' 4 = 24' },
    ]);
    expect(parseInline('sin sintaxis')).toEqual([{ kind: 'text', text: 'sin sintaxis' }]);
  });
});

describe('parseBlocks', () => {
  it('separates headings, paragraphs and rules on blank lines', () => {
    const blocks = parseBlocks('# Título\n\nUna línea\ny su continuación\n\n---');
    expect(blocks.map((block) => block.kind)).toEqual(['heading', 'paragraph', 'rule']);
    expect(blocks[0]).toMatchObject({ level: 1 });
    expect(blocks[1]).toMatchObject({
      children: [{ kind: 'text', text: 'Una línea y su continuación' }],
    });
  });

  it('groups consecutive bullets into one list', () => {
    const blocks = parseBlocks('- uno\n- dos\n\n1. tres');
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({ kind: 'list', ordered: false });
    expect(blocks[1]).toMatchObject({ kind: 'list', ordered: true });
  });

  /** A fence nobody closed runs to the end rather than swallowing the parser. */
  it('reads a fence, closed or not', () => {
    expect(parseBlocks('```json\n{"a":1}\n```')).toEqual([
      { kind: 'fence', language: 'json', text: '{"a":1}' },
    ]);
    expect(parseBlocks('```\nsin cierre')).toEqual([
      { kind: 'fence', language: '', text: 'sin cierre' },
    ]);
  });

  it('joins the lines of a quote', () => {
    expect(parseBlocks('> uno\n> dos')).toEqual([
      { kind: 'quote', children: [{ kind: 'text', text: 'uno dos' }] },
    ]);
  });
});

describe('Markdown', () => {
  it('renders elements rather than markup, so the text can never be executed', () => {
    const { container } = render(<Markdown source={'# Login\n\n`{{token}}` del equipo'} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Login' })).toBeTruthy();
    expect(screen.getByText('{{token}}').tagName).toBe('CODE');
    expect(container.querySelector('script')).toBeNull();
  });

  it('prints a tag as the text it is', () => {
    render(<Markdown source="<img src=x onerror=alert(1)>" />);
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeTruthy();
  });
});
