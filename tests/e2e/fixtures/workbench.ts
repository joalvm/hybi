import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron as electron, type ElectronApplication, type Page } from '@playwright/test';

/**
 * A seeded connection in the exact shape the workspace file stores. Written out
 * here rather than imported from the domain because these tests run against the
 * packaged main process: if the persisted shape drifts, the seed must fail with
 * it instead of following it.
 */
export function seededConnection(url = 'ws://127.0.0.1:9') {
  return {
    id: 'conn-1',
    name: 'local',
    environmentId: null,
    transport: {
      kind: 'websocket',
      url,
      settings: {
        headers: [],
        protocols: [],
        retry: { enabled: true, attempts: 5, baseMs: 500, maxMs: 8000 },
        keepalive: { enabled: false, intervalMs: 30000, timeoutMs: 10000 },
        verifyCertificate: true,
        maxMessageBytes: 104857600,
      },
    },
  };
}

/** A throwaway userData directory, so a run never touches a real workspace. */
export async function launch(prefix = 'wsw-e2e-'): Promise<ElectronApplication> {
  const userData = await mkdtemp(join(tmpdir(), prefix));
  return electron.launch({
    args: ['.', `--user-data-dir=${userData}`],
    env: { ...process.env, NODE_ENV: 'test' },
  });
}

/**
 * Picking a document opens a second window and closes the welcome one, so a
 * test cannot keep driving the page it clicked in. This waits for the editor
 * and hands back the window the rest of the run belongs to.
 */
export async function openWorkspace(app: ElectronApplication, name: string): Promise<Page> {
  const welcome = await app.firstWindow();
  const opened = app.waitForEvent('window');

  await welcome.getByRole('button', { name: `Abrir ${name}` }).click();

  const workbench = await opened;
  await workbench.waitForLoadState('domcontentloaded');
  return workbench;
}
