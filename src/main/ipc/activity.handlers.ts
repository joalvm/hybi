import { rename, rm, writeFile } from 'node:fs/promises';
import { dialog, ipcMain, type BrowserWindow } from 'electron';
import type { ActivityExportRequest } from '@shared/ipc/activity.js';
import { CHANNELS, type ExportOutcome } from '@shared/ipc/contract.js';
import { activityDefaultFileName, redactFrames, serializeActivity } from '../activity/export.js';

/**
 * Dumping one connection's log to a file. The native dialog and the write live
 * here like every other filesystem path; what the renderer sends is the log it
 * already holds plus the secrets it must not let out.
 */
export function registerActivityHandlers(window: BrowserWindow): () => void {
  ipcMain.handle(
    CHANNELS.activityExport,
    async (_event, request: ActivityExportRequest): Promise<ExportOutcome> => {
      try {
        const picked = await dialog.showSaveDialog(window, {
          title: 'Exportar la actividad',
          defaultPath: activityDefaultFileName(request.connectionName),
          filters: [
            { name: 'JSON', extensions: ['json'] },
            { name: 'Texto plano', extensions: ['txt'] },
          ],
        });
        if (picked.canceled || picked.filePath === '') {
          return { ok: false, cancelled: true, error: 'cancelled' };
        }

        const contents = serializeActivity(
          redactFrames(request.records, request.secrets),
          request.connectionName,
          picked.filePath,
        );

        // Written then renamed, like the workspace file: a crash mid-write must
        // not leave half a log behind a name that says it is complete.
        const temporary = `${picked.filePath}.tmp`;
        try {
          await writeFile(temporary, contents, 'utf8');
          await rename(temporary, picked.filePath);
        } catch (error) {
          await rm(temporary, { force: true });
          throw error;
        }
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) };
      }
    },
  );

  return () => {
    ipcMain.removeHandler(CHANNELS.activityExport);
  };
}
