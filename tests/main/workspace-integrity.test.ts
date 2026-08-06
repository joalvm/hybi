import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createWorkspace } from '@shared/domain/factory.js';
import type { WorkspaceMigration } from '@shared/domain/migrate.js';
import { WorkspaceRepository } from '../../src/main/workspace/repository.js';

let root: string;
let repository: WorkspaceRepository;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'wsw-'));
  repository = new WorkspaceRepository(root);
});

describe('WorkspaceRepository integrity', () => {
  it('lists an unreadable file as broken instead of hiding it', async () => {
    await repository.save(createWorkspace('good'));
    await writeFile(join(root, 'broken.json'), 'not json at all', 'utf8');

    const summaries = await repository.list();
    const broken = summaries.find((entry) => entry.broken !== undefined);

    expect(summaries).toHaveLength(2);
    expect(broken?.id).toBe('broken');
    expect(broken?.broken?.path).toBe(join(root, 'broken.json'));
    expect(broken?.broken?.reason).not.toBe('');
  });

  it('marks a file that is JSON but not a workspace', async () => {
    await writeFile(join(root, 'foreign.json'), '{"hello":"world"}', 'utf8');

    const [entry] = await repository.list();
    expect(entry?.broken).toBeDefined();
  });

  /** A damaged file is not a document, so it cannot be the one that opens. */
  it('never hands a broken file to ensureDefault', async () => {
    await writeFile(join(root, 'broken.json'), '{', 'utf8');

    const workspace = await repository.ensureDefault();
    expect(workspace.name).toBe('Workspace');
  });

  it('sorts broken files after the workspaces that still open', async () => {
    await writeFile(join(root, 'broken.json'), '{', 'utf8');
    await repository.save(createWorkspace('good'));

    const summaries = await repository.list();
    expect(summaries[0]?.name).toBe('good');
    expect(summaries[1]?.broken).toBeDefined();
  });

  it('discards a broken file by name', async () => {
    await writeFile(join(root, 'broken.json'), '{', 'utf8');
    await repository.remove('broken');

    expect(await repository.list()).toEqual([]);
  });
});

describe('WorkspaceRepository migration', () => {
  /** Renames the field the old format used, which is what a real step does. */
  const step: WorkspaceMigration = {
    from: 0,
    to: 1,
    apply: (document) => {
      const { legacyName, ...rest } = document as { legacyName?: string };
      return { ...rest, name: legacyName ?? 'unnamed' };
    },
  };

  async function writeLegacy(id: string): Promise<string> {
    const { name: _name, ...rest } = createWorkspace('ignored');
    const legacy = { ...rest, id, version: 0, legacyName: 'From v0' };
    const raw = `${JSON.stringify(legacy, null, 2)}\n`;
    await writeFile(join(root, `${id}.json`), raw, 'utf8');
    return raw;
  }

  it('upgrades a stored document to the current format', async () => {
    const migrating = new WorkspaceRepository(root, [step]);
    await writeLegacy('legacy');

    const workspace = await migrating.load('legacy');
    expect(workspace.name).toBe('From v0');
    expect(workspace.version).toBe(1);
  });

  it('copies the original file before the upgrade replaces it', async () => {
    const migrating = new WorkspaceRepository(root, [step]);
    const original = await writeLegacy('legacy');

    await migrating.load('legacy');

    expect(await readFile(join(root, 'legacy.json.bak'), 'utf8')).toBe(original);
    expect(JSON.parse(await readFile(join(root, 'legacy.json'), 'utf8'))).toMatchObject({
      version: 1,
      name: 'From v0',
    });
  });

  /** The copy is not a document: it must not show up as one more workspace. */
  it('keeps the copy out of the list', async () => {
    const migrating = new WorkspaceRepository(root, [step]);
    await writeLegacy('legacy');
    await migrating.load('legacy');

    expect((await migrating.list()).map((entry) => entry.name)).toEqual(['From v0']);
  });

  it('writes no copy when the document was already current', async () => {
    const saved = await repository.create('Demo');
    await repository.load(saved.id);

    await expect(readFile(join(root, `${saved.id}.json.bak`), 'utf8')).rejects.toThrow();
  });

  it('refuses a document saved by a newer build', async () => {
    const future = { ...createWorkspace('Future'), id: 'future', version: 2 };
    await writeFile(join(root, 'future.json'), JSON.stringify(future), 'utf8');

    await expect(repository.load('future')).rejects.toThrow(/2/);
  });
});
