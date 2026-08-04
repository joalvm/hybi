import { expect, test } from '@playwright/test';
import { launch } from './fixtures/workbench.js';

/** Catalog controls stay fixed because only the tree owns vertical overflow. */
test('keeps catalog controls outside the tree scroll area', async () => {
  const app = await launch('hybi-catalog-scroll-');

  try {
    const welcome = await app.firstWindow();
    const opened = app.waitForEvent('window');

    await welcome.getByRole('button', { name: 'Crear workspace' }).click();
    await welcome.getByRole('textbox', { name: 'Nombre' }).fill('Catálogo');
    await welcome.getByRole('button', { name: 'Guardar' }).click();

    const workbench = await opened;
    await workbench.waitForLoadState('domcontentloaded');

    const content = workbench.locator('[data-part="catalog-content"]');
    const tree = workbench.getByRole('tree', { name: 'Colecciones' });
    const filter = workbench.getByRole('searchbox', { name: 'Filtrar' });

    await expect(content).toHaveCSS('display', 'flex');
    await expect(content).toHaveCSS('flex-direction', 'column');
    await expect(content).toHaveCSS('overflow', 'hidden');
    await expect(tree).toHaveCSS('flex-grow', '1');
    await expect(tree).toHaveCSS('overflow-y', 'auto');
    await expect(filter).toBeVisible();

    const filterBefore = await filter.boundingBox();
    for (let index = 0; index < 40; index += 1) {
      await workbench.getByRole('button', { name: 'Opciones de General' }).click();
      await workbench.getByRole('menuitem', { name: 'Nuevo evento' }).click();
      await workbench.getByLabel('Nombre del evento').press('Enter');
    }

    const firstEvent = tree.getByRole('treeitem', { name: 'Nuevo Evento 1', exact: true });
    const lastEvent = tree.getByRole('treeitem', { name: 'Nuevo Evento 40', exact: true });
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
