import type {
  Collection,
  EventItem,
  Workspace,
  WorkspaceSummary,
} from '../domain/types.js';
import type {
  ActivityExportRequest,
  ActivityRecord,
  ConnectionStateEvent,
} from './activity.js';
import type {
  CloseConnectionRequest,
  OpenConnectionRequest,
  SendConnectionRequest,
  TransportSendResult,
} from '../transport/contract.js';
import type { AppPreferences } from '../preferences/types.js';

export const CHANNELS = {
  connectionOpen: 'connection:open',
  connectionClose: 'connection:close',
  /** The connection was deleted, not merely hung up. See `WorkbenchBridge`. */
  connectionDispose: 'connection:dispose',
  connectionSend: 'connection:send',
  connectionState: 'connection:state',
  connectionActivity: 'connection:activity',
  workspaceList: 'workspace:list',
  workspaceLoad: 'workspace:load',
  workspaceSave: 'workspace:save',
  workspaceCreate: 'workspace:create',
  workspaceDuplicate: 'workspace:duplicate',
  workspaceDelete: 'workspace:delete',
  preferencesLoad: 'preferences:load',
  preferencesSave: 'preferences:save',
  /** One installation, two windows: what one changes, the other is told about. */
  preferencesChanged: 'preferences:changed',
  asyncapiImport: 'asyncapi:import',
  asyncapiExport: 'asyncapi:export',
  activityExport: 'activity:export',
  clipboardRead: 'clipboard:read',
  clipboardWrite: 'clipboard:write',
  windowMinimize: 'window:minimize',
  windowToggleMaximize: 'window:toggle-maximize',
  windowClose: 'window:close',
  windowIsMaximized: 'window:is-maximized',
  windowState: 'window:state',
  windowPopupAppMenu: 'window:popup-app-menu',
  shellOpenWorkspace: 'shell:open-workspace',
  appAbout: 'app:about',
  appPreferences: 'app:preferences',
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

export type ImportResult = {
  collections: Collection[];
  items: EventItem[];
  sourceName: string;
};

/** Cancelling the native file dialog is not an error, so it gets its own shape. */
export type ImportOutcome = Result<ImportResult> | { ok: false; cancelled: true; error: string };

/** Cancelling export is expected; the selected path stays inside the main process. */
export type ExportOutcome = Result<Empty> | { ok: false; cancelled: true; error: string };

/** The complete surface the preload exposes. Nothing else crosses the bridge. */
export type WorkbenchBridge = {
  connection: {
    open(request: OpenConnectionRequest): Promise<Result<Empty>>;
    close(request: CloseConnectionRequest): Promise<Result<Empty>>;
    /**
     * Hangs up and forgets the connection. `close` leaves the session in place
     * so reconnecting the same tab continues its sequence; this is what the
     * renderer calls when the tab itself is deleted and the main process has
     * nothing left to keep.
     */
    dispose(request: CloseConnectionRequest): Promise<Result<Empty>>;
    send(request: SendConnectionRequest): Promise<Result<TransportSendResult>>;
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
  /**
   * Settings of the installation, not of the document. They are answered before
   * the first paint so the window never opens in the wrong theme, and the main
   * process is what normalises them — a hand-edited file cannot put a value the
   * renderer would have to defend itself against on the other side.
   */
  preferences: {
    load(): Promise<AppPreferences>;
    /** Answers with what was stored, which is not always what was sent. */
    save(preferences: AppPreferences): Promise<AppPreferences>;
    /** Fires when the *other* window changed them. */
    onChanged(listener: (preferences: AppPreferences) => void): () => void;
  };
  asyncapi: {
    import(): Promise<ImportOutcome>;
    export(workspace: Workspace): Promise<ExportOutcome>;
  };
  activity: {
    /**
     * Writes one connection's log where the user picks. The document is built in
     * the main process: serialising thousands of frames is the kind of work that
     * would be felt in the renderer, which is drawing the log at the same time.
     */
    export(request: ActivityExportRequest): Promise<ExportOutcome>;
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
  app: {
    /** What the running build is, straight from the main process. */
    version: string;
    /** The Help menu asks; the window that is in front paints the dialog. */
    onAboutRequested(listener: () => void): () => void;
    /** Same contract for the preferences entry, which is also a menu item. */
    onPreferencesRequested(listener: () => void): () => void;
    /** The host locale, for the preferences that defer to the machine. */
    locale: string;
  };
  /** Decides who owns the controls, so the renderer never guesses the host. */
  platform: HostPlatform;
  /** Which window this renderer is painting. Decided by the main process. */
  role: WindowRole;
  /** The document the workbench window was opened with; `null` in welcome. */
  workspaceId: string | null;
};
