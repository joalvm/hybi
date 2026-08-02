import type { ConnectionState } from '@shared/ipc/activity.js';

export type StateLabel = { text: string; tone: 'neutral' | 'ok' | 'warn' | 'error' };

/**
 * The three shut states read the same on purpose: the user cares that nothing is
 * connected, not whether a socket was ever opened. Only the tone separates a
 * close they asked for from one the peer imposed.
 */
const LABELS: Record<ConnectionState, StateLabel> = {
  idle: { text: 'Desconectado', tone: 'neutral' },
  connecting: { text: 'Conectando', tone: 'warn' },
  open: { text: 'Conectado', tone: 'ok' },
  closing: { text: 'Cerrando', tone: 'warn' },
  closed: { text: 'Desconectado', tone: 'neutral' },
  dropped: { text: 'Desconectado', tone: 'warn' },
  error: { text: 'Error', tone: 'error' },
};

export function stateLabel(state: ConnectionState): StateLabel {
  return LABELS[state];
}
