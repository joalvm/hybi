import { WelcomeScreen } from '@/features/welcome/WelcomeScreen.js';
import { ErrorBoundary } from './ErrorBoundary.js';
import { WindowChrome } from './WindowChrome.js';

/**
 * The root of the welcome window. It owns no store and no socket: picking a
 * document is all this window does, and the workbench window opens it.
 */
export function WelcomeApp() {
  return (
    <ErrorBoundary>
      {/* Fixed size and not minimisable, so the only control it carries is close. */}
      <WindowChrome resizable={false} />
      <WelcomeScreen />
    </ErrorBoundary>
  );
}
