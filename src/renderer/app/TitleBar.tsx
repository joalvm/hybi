import { ActiveEnvironmentPicker } from '@/features/workspace/ActiveEnvironmentPicker.js';
import { WorkspaceMenu } from '@/features/workspace/WorkspaceMenu.js';
import { BracesIcon } from '@/shared/ui/icons.js';
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

  return (
    <div className="title-bar">
      {/* The application menu sits left of the switcher, as in Postman: it acts
          on the app, the switcher on the document. */}
      <AppMenuButton />
      <WorkspaceMenu />
      <div className="title-bar__right">
        <div className="title-bar__environment">
          <ActiveEnvironmentPicker />
          {/* The picker and values action operate on one environment, so they
              share one bounded control instead of reading as two controls. */}
          <IconButton
            className="title-bar__variables"
            label="Variables"
            onClick={() => {
              setDialog('variables');
            }}
          >
            <BracesIcon />
          </IconButton>
        </div>
        <WindowControls />
      </div>
    </div>
  );
}
