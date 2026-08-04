import { useEffect, useMemo, useRef, useState } from 'react';
import type { WebSocketTransport } from '@shared/domain/connections/websocket.js';
import type { ConnectionState } from '@shared/ipc/activity.js';
import type { VariableScope } from '@shared/variables/resolve.js';
import { bridge } from '@/ipc/bridge.js';
import { VariablePopover } from '@/features/workspace/VariablePopover.js';
import { IconButton } from '@/shared/ui/IconButton.js';
import { SettingsIcon } from '@/shared/ui/icons.js';
import { ConnectButton } from '../ConnectButton.js';
import { UrlInput } from '../UrlInput.js';
import { resolveWebSocketTransport } from './resolve.js';

type Props = {
  connectionId: string;
  environmentId: string | null;
  transport: WebSocketTransport;
  scope: VariableScope;
  state: ConnectionState;
  onTransportChange: (transport: WebSocketTransport) => void;
  onStateChange: (state: ConnectionState) => void;
  onLocalError: (message: string) => void;
  onOpenSettings: () => void;
};

/** WebSocket-specific endpoint controls and IPC translation. */
export function WebSocketConnectionBar(props: Props) {
  const { connectionId, environmentId, transport, scope, state } = props;
  const resolution = useMemo(() => resolveWebSocketTransport(transport, scope), [transport, scope]);
  const [pointed, setPointed] = useState<{ name: string; rect: DOMRect } | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (openTimer.current !== null) clearTimeout(openTimer.current);
      if (closeTimer.current !== null) clearTimeout(closeTimer.current);
    };
  }, []);

  const clearCloseTimer = (): void => {
    if (closeTimer.current !== null) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };

  const pointVariable = (name: string, rect: DOMRect): void => {
    clearCloseTimer();
    if (openTimer.current !== null) clearTimeout(openTimer.current);
    openTimer.current = setTimeout(() => {
      setPointed({ name, rect });
      openTimer.current = null;
    }, 350);
  };

  const closeVariable = (): void => {
    if (openTimer.current !== null) clearTimeout(openTimer.current);
    openTimer.current = null;
    clearCloseTimer();
    setPointed(null);
  };

  const releaseVariable = (): void => {
    if (openTimer.current !== null) clearTimeout(openTimer.current);
    openTimer.current = null;
    clearCloseTimer();
    closeTimer.current = setTimeout(() => {
      setPointed(null);
      closeTimer.current = null;
    }, 250);
  };

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
            releaseVariable();
            return;
          }
          pointVariable(name, rect);
        }}
      />
      <IconButton label="Configuración de la conexión" onClick={props.onOpenSettings}>
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
          onClose={closeVariable}
          onPointerEnter={clearCloseTimer}
          onPointerLeave={releaseVariable}
        />
      )}
    </div>
  );
}
