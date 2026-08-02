import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let request: (() => void) | null = null;

const appBridge = {
  version: '0.3.0-alpha.1',
  onAboutRequested: vi.fn((listener: () => void) => {
    request = listener;
    return () => {
      request = null;
    };
  }),
};

vi.mock('@/ipc/bridge.js', () => ({ bridge: { app: appBridge } }));

const { AboutDialog } = await import('@/features/about/AboutDialog.js');

describe('AboutDialog', () => {
  beforeEach(() => {
    request = null;
    appBridge.version = '0.3.0-alpha.1';
    appBridge.onAboutRequested.mockClear();
  });

  it('stays closed until the Help menu asks for it', () => {
    render(<AboutDialog />);

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows the running version and the phase it is in', async () => {
    render(<AboutDialog />);

    request?.();

    expect(await screen.findByRole('dialog')).toBeDefined();
    expect(screen.getByText('0.3.0-alpha.1')).toBeDefined();
    expect(screen.getByText('alpha')).toBeDefined();
  });

  /** A stable build carries no suffix, so the badge has nothing to announce. */
  it('drops the phase badge once the version is stable', async () => {
    appBridge.version = '1.0.0';
    render(<AboutDialog />);

    request?.();

    expect(await screen.findByRole('dialog')).toBeDefined();
    expect(screen.queryByText('alpha')).toBeNull();
  });

  it('closes again from its own button', async () => {
    const user = userEvent.setup();
    render(<AboutDialog />);

    request?.();
    await user.click(await screen.findByRole('button', { name: 'Cerrar' }));

    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
