import { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { DEFAULT_CONNECTION_SETTINGS } from '@shared/domain/defaults.js';
import { resolveText } from '@shared/variables/resolve.js';
import { bridge } from '@/ipc/bridge.js';
import { VariablePopover } from '@/features/workspace/VariablePopover.js';
import { IconButton } from '@/shared/ui/IconButton.js';
import { SettingsIcon } from '@/shared/ui/icons.js';
import { selectScopeFor } from '@/store/selectors.js';
import { useStore } from '@/store/index.js';
import { ConnectButton } from './ConnectButton.js';
import { resolveSocketOptions } from './socket-options.js';
import { UrlInput } from './UrlInput.js';

type Props = { connectionId: string };

/**
 * URL and connect, nothing else. Failures are not shown here: every error the
 * app produces is written to the activity log, which is the one place to look
 * for what went wrong, and the button is left saying only what it can do next.
 *
 * Which environment a connection resolves against is set in the app chrome: it
 * belongs to the workspace and applies across tabs, so repeating the picker in
 * every connection bar only asked the same question twice.
 *
 * The URL is resolved during render rather than reported upward by the input:
 * `missing` is a function of the template and the scope, so an effect would only
 * add a frame of stale state.
 */
export function ConnectionBar({ connectionId }: Props) {
  const connection = useStore(
    (state) => state.workspace?.connections.find((entry) => entry.id === connectionId) ?? null,
  );
  // `useShallow` compares the scope entry by entry, so the map keeps its
  // identity between renders and `resolution` is not recomputed for nothing.
  const scope = useStore(useShallow(selectScopeFor(connectionId)));
  const state = useStore((store) => store.states[connectionId] ?? 'idle');
  const upsertConnection = useStore((store) => store.upsertConnection);
  const setConnectionState = useStore((store) => store.setConnectionState);
  const appendLocalError = useStore((store) => store.appendLocalError);
  const openSettings = useStore((store) => store.openConnectionSettings);
  /** The token under the pointer, with the rectangle to hang the popover off. */
  const [pointed, setPointed] = useState<{ name: string; rect: DOMRect } | null>(null);

  const url = connection?.url ?? '';
  // A module constant while no connection is loaded, so the memo below keeps
  // its result instead of recomputing against a fresh object every render.
  const settings = connection?.settings ?? DEFAULT_CONNECTION_SETTINGS;
  const resolution = useMemo(() => resolveText(url, scope), [url, scope]);
  const socket = useMemo(() => resolveSocketOptions(settings, scope), [settings, scope]);

  if (connection === null) return null;

  // A header pointing at a variable nobody defined is as broken as a URL that
  // does: the handshake would go out with `{{token}}` where the token belongs.
  const canConnect = resolution.missing.length === 0 && socket.missing.length === 0;

  /** A rejected bridge call: the main process never reached its own log. */
  const crash = (cause: unknown): void => {
    appendLocalError(connectionId, cause instanceof Error ? cause.message : String(cause));
    setConnectionState(connectionId, 'error');
  };

  const connect = (): void => {
    // Optimistic: the main process confirms with its own state event, but the
    // button must stop offering a second connect in the meantime.
    setConnectionState(connectionId, 'connecting');
    void bridge.ws
      .open({ connectionId, url: resolution.text, options: socket.options })
      .then((result) => {
        // The reason already went to the activity log from the main process,
        // so only the state is settled here.
        if (!result.ok) setConnectionState(connectionId, 'error');
      })
      .catch(crash);
  };

  const disconnect = (): void => {
    setConnectionState(connectionId, 'closing');
    void bridge.ws.close({ connectionId }).catch(crash);
  };

  return (
    <div className="connection-bar">
      <UrlInput
        value={connection.url}
        missing={resolution.missing}
        onChange={(value) => {
          upsertConnection({ ...connection, url: value });
        }}
        onVariablePoint={(name, rect) => {
          setPointed(rect === null ? null : { name, rect });
        }}
      />
      {/* Next to the URL rather than inside the tab menu alone: headers and
          subprotocols are part of what this bar opens, and reaching them
          should not mean finding the tab first. */}
      <IconButton
        label="Configuración de la conexión"
        onClick={() => {
          openSettings(connectionId);
        }}
      >
        <SettingsIcon />
      </IconButton>
      <ConnectButton
        state={state}
        canConnect={canConnect}
        onConnect={connect}
        onDisconnect={disconnect}
      />
      {pointed !== null && (
        <VariablePopover
          // A remount per token: the draft field is seeded from the store on
          // mount, so the next variable pointed at must be a new component.
          key={pointed.name}
          name={pointed.name}
          environmentId={connection.environmentId}
          anchor={{ getBoundingClientRect: () => pointed.rect }}
          onClose={() => {
            setPointed(null);
          }}
        />
      )}
    </div>
  );
}
