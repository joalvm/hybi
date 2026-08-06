import type { KeepalivePolicy } from '@shared/domain/connections/websocket.js';
import { useMessages } from '@/shared/i18n/useMessages.js';
import { NumberField } from '@/shared/ui/NumberField.js';
import { ToggleField } from '@/shared/ui/ToggleField.js';

type Props = {
  keepalive: KeepalivePolicy;
  onChange: (keepalive: KeepalivePolicy) => void;
};

/**
 * Off by default: a peer that never answers a ping would be hung up on by a
 * setting nobody chose. On, it is what tells a connection cut by a proxy apart
 * from one that is merely quiet.
 */
export function KeepaliveFields({ keepalive, onChange }: Props) {
  const messages = useMessages().connections.keepalive;

  return (
    <div className="flex flex-col">
      <ToggleField
        label={messages.enabled.label}
        hint={messages.enabled.hint}
        checked={keepalive.enabled}
        onChange={(enabled) => {
          onChange({ ...keepalive, enabled });
        }}
      />
      <NumberField
        label={messages.interval}
        value={keepalive.intervalMs}
        min={1000}
        max={600000}
        unit="ms"
        disabled={!keepalive.enabled}
        onChange={(intervalMs) => {
          onChange({ ...keepalive, intervalMs });
        }}
      />
      <NumberField
        label={messages.timeout}
        value={keepalive.timeoutMs}
        min={500}
        max={600000}
        unit="ms"
        disabled={!keepalive.enabled}
        onChange={(timeoutMs) => {
          onChange({ ...keepalive, timeoutMs });
        }}
      />
    </div>
  );
}
