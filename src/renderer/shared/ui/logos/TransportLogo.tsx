import type {
  TransportFactoryMap,
  TransportKind,
} from '@shared/domain/connections/connection.js';
import { cn } from '../../utils/cn.js';
import { SocketIoLogo } from './SocketIoLogo.js';
import { WebSocketLogo } from './WebSocketLogo.js';

type Mark = {
  Glyph: (props: { className?: string }) => React.ReactElement;
  /** The protocol's own colour, distinct from the app's accent and from state. */
  tone: string;
};

/**
 * One mark per transport, typed as the total map so a transport with no mark is
 * a compiler error rather than an empty box in the tab strip. Same forcing
 * function as `ADAPTER_FACTORIES` and `CLONERS`.
 */
export const TRANSPORT_LOGOS: TransportFactoryMap<Mark> = {
  websocket: { Glyph: WebSocketLogo, tone: 'text-transport-websocket' },
  socketio: { Glyph: SocketIoLogo, tone: 'text-transport-socketio' },
};

/**
 * Which protocol a connection speaks, wherever the connection is named. It says
 * only that: how the connection is doing is the state dot's answer, and keeping
 * the two apart is what lets a tab carry both without either one being read as
 * the other.
 */
export function TransportLogo({ kind, className }: { kind: TransportKind; className?: string }) {
  const { Glyph, tone } = TRANSPORT_LOGOS[kind];
  return <Glyph className={cn('shrink-0', tone, className)} />;
}
