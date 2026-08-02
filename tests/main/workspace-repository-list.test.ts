import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createWorkspace } from '@shared/domain/factory.js';
import { WorkspaceRepository } from '../../src/main/workspace/repository.js';

let repository: WorkspaceRepository;
let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'wsw-'));
  repository = new WorkspaceRepository(root);
});

describe('WorkspaceRepository list and creation', () => {
  it('lists every saved workspace', async () => {
    await repository.save(createWorkspace('one'));
    await repository.save(createWorkspace('two'));

    const summaries = await repository.list();
    expect(summaries.map((item) => item.name).sort()).toEqual(['one', 'two']);
    expect(summaries[0]?.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('skips unreadable files instead of failing the whole list', async () => {
    await repository.save(createWorkspace('good'));
    await writeFile(join(root, 'broken.json'), 'not json at all', 'utf8');

    const summaries = await repository.list();
    expect(summaries.map((item) => item.name)).toEqual(['good']);
  });

  it('creates a default workspace when the directory is empty', async () => {
    const workspace = await repository.ensureDefault();
    expect(workspace.name).toBe('Workspace');
    expect(await repository.list()).toHaveLength(1);
  });

  it('reuses the existing workspace instead of creating another default', async () => {
    const existing = createWorkspace('Demo');
    await repository.save(existing);
    expect((await repository.ensureDefault()).id).toBe(existing.id);
  });

  it('creates one connection without creating an environment', async () => {
    const created = await repository.create('Staging');
    const loaded = await repository.load(created.id);

    expect((await repository.list()).map((entry) => entry.name)).toEqual(['Staging']);
    expect(loaded.environments).toEqual([]);
    expect(loaded.connections).toHaveLength(1);
    expect(loaded.connections[0]).toMatchObject({
      name: 'Nueva conexión',
      environmentId: null,
    });
  });
});
