import { bridge } from '@/ipc/bridge.js';
import {
  CloseIcon,
  WindowMaximizeIcon,
  WindowMinimizeIcon,
  WindowRestoreIcon,
} from '@/shared/ui/icons.js';
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
    <div className="window-controls">
      {resizable && (
        <>
          <button
            type="button"
            className="window-control"
            aria-label="Minimizar"
            title="Minimizar"
            onClick={() => {
              void bridge.window.minimize();
            }}
          >
            <WindowMinimizeIcon />
          </button>
          <button
            type="button"
            className="window-control"
            aria-label={maximized ? 'Restaurar' : 'Maximizar'}
            title={maximized ? 'Restaurar' : 'Maximizar'}
            onClick={() => {
              void bridge.window.toggleMaximize();
            }}
          >
            {maximized ? <WindowRestoreIcon /> : <WindowMaximizeIcon />}
          </button>
        </>
      )}
      <button
        type="button"
        className="window-control window-control--close"
        aria-label="Cerrar"
        title="Cerrar"
        onClick={() => {
          void bridge.window.close();
        }}
      >
        <CloseIcon />
      </button>
    </div>
  );
}
