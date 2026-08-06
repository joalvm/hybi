import { useId, useLayoutEffect, useMemo, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import type { VariableScope } from '@shared/variables/resolve.js';
import { useMessages } from '@/shared/i18n/useMessages.js';
import { paintSegments, readCaret, readSelection, readText, writeCaret } from './urlCaret.js';
import { urlSegments } from './urlSegments.js';
import { useUrlSuggestions } from './useUrlSuggestions.js';
import { VariableSuggestions } from './VariableSuggestions.js';

type Props = {
  value: string;
  /** Names the current scope cannot resolve. Derived by the caller, not here. */
  missing: readonly string[];
  scope: VariableScope;
  onChange: (value: string) => void;
  /**
   * A variable was pointed at. The rectangle is the token's own box, so the
   * popover hangs off the text rather than off the whole field.
   */
  onVariablePoint: (name: string, rect: DOMRect | null) => void;
};

/** The token under the pointer, if the pointer is over one at all. */
function tokenAt(event: PointerEvent<HTMLDivElement>): HTMLElement | null {
  const target = event.target;
  if (!(target instanceof Element)) return null;
  return target.closest<HTMLElement>('[data-variable]');
}

/**
 * A `contenteditable`, not an `<input>` under a coloured mirror. A mirror has
 * to match the field's text metrics character for character, which rules out
 * the padding a token pill needs: the pill's box ended up painted outside its
 * own text and covered the characters on either side of it.
 *
 * Here a token is a real inline box, so the space it takes is the space the
 * caret walks. The price is that an edit has to be read back out of the DOM,
 * and that the field is repainted rather than reconciled — see `urlCaret.ts`.
 */
export function UrlInput({ value, missing, scope, onChange, onVariablePoint }: Props) {
  const messages = useMessages().connections;
  const segments = useMemo(() => urlSegments(value, missing), [value, missing]);
  const suggestions = useUrlSuggestions(value, scope);
  const editorRef = useRef<HTMLDivElement>(null);
  const caret = useRef<number | null>(null);
  const listboxId = `url-variable-suggestions${useId()}`;
  const open = suggestions.variables.length > 0;

  // No dependency list: the text the browser left in the field is the only
  // thing that can say whether a repaint is owed, and reading it is a
  // `textContent` away. A pending caret means the edit was ours, so the tokens
  // have to be rebuilt even when the characters already match.
  useLayoutEffect(() => {
    const root = editorRef.current;
    if (root === null) return;
    const offset = caret.current;
    caret.current = null;
    if (offset === null && readText(root) === value) return;

    paintSegments(root, segments);
    if (offset !== null) writeCaret(root, offset);
  });

  const edit = (next: string, cursor: number): void => {
    caret.current = cursor;
    onChange(next);
  };

  const complete = (name: string): void => {
    const completion = suggestions.complete(name);
    if (completion === null) return;
    editorRef.current?.focus();
    edit(completion.url, completion.caret);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    // One line only: a break lands text where no character offset describes it.
    if (event.key === 'Enter') event.preventDefault();
    if (!open) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      suggestions.dismiss();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      suggestions.step(event.key === 'ArrowDown' ? 1 : -1);
      return;
    }
    const selected = suggestions.variables[suggestions.activeIndex];
    if (event.key === 'Enter' && selected !== undefined) complete(selected.name);
  };

  return (
    <div className="relative h-7.5 min-w-0 flex-1 rounded-ui border border-border bg-panel focus-within:border-accent focus-within:outline focus-within:outline-1 focus-within:outline-accent">
      <div
        ref={editorRef}
        className="h-full w-full overflow-hidden px-2 font-ui text-ui leading-url font-normal whitespace-pre text-foreground caret-foreground outline-none"
        data-part="url-input-field"
        contentEditable
        role="combobox"
        aria-label={messages.url}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={open ? `${listboxId}-${String(suggestions.activeIndex)}` : undefined}
        spellCheck={false}
        onInput={() => {
          const root = editorRef.current;
          if (root === null) return;
          edit(readText(root), readCaret(root));
        }}
        onKeyDown={handleKeyDown}
        onPaste={(event) => {
          // Plain text on one line: anything else arrives as nodes no segment
          // describes, and the next repaint would drop them regardless.
          event.preventDefault();
          const root = editorRef.current;
          if (root === null) return;
          const pasted = event.clipboardData.getData('text/plain').replace(/\s/g, '');
          const { start, end } = readSelection(root);
          edit(`${value.slice(0, start)}${pasted}${value.slice(end)}`, start + pasted.length);
        }}
        // Delegated, because the tokens are not React's to hang props on.
        // `over`/`out` bubble where `enter`/`leave` do not.
        onPointerOver={(event) => {
          const token = tokenAt(event);
          if (token === null) return;
          onVariablePoint(token.dataset.variable ?? '', token.getBoundingClientRect());
        }}
        onPointerOut={(event) => {
          const token = tokenAt(event);
          if (token === null) return;
          onVariablePoint(token.dataset.variable ?? '', null);
        }}
      />
      <VariableSuggestions
        id={listboxId}
        variables={suggestions.variables}
        activeIndex={suggestions.activeIndex}
        onActiveIndexChange={suggestions.setActiveIndex}
        onSelect={complete}
      />
    </div>
  );
}
