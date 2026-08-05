import { EDITOR_FONT_SIZE_RANGE } from '@shared/preferences/defaults.js';
import type { ThemePreference } from '@shared/preferences/types.js';
import { NumberField } from '@/shared/ui/NumberField.js';
import { SelectField } from '@/shared/ui/SelectField.js';

const THEME_OPTIONS = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
];

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
  return (
    <div className="flex flex-col">
      <SelectField
        label="Tema"
        description="Sistema sigue el modo claro u oscuro del escritorio."
        value={theme}
        options={THEME_OPTIONS}
        onChange={(value) => {
          onThemeChange(value as ThemePreference);
        }}
      />
      <NumberField
        label="Tamaño de fuente del editor"
        description="Se aplica al composer, a la documentación y al detalle del log."
        value={editorFontSize}
        min={EDITOR_FONT_SIZE_RANGE.min}
        max={EDITOR_FONT_SIZE_RANGE.max}
        unit="px"
        onChange={onEditorFontSizeChange}
      />
    </div>
  );
}
