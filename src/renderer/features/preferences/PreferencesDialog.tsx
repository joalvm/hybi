import { useMessages } from '@/shared/i18n/useMessages.js';
import { LogIcon, PaletteIcon, StartupIcon } from '@/shared/ui/icons.js';
import { SettingsDialog, type SettingsTab } from '@/shared/ui/settings/SettingsDialog.js';
import { SettingsPane } from '@/shared/ui/settings/SettingsPane.js';
import { usePreferences } from '@/store/preferences.store.js';
import { AppearanceSection } from './AppearanceSection.js';
import { LanguageSection } from './LanguageSection.js';
import { LogSection } from './LogSection.js';
import { StartupSection } from './StartupSection.js';
import { usePreferenceActions } from './usePreferenceActions.js';

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
  const messages = useMessages().preferences;
  const language = usePreferences((state) => state.language);
  const theme = usePreferences((state) => state.theme);
  const editorFontSize = usePreferences((state) => state.editorFontSize);
  const activityLimit = usePreferences((state) => state.activityLimit);
  const activityByteLimit = usePreferences((state) => state.activityByteLimit);
  const startup = usePreferences((state) => state.startup);
  const update = usePreferenceActions();

  if (!open) return null;

  const tabs: SettingsTab[] = [
    { value: 'general', label: messages.tabs.general, icon: <StartupIcon /> },
    { value: 'appearance', label: messages.tabs.appearance, icon: <PaletteIcon /> },
    { value: 'log', label: messages.tabs.log, icon: <LogIcon /> },
  ];

  return (
    <SettingsDialog open title={messages.title} tabs={tabs} onClose={onClose}>
      <SettingsPane value="general" title={messages.tabs.general}>
        <LanguageSection
          language={language}
          onLanguageChange={(next) => {
            update({ language: next });
          }}
        />
        <StartupSection
          startup={startup}
          onStartupChange={(next) => {
            update({ startup: next });
          }}
        />
      </SettingsPane>
      <SettingsPane value="appearance" title={messages.tabs.appearance}>
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
      <SettingsPane value="log" title={messages.tabs.log}>
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
