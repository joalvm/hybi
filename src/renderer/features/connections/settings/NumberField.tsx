import { useId, useState } from 'react';
import { Field } from '@/shared/ui/Field.js';

type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (value: number) => void;
};

/**
 * A whole number inside known bounds.
 *
 * Typing is free and the value is committed when the field is left: `1` on its
 * way to `1000` is below every minimum here, and writing it straight through
 * would put a number in the workspace that its own schema rejects on the next
 * save. The draft is seeded on mount — the caller mounts this with the dialog.
 */
export function NumberField({ label, value, min, max, disabled = false, onChange }: Props) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));

  const commit = (): void => {
    const parsed = Number.parseInt(draft, 10);
    const next = Number.isNaN(parsed) ? value : Math.min(max, Math.max(min, parsed));
    setDraft(String(next));
    onChange(next);
  };

  return (
    <Field label={label} htmlFor={id}>
      <input
        id={id}
        className="input settings-control"
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={draft}
        disabled={disabled}
        onChange={(event) => {
          setDraft(event.target.value);
        }}
        onBlur={commit}
      />
    </Field>
  );
}
