import { expect, test } from '@playwright/test';
import { launch } from './fixtures/workbench.js';

/** Geometry is the feature: the status bar stays compact while the surface gains the rail width. */
test('toggles the catalog from a 25px status bar', async () => {
  const app = await launch('hybi-status-bar-');

  try {
    const welcome = await app.firstWindow();
    const opened = app.waitForEvent('window');

    await welcome.getByRole('button', { name: 'Create workspace' }).click();
    await welcome.getByRole('textbox', { name: 'Name' }).fill('Status bar');
    await welcome.getByRole('button', { name: 'Save' }).click();

    const workbench = await opened;
    await workbench.waitForLoadState('domcontentloaded');

    const statusBar = workbench.locator('[data-part="status-bar"]');
    const catalogRail = workbench.locator('[data-part="catalog-rail"]');
    const connectionSurface = workbench.locator('[data-part="connection-surface"]');
    const before = await connectionSurface.boundingBox();

    await expect(statusBar).toHaveCSS('height', '25px');
    await workbench.getByRole('button', { name: 'Hide the catalog' }).click();
    await expect(catalogRail).toBeHidden();
    await expect(workbench.getByRole('button', { name: 'Show the catalog' })).toBeVisible();

    const after = await connectionSurface.boundingBox();
    if (before === null || after === null) throw new Error('Workbench geometry unavailable');
    expect(after.width).toBeGreaterThan(before.width);
  } finally {
    await app.close();
  }
});
