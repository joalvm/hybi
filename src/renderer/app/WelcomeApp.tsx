import { AboutDialog } from '@/features/about/AboutDialog.js';
import { PreferencesDialog } from '@/features/preferences/PreferencesDialog.js';
import { usePreferenceRequests } from '@/features/preferences/usePreferenceRequests.js';
import { WelcomeScreen } from '@/features/welcome/WelcomeScreen.js';
import { ErrorBoundary } from './ErrorBoundary.js';
import { WindowChrome } from './WindowChrome.js';

/**
 * The root of the welcome window. It owns no workspace and no socket: picking a
 * document is all this window does, and the workbench window opens it.
 *
 * Preferences are the exception, and deliberately so: they belong to the
 * installation, so the window that is in front when the menu item is chosen is
 * the one that answers for them.
 */
export function WelcomeApp() {
  const preferences = usePreferenceRequests();

  return (
    <ErrorBoundary>
      {/* Fixed size and not minimisable, so the only control it carries is close. */}
      <WindowChrome resizable={false} />
      <WelcomeScreen />
      <AboutDialog />
      <PreferencesDialog open={preferences.open} onClose={preferences.close} />
    </ErrorBoundary>
  );
}
