import { expect, test } from '@playwright/test';
import { launch } from './fixtures/workbench.js';

/**
 * The regression that forced the URL field off a native input: a token drawn as
 * an absolutely positioned decoration bled over the characters beside it. A
 * pill that takes its own inline space cannot, so the invariant is measured
 * rather than eyeballed.
 */
test('lays out a URL variable without covering the text beside it', async () => {
  const app = await launch('hybi-url-variables-');

  try {
    const welcome = await app.firstWindow();
    const opened = app.waitForEvent('window');

    await welcome.getByRole('button', { name: 'Crear workspace' }).click();
    await welcome.getByRole('textbox', { name: 'Nombre' }).fill('URL');
    await welcome.getByRole('button', { name: 'Guardar' }).click();

    const workbench = await opened;
    await workbench.waitForLoadState('domcontentloaded');

    const field = workbench.getByLabel('URL');
    await field.fill('ws://{{host}}/socket');
    await expect(field).toHaveText('ws://{{host}}/socket');

    const boxes = await workbench.evaluate(() => {
      const root = document.querySelector('[data-part="url-input-field"]');
      const token = root?.querySelector('[data-variable]') ?? null;
      const after = token?.nextSibling ?? null;
      if (token === null || after === null) return null;

      // The first character after the token, not the whole run: only the
      // characters immediately next to the pill can be hidden by it.
      const range = document.createRange();
      range.setStart(after, 0);
      range.setEnd(after, 1);
      return {
        tokenRight: token.getBoundingClientRect().right,
        nextLeft: range.getBoundingClientRect().left,
      };
    });

    if (boxes === null) throw new Error('URL token geometry unavailable');
    expect(boxes.nextLeft).toBeGreaterThanOrEqual(boxes.tokenRight);
  } finally {
    await app.close();
  }
});
