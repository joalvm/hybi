import { useMessages } from '@/shared/i18n/useMessages.js';
import { Button } from '@/shared/ui/Button.js';
import { SettingsRow } from '@/shared/ui/settings/SettingsRow.js';

type Props = { onOpenLogs: () => void };

/**
 * Not a setting: the log is always written. What this row offers is the way to
 * reach the file, and the sentence that says what is in it — a report during
 * the beta is worth what the user is willing to attach to it, and nobody
 * attaches a file they cannot be sure about.
 */
export function DiagnosticsSection({ onOpenLogs }: Props) {
  const messages = useMessages().preferences.diagnostics;

  return (
    <div className="flex flex-col">
      <SettingsRow
        label={messages.label}
        description={messages.description}
        control={
          <Button size="sm" onClick={onOpenLogs}>
            {messages.open}
          </Button>
        }
      />
    </div>
  );
}
