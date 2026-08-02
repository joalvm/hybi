/**
 * `closed` and `dropped` are both a shut socket; they differ in who shut it.
 * `dropped` means the peer did, which is the only close worth warning about —
 * the user already knows about the ones they asked for.
 */
export type ConnectionState =
  | 'idle'
  | 'connecting'
  | 'open'
  | 'closing'
  | 'closed'
  | 'dropped'
  | 'error';

export type ActivityKind = 'outgoing' | 'incoming' | 'status' | 'error';

/**
 * One line in the activity log. `body` is the exact text that crossed the
 * socket; `label` is only a display hint derived from it.
 */
export type ActivityRecord = {
  id: string;
  connectionId: string;
  sequence: number;
  kind: ActivityKind;
  at: number;
  label: string;
  body: string;
  bytes: number;
};

export type ConnectionStateEvent = {
  connectionId: string;
  state: ConnectionState;
  detail?: string;
};
