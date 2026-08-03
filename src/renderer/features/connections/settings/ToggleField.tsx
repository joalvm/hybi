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
    <label className="toggle-field-runtime relative flex cursor-pointer items-center justify-between gap-2 py-2">
      <input
        className="absolute h-px w-px opacity-0"
        type="checkbox"
        checked={checked}
        onChange={(event) => {
          onChange(event.target.checked);
        }}
      />
      <span
        className="toggle-switch-runtime order-2 ml-auto h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors"
        aria-hidden="true"
      />
      <span className="order-1 flex flex-col gap-0.5">
        {label}
        {hint !== undefined && <span className="text-ui leading-4 text-muted">{hint}</span>}
      </span>
    </label>
  );
}
