import { Select, type SelectOption } from './Select.js';
import { SettingsRow } from './settings/SettingsRow.js';

type Props = {
  label: string;
  description?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
};

/**
 * A dropdown in a settings row. The row's text is not tied to the trigger with
 * `for`: Radix draws a button, and `for` does not carry a click to one the way
 * it does to an input — the trigger takes the same text as its accessible name
 * instead.
 */
export function SelectField({ label, description, value, options, onChange }: Props) {
  return (
    <SettingsRow
      label={label}
      description={description}
      control={
        <Select label={label} value={value} options={options} className="w-52" onChange={onChange} />
      }
    />
  );
}
