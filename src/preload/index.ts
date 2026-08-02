import { contextBridge, ipcRenderer } from 'electron';
import type { ActivityRecord, ConnectionStateEvent } from '@shared/ipc/activity.js';
import { CHANNELS, type HostPlatform, type WorkbenchBridge } from '@shared/ipc/contract.js';
import { roleOf, versionOf, workspaceIdOf } from '@shared/ipc/window-args.js';

type ChannelListener = Parameters<typeof ipcRenderer.on>[1];

/** Anything that is not macOS or Windows behaves like Linux for the chrome. */
function hostPlatform(): HostPlatform {
  if (process.platform === 'darwin') return 'darwin';
  if (process.platform === 'win32') return 'win32';
  return 'linux';
}

/** Hands the renderer an unsubscribe function instead of the emitter itself. */
function subscribe(channel: string, handler: ChannelListener): () => void {
  ipcRenderer.on(channel, handler);
  return () => {
    ipcRenderer.off(channel, handler);
  };
}

const bridge: WorkbenchBridge = {
  ws: {
    open: (request) => ipcRenderer.invoke(CHANNELS.wsOpen, request),
    close: (request) => ipcRenderer.invoke(CHANNELS.wsClose, request),
    send: (request) => ipcRenderer.invoke(CHANNELS.wsSend, request),
    onState: (listener) =>
      subscribe(CHANNELS.wsState, (_event, payload: ConnectionStateEvent) => {
        listener(payload);
      }),
    onActivity: (listener) =>
      subscribe(CHANNELS.wsActivity, (_event, records: ActivityRecord[]) => {
        listener(records);
      }),
  },
  workspace: {
    list: () => ipcRenderer.invoke(CHANNELS.workspaceList),
    load: (workspaceId) => ipcRenderer.invoke(CHANNELS.workspaceLoad, workspaceId),
    save: (workspace) => ipcRenderer.invoke(CHANNELS.workspaceSave, workspace),
    create: (name) => ipcRenderer.invoke(CHANNELS.workspaceCreate, name),
    duplicate: (workspaceId, name) =>
      ipcRenderer.invoke(CHANNELS.workspaceDuplicate, workspaceId, name),
    remove: (workspaceId) => ipcRenderer.invoke(CHANNELS.workspaceDelete, workspaceId),
  },
  asyncapi: {
    import: () => ipcRenderer.invoke(CHANNELS.asyncapiImport),
  },
  clipboard: {
    readText: () => ipcRenderer.invoke(CHANNELS.clipboardRead),
    writeText: (text) => ipcRenderer.invoke(CHANNELS.clipboardWrite, text),
  },
  window: {
    minimize: () => ipcRenderer.invoke(CHANNELS.windowMinimize),
    toggleMaximize: () => ipcRenderer.invoke(CHANNELS.windowToggleMaximize),
    close: () => ipcRenderer.invoke(CHANNELS.windowClose),
    isMaximized: () => ipcRenderer.invoke(CHANNELS.windowIsMaximized),
    onMaximizedChange: (listener) =>
      subscribe(CHANNELS.windowState, (_event, maximized: boolean) => {
        listener(maximized);
      }),
    popupAppMenu: (anchor) => ipcRenderer.invoke(CHANNELS.windowPopupAppMenu, anchor),
  },
  shell: {
    openWorkspace: (workspaceId) => ipcRenderer.invoke(CHANNELS.shellOpenWorkspace, workspaceId),
  },
  app: {
    version: versionOf(process.argv),
    onAboutRequested: (listener) =>
      subscribe(CHANNELS.appAbout, () => {
        listener();
      }),
  },
  platform: hostPlatform(),
  // Both windows run the same bundle, so what this one is comes from the flags
  // the main process attached to it, never from what happens to be rendered.
  role: roleOf(process.argv),
  workspaceId: workspaceIdOf(process.argv),
};

// Only these closures cross the bridge. `ipcRenderer` itself never does, so the
// renderer cannot reach a channel that is not part of the contract.
contextBridge.exposeInMainWorld('workbench', bridge);
