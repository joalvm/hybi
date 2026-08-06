import { extname } from 'node:path';
import { format, plural } from '@lang/translate.js';
import { APP_NAME } from '@shared/brand.js';
import type { ActivityRecord, ActivitySecret } from '@shared/ipc/activity.js';
import { mainMessages } from '../lang.js';

const INVALID_FILE_NAME = /[<>:"/\\|?*]/g;

function replaceControlCharacters(value: string): string {
  let safe = '';
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    safe += codePoint !== undefined && codePoint < 32 ? '-' : character;
  }
  return safe;
}

/** A cross-platform filename from a connection name, without path separators. */
export function activityDefaultFileName(connectionName: string): string {
  const safe = replaceControlCharacters(connectionName)
    .replace(INVALID_FILE_NAME, '-')
    .trim()
    .replace(/[ .]+$/g, '');
  return `${safe === '' ? mainMessages().activity.file.name : safe}.json`;
}

/**
 * Puts `{{name}}` back wherever a secret's resolved value appears. A sent frame
 * carries the substituted text, so a bearer token that `redact.ts` keeps out of
 * the workspace file is sitting in the log in plain sight — and an exported log
 * is the copy that gets attached to an issue.
 *
 * Longest value first: a secret that contains another would otherwise be left
 * half rewritten. `split`/`join` rather than a pattern, so a value full of
 * regular expression syntax is still matched literally.
 */
export function redactFrames(
  records: readonly ActivityRecord[],
  secrets: readonly ActivitySecret[],
): ActivityRecord[] {
  const usable = secrets
    .filter((secret) => secret.value !== '')
    .sort((a, b) => b.value.length - a.value.length);
  if (usable.length === 0) return [...records];

  const hide = (text: string): string => {
    let output = text;
    for (const secret of usable) output = output.split(secret.value).join(`{{${secret.name}}}`);
    return output;
  };

  return records.map((record) => ({
    ...record,
    label: hide(record.label),
    body: hide(record.body),
  }));
}

/** One block per frame, with the body verbatim under its own heading. */
function asText(records: readonly ActivityRecord[], connectionName: string): string {
  const messages = mainMessages().activity;
  const title = format(messages.file.title, { app: APP_NAME, connection: connectionName });
  const summary = plural(messages.file.summary, records.length, {
    at: new Date().toISOString(),
  });
  const header = `# ${title}\n# ${summary}\n`;
  const blocks = records.map((record) => {
    const when = new Date(record.at).toISOString();
    const kind = messages.kinds[record.kind];
    return `\n[${when}] ${kind} ${record.label} (${String(record.bytes)} B)\n${record.body}\n`;
  });
  return `${header}${blocks.join('')}`;
}

/**
 * The format is the extension the user picked in the save dialog, so the choice
 * is made once, in the dialog, instead of twice.
 */
export function serializeActivity(
  records: readonly ActivityRecord[],
  connectionName: string,
  filePath: string,
): string {
  if (extname(filePath).toLowerCase() !== '.json') return asText(records, connectionName);
  return `${JSON.stringify(
    { exportedAt: new Date().toISOString(), connection: connectionName, records },
    null,
    2,
  )}\n`;
}
