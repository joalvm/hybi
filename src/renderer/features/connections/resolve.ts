import type { ConnectionTransport } from '@shared/domain/connections/connection.js';
import type { ResolvedTransport } from '@shared/transport/contract.js';
import type { VariableScope } from '@shared/variables/resolve.js';
import { resolveSocketIoTransport } from './socketio/resolve.js';
import { resolveWebSocketTransport } from './websocket/resolve.js';

export type TransportResolution = {
  transport: ResolvedTransport;
  /** Variables the templates referenced and the environment did not define. */
  missing: string[];
};

/**
 * Whichever transport a connection holds, resolved into what crosses IPC. A
 * switch rather than a map because each branch returns a different member of the
 * union: the function's own return type is what makes a missing case an error,
 * since a kind with no branch would fall out of the end returning nothing.
 */
export function resolveTransport(
  transport: ConnectionTransport,
  scope: VariableScope,
): TransportResolution {
  switch (transport.kind) {
    case 'websocket':
      return resolveWebSocketTransport(transport, scope);
    case 'socketio':
      return resolveSocketIoTransport(transport, scope);
  }
}
