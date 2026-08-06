import type { StartupBehavior } from '@shared/preferences/types.js';
import { useMessages } from '@/shared/i18n/useMessages.js';
import { SelectField } from '@/shared/ui/SelectField.js';

type Props = { startup: StartupBehavior; onStartupChange: (startup: StartupBehavior) => void };

/** Read by the main process before any window exists, so it applies next launch. */
export function StartupSection({ startup, onStartupChange }: Props) {
  const messages = useMessages().preferences.startup;

  return (
    <div className="flex flex-col">
      <SelectField
        label={messages.label}
        description={messages.description}
        value={startup}
        options={[
          { value: 'welcome', label: messages.welcome },
          { value: 'last-workspace', label: messages.lastWorkspace },
        ]}
        onChange={(value) => {
          onStartupChange(value as StartupBehavior);
        }}
      />
    </div>
  );
}
