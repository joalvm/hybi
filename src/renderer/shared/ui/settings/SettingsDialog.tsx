import { Tabs } from 'radix-ui';
import type { ReactNode } from 'react';
import { Dialog } from '../Dialog.js';
import { CloseIcon } from '../icons.js';
import { IconButton } from '../IconButton.js';
import { SettingsTabTrigger } from './SettingsTabTrigger.js';

export type SettingsTab = { value: string; label: string; icon: ReactNode };

type Props = {
  open: boolean;
  /** The accessible name of the dialog; the pane draws its own heading. */
  title: string;
  tabs: SettingsTab[];
  /** A banner above the panes, for what applies to every one of them. */
  notice?: ReactNode;
  onClose: () => void;
  children: ReactNode;
};

/**
 * The shape both settings dialogs share: a rail of groups on the left and one
 * pane at a time on the right. A group added later costs a row on the left
 * rather than height the dialog does not have, and no pane is rendered until
 * its row is chosen.
 *
 * The dialog draws no title bar of its own — the pane heading is the title, and
 * the close button belongs in the corner of the surface it closes.
 */
export function SettingsDialog({ open, title, tabs, notice, onClose, children }: Props) {
  const first = tabs[0]?.value;
  if (first === undefined) return null;

  return (
    <Dialog open={open} title={title} size="xl" chrome={false} bodyClassName="p-0" onClose={onClose}>
      <Tabs.Root className="flex h-settings-body min-h-0" defaultValue={first} orientation="vertical">
        <Tabs.List
          className="flex w-settings-rail shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-border bg-chrome p-2"
          aria-label={title}
        >
          {tabs.map((tab) => (
            <SettingsTabTrigger key={tab.value} value={tab.value} label={tab.label} icon={tab.icon} />
          ))}
        </Tabs.List>
        <div className="relative flex min-w-0 flex-1 flex-col overflow-y-auto">
          {/* Escape closes too, but a dialog with no visible way out reads as a
              trap — this is the button the user looks for first. */}
          <IconButton
            className="absolute top-4 right-4 z-1 min-h-6 min-w-6 bg-panel p-0"
            label="Cerrar"
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>
          {notice}
          {children}
        </div>
      </Tabs.Root>
    </Dialog>
  );
}
