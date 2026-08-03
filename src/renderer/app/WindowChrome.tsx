import { WindowControls } from './WindowControls.js';

/**
 * The bare frame for screens that have no title bar: a drag strip across the
 * top with the controls floating over whatever is painted underneath.
 */
export function WindowChrome({ resizable = false }: { resizable?: boolean }) {
  return (
    <div className="app-drag-region platform-titlebar fixed top-0 right-0 left-0 z-20 flex h-titlebar justify-end">
      <WindowControls resizable={resizable} />
    </div>
  );
}
