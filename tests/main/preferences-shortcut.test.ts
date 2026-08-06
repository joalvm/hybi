import { beforeEach, describe, expect, it, vi } from 'vitest';
import { watchPreferencesShortcut } from '../../src/main/shortcuts.js';

type InputListener = (event: { preventDefault: () => void }, input: Electron.Input) => void;

function fakeContents() {
  let listener: InputListener | null = null;

  return {
    watching: (): boolean => listener !== null,
    on: (channel: string, handler: InputListener) => {
      if (channel === 'before-input-event') listener = handler;
    },
    press: (input: Partial<Electron.Input>): boolean => {
      let prevented = false;
      listener?.({ preventDefault: () => (prevented = true) }, {
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
 * the chrome — so `Preferencias… Ctrl+,` would be a dead accelerator without
 * this. macOS has a real menu bar and must not get a second listener.
 */
describe('preferences shortcut', () => {
  let contents: ReturnType<typeof fakeContents>;
  const open = vi.fn();

  beforeEach(() => {
    open.mockClear();
    contents = fakeContents();
    watchPreferencesShortcut(contents as unknown as Electron.WebContents, open);
  });

  it('leaves the accelerator to the menu bar on macOS', () => {
    expect(contents.watching()).toBe(process.platform !== 'darwin');
  });

  it('opens preferences on Ctrl+, where no menu is installed', () => {
    if (process.platform === 'darwin') return;

    const prevented = contents.press({ control: true, key: ',' });

    expect(open).toHaveBeenCalledOnce();
    expect(prevented).toBe(true);
  });

  it('leaves a plain comma and the modified variants alone', () => {
    if (process.platform === 'darwin') return;

    contents.press({ key: ',' });
    contents.press({ control: true, shift: true, key: ',' });
    contents.press({ control: true, key: ',', type: 'keyUp' });

    expect(open).not.toHaveBeenCalled();
  });
});
