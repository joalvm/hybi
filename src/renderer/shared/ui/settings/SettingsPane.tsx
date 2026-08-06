import { Tabs } from 'radix-ui';
import type { ReactNode } from 'react';

type Props = { value: string; title: string; children: ReactNode };

/**
 * One entry of the rail, opened. The heading repeats the rail label on purpose:
 * it is what tells a reader which of the groups they are looking at once the
 * pane has scrolled and the highlighted row is out of the corner of the eye.
 *
 * The layout goes on an inner element and never on `Tabs.Content` itself: Radix
 * keeps a closed pane in the tree as `hidden`, and a `display` utility on that
 * element wins over `[hidden]` — leaving every closed pane's padding stacked
 * above the open one.
 */
export function SettingsPane({ value, title, children }: Props) {
  return (
    <Tabs.Content value={value}>
      <div className="flex flex-col gap-4 px-6 pt-4 pb-5">
        <h2 className="text-dialog-title leading-6 font-semibold text-foreground">{title}</h2>
        {children}
      </div>
    </Tabs.Content>
  );
}
