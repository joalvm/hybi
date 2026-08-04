import { expect, test } from '@playwright/test';
import { startEchoServer } from './fixtures/echo-server.js';
import { launch } from './fixtures/workbench.js';

test('connect, send an event and read it in the detail pane', async () => {
  const server = await startEchoServer();
  const app = await launch();

  try {
    const welcome = await app.firstWindow();

    // Startup is its own window and stays outside the editor until a workspace
    // is chosen. It is named there, and the editor opens in a second window.
    await expect(welcome.getByRole('heading', { name: 'Tus workspaces' })).toBeVisible();
    const opened = app.waitForEvent('window');
    await welcome.getByRole('button', { name: 'Crear workspace' }).click();
    await welcome.getByRole('textbox', { name: 'Nombre' }).fill('Prueba E2E');
    await welcome.getByRole('button', { name: 'Guardar' }).click();

    const window = await opened;
    await window.waitForLoadState('domcontentloaded');
    await expect(window.getByRole('button', { name: 'Workspace' })).toContainText('Prueba E2E');
    await expect(window.getByRole('combobox', { name: 'Entorno' })).toContainText('Sin entorno');
    expect((await window.locator('[data-part="title-bar"]').boundingBox())?.height).toBe(48);
    const closeWindow = window.getByRole('button', { name: 'Cerrar' });
    expect((await closeWindow.boundingBox())?.width).toBe(48);
    expect((await closeWindow.boundingBox())?.height).toBe(47);
    await closeWindow.hover();
    await expect(closeWindow).toHaveCSS('background-color', 'rgb(196, 43, 28)');
    await expect(closeWindow).toHaveCSS('border-radius', '0px');
    await window.mouse.move(0, 0);

    // The temporary QA switch changes both the semantic palette and Monaco.
    // In dark mode, an active tab uses the same selected surface as an event;
    // no extra border or accent bar introduces a second selection language.
    await window.getByRole('button', { name: 'Probar tema oscuro' }).click();
    await expect(window.locator('html')).toHaveAttribute('data-theme', 'dark');
    const activeConnectionTab = window.locator('[data-active="true"]');
    await expect(activeConnectionTab).toHaveCSS('background-color', 'rgb(17, 59, 57)');
    await expect(activeConnectionTab).toHaveCSS('box-shadow', 'none');
    await expect(window.getByRole('button', { name: 'Conectar' })).toHaveCSS(
      'color',
      'rgb(6, 17, 16)',
    );
    await window.getByRole('button', { name: 'Probar tema claro' }).click();

    await window.getByLabel('URL').fill(server.url);

    // The field renders its own text now, so what it holds is what is read.
    await expect(window.locator('[data-part="url-input-field"]')).toHaveText(server.url);

    // The bar carries no state badge any more: the button turning into its own
    // opposite is what says the socket is up.
    const idle = window.getByRole('button', { name: 'Conectar' });
    const idleWidth = (await idle.boundingBox())?.width;
    await expect(idle).toHaveCSS('background-color', 'rgb(16, 209, 197)');
    await expect(idle).toHaveCSS('color', 'rgb(8, 13, 13)');
    await idle.click();
    const live = window.getByRole('button', { name: 'Desconectar' });
    await expect(live).toBeVisible();
    // And it goes quiet. Asserted on the colour because the state class lives in
    // a sheet that is imported before the one painting `.button`: at one class it
    // lost the background entirely, so the button went blank while every locator
    // still found it. The pointer leaves first, or this reads the hover shade of
    // the button it just clicked.
    await window.mouse.move(0, 0);
    await expect(live).toHaveCSS('background-color', 'rgb(241, 241, 243)');

    // Both labels get the same box: "Desconectar" is eight characters longer,
    // and a button that resizes as the socket opens makes the bar twitch.
    expect((await live.boundingBox())?.width).toBe(idleWidth);

    // Deleting a connection is never one click any more: the tab carries a menu
    // and the menu asks first.
    await expect(window.getByRole('button', { name: /^Cerrar / })).toHaveCount(0);
    await window.getByRole('button', { name: /^Opciones de Nueva conexión/ }).click();
    await expect(window.getByRole('menuitem', { name: 'Eliminar' })).toBeVisible();
    await window.keyboard.press('Escape');

    // The catalog of a fresh workspace holds one collection and no events, and
    // creating one is a row with its name under the caret — no dialog.
    await window.getByRole('button', { name: 'Opciones de General' }).click();
    await window.getByRole('menuitem', { name: 'Nuevo evento' }).click();
    await window.getByLabel('Nombre del evento').fill('Ping');
    await window.keyboard.press('Enter');

    // The panel title became a breadcrumb in phase 2: collection, then event.
    await expect(window.getByLabel('Ubicación del evento')).toContainText('Ping');
    await expect(window.getByRole('tab', { selected: true })).toHaveCSS(
      'background-color',
      'rgb(233, 233, 237)',
    );

    // The new event opens on an empty payload, so the text is written here.
    const editor = window.locator('[data-part="payload-editor"]');
    await editor.locator('.view-lines').click();
    await window.keyboard.type('{"event":"ping","host":"{{host}}"}');

    // The hit-testing is the one part no unit test can reach: it needs a laid
    // out editor, a real model and a real scroll position. The variable is
    // undefined here, so the token carries the `missing` class.
    await editor.locator('.wsw-var-missing').first().hover();
    await expect(window.getByRole('dialog')).toContainText('{{host}}');
    await window.keyboard.press('Escape');

    await window.getByRole('button', { name: 'Enviar' }).click();

    const incoming = window.getByLabel('entrante');
    await expect(incoming).toBeVisible();
    await incoming.click();

    await expect(window.getByTestId('activity-detail')).toContainText('echo:');
  } finally {
    await app.close();
    await server.close();
  }
});
