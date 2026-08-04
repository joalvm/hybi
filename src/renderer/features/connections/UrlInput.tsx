import clsx from 'clsx';
import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { Variable } from '@shared/domain/types.js';
import type { VariableScope } from '@shared/variables/resolve.js';
import { VariableSuggestions } from './VariableSuggestions.js';
import { variableQuery, urlSegments, type UrlTone } from './urlSegments.js';

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

const TONE_CLASS: Record<UrlTone, string | false> = {
  plain: false,
  resolved: 'wsw-var-resolved',
  missing: 'wsw-var-missing',
  pending: 'wsw-url-var wsw-var-pending',
};

/**
 * A transparent input over a coloured mirror. Monaco would give the same
 * highlighting, but a second editor instance for one line of text costs a
 * worker and a model — the mirror costs a `<span>` per token.
 */
export function UrlInput({ value, missing, scope, onChange, onVariablePoint }: Props) {
  const segments = useMemo(() => urlSegments(value, missing), [value, missing]);
  const suggestions = useMemo(
    () => {
      const query = variableQuery(value);
      if (query === null) return [];
      const normalizedQuery = query.toLocaleLowerCase();
      return [...scope.values()].filter((variable): variable is Variable =>
        variable.name.toLocaleLowerCase().startsWith(normalizedQuery),
      );
    },
    [scope, value],
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const suggestionsId = `url-variable-suggestions${useId()}`;
  const selectedSuggestionIndex =
    suggestions.length === 0 ? -1 : Math.min(activeSuggestionIndex, suggestions.length - 1);

  const insertVariable = (name: string): void => {
    const start = value.lastIndexOf('{{');
    const query = variableQuery(value);
    if (start < 0 || query === null) return;
    const end = start + 2 + query.length;
    const next = `${value.slice(0, start)}{{${name}}}${value.slice(end)}`;
    setActiveSuggestionIndex(0);
    onChange(next);
    inputRef.current?.focus();
    const cursor = start + name.length + 4;
    inputRef.current?.setSelectionRange(cursor, cursor);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (suggestions.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveSuggestionIndex((current) => (current + 1) % suggestions.length);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveSuggestionIndex(
        (current) => (current - 1 + suggestions.length) % suggestions.length,
      );
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      setActiveSuggestionIndex(0);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      setActiveSuggestionIndex(suggestions.length - 1);
      return;
    }
    const selectedSuggestion = suggestions[selectedSuggestionIndex];
    if (event.key === 'Enter' && selectedSuggestion !== undefined) {
      event.preventDefault();
      insertVariable(selectedSuggestion.name);
    }
  };

  return (
    <div className="relative h-7.5 min-w-0 flex-1 rounded-ui border border-border bg-panel focus-within:border-accent focus-within:outline focus-within:outline-1 focus-within:outline-accent">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-1 h-full w-full overflow-hidden border-0 bg-transparent px-2 font-ui text-ui font-normal leading-url whitespace-pre text-foreground"
        data-part="url-input-mirror"
      >
        {segments.map((segment, index) => (
          // Segments are regenerated whole on every keystroke, so the index is
          // the only stable identity a token has.
          <span
            key={index}
            className={clsx(
              TONE_CLASS[segment.tone],
              segment.name !== undefined && 'wsw-url-var pointer-events-auto cursor-pointer',
            )}
            onPointerEnter={(event) => {
              if (segment.name === undefined) return;
              onVariablePoint(segment.name, event.currentTarget.getBoundingClientRect());
            }}
            onPointerLeave={() => {
              if (segment.name === undefined) return;
              onVariablePoint(segment.name, null);
            }}
            onClick={(event) => {
              if (segment.name === undefined) return;
              // The click must not be swallowed: the field is what the user was
              // aiming at, so the caret lands at the end of the token as well.
              const end = segments
                .slice(0, index + 1)
                .reduce((total, entry) => total + entry.text.length, 0);
              inputRef.current?.focus();
              inputRef.current?.setSelectionRange(end, end);
              onVariablePoint(segment.name, event.currentTarget.getBoundingClientRect());
            }}
          >
            {segment.text}
          </span>
        ))}
      </div>
      <VariableSuggestions
        id={suggestionsId}
        variables={suggestions}
        activeIndex={selectedSuggestionIndex}
        onActiveIndexChange={setActiveSuggestionIndex}
        onSelect={insertVariable}
      />
      <input
        ref={inputRef}
        className="url-input-field-runtime relative h-full w-full border-0 bg-transparent px-2 font-ui text-ui font-normal leading-url whitespace-pre text-transparent caret-foreground focus-visible:outline-none"
        data-part="url-input-field"
        aria-label="URL"
        aria-autocomplete="list"
        aria-controls={suggestions.length > 0 ? suggestionsId : undefined}
        aria-expanded={suggestions.length > 0}
        aria-activedescendant={
          selectedSuggestionIndex >= 0
            ? `${suggestionsId}-${String(selectedSuggestionIndex)}`
            : undefined
        }
        spellCheck={false}
        autoComplete="off"
        value={value}
        onChange={(event) => {
          setActiveSuggestionIndex(0);
          onChange(event.target.value);
        }}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
