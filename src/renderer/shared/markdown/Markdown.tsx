import { createElement, Fragment, useMemo, type ReactNode } from 'react';
import { parseBlocks } from './blocks.js';
import type { Block, Inline } from './types.js';

const HEADINGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;

function renderInline(nodes: Inline[]): ReactNode[] {
  return nodes.map((node, index) => {
    const key = String(index);
    switch (node.kind) {
      case 'text':
        return <Fragment key={key}>{node.text}</Fragment>;
      case 'code':
        return (
          <code key={key} className="md-code">
            {node.text}
          </code>
        );
      case 'strong':
        return <strong key={key}>{renderInline(node.children)}</strong>;
      case 'em':
        return <em key={key}>{renderInline(node.children)}</em>;
      // No `target`: the main process turns `will-navigate` into a call to the
      // OS browser, so an ordinary href is what opens the page outside the app.
      case 'link':
        return (
          <a key={key} className="md-link" href={node.href}>
            {renderInline(node.children)}
          </a>
        );
    }
  });
}

function renderBlock(block: Block, key: string): ReactNode {
  switch (block.kind) {
    case 'heading':
      return createElement(
        HEADINGS[Math.min(block.level, HEADINGS.length) - 1] ?? 'h6',
        { key, className: 'md-heading' },
        renderInline(block.children),
      );
    case 'paragraph':
      return (
        <p key={key} className="md-paragraph">
          {renderInline(block.children)}
        </p>
      );
    case 'list': {
      const items = block.items.map((item, index) => <li key={String(index)}>{renderInline(item)}</li>);
      return block.ordered ? (
        <ol key={key} className="md-list">
          {items}
        </ol>
      ) : (
        <ul key={key} className="md-list">
          {items}
        </ul>
      );
    }
    case 'quote':
      return (
        <blockquote key={key} className="md-quote">
          {renderInline(block.children)}
        </blockquote>
      );
    case 'fence':
      return (
        <pre key={key} className="md-fence">
          <code>{block.text}</code>
        </pre>
      );
    case 'rule':
      return <hr key={key} className="md-rule" />;
  }
}

type Props = { source: string };

/**
 * Markdown as React elements, never as `dangerouslySetInnerHTML`: the text comes
 * from an AsyncAPI document somebody else wrote, so no branch of this renderer
 * can turn it into markup the page executes.
 */
export function Markdown({ source }: Props) {
  const blocks = useMemo(() => parseBlocks(source), [source]);
  return (
    <div className="markdown">
      {blocks.map((block, index) => renderBlock(block, String(index)))}
    </div>
  );
}
