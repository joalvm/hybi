import type { AppPreferences } from './types.js';

/** A whole-number setting and the window it is allowed to move in. */
export type PreferenceRange = { min: number; max: number };

/** How many records a single connection keeps before the oldest fall off. */
export const ACTIVITY_LIMIT = 2000;

/**
 * How many bytes of frame bodies a single connection keeps. The count above
 * cannot bound memory on its own: `maxMessageBytes` allows a frame far larger
 * than the whole log, so 2000 of them would be gigabytes the user never asked
 * to hold. Whichever limit is reached first decides what falls off.
 */
export const ACTIVITY_BYTE_LIMIT = 8 * 1024 * 1024;

export const MEGABYTE = 1024 * 1024;

/** Below 10 the gutter stops being readable; above 20 two panes stop fitting. */
export const EDITOR_FONT_SIZE_RANGE: PreferenceRange = { min: 10, max: 20 };

export const ACTIVITY_LIMIT_RANGE: PreferenceRange = { min: 100, max: 50_000 };

export const ACTIVITY_BYTE_LIMIT_RANGE: PreferenceRange = {
  min: MEGABYTE,
  max: 128 * MEGABYTE,
};

/**
 * What a fresh install runs with, and what any field the file cannot answer for
 * falls back to. The theme follows the desktop, because a light app on a dark
 * machine is jarring; the language does not, because English is what the app is
 * written in and `system` is one selection away for anyone who wants it.
 */
export const DEFAULT_PREFERENCES: AppPreferences = {
  version: 1,
  theme: 'system',
  language: 'en',
  editorFontSize: 12,
  activityLimit: ACTIVITY_LIMIT,
  activityByteLimit: ACTIVITY_BYTE_LIMIT,
  startup: 'welcome',
};
