import { dialog, ipcMain, type BrowserWindow } from 'electron';
import type { Workspace } from '@shared/domain/types.js';
import {
  CHANNELS,
  type ExportOutcome,
  type ImportOutcome,
} from '@shared/ipc/contract.js';
import { asyncApiDefaultFileName, writeAsyncApiExport } from '../asyncapi/export-file.js';
import { importAsyncApi } from '../asyncapi/importer.js';

const ASYNCAPI_CHANNELS = [CHANNELS.asyncapiImport, CHANNELS.asyncapiExport];

/**
 * Native dialogs and filesystem access stay in main. Import accepts AsyncAPI
 * 2.x/3.x; export emits AsyncAPI 3.0 JSON with Hybi extensions.
 */
export function registerAsyncApiHandlers(window: BrowserWindow): () => void {
  ipcMain.handle(CHANNELS.asyncapiImport, async (): Promise<ImportOutcome> => {
    const picked = await dialog.showOpenDialog(window, {
      title: 'Importar AsyncAPI',
      properties: ['openFile'],
      filters: [{ name: 'AsyncAPI', extensions: ['json', 'yaml', 'yml'] }],
    });

    const filePath = picked.filePaths[0];
    if (picked.canceled || filePath === undefined) {
      return { ok: false, cancelled: true, error: 'cancelled' };
    }

    try {
      return { ok: true, ...(await importAsyncApi(filePath)) };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle(
    CHANNELS.asyncapiExport,
    async (_event, workspace: Workspace): Promise<ExportOutcome> => {
      try {
        const picked = await dialog.showSaveDialog(window, {
          title: 'Exportar workspace como AsyncAPI',
          defaultPath: asyncApiDefaultFileName(workspace.name),
          filters: [{ name: 'AsyncAPI JSON', extensions: ['json'] }],
        });
        if (picked.canceled || picked.filePath === '') {
          return { ok: false, cancelled: true, error: 'cancelled' };
        }
        await writeAsyncApiExport(workspace, picked.filePath);
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) };
      }
    },
  );

  return () => {
    for (const channel of ASYNCAPI_CHANNELS) ipcMain.removeHandler(channel);
  };
}
