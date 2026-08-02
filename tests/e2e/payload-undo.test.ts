import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron as electron, expect, test } from '@playwright/test';
import { openWorkspace } from './fixtures/workbench.js';

const WORKSPACE_ID = 'e2e-undo';

const workspace = {
  id: WORKSPACE_ID,
  version: 2,
  name: 'Undo',
  environments: [],
  connections: [{ id: 'conn-1', name: 'local', url: 'ws://127.0.0.1:9', environmentId: null }],
  catalog: {
    collections: [{ id: 'col-1', name: 'General' }],
    items: [
      {
        id: 'item-1',
        collectionId: 'col-1',
        name: 'Ping',
        payload: '{"a":1}',
        source: 'manual',
      },
    ],
  },
};

/**
 * The composer has no revert button: undo belongs to the editor, where the text
 * is. That only holds if the keystrokes reach Monaco — Electron's default menu
 * binds Ctrl+Z to a native `undo` role, which does nothing to a Monaco model and
 * would have swallowed the shortcut. Nothing but a real window can tell.
 */
test('undoes and redoes a payload edit with the keyboard', async () => {
  const userData = await mkdtemp(join(tmpdir(), 'wsw-e2e-'));
  await mkdir(join(userData, 'workspaces'), { recursive: true });
  await writeFile(
    join(userData, 'workspaces', `${WORKSPACE_ID}.json`),
    JSON.stringify({ ...workspace, updatedAt: new Date().toISOString() }, null, 2),
    'utf8',
  );

  const app = await electron.launch({
    args: ['.', `--user-data-dir=${userData}`],
    env: { ...process.env, NODE_ENV: 'test' },
  });

  try {
    const window = await openWorkspace(app, 'Undo');

    await window.getByText('Ping', { exact: true }).click();
    // The panel title became a breadcrumb in phase 2: collection, then event.
    await expect(window.getByLabel('Ubicación del evento')).toContainText('Ping');

    // The text itself, not the hidden textarea Monaco keeps for IME input.
    const editor = window.locator('.payload-editor');
    await editor.locator('.view-lines').click();
    await window.keyboard.press('End');
    await window.keyboard.type('zzz');
    await expect(editor).toContainText('zzz');

    await window.keyboard.press('Control+z');
    await expect(editor).not.toContainText('zzz');

    await window.keyboard.press('Control+y');
    await expect(editor).toContainText('zzz');
  } finally {
    await app.close();
  }
});
