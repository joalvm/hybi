import type { ReactNode } from 'react';

type Props = {
  label: string;
  /** One line under the label, in the same column. Not a tooltip. */
  description?: string | undefined;
  /** The control this row is about, so the label can point at it. */
  htmlFor?: string | undefined;
  control: ReactNode;
};

/**
 * The unit every settings pane is made of: what the setting is on the left,
 * what changes it on the right, and a hairline between rows so a long pane
 * still reads as a list instead of a wall.
 *
 * The description sits in the row and not behind a tooltip: a setting whose
 * consequence is hidden is a setting nobody dares to touch.
 */
export function SettingsRow({ label, description, htmlFor, control }: Props) {
  return (
    <div
      className="settings-row-grid grid items-center gap-6 border-b border-border-subtle py-3 last:border-b-0"
      data-part="settings-row"
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <label className="text-ui text-foreground" htmlFor={htmlFor}>
          {label}
        </label>
        {description !== undefined && (
          <p className="text-label leading-copy text-muted">{description}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center justify-end">{control}</div>
    </div>
  );
}
