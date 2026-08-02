import { expect, test } from '@playwright/test';
import { launch } from './fixtures/workbench.js';

/**
 * The welcome screen is a window of its own, not a panel over the editor. Only
 * a real launch can tell the difference, so the window's own traits are checked
 * here alongside its layout.
 */
test('opens welcome as a fixed 1294x807 window with the flight to its right', async (
  { browserName: _browserName },
  testInfo,
) => {
  const app = await launch('hybi-welcome-');

  try {
    const window = await app.firstWindow();

    const traits = await app.evaluate(({ BrowserWindow }) => {
      const [first] = BrowserWindow.getAllWindows();
      const bounds = first?.getContentBounds() ?? { width: 0, height: 0 };
      return {
        count: BrowserWindow.getAllWindows().length,
        resizable: first?.isResizable() ?? true,
        minimizable: first?.isMinimizable() ?? true,
        maximizable: first?.isMaximizable() ?? true,
        width: bounds.width,
        height: bounds.height,
      };
    });

    expect(traits.count).toBe(1);
    expect(traits).toMatchObject({
      resizable: false,
      width: 1294,
      height: 807,
    });

    // Minimise and maximise are hints the window manager grants on X11, and CI
    // runs a bare display with no manager to grant them.
    if (process.platform !== 'linux') {
      expect(traits).toMatchObject({ minimizable: false, maximizable: false });
    }

    // Close is the only control it can honestly offer.
    await expect(window.getByRole('button', { name: 'Cerrar' })).toBeVisible();
    await expect(window.getByRole('button', { name: 'Minimizar' })).toHaveCount(0);
    await expect(window.getByRole('button', { name: 'Maximizar' })).toHaveCount(0);

    const workspaces = window.getByRole('region', { name: 'Tus workspaces' });
    const flight = window.getByRole('figure', { name: 'Hybi viajando hacia la izquierda' });

    await expect(workspaces).toBeVisible();
    await expect(flight).toBeVisible();
    const workspacesBox = await workspaces.boundingBox();
    const flightBox = await flight.boundingBox();
    if (workspacesBox === null || flightBox === null) throw new Error('Welcome geometry unavailable');

    // Geometry is the requirement: mirror the reference without coupling to exact pixels.
    expect(workspacesBox.x).toBeGreaterThanOrEqual(0);
    expect(workspacesBox.x).toBeLessThan(flightBox.x);
    expect(flightBox.width).toBeGreaterThan(workspacesBox.width);
    await window.waitForTimeout(800);
    await window.screenshot({ path: testInfo.outputPath('welcome.png') });
  } finally {
    await app.close();
  }
});

/** The editor is the one window that may be resized and minimised. */
test('opens the workbench in a second window that can resize and minimise', async () => {
  const app = await launch('hybi-workbench-');

  try {
    const welcome = await app.firstWindow();
    const opened = app.waitForEvent('window');

    await welcome.getByRole('button', { name: 'Crear workspace' }).click();
    await welcome.getByRole('textbox', { name: 'Nombre' }).fill('Ventanas');
    await welcome.getByRole('button', { name: 'Guardar' }).click();

    const workbench = await opened;
    await workbench.waitForLoadState('domcontentloaded');
    await expect(workbench.getByRole('button', { name: 'Workspace' })).toContainText('Ventanas');

    // The welcome window retires once the editor is up, so only one is left.
    await expect
      .poll(async () => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length))
      .toBe(1);

    const traits = await app.evaluate(({ BrowserWindow }) => {
      const [first] = BrowserWindow.getAllWindows();
      const bounds = first?.getContentBounds() ?? { width: 0, height: 0 };
      return {
        resizable: first?.isResizable() ?? false,
        minimizable: first?.isMinimizable() ?? false,
        width: bounds.width,
        height: bounds.height,
      };
    });

    expect(traits).toMatchObject({
      resizable: true,
      minimizable: true,
      width: 1294,
      height: 807,
    });

    await expect(workbench.getByRole('button', { name: 'Minimizar' })).toBeVisible();
    await expect(workbench.getByRole('button', { name: 'Menú' })).toBeVisible();
  } finally {
    await app.close();
  }
});
