import { ipcMain, type BrowserWindow } from 'electron';
import { CHANNELS, type Empty, type Result } from '@shared/ipc/contract.js';
import type { TransportSendResult } from '@shared/transport/contract.js';
import {
  parseCloseConnectionRequest,
  parseOpenConnectionRequest,
  parseSendConnectionRequest,
} from '@shared/transport/schema.js';
import { ActivityBuffer } from '../connections/activity-buffer.js';
import { ConnectionManager } from '../connections/manager.js';

/** Owns all transport sessions and push channels for one workbench window. */
export function registerConnectionHandlers(window: BrowserWindow): () => void {
  const buffer = new ActivityBuffer((records) => {
    if (!window.isDestroyed()) window.webContents.send(CHANNELS.connectionActivity, records);
  });
  const manager = new ConnectionManager({
    state: (event) => {
      if (!window.isDestroyed()) window.webContents.send(CHANNELS.connectionState, event);
    },
    activity: (record) => {
      buffer.push(record);
    },
  });

  ipcMain.handle(CHANNELS.connectionOpen, async (_event, input: unknown): Promise<Result<Empty>> => {
    try {
      await manager.open(parseOpenConnectionRequest(input));
      return { ok: true };
    } catch (error) {
      return failure(error);
    }
  });
  ipcMain.handle(
    CHANNELS.connectionSend,
    async (_event, input: unknown): Promise<Result<TransportSendResult>> => {
      try {
        const request = parseSendConnectionRequest(input);
        const sequence = await manager.send(request.connectionId, request.message);
        return { ok: true, sequence };
      } catch (error) {
        return failure(error);
      }
    },
  );
  ipcMain.handle(CHANNELS.connectionClose, (_event, input: unknown): Result<Empty> => {
    try {
      manager.close(parseCloseConnectionRequest(input).connectionId);
      return { ok: true };
    } catch (error) {
      return failure(error);
    }
  });
  ipcMain.handle(CHANNELS.connectionDispose, (_event, input: unknown): Result<Empty> => {
    try {
      manager.dispose(parseCloseConnectionRequest(input).connectionId);
      return { ok: true };
    } catch (error) {
      return failure(error);
    }
  });

  return () => {
    manager.disposeAll();
    buffer.dispose();
    ipcMain.removeHandler(CHANNELS.connectionOpen);
    ipcMain.removeHandler(CHANNELS.connectionSend);
    ipcMain.removeHandler(CHANNELS.connectionClose);
    ipcMain.removeHandler(CHANNELS.connectionDispose);
  };
}

function failure(error: unknown): { ok: false; error: string } {
  return { ok: false, error: error instanceof Error ? error.message : String(error) };
}
