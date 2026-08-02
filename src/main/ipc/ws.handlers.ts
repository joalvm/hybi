import { ipcMain, type BrowserWindow } from 'electron';
import {
  CHANNELS,
  type CloseRequest,
  type Empty,
  type OpenRequest,
  type Result,
  type SendRequest,
} from '@shared/ipc/contract.js';
import { ActivityBuffer } from '../connections/activity-buffer.js';
import { ConnectionManager } from '../connections/manager.js';

/**
 * Owns the sockets for one window. State events go straight through; traffic
 * is coalesced by `ActivityBuffer` so a chatty server costs one message per
 * frame instead of one per record.
 */
export function registerWsHandlers(window: BrowserWindow): () => void {
  const buffer = new ActivityBuffer((records) => {
    if (!window.isDestroyed()) window.webContents.send(CHANNELS.wsActivity, records);
  });

  const manager = new ConnectionManager({
    state: (event) => {
      if (!window.isDestroyed()) window.webContents.send(CHANNELS.wsState, event);
    },
    activity: (record) => {
      buffer.push(record);
    },
  });

  ipcMain.handle(CHANNELS.wsOpen, async (_event, request: OpenRequest): Promise<Result<Empty>> => {
    try {
      await manager.open(request);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: messageOf(error) };
    }
  });

  ipcMain.handle(CHANNELS.wsSend, (_event, request: SendRequest): Result<{ sequence: number }> => {
    try {
      return { ok: true, sequence: manager.send(request.connectionId, request.text) };
    } catch (error) {
      return { ok: false, error: messageOf(error) };
    }
  });

  ipcMain.handle(CHANNELS.wsClose, (_event, request: CloseRequest): Result<Empty> => {
    manager.close(request.connectionId);
    return { ok: true };
  });

  return () => {
    manager.disposeAll();
    buffer.dispose();
    ipcMain.removeHandler(CHANNELS.wsOpen);
    ipcMain.removeHandler(CHANNELS.wsSend);
    ipcMain.removeHandler(CHANNELS.wsClose);
  };
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
