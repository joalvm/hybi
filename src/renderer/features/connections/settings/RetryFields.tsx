import type { RetryPolicy } from '@shared/domain/connections/policies.js';
import { useMessages } from '@/shared/i18n/useMessages.js';
import { NumberField } from '@/shared/ui/NumberField.js';
import { ToggleField } from '@/shared/ui/ToggleField.js';

type Props = {
  retry: RetryPolicy;
  onChange: (retry: RetryPolicy) => void;
};

/**
 * Reconnection after the peer drops a connection that had reached `open`. A
 * first attempt that never connects is reported instead of retried, and a close
 * the user asked for is final — neither is affected by anything here.
 */
export function RetryFields({ retry, onChange }: Props) {
  const messages = useMessages().connections.retry;

  return (
    <div className="flex flex-col">
      <ToggleField
        label={messages.enabled.label}
        hint={messages.enabled.hint}
        checked={retry.enabled}
        onChange={(enabled) => {
          onChange({ ...retry, enabled });
        }}
      />
      <NumberField
        label={messages.attempts}
        value={retry.attempts}
        min={0}
        max={100}
        disabled={!retry.enabled}
        onChange={(attempts) => {
          onChange({ ...retry, attempts });
        }}
      />
      <NumberField
        label={messages.base.label}
        description={messages.base.description}
        value={retry.baseMs}
        min={100}
        max={60000}
        unit="ms"
        disabled={!retry.enabled}
        onChange={(baseMs) => {
          onChange({ ...retry, baseMs });
        }}
      />
      <NumberField
        label={messages.max}
        value={retry.maxMs}
        min={100}
        max={300000}
        unit="ms"
        disabled={!retry.enabled}
        onChange={(maxMs) => {
          onChange({ ...retry, maxMs });
        }}
      />
    </div>
  );
}
