import type { ActivityRecord } from '@shared/ipc/activity.js';
import { usePreferences } from './preferences.store.js';

/**
 * What a record costs the window, which is not always what it weighed on the
 * wire: a binary frame is held as base64, four characters for every three bytes.
 * Charging it its wire size would let the log outgrow the ceiling by a third.
 */
function weightOf(record: ActivityRecord | undefined): number {
  if (record === undefined) return 0;
  return record.encoding === 'base64' ? Math.ceil((record.bytes * 4) / 3) : record.bytes;
}

/**
 * The window the log keeps, counting back from the newest record. Returns the
 * same array when nothing has to go, so an append that changes nothing does not
 * hand zustand a new reference.
 *
 * Both limits are preferences, read on every batch rather than captured: a
 * budget the user just lowered has to apply to the log that is already there,
 * not only to the frames that arrive after it.
 *
 * The record count cannot bound memory on its own — `maxMessageBytes` allows a
 * frame far larger than the whole log — so whichever limit is reached first
 * decides what falls off. The newest record always survives, even alone over
 * budget: dropping the frame that just arrived would make the log lie about
 * what the socket did.
 */
export function withinBudget(records: ActivityRecord[]): ActivityRecord[] {
  if (records.length === 0) return records;
  const { activityLimit, activityByteLimit } = usePreferences.getState();

  const floor = Math.max(0, records.length - activityLimit);
  let start = records.length - 1;
  let weight = weightOf(records[start]);

  // Walk backwards from the newest, taking one more record only while it fits.
  while (start > floor) {
    const older = records[start - 1];
    if (older === undefined) break;
    const cost = weightOf(older);
    if (weight + cost > activityByteLimit) break;
    weight += cost;
    start -= 1;
  }

  return start === 0 ? records : records.slice(start);
}
