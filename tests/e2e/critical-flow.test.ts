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
    await expect(welcome.getByRole('heading', { name: 'Your workspaces' })).toBeVisible();
    const opened = app.waitForEvent('window');
    await welcome.getByRole('button', { name: 'Create workspace' }).click();
    await welcome.getByRole('textbox', { name: 'Name' }).fill('Prueba E2E');
    await welcome.getByRole('button', { name: 'Save' }).click();

    const window = await opened;
    await window.waitForLoadState('domcontentloaded');
    await expect(window.getByRole('button', { name: 'Workspace' })).toContainText('Prueba E2E');
    await expect(window.getByRole('combobox', { name: 'Environment' })).toContainText('No environment');
    expect((await window.locator('[data-part="title-bar"]').boundingBox())?.height).toBe(48);
    const closeWindow = window.getByRole('button', { name: 'Close' });
    expect((await closeWindow.boundingBox())?.width).toBe(48);
    expect((await closeWindow.boundingBox())?.height).toBe(47);
    await closeWindow.hover();
    await expect(closeWindow).toHaveCSS('background-color', 'rgb(196, 43, 28)');
    await expect(closeWindow).toHaveCSS('border-radius', '0px');
    await window.mouse.move(0, 0);

    // The theme is a preference now. Driven from the gear and not from the
    // `Ctrl+,` accelerator: that one is delivered by `before-input-event`, which
    // the browser process never sees for input injected over the debug protocol.
    //
    // In dark mode, an active tab uses the same selected surface as an event;
    // no extra border or accent bar introduces a second selection language.
    // The dialog is modal, so everything behind it is `aria-hidden` while it is
    // up: the palette is asserted once it is closed, not through it.
    await window.getByRole('button', { name: 'Preferences' }).click();
    const startupSelect = window.getByRole('combobox', { name: 'On startup' });
    const startupSelectBox = await startupSelect.boundingBox();
    expect(startupSelectBox?.height).toBe(26);
    expect(startupSelectBox?.width).toBeLessThanOrEqual(208);
    await expect(startupSelect).toHaveCSS('max-width', '208px');
    await expect(startupSelect).toHaveCSS('white-space', 'nowrap');
    await expect(startupSelect).toHaveCSS('overflow', 'hidden');
    await window.getByRole('tab', { name: 'Appearance' }).click();
    const preferencesDialog = window.getByRole('dialog');
    await expect(preferencesDialog).toHaveCSS('border-radius', '11px');
    await expect(preferencesDialog).toHaveCSS('overflow', 'hidden');
    const appearanceTab = window.getByRole('tab', { name: 'Appearance' });
    await expect(appearanceTab).toHaveCSS('background-color', 'rgb(233, 233, 237)');
    await expect(appearanceTab).toHaveCSS('font-weight', '400');
    const themeSelect = window.getByRole('combobox', { name: 'Theme' });
    const themeSelectBox = await themeSelect.boundingBox();
    expect(themeSelectBox?.height).toBe(26);
    expect(themeSelectBox?.width).toBeLessThan(startupSelectBox?.width ?? 0);
    await expect(window.getByLabel('Editor font size')).toHaveCSS(
      'text-align',
      'left',
    );
    await themeSelect.click();
    await window.getByRole('option', { name: 'Dark' }).click();
    await window.keyboard.press('Escape');
    await expect(window.getByRole('dialog')).toHaveCount(0);

    await expect(window.locator('html')).toHaveAttribute('data-theme', 'dark');
    const activeConnectionTab = window.locator('[data-active="true"]');
    await expect(activeConnectionTab).toHaveCSS('background-color', 'rgb(17, 59, 57)');
    await expect(activeConnectionTab).toHaveCSS('box-shadow', 'none');
    await expect(window.getByRole('button', { name: 'Connect', exact: true })).toHaveCSS(
      'color',
      'rgb(6, 17, 16)',
    );

    await window.getByRole('button', { name: 'Preferences' }).click();
    await window.getByRole('tab', { name: 'Appearance' }).click();
    await window.getByRole('combobox', { name: 'Theme' }).click();
    await window.getByRole('option', { name: 'Light' }).click();
    await window.keyboard.press('Escape');
    await expect(window.getByRole('dialog')).toHaveCount(0);
    await expect(window.locator('html')).toHaveAttribute('data-theme', 'light');

    await window.getByLabel('URL').fill(server.url);

    // The field renders its own text now, so what it holds is what is read.
    await expect(window.locator('[data-part="url-input-field"]')).toHaveText(server.url);

    // The bar carries no state badge any more: the button turning into its own
    // opposite is what says the socket is up.
    const idle = window.getByRole('button', { name: 'Connect', exact: true });
    const idleWidth = (await idle.boundingBox())?.width;
    await expect(idle).toHaveCSS('background-color', 'rgb(16, 209, 197)');
    await expect(idle).toHaveCSS('color', 'rgb(8, 13, 13)');
    await idle.click();
    const live = window.getByRole('button', { name: 'Disconnect', exact: true });
    await expect(live).toBeVisible();
    // And it goes quiet. Asserted on the colour because the state class lives in
    // a sheet that is imported before the one painting `.button`: at one class it
    // lost the background entirely, so the button went blank while every locator
    // still found it. The pointer leaves first, or this reads the hover shade of
    // the button it just clicked.
    await window.mouse.move(0, 0);
    await expect(live).toHaveCSS('background-color', 'rgb(241, 241, 243)');

    // Both labels get the same box: "Disconnect" is eight characters longer,
    // and a button that resizes as the socket opens makes the bar twitch.
    expect((await live.boundingBox())?.width).toBe(idleWidth);

    // Deleting a connection is never one click any more: the tab carries a menu
    // and the menu asks first.
    await expect(window.getByRole('button', { name: /^Cerrar / })).toHaveCount(0);
    await window.getByRole('button', { name: /^Options for New connection/ }).click();
    await expect(window.getByRole('menuitem', { name: 'Delete' })).toBeVisible();
    await window.keyboard.press('Escape');

    // The catalog of a fresh workspace holds one collection and no events, and
    // creating one is a row with its name under the caret — no dialog.
    await window.getByRole('button', { name: 'Options for General' }).click();
    await window.getByRole('menuitem', { name: 'New event' }).click();
    await window.getByLabel('Event name').fill('Ping');
    await window.keyboard.press('Enter');

    // The panel title became a breadcrumb in phase 2: collection, then event.
    await expect(window.getByLabel('Event location')).toContainText('Ping');
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

    await window.getByRole('button', { name: 'Send' }).click();

    // The row, not the log's «Incoming» filter: an accessible name is matched
    // as a substring, and one contains the other.
    const incoming = window.getByRole('button', { name: /^incoming / });
    await expect(incoming).toBeVisible();
    await incoming.click();

    await expect(window.getByTestId('activity-detail')).toContainText('echo:');
  } finally {
    await app.close();
    await server.close();
  }
});
