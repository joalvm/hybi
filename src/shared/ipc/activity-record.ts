import type { TransportFactoryMap, TransportKind } from '../domain/connections/connection.js';
import type { ActivityRecord, CommonActivityRecord } from './activity.js';

/**
 * One builder per transport. A `TransportKind` held in a variable cannot be
 * written into a discriminated union by hand, so this is the single place that
 * turns the kind back into the variant it names — and the map refuses to
 * compile until every transport has an answer.
 */
const RECORD_FACTORIES: TransportFactoryMap<(common: CommonActivityRecord) => ActivityRecord> = {
  websocket: (common) => ({ ...common, transportKind: 'websocket' }),
  // No event and no ack: this is a line the app wrote about the connection, not
  // something that arrived under a name.
  socketio: (common) => ({ ...common, transportKind: 'socketio', event: '', ack: false }),
};

/** An activity record for a transport that is only known at run time. */
export function activityRecordFor(
  kind: TransportKind,
  common: CommonActivityRecord,
): ActivityRecord {
  return RECORD_FACTORIES[kind](common);
}
