import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron as electron, expect, test } from '@playwright/test';
import { openWorkspace, seededConnection } from './fixtures/workbench.js';

const WORKSPACE_ID = 'e2e-docs';
const MARKDOWN =
  '# Login\n\n| Campo | Tipo |\n| --- | --- |\n| token | string |\n\n~~~ts\ninterface Device { id: number }\n~~~';

const workspace = {
  id: WORKSPACE_ID,
  version: 1,
  name: 'Docs',
  environments: [],
  connections: [seededConnection()],
  catalog: {
    collections: [{ id: 'col-1', name: 'General' }],
    items: [
      {
        id: 'item-1',
        collectionId: 'col-1',
        name: 'Ping',
        payload: '{}',
        source: 'manual',
        description: 'Texto anterior',
      },
    ],
  },
};

type StoredWorkspace = { catalog: { items: { description?: string }[] } };

/** A real Monaco model must carry edited Markdown into preview and autosave. */
test('edits, previews and persists event documentation', async () => {
  const userData = await mkdtemp(join(tmpdir(), 'wsw-e2e-'));
  const workspacePath = join(userData, 'workspaces', `${WORKSPACE_ID}.json`);
  await mkdir(join(userData, 'workspaces'), { recursive: true });
  await writeFile(
    workspacePath,
    JSON.stringify({ ...workspace, updatedAt: new Date().toISOString() }, null, 2),
    'utf8',
  );

  const app = await electron.launch({
    args: ['.', `--user-data-dir=${userData}`],
    env: { ...process.env, NODE_ENV: 'test' },
  });

  try {
    const window = await openWorkspace(app, 'Docs');
    await window.getByText('Ping', { exact: true }).click();
    await window.getByRole('tab', { name: 'Docs' }).click();
    await window.getByRole('button', { name: 'Editar documentación' }).click();

    const editor = window.locator('[data-part="markdown-editor"]');
    await expect(editor).toHaveAttribute('data-mode-id', 'markdown');
    await editor.click({ button: 'right' });
    await expect(window.getByRole('menuitem').allTextContents()).resolves.toEqual([
      'Cortar',
      'Copiar',
      'Pegar',
    ]);
    await window.keyboard.press('Escape');
    await editor.locator('.view-lines').click();
    await window.keyboard.press('Control+a');
    await window.keyboard.insertText(MARKDOWN);
    await expect
      .poll(async () => {
        const tokens = await editor.locator('.view-line span[class*="mtk"]').all();
        const classes = await Promise.all(tokens.map((token) => token.getAttribute('class')));
        return new Set(classes).size;
      })
      .toBeGreaterThan(2);
    await editor.locator('.view-lines').click();
    await window.keyboard.press('Control+End');
    await window.keyboard.type('zzz');
    await expect(editor).toContainText('zzz');
    await window.keyboard.press('Control+z');
    await expect(editor).not.toContainText('zzz');
    await window.keyboard.press('Control+y');
    await expect(editor).toContainText('zzz');
    await window.keyboard.press('Control+z');
    await window.keyboard.press('Control+a');
    await window.keyboard.insertText(MARKDOWN);
    await window.keyboard.press('Control+s');

    await expect(editor).toBeVisible();
    const closeEditor = window.getByRole('button', { name: 'Cerrar editor' });
    const send = window.getByRole('button', { name: 'Enviar' });
    const closeBox = await closeEditor.boundingBox();
    const sendBox = await send.boundingBox();
    expect(closeBox?.width).toBeLessThanOrEqual(24);
    expect(
      (closeBox?.y ?? 0) - ((sendBox?.y ?? 0) + (sendBox?.height ?? 0)),
    ).toBeGreaterThanOrEqual(8);
    await closeEditor.click();
    const heading = window.getByRole('heading', { name: 'Login' });
    await expect(heading).toBeVisible();
    await expect(window.getByRole('table')).toBeVisible();
    const keyword = window.locator('.markdown .hljs-keyword');
    await expect(keyword).toHaveText('interface');
    await expect(keyword).toHaveClass(/hljs-keyword/);
    await expect
      .poll(async () => {
        const stored = JSON.parse(await readFile(workspacePath, 'utf8')) as StoredWorkspace;
        return stored.catalog.items[0]?.description?.replaceAll('\r\n', '\n');
      })
      .toBe(MARKDOWN);
  } finally {
    await app.close();
  }
});
