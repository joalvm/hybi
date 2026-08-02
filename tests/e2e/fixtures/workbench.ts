import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron as electron, type ElectronApplication, type Page } from '@playwright/test';

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
