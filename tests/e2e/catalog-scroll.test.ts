import { expect, test } from '@playwright/test';
import { launch } from './fixtures/workbench.js';

/** Catalog controls stay fixed because only the tree owns vertical overflow. */
test('keeps catalog controls outside the tree scroll area', async () => {
  const app = await launch('hybi-catalog-scroll-');

  try {
    const welcome = await app.firstWindow();
    const opened = app.waitForEvent('window');

    await welcome.getByRole('button', { name: 'Create workspace' }).click();
    await welcome.getByRole('textbox', { name: 'Name' }).fill('Catálogo');
    await welcome.getByRole('button', { name: 'Save' }).click();

    const workbench = await opened;
    await workbench.waitForLoadState('domcontentloaded');

    const tree = workbench.getByRole('tree', { name: 'Collections' });
    const filter = workbench.getByRole('searchbox', { name: 'Filter' });
    await expect(filter).toBeVisible();

    const filterBefore = await filter.boundingBox();
    for (let index = 0; index < 40; index += 1) {
      await workbench.getByRole('button', { name: 'Options for General' }).click();
      await workbench.getByRole('menuitem', { name: 'New event' }).click();
      await workbench.getByLabel('Event name').press('Enter');
    }

    const firstEvent = tree.getByRole('treeitem', { name: 'New Event 1', exact: true });
    const lastEvent = tree.getByRole('treeitem', { name: 'New Event 40', exact: true });
    await firstEvent.scrollIntoViewIfNeeded();
    await expect(firstEvent).toBeInViewport();
    await lastEvent.scrollIntoViewIfNeeded();
    await expect(lastEvent).toBeInViewport();

    const filterAfter = await filter.boundingBox();
    if (filterBefore === null || filterAfter === null)
      throw new Error('Catalog geometry unavailable');
    expect(filterAfter.y).toBe(filterBefore.y);
  } finally {
    await app.close();
  }
});
