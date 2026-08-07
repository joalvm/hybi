import { format } from '@lang/translate.js';
import { mainMessages } from '../../lang.js';

/**
 * The status lines the session writes into the activity log. They are sentences
 * the user reads, so they live in the catalog and not in a template literal
 * inside the state machine.
 */
export function closedNote(code: number): string {
  return format(mainMessages().activity.notes.closed, { code });
}

export function retryNote(
  attempt: number,
  attempts: number,
  delay: number,
): { label: string; body: string } {
  const notes = mainMessages().activity.notes;
  return {
    label: format(notes.retrying, { attempt, attempts }),
    body: format(notes.retryDelay, { delay }),
  };
}
