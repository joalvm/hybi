import clsx from 'clsx';
import { useMemo, useRef } from 'react';
import { scanVariables } from '@shared/variables/scan.js';

type Tone = 'plain' | 'resolved' | 'missing';
export type UrlSegment = { text: string; tone: Tone; name?: string };

type Props = {
  value: string;
  /** Names the current scope cannot resolve. Derived by the caller, not here. */
  missing: readonly string[];
  onChange: (value: string) => void;
  /**
   * A variable was pointed at. The rectangle is the token's own box, so the
   * popover hangs off the text rather than off the whole field.
   */
  onVariablePoint: (name: string, rect: DOMRect | null) => void;
};

const TONE_CLASS: Record<Tone, string | false> = {
  plain: false,
  resolved: 'wsw-var-resolved',
  missing: 'wsw-var-missing',
};

/** Splits a URL template so the mirror can colour `{{var}}` like the editor. */
export function urlSegments(text: string, missing: readonly string[]): UrlSegment[] {
  const segments: UrlSegment[] = [];
  let cursor = 0;

  for (const token of scanVariables(text)) {
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

  if (cursor < text.length) segments.push({ text: text.slice(cursor), tone: 'plain' });
  return segments;
}

/**
 * A transparent input over a coloured mirror. Monaco would give the same
 * highlighting, but a second editor instance for one line of text costs a
 * worker and a model — the mirror costs a `<span>` per token.
 */
export function UrlInput({ value, missing, onChange, onVariablePoint }: Props) {
  const segments = useMemo(() => urlSegments(value, missing), [value, missing]);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative h-7.5 min-w-0 flex-1 rounded-ui border border-border bg-panel focus-within:border-accent focus-within:outline focus-within:outline-1 focus-within:outline-accent">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-1 h-full w-full overflow-hidden border-0 bg-transparent px-2 font-mono leading-url whitespace-pre text-foreground"
        data-part="url-input-mirror"
      >
        {segments.map((segment, index) => (
          // Segments are regenerated whole on every keystroke, so the index is
          // the only stable identity a token has.
          <span
            key={index}
            className={clsx(
              TONE_CLASS[segment.tone],
              segment.name !== undefined && 'pointer-events-auto cursor-pointer',
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
      <input
        ref={inputRef}
        className="url-input-field-runtime relative h-full w-full border-0 bg-transparent px-2 font-mono leading-url whitespace-pre text-transparent caret-foreground focus-visible:outline-none"
        data-part="url-input-field"
        aria-label="URL"
        spellCheck={false}
        autoComplete="off"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
    </div>
  );
}
