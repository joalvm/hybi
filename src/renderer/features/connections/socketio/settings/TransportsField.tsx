import type { SocketIoEngineTransport } from '@shared/domain/connections/socketio.js';
import { useMessages } from '@/shared/i18n/useMessages.js';
import { Select } from '@/shared/ui/Select.js';
import { SettingsRow } from '@/shared/ui/settings/SettingsRow.js';

type Props = {
  transports: SocketIoEngineTransport[];
  onChange: (transports: SocketIoEngineTransport[]) => void;
};

/**
 * Which engine.io transports the client offers. Three answers rather than a
 * free list: the only orders that mean anything are WebSocket alone, polling
 * alone, and polling that upgrades — which is what a browser does and what a
 * proxy that refuses the upgrade leaves you with.
 */
const CHOICES: Record<string, SocketIoEngineTransport[]> = {
  websocket: ['websocket'],
  polling: ['polling'],
  upgrade: ['polling', 'websocket'],
};

function choiceOf(transports: SocketIoEngineTransport[]): string {
  if (transports.length > 1) return 'upgrade';
  return transports[0] === 'polling' ? 'polling' : 'websocket';
}

export function TransportsField({ transports, onChange }: Props) {
  const messages = useMessages().connections.socketio.transports;

  return (
    <SettingsRow
      label={messages.label}
      description={messages.description}
      control={
        <Select
          label={messages.label}
          className="h-control w-52 rounded-ui border border-border bg-app px-2 text-foreground"
          value={choiceOf(transports)}
          options={[
            { value: 'websocket', label: messages.websocket },
            { value: 'polling', label: messages.polling },
            { value: 'upgrade', label: messages.upgrade },
          ]}
          onChange={(next) => {
            onChange(CHOICES[next] ?? ['websocket']);
          }}
        />
      }
    />
  );
}
