import { useId, useState } from 'react';
import { Input } from './Input.js';
import { SettingsRow } from './settings/SettingsRow.js';

type Props = {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  /** Drawn inside the field, on the right: `ms`, `MB`, `KiB`. */
  unit?: string;
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
export function NumberField({
  label,
  description,
  value,
  min,
  max,
  unit,
  disabled = false,
  onChange,
}: Props) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));

  const commit = (): void => {
    const parsed = Number.parseInt(draft, 10);
    const next = Number.isNaN(parsed) ? value : Math.min(max, Math.max(min, parsed));
    setDraft(String(next));
    onChange(next);
  };

  return (
    <SettingsRow
      label={label}
      description={description}
      htmlFor={id}
      control={
        <span className="relative inline-flex items-center">
          <Input
            id={id}
            className={unit === undefined ? 'w-24 text-left' : 'w-28 pr-9 text-left'}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={draft}
            disabled={disabled}
            onChange={(event) => {
              setDraft(event.target.value);
            }}
            onBlur={commit}
          />
          {unit !== undefined && (
            <span className="pointer-events-none absolute right-2 text-label text-muted">
              {unit}
            </span>
          )}
        </span>
      }
    />
  );
}
