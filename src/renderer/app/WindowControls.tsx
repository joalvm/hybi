import { bridge } from '@/ipc/bridge.js';
import {
  CloseIcon,
  WindowMaximizeIcon,
  WindowMinimizeIcon,
  WindowRestoreIcon,
} from '@/shared/ui/icons.js';
import { IconButton } from '@/shared/ui/IconButton.js';
import { useWindowMaximized } from './useWindowMaximized.js';

type Props = {
  /**
   * Mirrors what the window itself allows. The welcome window is fixed at the
   * reference size and cannot be minimised, so drawing those two would offer
   * buttons the main process refuses.
   */
  resizable?: boolean;
};

/**
 * The controls of a frameless window. macOS renders nothing here: its traffic
 * lights are still drawn by the system over the drag region.
 */
export function WindowControls({ resizable = true }: Props) {
  const maximized = useWindowMaximized();

  if (bridge.platform === 'darwin') return null;

  return (
    <div className="app-no-drag flex self-stretch" data-part="window-controls">
      {resizable && (
        <>
          <IconButton
            className="h-full min-h-0 w-12 rounded-none border-0 text-foreground focus-visible:-outline-offset-3"
            label="Minimizar"
            onClick={() => {
              void bridge.window.minimize();
            }}
          >
            <WindowMinimizeIcon />
          </IconButton>
          <IconButton
            className="h-full min-h-0 w-12 rounded-none border-0 text-foreground focus-visible:-outline-offset-3"
            label={maximized ? 'Restaurar' : 'Maximizar'}
            onClick={() => {
              void bridge.window.toggleMaximize();
            }}
          >
            {maximized ? <WindowRestoreIcon /> : <WindowMaximizeIcon />}
          </IconButton>
        </>
      )}
      <IconButton
        className="h-full min-h-0 w-12 rounded-none border-0 text-foreground enabled:hover:bg-window-close enabled:hover:text-on-danger focus-visible:-outline-offset-3"
        label="Cerrar"
        onClick={() => {
          void bridge.window.close();
        }}
      >
        <CloseIcon />
      </IconButton>
    </div>
  );
}
