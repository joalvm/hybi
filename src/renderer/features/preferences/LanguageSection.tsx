import type { LanguagePreference } from '@shared/preferences/types.js';
import { useMessages } from '@/shared/i18n/useMessages.js';
import { SelectField } from '@/shared/ui/SelectField.js';

type Props = {
  language: LanguagePreference;
  onLanguageChange: (language: LanguagePreference) => void;
};

/**
 * The one setting that changes the words around it. `system` reads the host
 * locale, which is why it is a choice and not the default: the app is written in
 * English, and a machine set to a language it does not ship in would otherwise
 * land somewhere the user never picked.
 */
export function LanguageSection({ language, onLanguageChange }: Props) {
  const messages = useMessages().preferences.language;

  return (
    <div className="flex flex-col">
      <SelectField
        label={messages.label}
        description={messages.description}
        value={language}
        options={[
          { value: 'system', label: messages.system },
          { value: 'en', label: messages.en },
          { value: 'es', label: messages.es },
        ]}
        onChange={(value) => {
          onLanguageChange(value as LanguagePreference);
        }}
      />
    </div>
  );
}
