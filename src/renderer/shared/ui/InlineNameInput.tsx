import { useRef, useState, type KeyboardEvent } from 'react';

type Props = {
  /** The name the field starts with, and what an empty commit falls back to. */
  value: string;
  label: string;
  onCommit: (name: string) => void;
  onCancel: () => void;
};

/**
 * The rename affordance for a row that already shows its name: the input takes
 * the name's place instead of opening a dialog, so naming a thing never leaves
 * the list it lives in.
 *
 * Enter and blur commit, Escape cancels, and `settled` makes sure the blur that
 * follows either one does not fire a second outcome. Events are stopped here
 * because the rows this sits in are themselves clickable and Enter-activated.
 *
 * *Every* key stops, not only the two this handles: the rows underneath treat
 * Space as "select me" and call `preventDefault` on it, which silently swallowed
 * every space typed into a name.
 */
export function InlineNameInput({ value, label, onCommit, onCancel }: Props) {
  const [text, setText] = useState(value);
  const settled = useRef(false);

  const commit = (): void => {
    if (settled.current) return;
    settled.current = true;
    const next = text.trim();
    onCommit(next === '' ? value : next);
  };

  const cancel = (): void => {
    if (settled.current) return;
    settled.current = true;
    onCancel();
  };

  const keys = (event: KeyboardEvent<HTMLInputElement>): void => {
    event.stopPropagation();
    if (event.key !== 'Enter' && event.key !== 'Escape') return;
    event.preventDefault();
    if (event.key === 'Enter') commit();
    else cancel();
  };

  return (
    <input
      className="h-5.5 min-w-0 flex-1 rounded-ui border border-accent bg-app px-1 text-foreground focus-visible:outline-none"
      aria-label={label}
      value={text}
      autoFocus
      onFocus={(event) => {
        event.currentTarget.select();
      }}
      onChange={(event) => {
        setText(event.target.value);
      }}
      onBlur={commit}
      onKeyDown={keys}
      onClick={(event) => {
        event.stopPropagation();
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
      }}
    />
  );
}
