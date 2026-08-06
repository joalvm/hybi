import { Tabs } from 'radix-ui';
import type { ReactNode } from 'react';
import { cn } from '../../utils/cn.js';

type Props = { value: string; label: string; icon: ReactNode };

const TRIGGER = cn(
  'group flex h-control shrink-0 cursor-pointer items-center gap-2 rounded-ui border border-transparent bg-transparent px-2 text-left text-ui text-muted',
  'hover:bg-hover focus-visible:border-accent focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent',
  'data-[state=active]:border-border data-[state=active]:bg-selected data-[state=active]:text-foreground data-[state=active]:hover:bg-selected',
);

const ICON = cn(
  'inline-flex shrink-0 items-center text-muted',
  'group-data-[state=active]:text-foreground',
);

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
      className={TRIGGER}
      value={value}
    >
      <span className={ICON} aria-hidden="true">
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </Tabs.Trigger>
  );
}
