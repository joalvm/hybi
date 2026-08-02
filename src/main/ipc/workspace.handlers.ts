import { ipcMain } from 'electron';
import type { Workspace, WorkspaceSummary } from '@shared/domain/types.js';
import { CHANNELS, type Empty, type Result } from '@shared/ipc/contract.js';
import { workspacesDirectory } from '../workspace/paths.js';
import { WorkspaceRepository } from '../workspace/repository.js';

const WORKSPACE_CHANNELS = [
  CHANNELS.workspaceList,
  CHANNELS.workspaceLoad,
  CHANNELS.workspaceSave,
  CHANNELS.workspaceCreate,
  CHANNELS.workspaceDuplicate,
  CHANNELS.workspaceDelete,
];

export function registerWorkspaceHandlers(): () => void {
  const repository = new WorkspaceRepository(workspacesDirectory());

  ipcMain.handle(CHANNELS.workspaceList, (): Promise<WorkspaceSummary[]> => repository.list());

  // `null` means "whatever workspace this user last had", which on a fresh
  // install is one the repository creates on the spot.
  ipcMain.handle(CHANNELS.workspaceLoad, (_event, workspaceId: string | null): Promise<Workspace> =>
    workspaceId === null ? repository.ensureDefault() : repository.load(workspaceId),
  );

  ipcMain.handle(
    CHANNELS.workspaceSave,
    async (_event, workspace: Workspace): Promise<Result<{ savedAt: string }>> => {
      try {
        return { ok: true, savedAt: await repository.save(workspace) };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) };
      }
    },
  );

  // Create and duplicate answer with the document itself: the renderer installs
  // what it gets rather than asking for it again.
  ipcMain.handle(CHANNELS.workspaceCreate, (_event, name: string): Promise<Workspace> =>
    repository.create(name),
  );

  ipcMain.handle(
    CHANNELS.workspaceDuplicate,
    (_event, workspaceId: string, name: string): Promise<Workspace> =>
      repository.duplicate(workspaceId, name),
  );

  ipcMain.handle(
    CHANNELS.workspaceDelete,
    async (_event, workspaceId: string): Promise<Result<Empty>> => {
      try {
        await repository.remove(workspaceId);
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) };
      }
    },
  );

  return () => {
    for (const channel of WORKSPACE_CHANNELS) ipcMain.removeHandler(channel);
  };
}
