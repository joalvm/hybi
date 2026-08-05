import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { cloneWebSocketSettings } from '@shared/domain/connections/defaults.js';
import { createWorkspace } from '@shared/domain/factory.js';
import { WorkspaceRepository } from '../../src/main/workspace/repository.js';

let repository: WorkspaceRepository;
let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'wsw-'));
  repository = new WorkspaceRepository(root);
});

describe('WorkspaceRepository', () => {
  it('round-trips a workspace', async () => {
    const workspace = createWorkspace('Demo');
    await repository.save(workspace);
    expect(await repository.load(workspace.id)).toEqual(workspace);
  });

  it('never writes secret values to disk', async () => {
    const workspace = createWorkspace('Demo');
    workspace.environments.push({
      id: 'env1',
      name: 'local',
      variables: [
        { name: 'host', value: '127.0.0.1', secret: false },
        { name: 'token', value: 'super-secret', secret: true },
      ],
    });
    await repository.save(workspace);

    const raw = await readFile(join(root, `${workspace.id}.json`), 'utf8');
    expect(raw).not.toContain('super-secret');
    expect(raw).toContain('127.0.0.1');

    const loaded = await repository.load(workspace.id);
    expect(loaded.environments[0]?.variables[1]).toEqual({
      name: 'token',
      value: '',
      secret: true,
    });
  });

  it('duplicates a workspace without sharing a single id', async () => {
    const source = createWorkspace('Demo');
    source.environments.push({ id: 'env1', name: 'local', variables: [] });
    source.connections.push({
      id: 'c1',
      name: 'local',
      environmentId: 'env1',
      transport: {
        kind: 'websocket',
        url: 'ws://x',
        settings: cloneWebSocketSettings(),
      },
    });
    const [collection] = source.catalog.collections;
    source.catalog.items.push({
      id: 'e1',
      collectionId: collection?.id ?? '',
      name: 'Login',
      payload: '{}',
      source: 'manual',
    });
    await repository.save(source);

    const copy = await repository.duplicate(source.id, 'Demo (copia)');

    expect(copy.id).not.toBe(source.id);
    expect(copy.name).toBe('Demo (copia)');
    // References follow the copy: the environment and the collection its
    // connection and event point at are the copied ones, not the originals.
    expect(copy.connections[0]?.environmentId).toBe(copy.environments[0]?.id);
    expect(copy.catalog.items[0]?.collectionId).toBe(copy.catalog.collections[0]?.id);
    expect(copy.environments[0]?.id).not.toBe('env1');
    // Both documents survive, and reloading proves the copy is schema-valid.
    expect((await repository.list()).map((entry) => entry.name).sort()).toEqual([
      'Demo',
      'Demo (copia)',
    ]);
    expect((await repository.load(copy.id)).id).toBe(copy.id);
  });

  it('removes a workspace and stays quiet about removing it twice', async () => {
    const workspace = createWorkspace('Demo');
    await repository.save(workspace);

    await repository.remove(workspace.id);
    await repository.remove(workspace.id);

    expect(await repository.list()).toEqual([]);
  });

  it('refuses a workspace id that could escape the directory', async () => {
    await expect(repository.load('../../etc/passwd')).rejects.toThrow(/Invalid workspace id/);
  });

  // There is one format and no upgrade path into it: the alpha shapes were
  // never in anyone's hands, so a file announcing one of them is a file this
  // build must refuse rather than reinterpret.
  it('rejects a file written by a pre-release format', async () => {
    const workspace = createWorkspace('Demo');
    await repository.save(workspace);
    await writeFile(
      join(root, `${workspace.id}.json`),
      JSON.stringify({ ...workspace, version: 4 }),
      'utf8',
    );
    await expect(repository.load(workspace.id)).rejects.toThrow(/Invalid workspace file/);
  });

  it('rejects a file whose contents no longer match the schema', async () => {
    const workspace = createWorkspace('Demo');
    await repository.save(workspace);
    await writeFile(
      join(root, `${workspace.id}.json`),
      JSON.stringify({ ...workspace, version: 99 }),
      'utf8',
    );
    await expect(repository.load(workspace.id)).rejects.toThrow(/Invalid workspace file/);
  });
});
