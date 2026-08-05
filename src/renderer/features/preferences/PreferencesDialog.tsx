import { LogIcon, PaletteIcon, StartupIcon } from '@/shared/ui/icons.js';
import { SettingsDialog, type SettingsTab } from '@/shared/ui/settings/SettingsDialog.js';
import { SettingsPane } from '@/shared/ui/settings/SettingsPane.js';
import { usePreferences } from '@/store/preferences.store.js';
import { AppearanceSection } from './AppearanceSection.js';
import { LogSection } from './LogSection.js';
import { StartupSection } from './StartupSection.js';
import { usePreferenceActions } from './usePreferenceActions.js';

const TABS: SettingsTab[] = [
  { value: 'general', label: 'General', icon: <StartupIcon /> },
  { value: 'appearance', label: 'Apariencia', icon: <PaletteIcon /> },
  { value: 'log', label: 'Log de actividad', icon: <LogIcon /> },
];

type Props = { open: boolean; onClose: () => void };

/**
 * Settings of the installation, not of the open document. Both windows paint
 * it, and what one changes the other is told about, so there is one answer per
 * machine rather than one per window.
 *
 * The only component in the group that reads the store — the panes take their
 * values and a callback, which is what keeps each of them testable alone.
 */
export function PreferencesDialog({ open, onClose }: Props) {
  const theme = usePreferences((state) => state.theme);
  const editorFontSize = usePreferences((state) => state.editorFontSize);
  const activityLimit = usePreferences((state) => state.activityLimit);
  const activityByteLimit = usePreferences((state) => state.activityByteLimit);
  const startup = usePreferences((state) => state.startup);
  const update = usePreferenceActions();

  if (!open) return null;

  return (
    <SettingsDialog open title="Preferencias" tabs={TABS} onClose={onClose}>
      <SettingsPane value="general" title="General">
        <StartupSection
          startup={startup}
          onStartupChange={(next) => {
            update({ startup: next });
          }}
        />
      </SettingsPane>
      <SettingsPane value="appearance" title="Apariencia">
        <AppearanceSection
          theme={theme}
          editorFontSize={editorFontSize}
          onThemeChange={(next) => {
            update({ theme: next });
          }}
          onEditorFontSizeChange={(next) => {
            update({ editorFontSize: next });
          }}
        />
      </SettingsPane>
      <SettingsPane value="log" title="Log de actividad">
        <LogSection
          activityLimit={activityLimit}
          activityByteLimit={activityByteLimit}
          onActivityLimitChange={(next) => {
            update({ activityLimit: next });
          }}
          onActivityByteLimitChange={(next) => {
            update({ activityByteLimit: next });
          }}
        />
      </SettingsPane>
    </SettingsDialog>
  );
}
