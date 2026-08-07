import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { IconButton } from '@/shared/ui/IconButton.js';
import { Dialog } from '@/shared/ui/Dialog.js';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog.js';
import { Badge } from '@/shared/ui/Badge.js';
import { Menu } from '@/shared/ui/Menu.js';
import { ContextMenu } from '@/shared/ui/ContextMenu.js';
import { TRANSPORT_LOGOS, TransportLogo } from '@/shared/ui/logos/TransportLogo.js';
import { Panel } from '@/shared/ui/Panel.js';

describe('TransportLogo', () => {
  // The map is typed `TransportFactoryMap`, so a transport with no mark is a
  // compile error rather than an empty box. This checks the marks are real.
  it('draws a mark for every transport the app can speak', () => {
    for (const kind of Object.keys(TRANSPORT_LOGOS) as (keyof typeof TRANSPORT_LOGOS)[]) {
      const { container, unmount } = render(<TransportLogo kind={kind} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      // One colour, taken from the text colour of the box it lands in: the tab
      // behind it is a different shade when hovered, active and neither.
      expect(container.innerHTML).toContain('currentColor');
      unmount();
    }
  });
});

describe('Panel', () => {
  it('pins the footer outside the part that scrolls', () => {
    render(
      <Panel title="Activity" footer={<span data-testid="strip">1</span>}>
        <span>body</span>
      </Panel>,
    );

    expect(screen.getByTestId('strip').closest('[data-part="panel-body"]')).toBeNull();
  });
});

describe('IconButton', () => {
  it('always exposes an accessible name', () => {
    render(
      <IconButton label="Clear activity" onClick={() => undefined}>
        x
      </IconButton>,
    );
    expect(screen.getByRole('button', { name: 'Clear activity' })).toBeTruthy();
  });

  it('does not fire when disabled', () => {
    const onClick = vi.fn();
    render(
      <IconButton label="Send" onClick={onClick} disabled>
        x
      </IconButton>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('Badge', () => {
  it('exposes its semantic tone without coupling tests to presentation classes', () => {
    render(<Badge tone="error">fallo</Badge>);
    expect(screen.getByText('fallo').dataset.tone).toBe('error');
  });
});

describe('Dialog', () => {
  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(
      <Dialog open title="Variables" onClose={onClose}>
        <p>contenido</p>
      </Dialog>,
    );
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes from the header button', () => {
    const onClose = vi.fn();
    render(
      <Dialog open title="Variables" onClose={onClose}>
        <p>contenido</p>
      </Dialog>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('renders nothing when closed', () => {
    render(
      <Dialog open={false} title="Variables" onClose={() => undefined}>
        <p>contenido</p>
      </Dialog>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('exposes overlay and surface state for motion', () => {
    render(
      <Dialog open title="Variables" onClose={() => undefined}>
        <p>contenido</p>
      </Dialog>,
    );

    expect(screen.getByRole('dialog').dataset.state).toBe('open');
    expect(document.querySelector('[data-part="dialog-backdrop"]')?.getAttribute('data-state')).toBe(
      'open',
    );
  });

  it('uses the shared dialog surface', () => {
    render(
      <Dialog open title="Variables" onClose={() => undefined}>
        <p>contenido</p>
      </Dialog>,
    );

    expect(screen.getByRole('dialog').dataset.part).toBe('dialog');
  });
});

describe('Dialog sizes', () => {
  it('defaults to md and takes the size it is given', () => {
    const { rerender } = render(
      <Dialog open title="Ajustes" onClose={vi.fn()}>
        <p>cuerpo</p>
      </Dialog>,
    );
    expect(screen.getByRole('dialog').dataset.size).toBe('md');

    rerender(
      <Dialog open title="Ajustes" size="lg" onClose={vi.fn()}>
        <p>cuerpo</p>
      </Dialog>,
    );
    expect(screen.getByRole('dialog').dataset.size).toBe('lg');
  });
});

describe('ConfirmDialog', () => {
  it('uses the shared alert surface', () => {
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Delete event"
        message="No se puede deshacer."
        onConfirm={() => undefined}
        onClose={onClose}
      />,
    );

    expect(screen.getByRole('alertdialog').dataset.part).toBe('dialog');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('confirms and cancels through its own buttons', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <ConfirmDialog
        open
        title="Delete event"
        message='¿Delete "PcStatus"? No se puede deshacer.'
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

describe('Menu', () => {
  it('opens on the trigger and runs the chosen item', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <Menu
        label="Options"
        trigger={<button type="button">Options</button>}
        items={[{ label: 'Rename', onSelect }]}
        groups={[{ label: 'Move to', items: [{ label: 'devices', onSelect: vi.fn() }] }]}
      />,
    );

    expect(screen.queryByRole('menuitem', { name: 'Rename' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Options' }));
    expect(screen.getByText('Move to')).toBeTruthy();
    await user.click(screen.getByRole('menuitem', { name: 'Rename' }));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});

describe('ContextMenu', () => {
  it('opens on a right click and shows exactly its items', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <ContextMenu
        label="Editor actions"
        items={[
          { label: 'Copy', disabled: true, onSelect: vi.fn() },
          { label: 'Paste', onSelect },
        ]}
      >
        <div data-testid="surface">payload</div>
      </ContextMenu>,
    );

    await user.pointer({ keys: '[MouseRight]', target: screen.getByTestId('surface') });

    const items = screen.getAllByRole('menuitem');
    expect(items.map((item) => item.textContent)).toEqual(['Copy', 'Paste']);
    expect(items[0]?.getAttribute('data-disabled')).not.toBeNull();

    await user.click(screen.getByRole('menuitem', { name: 'Paste' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
