import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  createWorkspace,
  duplicateWorkspace,
  ensureStarterConnection,
} from '@shared/domain/factory.js';
import { format } from '@lang/translate.js';
import { WORKSPACE_MIGRATIONS, type WorkspaceMigration } from '@shared/domain/migrate.js';
import type { Workspace, WorkspaceSummary } from '@shared/domain/types.js';
import { mainMessages } from '../lang.js';
import { parseWorkspaceDocument, readWorkspaceDocument, type StoredWorkspace } from './document.js';
import { redactSecrets } from './redact.js';
import { summarizeWorkspaceFile } from './summary.js';

/**
 * One JSON file per workspace. The root directory is injected rather than read
 * from Electron so the repository is testable without booting an app, and the
 * migration chain is injected for the same reason: a step can be exercised
 * against a real file before one exists in the shipped list.
 */
export class WorkspaceRepository {
  constructor(
    private readonly rootDir: string,
    private readonly migrations: readonly WorkspaceMigration[] = WORKSPACE_MIGRATIONS,
  ) {}

  async list(): Promise<WorkspaceSummary[]> {
    await mkdir(this.rootDir, { recursive: true });
    const names = (await readdir(this.rootDir)).filter((name) => name.endsWith('.json'));

    const summaries: WorkspaceSummary[] = [];
    for (const name of names) {
      summaries.push(await summarizeWorkspaceFile(join(this.rootDir, name), this.migrations));
    }

    // Broken rows carry the epoch, so they sort below every file that opens.
    return summaries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async load(workspaceId: string): Promise<Workspace> {
    const path = this.filePath(workspaceId);
    const raw = await readFile(path, 'utf8');
    // Validated here and not in the renderer: a file that does not match the
    // current format never crosses the bridge. The starter connection is added
    // here too, so the window never has to name one and every document reaches
    // it with the surface the editor needs.
    const { workspace, migrated } = readWorkspaceDocument(raw, this.migrations);
    if (migrated) await this.upgrade(path, raw, workspace);

    return ensureStarterConnection(workspace, mainMessages().connections.newConnection);
  }

  async save(workspace: Workspace): Promise<string> {
    await mkdir(this.rootDir, { recursive: true });
    const updatedAt = new Date().toISOString();
    const stored: StoredWorkspace = {
      ...redactSecrets(parseWorkspaceDocument(workspace)),
      updatedAt,
    };

    // Write then rename so a crash mid-write cannot truncate the live file.
    const target = this.filePath(workspace.id);
    const temporary = `${target}.tmp`;
    await writeFile(temporary, `${JSON.stringify(stored, null, 2)}\n`, 'utf8');
    await rename(temporary, target);

    return updatedAt;
  }

  /** `list()` is sorted by `updatedAt`, so the first entry is the last one used. */
  async ensureDefault(): Promise<Workspace> {
    const first = (await this.list()).find((entry) => entry.broken === undefined);
    return first === undefined ? this.create('Workspace') : this.load(first.id);
  }

  async create(name: string): Promise<Workspace> {
    const workspace = ensureStarterConnection(
      createWorkspace(name),
      mainMessages().connections.newConnection,
    );
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

  /**
   * The original bytes are put beside the file before the upgraded document
   * replaces it, so a migration interrupted between the two writes leaves the
   * user something to go back to. `.json.bak` and not `.bak.json`: the list
   * reads `.json` files, and the copy is not one more workspace.
   */
  private async upgrade(path: string, raw: string, workspace: Workspace): Promise<void> {
    await writeFile(`${path}.bak`, raw, 'utf8');
    await this.save(workspace);
  }

  /** Keeps a crafted id from walking out of the workspaces directory. */
  private filePath(workspaceId: string): string {
    if (!/^[A-Za-z0-9-]+$/.test(workspaceId)) {
      throw new Error(format(mainMessages().validation.workspaceId, { id: workspaceId }));
    }
    return join(this.rootDir, `${workspaceId}.json`);
  }
}
