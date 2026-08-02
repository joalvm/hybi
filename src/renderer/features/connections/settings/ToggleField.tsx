type Props = {
  label: string;
  checked: boolean;
  /** Sits under the label, in the same click target. */
  hint?: string;
  onChange: (checked: boolean) => void;
};

/**
 * A checkbox wrapped in its own label, so the text is part of the target rather
 * than something to aim beside it.
 */
export function ToggleField({ label, checked, hint, onChange }: Props) {
  return (
    <label className="toggle-field">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => {
          onChange(event.target.checked);
        }}
      />
      <span className="toggle-field__switch" aria-hidden="true" />
      <span className="toggle-field__text">
        {label}
        {hint !== undefined && <span className="settings-hint">{hint}</span>}
      </span>
    </label>
  );
}
