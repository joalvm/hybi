import { describe, expect, it } from 'vitest';
import { DEFAULT_PREFERENCES } from '@shared/preferences/defaults.js';
import { resolveLanguage, resolveTheme } from '@shared/preferences/resolve.js';
import { parsePreferences } from '@shared/preferences/schema.js';
import type { AppPreferences } from '@shared/preferences/types.js';

const complete: AppPreferences = {
  version: 1,
  theme: 'dark',
  language: 'es',
  editorFontSize: 15,
  activityLimit: 500,
  activityByteLimit: 4 * 1024 * 1024,
  startup: 'last-workspace',
};

describe('parsePreferences', () => {
  it('keeps a file that matches the format', () => {
    expect(parsePreferences(complete)).toEqual(complete);
  });

  it('answers with the defaults when the file is not an object', () => {
    expect(parsePreferences('corrupt')).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences(null)).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences(undefined)).toEqual(DEFAULT_PREFERENCES);
  });

  /** One unreadable field must not cost the user every other setting. */
  it('replaces only the fields it cannot read', () => {
    const parsed = parsePreferences({ ...complete, theme: 'neon' });

    expect(parsed.theme).toBe(DEFAULT_PREFERENCES.theme);
    expect(parsed.editorFontSize).toBe(15);
    expect(parsed.startup).toBe('last-workspace');
  });

  it('falls back to the default for a number outside its bounds', () => {
    const parsed = parsePreferences({ ...complete, editorFontSize: 400, activityLimit: 0 });

    expect(parsed.editorFontSize).toBe(DEFAULT_PREFERENCES.editorFontSize);
    expect(parsed.activityLimit).toBe(DEFAULT_PREFERENCES.activityLimit);
  });

  it('drops keys that are not part of the format', () => {
    expect(parsePreferences({ ...complete, spy: 'yes' })).toEqual(complete);
  });

  it('restores a missing field instead of leaving it absent', () => {
    const { startup: _startup, ...withoutStartup } = complete;

    expect(parsePreferences(withoutStartup).startup).toBe(DEFAULT_PREFERENCES.startup);
  });
});

describe('resolveTheme', () => {
  it('follows the host only while the preference says system', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });
});

describe('resolveLanguage', () => {
  it('reads the host locale only while the preference says system', () => {
    expect(resolveLanguage('system', 'es-PE')).toBe('es');
    expect(resolveLanguage('system', 'es')).toBe('es');
    expect(resolveLanguage('system', 'fr-FR')).toBe('en');
    expect(resolveLanguage('en', 'es-PE')).toBe('en');
    expect(resolveLanguage('es', 'en-US')).toBe('es');
  });
});
