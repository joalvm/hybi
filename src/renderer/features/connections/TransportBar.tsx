import { useMemo } from 'react';
import type { ConnectionTransport } from '@shared/domain/connections/connection.js';
import type { ConnectionState } from '@shared/ipc/activity.js';
import type { VariableScope } from '@shared/variables/resolve.js';
import { bridge } from '@/ipc/bridge.js';
import { VariablePopover } from '@/features/workspace/VariablePopover.js';
import { useMessages } from '@/shared/i18n/useMessages.js';
import { IconButton } from '@/shared/ui/IconButton.js';
import { SettingsIcon } from '@/shared/ui/icons.js';
import { useHoverIntent } from '@/shared/ui/useHoverIntent.js';
import { ConnectButton } from './ConnectButton.js';
import { resolveTransport } from './resolve.js';
import { UrlInput } from './UrlInput.js';

type Props = {
  connectionId: string;
  environmentId: string | null;
  transport: ConnectionTransport;
  scope: VariableScope;
  state: ConnectionState;
  onTransportChange: (transport: ConnectionTransport) => void;
  onStateChange: (state: ConnectionState) => void;
  onLocalError: (message: string) => void;
  onOpenSettings: () => void;
};

/**
 * The endpoint controls, shared by every transport. What each one does with the
 * URL differs and lives in `resolveTransport`; a bar per protocol would be the
 * same hundred lines twice over the one line that is not the same.
 */
export function TransportBar(props: Props) {
  const messages = useMessages().connections;
  const { connectionId, environmentId, transport, scope, state } = props;
  const resolution = useMemo(() => resolveTransport(transport, scope), [transport, scope]);
  // Same open/close timing as the Monaco editor's variable hover: one panel,
  // one set of delays, wherever the token is written.
  const hover = useHoverIntent<{ name: string; rect: DOMRect }>();
  const pointed = hover.value;

  const crash = (cause: unknown): void => {
    props.onLocalError(cause instanceof Error ? cause.message : String(cause));
    props.onStateChange('error');
  };

  const connect = (): void => {
    props.onStateChange('connecting');
    void bridge.connection
      .open({ connectionId, transport: resolution.transport })
      .then((result) => {
        if (!result.ok) props.onStateChange('error');
      })
      .catch(crash);
  };

  const disconnect = (): void => {
    props.onStateChange('closing');
    void bridge.connection.close({ connectionId }).catch(crash);
  };

  return (
    <div className="flex items-center gap-2 bg-panel px-3 py-2">
      <UrlInput
        value={transport.url}
        missing={resolution.missing}
        scope={scope}
        onChange={(url) => {
          props.onTransportChange({ ...transport, url });
        }}
        onVariablePoint={(name, rect) => {
          if (rect === null) {
            hover.release();
            return;
          }
          hover.point(() => ({ name, rect }));
        }}
      />
      <IconButton label={messages.settings} onClick={props.onOpenSettings}>
        <SettingsIcon />
      </IconButton>
      <ConnectButton
        state={state}
        canConnect={resolution.missing.length === 0}
        onConnect={connect}
        onDisconnect={disconnect}
      />
      {pointed !== null && (
        <VariablePopover
          key={pointed.name}
          name={pointed.name}
          environmentId={environmentId}
          anchor={{ getBoundingClientRect: () => pointed.rect }}
          onClose={hover.close}
          onPointerEnter={hover.keepOpen}
          onPointerLeave={hover.release}
        />
      )}
    </div>
  );
}
