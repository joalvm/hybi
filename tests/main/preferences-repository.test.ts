import { mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_PREFERENCES } from '@shared/preferences/defaults.js';
import { PreferencesRepository } from '../../src/main/preferences/repository.js';

let repository: PreferencesRepository;
let root: string;
let file: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'wsw-prefs-'));
  file = join(root, 'preferences.json');
  repository = new PreferencesRepository(file);
});

describe('PreferencesRepository', () => {
  it('answers with the defaults on a fresh install', async () => {
    expect(await repository.load()).toEqual(DEFAULT_PREFERENCES);
  });

  it('round-trips what was saved', async () => {
    const saved = await repository.save({
      ...DEFAULT_PREFERENCES,
      theme: 'dark',
      editorFontSize: 16,
    });

    expect(saved.theme).toBe('dark');
    expect(await repository.load()).toEqual(saved);
  });

  /**
   * The worst outcome for this file is a build that will not start because of
   * it: nothing here is worth more than the app opening.
   */
  it('starts with the defaults instead of failing on a corrupt file', async () => {
    await writeFile(file, '{ not json', 'utf8');

    expect(await repository.load()).toEqual(DEFAULT_PREFERENCES);
  });

  it('recovers the readable half of a damaged file', async () => {
    await writeFile(file, JSON.stringify({ theme: 'dark', editorFontSize: 'huge' }), 'utf8');

    const loaded = await repository.load();

    expect(loaded.theme).toBe('dark');
    expect(loaded.editorFontSize).toBe(DEFAULT_PREFERENCES.editorFontSize);
  });

  /** Write then rename, so a crash mid-write cannot truncate the live file. */
  it('leaves no temporary file behind', async () => {
    await repository.save({ ...DEFAULT_PREFERENCES, theme: 'light' });

    expect(await readdir(root)).toEqual(['preferences.json']);
  });

  it('normalises what it writes so a bad value never reaches disk twice', async () => {
    await repository.save({ ...DEFAULT_PREFERENCES, editorFontSize: 999 });

    const raw = JSON.parse(await readFile(file, 'utf8')) as { editorFontSize: number };
    expect(raw.editorFontSize).toBe(DEFAULT_PREFERENCES.editorFontSize);
  });
});
