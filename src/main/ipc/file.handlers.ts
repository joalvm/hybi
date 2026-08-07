import { readFile, stat } from 'node:fs/promises';
import { basename } from 'node:path';
import { dialog, ipcMain, type BrowserWindow } from 'electron';
import { bytesToBase64 } from '@shared/binary/base64.js';
import { format } from '@lang/translate.js';
import { CHANNELS, type BinaryFileOutcome } from '@shared/ipc/contract.js';
import { mainMessages } from '../lang.js';

/**
 * The largest file the composer will carry. Well above any frame a server is
 * likely to accept, and low enough that picking the wrong file cannot make the
 * window swallow a disk image: the payload is held in memory as base64, which
 * costs a third more than the file itself.
 */
const MAX_ATTACHMENT_BYTES = 16 * 1024 * 1024;

/** Picking a file to send as one binary frame. The renderer never sees a path. */
export function registerFileHandlers(window: BrowserWindow): () => void {
  ipcMain.handle(CHANNELS.filePickBinary, async (): Promise<BinaryFileOutcome> => {
    const messages = mainMessages();
    const picked = await dialog.showOpenDialog(window, {
      title: messages.menu.pickBinaryFile,
      properties: ['openFile'],
    });

    const filePath = picked.filePaths[0];
    if (picked.canceled || filePath === undefined) {
      return { ok: false, cancelled: true, error: 'cancelled' };
    }

    try {
      // Measured before it is read: the point of the ceiling is not to load the
      // file that exceeds it.
      const { size } = await stat(filePath);
      if (size > MAX_ATTACHMENT_BYTES) {
        return {
          ok: false,
          error: format(messages.validation.attachmentTooLarge, { bytes: MAX_ATTACHMENT_BYTES }),
        };
      }
      const contents = await readFile(filePath);
      return {
        ok: true,
        name: basename(filePath),
        body: bytesToBase64(new Uint8Array(contents)),
        bytes: contents.byteLength,
      };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  return () => {
    ipcMain.removeHandler(CHANNELS.filePickBinary);
  };
}
