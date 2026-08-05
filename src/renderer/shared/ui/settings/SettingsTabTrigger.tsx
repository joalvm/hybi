import { Tabs } from 'radix-ui';
import type { ReactNode } from 'react';

type Props = { value: string; label: string; icon: ReactNode };

/**
 * One row of the rail. Radix owns the roving focus and the arrow keys, which is
 * the whole reason the rail is a tab list and not a column of buttons.
 */
export function SettingsTabTrigger({ value, label, icon }: Props) {
  return (
    <Tabs.Trigger
      // No preflight in this app, so a button carries the UA border unless it is
      // told otherwise. Transparent rather than absent, so the active row does
      // not shift by a pixel when it takes an outline.
      className="settings-tab-runtime flex cursor-pointer items-center gap-2 rounded-ui border border-transparent bg-transparent px-2 py-1.5 text-left text-ui text-muted outline-none hover:bg-hover"
      value={value}
    >
      <span className="inline-flex shrink-0 items-center text-muted" aria-hidden="true">
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </Tabs.Trigger>
  );
}
