import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HostPlatform } from '@shared/ipc/contract.js';

const popupAppMenu = vi.fn(() => Promise.resolve());
const bridge = { window: { popupAppMenu }, platform: 'win32' as HostPlatform };

vi.mock('@/ipc/bridge.js', () => ({ bridge }));

const { AppMenuButton } = await import('@/app/AppMenuButton.js');

describe('AppMenuButton', () => {
  beforeEach(() => {
    bridge.platform = 'win32';
    popupAppMenu.mockClear();
  });

  /**
   * The menu is native and drawn by the main process, so the button's whole job
   * is saying where to drop it — under itself, never at the pointer.
   */
  it('asks the main process to drop the menu under the button', async () => {
    const user = userEvent.setup();
    render(<AppMenuButton />);

    const button = screen.getByRole('button', { name: 'Menu' });
    vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
      left: 8,
      bottom: 36,
    } as DOMRect);

    await user.click(button);

    expect(popupAppMenu).toHaveBeenCalledWith({ x: 8, y: 36 });
  });

  it('draws nothing on macOS, where the menu bar already carries it', () => {
    bridge.platform = 'darwin';
    render(<AppMenuButton />);

    expect(screen.queryByRole('button', { name: 'Menu' })).toBeNull();
  });
});
