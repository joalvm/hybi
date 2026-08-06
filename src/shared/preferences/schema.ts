import { z } from 'zod';
import {
  ACTIVITY_BYTE_LIMIT_RANGE,
  ACTIVITY_LIMIT_RANGE,
  DEFAULT_PREFERENCES,
  EDITOR_FONT_SIZE_RANGE,
  type PreferenceRange,
} from './defaults.js';
import type { AppPreferences } from './types.js';

/** A bounded whole number that answers with its default rather than failing. */
function bounded(range: PreferenceRange, fallback: number) {
  return z.number().int().min(range.min).max(range.max).catch(fallback);
}

/**
 * Every field carries its own `catch`, so one unreadable setting costs exactly
 * that setting. The object carries one too, for a file that is not an object at
 * all. Nothing here throws: preferences are never worth a build that will not
 * start.
 */
const preferencesSchema = z
  .object({
    version: z.literal(1).catch(1),
    theme: z.enum(['system', 'light', 'dark']).catch(DEFAULT_PREFERENCES.theme),
    language: z.enum(['system', 'en', 'es']).catch(DEFAULT_PREFERENCES.language),
    editorFontSize: bounded(EDITOR_FONT_SIZE_RANGE, DEFAULT_PREFERENCES.editorFontSize),
    activityLimit: bounded(ACTIVITY_LIMIT_RANGE, DEFAULT_PREFERENCES.activityLimit),
    activityByteLimit: bounded(ACTIVITY_BYTE_LIMIT_RANGE, DEFAULT_PREFERENCES.activityByteLimit),
    startup: z.enum(['welcome', 'last-workspace']).catch(DEFAULT_PREFERENCES.startup),
  })
  .catch(() => ({ ...DEFAULT_PREFERENCES }));

export function parsePreferences(input: unknown): AppPreferences {
  return preferencesSchema.parse(input);
}
