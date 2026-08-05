import { useId } from 'react';
import { SettingsRow } from './settings/SettingsRow.js';

type Props = {
  label: string;
  checked: boolean;
  /** One line under the label, in the same column. */
  hint?: string;
  onChange: (checked: boolean) => void;
};

/**
 * A switch in a settings row. The checkbox is real and hidden behind the track
 * it drives; the row's label points at it, so the text is part of the target
 * rather than something to aim beside — and the track is wrapped in a label of
 * its own so the switch itself stays clickable.
 */
export function ToggleField({ label, checked, hint, onChange }: Props) {
  const id = useId();

  return (
    <SettingsRow
      label={label}
      description={hint}
      htmlFor={id}
      control={
        <label className="toggle-field-runtime relative inline-flex cursor-pointer items-center">
          <input
            id={id}
            className="absolute h-px w-px opacity-0"
            type="checkbox"
            checked={checked}
            onChange={(event) => {
              onChange(event.target.checked);
            }}
          />
          {/* Immediately after the input on purpose: the stylesheet reads the
              checked state through the sibling selector. */}
          <span
            className="toggle-switch-runtime h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors"
            aria-hidden="true"
          />
        </label>
      }
    />
  );
}
