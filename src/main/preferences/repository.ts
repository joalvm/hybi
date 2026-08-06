import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { parsePreferences } from '@shared/preferences/schema.js';
import type { AppPreferences } from '@shared/preferences/types.js';

/**
 * One JSON file outside the workspaces directory. The path is injected rather
 * than read from Electron so the repository is testable without booting an app,
 * the same way `WorkspaceRepository` takes its root.
 */
export class PreferencesRepository {
  constructor(private readonly path: string) {}

  /**
   * Never throws. A missing file is a fresh install and a damaged one is a file
   * whose readable half is still worth having: `parsePreferences` replaces what
   * it cannot understand field by field.
   */
  async load(): Promise<AppPreferences> {
    try {
      return parsePreferences(JSON.parse(await readFile(this.path, 'utf8')));
    } catch {
      return parsePreferences(undefined);
    }
  }

  /** Parsed on the way in too, so a rejected value never reaches disk. */
  async save(preferences: AppPreferences): Promise<AppPreferences> {
    const stored = parsePreferences(preferences);
    await mkdir(dirname(this.path), { recursive: true });

    // Write then rename so a crash mid-write cannot truncate the live file.
    const temporary = `${this.path}.tmp`;
    await writeFile(temporary, `${JSON.stringify(stored, null, 2)}\n`, 'utf8');
    await rename(temporary, this.path);

    return stored;
  }
}
