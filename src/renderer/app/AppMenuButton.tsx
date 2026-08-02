import { bridge } from '@/ipc/bridge.js';
import { MenuBarIcon } from '@/shared/ui/icons.js';

/**
 * Reaches the real application menu from the chrome, the way Postman does. The
 * menu is built and drawn by the main process — this only says where to drop it,
 * anchored under the button so it reads as belonging to it.
 *
 * macOS keeps its own menu bar, so the button is not drawn there.
 */
export function AppMenuButton() {
  if (bridge.platform === 'darwin') return null;

  return (
    <button
      type="button"
      className="app-menu-button"
      aria-label="Menú"
      title="Menú"
      onClick={(event) => {
        const box = event.currentTarget.getBoundingClientRect();
        void bridge.window.popupAppMenu({ x: box.left, y: box.bottom });
      }}
    >
      <MenuBarIcon />
    </button>
  );
}
