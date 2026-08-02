import type {
  Collection,
  EventItem,
  KeepalivePolicy,
  RetryPolicy,
  Workspace,
  WorkspaceSummary,
} from '../domain/types.js';
import type { ActivityRecord, ConnectionStateEvent } from './activity.js';

export const CHANNELS = {
  wsOpen: 'ws:open',
  wsClose: 'ws:close',
  wsSend: 'ws:send',
  wsState: 'ws:state',
  wsActivity: 'ws:activity',
  workspaceList: 'workspace:list',
  workspaceLoad: 'workspace:load',
  workspaceSave: 'workspace:save',
  workspaceCreate: 'workspace:create',
  workspaceDuplicate: 'workspace:duplicate',
  workspaceDelete: 'workspace:delete',
  asyncapiImport: 'asyncapi:import',
  clipboardRead: 'clipboard:read',
  clipboardWrite: 'clipboard:write',
  windowMinimize: 'window:minimize',
  windowToggleMaximize: 'window:toggle-maximize',
  windowClose: 'window:close',
  windowIsMaximized: 'window:is-maximized',
  windowState: 'window:state',
  windowPopupAppMenu: 'window:popup-app-menu',
  shellOpenWorkspace: 'shell:open-workspace',
} as const;

/** Only the distinction the chrome needs: macOS draws its own controls. */
export type HostPlatform = 'darwin' | 'win32' | 'linux';

/**
 * Which of the two windows this renderer is. They share one bundle, so the role
 * arrives from the main process instead of being guessed from what is on screen:
 * `welcome` picks a document, `workbench` edits the one it was opened with.
 */
export type WindowRole = 'welcome' | 'workbench';

export type Failure = { ok: false; error: string };
export type Success<T> = { ok: true } & T;
export type Result<T> = Success<T> | Failure;

/**
 * A success that carries no payload. `Record<never, never>` rather than
 * `Record<string, never>`, whose index signature would make `Success<Empty>`
 * reject its own `ok` property.
 */
export type Empty = Record<never, never>;

/**
 * A connection's settings as the socket needs them, not as they are stored.
 *
 * `headers` arrives already resolved and flattened: the renderer substitutes
 * `{{variables}}` before it calls, exactly as it does for the URL, so the
 * variable scope — which holds secret values that are kept out of the workspace
 * file — never has to cross to the main process.
 */
export type SocketOptions = {
  headers: Record<string, string>;
  protocols: string[];
  retry: RetryPolicy;
  keepalive: KeepalivePolicy;
  verifyCertificate: boolean;
  maxMessageBytes: number;
};

/** Omitting `options` opens with the defaults, which is what v2 always did. */
export type OpenRequest = { connectionId: string; url: string; options?: SocketOptions };
export type SendRequest = { connectionId: string; text: string };
export type CloseRequest = { connectionId: string };

export type ImportResult = {
  collections: Collection[];
  items: EventItem[];
  sourceName: string;
};

/** Cancelling the native file dialog is not an error, so it gets its own shape. */
export type ImportOutcome = Result<ImportResult> | { ok: false; cancelled: true; error: string };

/** The complete surface the preload exposes. Nothing else crosses the bridge. */
export type WorkbenchBridge = {
  ws: {
    open(request: OpenRequest): Promise<Result<Empty>>;
    close(request: CloseRequest): Promise<Result<Empty>>;
    send(request: SendRequest): Promise<Result<{ sequence: number }>>;
    onState(listener: (event: ConnectionStateEvent) => void): () => void;
    onActivity(listener: (records: ActivityRecord[]) => void): () => void;
  };
  workspace: {
    list(): Promise<WorkspaceSummary[]>;
    /** `null` opens the last used workspace, creating one when none exists. */
    load(workspaceId: string | null): Promise<Workspace>;
    save(workspace: Workspace): Promise<Result<{ savedAt: string }>>;
    create(name: string): Promise<Workspace>;
    duplicate(workspaceId: string, name: string): Promise<Workspace>;
    remove(workspaceId: string): Promise<Result<Empty>>;
    /** Renaming needs no channel: the name is in the document, so autosave carries it. */
  };
  asyncapi: {
    import(): Promise<ImportOutcome>;
  };
  /**
   * The renderer is denied every permission by the security policy, so
   * `navigator.clipboard` is not available to it. Reading and writing happen in
   * the main process, over this contract like everything else.
   */
  clipboard: {
    readText(): Promise<string>;
    writeText(text: string): Promise<void>;
  };
  /**
   * The frame is drawn by the renderer, so the three controls are requests like
   * any other. The main process acts on the window that sent them, never on a
   * window the renderer names.
   */
  window: {
    minimize(): Promise<void>;
    toggleMaximize(): Promise<void>;
    close(): Promise<void>;
    isMaximized(): Promise<boolean>;
    onMaximizedChange(listener: (maximized: boolean) => void): () => void;
    /**
     * Drops the real application menu under the button that asked for it. The
     * menu itself is built in the main process, so File, Edit and View stay
     * native even though no menu bar is drawn.
     */
    popupAppMenu(anchor: { x: number; y: number }): Promise<void>;
  };
  /** Opens a document in the workbench window, replacing the welcome window. */
  shell: {
    openWorkspace(workspaceId: string): Promise<void>;
  };
  /** Decides who owns the controls, so the renderer never guesses the host. */
  platform: HostPlatform;
  /** Which window this renderer is painting. Decided by the main process. */
  role: WindowRole;
  /** The document the workbench window was opened with; `null` in welcome. */
  workspaceId: string | null;
};
