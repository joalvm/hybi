import { EDITOR_FONT_SIZE_RANGE } from '@shared/preferences/defaults.js';
import type { ThemePreference } from '@shared/preferences/types.js';
import { useMessages } from '@/shared/i18n/useMessages.js';
import { NumberField } from '@/shared/ui/NumberField.js';
import { SelectField } from '@/shared/ui/SelectField.js';

type Props = {
  theme: ThemePreference;
  editorFontSize: number;
  onThemeChange: (theme: ThemePreference) => void;
  onEditorFontSizeChange: (size: number) => void;
};

/** What the app looks like. Nothing here reaches the network or the document. */
export function AppearanceSection({
  theme,
  editorFontSize,
  onThemeChange,
  onEditorFontSizeChange,
}: Props) {
  const messages = useMessages().preferences;

  return (
    <div className="flex flex-col">
      <SelectField
        label={messages.theme.label}
        description={messages.theme.description}
        value={theme}
        options={[
          { value: 'system', label: messages.theme.system },
          { value: 'light', label: messages.theme.light },
          { value: 'dark', label: messages.theme.dark },
        ]}
        onChange={(value) => {
          onThemeChange(value as ThemePreference);
        }}
      />
      <NumberField
        label={messages.editorFontSize.label}
        description={messages.editorFontSize.description}
        value={editorFontSize}
        min={EDITOR_FONT_SIZE_RANGE.min}
        max={EDITOR_FONT_SIZE_RANGE.max}
        unit="px"
        onChange={onEditorFontSizeChange}
      />
    </div>
  );
}
