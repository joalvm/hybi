import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  session: { defaultSession: { extensions: { loadExtension: vi.fn() } } },
}));

const { watchDevToolsShortcut } = await import('../../src/main/devtools.js');

type InputListener = (event: { preventDefault: () => void }, input: Electron.Input) => void;

function fakeContents() {
  let listener: InputListener = () => undefined;
  const toggleDevTools = vi.fn();

  return {
    toggleDevTools,
    on: (channel: string, handler: InputListener) => {
      if (channel === 'before-input-event') listener = handler;
    },
    press: (input: Partial<Electron.Input>): boolean => {
      let prevented = false;
      listener({ preventDefault: () => (prevented = true) }, {
        type: 'keyDown',
        control: false,
        shift: false,
        alt: false,
        meta: false,
        ...input,
      } as Electron.Input);
      return prevented;
    },
  };
}

/**
 * No application menu is installed on Windows and Linux — the renderer draws
 * the chrome — so the accelerator that would normally arrive with it has to be
 * wired by hand. Without this, Ctrl+Shift+I does nothing in a packaged build.
 */
describe('devtools shortcut', () => {
  let contents: ReturnType<typeof fakeContents>;

  /** Chrome's accelerator on Windows and Linux, and the one macOS expects. */
  const toggle: Partial<Electron.Input> =
    process.platform === 'darwin'
      ? { meta: true, alt: true, key: 'I' }
      : { control: true, shift: true, key: 'I' };

  beforeEach(() => {
    contents = fakeContents();
    watchDevToolsShortcut(contents as unknown as Electron.WebContents);
  });

  it('toggles devtools on the platform accelerator', () => {
    const prevented = contents.press(toggle);

    expect(contents.toggleDevTools).toHaveBeenCalledOnce();
    expect(prevented).toBe(true);
  });

  it('toggles devtools on F12', () => {
    contents.press({ key: 'F12' });

    expect(contents.toggleDevTools).toHaveBeenCalledOnce();
  });

  it('ignores the same keys on the way up', () => {
    contents.press({ ...toggle, type: 'keyUp' });

    expect(contents.toggleDevTools).not.toHaveBeenCalled();
  });

  it('leaves plain typing alone', () => {
    contents.press({ key: 'i' });
    contents.press({ control: true, key: 'i' });

    expect(contents.toggleDevTools).not.toHaveBeenCalled();
  });
});
