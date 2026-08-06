import type { Messages } from '@lang/translate.js';
import type { ConnectionState } from '@shared/ipc/activity.js';

export type StateTone = 'neutral' | 'ok' | 'warn' | 'error';
export type StateLabel = { text: string; tone: StateTone };

/** The words each state is read in, handed over by whoever holds the catalog. */
export type StateLabels = Messages['connections']['states'];

/**
 * The three shut states read the same on purpose: the user cares that nothing is
 * connected, not whether a socket was ever opened. Only the tone separates a
 * close they asked for from one the peer imposed, which is why the tone lives
 * here and the wording lives in the catalog.
 */
const TONES: Record<ConnectionState, StateTone> = {
  idle: 'neutral',
  connecting: 'warn',
  open: 'ok',
  closing: 'warn',
  closed: 'neutral',
  dropped: 'warn',
  error: 'error',
};

export function stateLabel(state: ConnectionState, labels: StateLabels): StateLabel {
  return { text: labels[state], tone: TONES[state] };
}
