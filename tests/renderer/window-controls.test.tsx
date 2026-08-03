import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HostPlatform } from '@shared/ipc/contract.js';

const windowBridge = {
  minimize: vi.fn(() => Promise.resolve()),
  toggleMaximize: vi.fn(() => Promise.resolve()),
  close: vi.fn(() => Promise.resolve()),
  isMaximized: vi.fn(() => Promise.resolve(false)),
  onMaximizedChange: vi.fn(() => () => undefined),
};

const bridge = { window: windowBridge, platform: 'win32' as HostPlatform };

vi.mock('@/ipc/bridge.js', () => ({ bridge }));

const { WindowControls } = await import('@/app/WindowControls.js');

describe('WindowControls', () => {
  beforeEach(() => {
    bridge.platform = 'win32';
    windowBridge.minimize.mockClear();
    windowBridge.toggleMaximize.mockClear();
    windowBridge.close.mockClear();
    windowBridge.isMaximized.mockResolvedValue(false);
  });

  it('drives the window over the bridge', async () => {
    const user = userEvent.setup();
    render(<WindowControls />);

    await user.click(screen.getByRole('button', { name: 'Minimizar' }));
    await user.click(screen.getByRole('button', { name: 'Maximizar' }));
    await user.click(screen.getByRole('button', { name: 'Cerrar' }));

    expect(windowBridge.minimize).toHaveBeenCalledOnce();
    expect(windowBridge.toggleMaximize).toHaveBeenCalledOnce();
    expect(windowBridge.close).toHaveBeenCalledOnce();
  });

  it('offers restore once the window reports itself maximised', async () => {
    windowBridge.isMaximized.mockResolvedValue(true);
    render(<WindowControls />);

    expect(await screen.findByRole('button', { name: 'Restaurar' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Maximizar' })).toBeNull();
  });

  /**
   * The welcome window is fixed at the reference size and cannot be minimised,
   * so drawing those two would offer buttons the main process refuses.
   */
  it('offers only close on a window that cannot be resized', () => {
    render(<WindowControls resizable={false} />);

    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Minimizar' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Maximizar' })).toBeNull();
  });

  it('draws nothing on macOS, where the system owns the controls', () => {
    bridge.platform = 'darwin';
    const { container } = render(<WindowControls />);

    expect(container.querySelector('[data-part="window-controls"]')).toBeNull();
  });
});
