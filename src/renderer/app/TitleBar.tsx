import { usePreferencesDialog } from '@/features/preferences/dialog.store.js';
import { ActiveEnvironmentPicker } from '@/features/workspace/ActiveEnvironmentPicker.js';
import { WorkspaceMenu } from '@/features/workspace/WorkspaceMenu.js';
import { BracesIcon, SettingsIcon } from '@/shared/ui/icons.js';
import { IconButton } from '@/shared/ui/IconButton.js';
import { useStore } from '@/store/index.js';
import { AppMenuButton } from './AppMenuButton.js';
import { WindowControls } from './WindowControls.js';

/**
 * The app chrome: which workspace is open on the left, and what applies across
 * connections on the right. Nothing here belongs to a single connection.
 *
 * It is also the window's own bar — the native one is hidden — so the empty
 * space drags the window and the controls close it.
 */
export function TitleBar() {
  const setDialog = useStore((state) => state.setDialog);
  const openPreferences = usePreferencesDialog((state) => state.openDialog);

  return (
    <div className="flex h-full w-full items-center gap-2">
      {/* The application menu sits left of the switcher, as in Postman: it acts
          on the app, the switcher on the document. */}
      <AppMenuButton />
      <WorkspaceMenu />
      <div className="ml-auto flex h-full items-center gap-2">
        <div className="app-no-drag flex items-center overflow-hidden rounded-ui border border-border bg-control focus-within:border-accent focus-within:outline focus-within:outline-1 focus-within:outline-accent">
          <ActiveEnvironmentPicker />
          {/* The picker and values action operate on one environment, so they
              share one bounded control instead of reading as two controls. */}
          <IconButton
            className="min-h-control min-w-control rounded-none border-0 border-l border-l-border bg-transparent"
            label="Variables"
            onClick={() => {
              setDialog('variables');
            }}
          >
            <BracesIcon />
          </IconButton>
        </div>
        {/* The menu carries the same entry, but a menu nobody opens is not a
            way in: this is where a desktop app is looked at for settings. */}
        <IconButton
          className="app-no-drag shrink-0 bg-control"
          label="Preferencias"
          onClick={openPreferences}
        >
          <SettingsIcon />
        </IconButton>
        <WindowControls />
      </div>
    </div>
  );
}
