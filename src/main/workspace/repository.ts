import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  createWorkspace,
  duplicateWorkspace,
  ensureStarterConnection,
} from '@shared/domain/factory.js';
import { migrateWorkspace } from '@shared/domain/migrate.js';
import { parseWorkspace } from '@shared/domain/schema.js';
import type { Workspace, WorkspaceSummary } from '@shared/domain/types.js';
import { redactSecrets } from './redact.js';

/** `updatedAt` is repository bookkeeping, so it is not part of the domain type. */
type StoredWorkspace = Workspace & { updatedAt?: string };

const EPOCH = new Date(0).toISOString();

/**
 * One JSON file per workspace. The root directory is injected rather than read
 * from Electron so the repository is testable without booting an app.
 */
export class WorkspaceRepository {
  constructor(private readonly rootDir: string) {}

  async list(): Promise<WorkspaceSummary[]> {
    await mkdir(this.rootDir, { recursive: true });
    const names = (await readdir(this.rootDir)).filter((name) => name.endsWith('.json'));

    const summaries: WorkspaceSummary[] = [];
    for (const name of names) {
      const summary = await this.summarize(join(this.rootDir, name));
      if (summary !== null) summaries.push(summary);
    }

    return summaries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async load(workspaceId: string): Promise<Workspace> {
    const raw = await readFile(this.filePath(workspaceId), 'utf8');
    const { updatedAt: _updatedAt, ...rest } = JSON.parse(raw) as StoredWorkspace;
    // Migrating here and not in the renderer keeps every older shape on this
    // side of the bridge: the rest of the app only ever sees the current one.
    return parseWorkspace(migrateWorkspace(rest));
  }

  async save(workspace: Workspace): Promise<string> {
    await mkdir(this.rootDir, { recursive: true });
    const updatedAt = new Date().toISOString();
    const stored: StoredWorkspace = { ...redactSecrets(parseWorkspace(workspace)), updatedAt };

    // Write then rename so a crash mid-write cannot truncate the live file.
    const target = this.filePath(workspace.id);
    const temporary = `${target}.tmp`;
    await writeFile(temporary, `${JSON.stringify(stored, null, 2)}\n`, 'utf8');
    await rename(temporary, target);

    return updatedAt;
  }

  /** `list()` is sorted by `updatedAt`, so the first entry is the last one used. */
  async ensureDefault(): Promise<Workspace> {
    const [first] = await this.list();
    return first === undefined ? this.create('Workspace') : this.load(first.id);
  }

  async create(name: string): Promise<Workspace> {
    const workspace = ensureStarterConnection(createWorkspace(name));
    await this.save(workspace);
    return workspace;
  }

  async duplicate(workspaceId: string, name: string): Promise<Workspace> {
    const copy = duplicateWorkspace(await this.load(workspaceId), name);
    await this.save(copy);
    return copy;
  }

  /** `force` so deleting a workspace twice is not an error worth surfacing. */
  async remove(workspaceId: string): Promise<void> {
    await rm(this.filePath(workspaceId), { force: true });
  }

  private async summarize(path: string): Promise<WorkspaceSummary | null> {
    try {
      const stored = JSON.parse(await readFile(path, 'utf8')) as StoredWorkspace;
      return { id: stored.id, name: stored.name, updatedAt: stored.updatedAt ?? EPOCH };
    } catch {
      // A corrupt or foreign file must not hide every other workspace.
      return null;
    }
  }

  /** Keeps a crafted id from walking out of the workspaces directory. */
  private filePath(workspaceId: string): string {
    if (!/^[A-Za-z0-9-]+$/.test(workspaceId)) {
      throw new Error(`Invalid workspace id: ${workspaceId}`);
    }
    return join(this.rootDir, `${workspaceId}.json`);
  }
}
