import { WindowControls } from './WindowControls.js';

/**
 * The bare frame for screens that have no title bar: a drag strip across the
 * top with the controls floating over whatever is painted underneath.
 */
export function WindowChrome({ resizable = false }: { resizable?: boolean }) {
  return (
    <div className="window-chrome">
      <WindowControls resizable={resizable} />
    </div>
  );
}
