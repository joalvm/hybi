import { dialog, ipcMain, type BrowserWindow } from 'electron';
import { CHANNELS, type ImportOutcome } from '@shared/ipc/contract.js';
import { importAsyncApi } from '../asyncapi/importer.js';

/**
 * The renderer never sees a path: it asks for an import, the main process runs
 * the native picker and answers with catalog entries. Any AsyncAPI 2.x or 3.x
 * document works — the importer knows nothing about a particular server.
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

  return () => {
    ipcMain.removeHandler(CHANNELS.asyncapiImport);
  };
}
