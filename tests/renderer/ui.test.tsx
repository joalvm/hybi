import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { IconButton } from '@/shared/ui/IconButton.js';
import { Dialog } from '@/shared/ui/Dialog.js';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog.js';
import { Badge } from '@/shared/ui/Badge.js';
import { Menu } from '@/shared/ui/Menu.js';
import { ContextMenu } from '@/shared/ui/ContextMenu.js';

describe('IconButton', () => {
  it('always exposes an accessible name', () => {
    render(
      <IconButton label="Limpiar actividad" onClick={() => undefined}>
        x
      </IconButton>,
    );
    expect(screen.getByRole('button', { name: 'Limpiar actividad' })).toBeTruthy();
  });

  it('does not fire when disabled', () => {
    const onClick = vi.fn();
    render(
      <IconButton label="Enviar" onClick={onClick} disabled>
        x
      </IconButton>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
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
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
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
        title="Eliminar evento"
        message="No se puede deshacer."
        onConfirm={() => undefined}
        onClose={onClose}
      />,
    );

    expect(screen.getByRole('alertdialog').dataset.part).toBe('dialog');
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('confirms and cancels through its own buttons', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <ConfirmDialog
        open
        title="Eliminar evento"
        message='¿Eliminar "PcStatus"? No se puede deshacer.'
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Eliminar' }));
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
        label="Opciones"
        trigger={<button type="button">Opciones</button>}
        items={[{ label: 'Renombrar', onSelect }]}
        groups={[{ label: 'Mover a', items: [{ label: 'devices', onSelect: vi.fn() }] }]}
      />,
    );

    expect(screen.queryByRole('menuitem', { name: 'Renombrar' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Opciones' }));
    expect(screen.getByText('Mover a')).toBeTruthy();
    await user.click(screen.getByRole('menuitem', { name: 'Renombrar' }));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});

describe('ContextMenu', () => {
  it('opens on a right click and shows exactly its items', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <ContextMenu
        label="Acciones del editor"
        items={[
          { label: 'Copiar', disabled: true, onSelect: vi.fn() },
          { label: 'Pegar', onSelect },
        ]}
      >
        <div data-testid="surface">payload</div>
      </ContextMenu>,
    );

    await user.pointer({ keys: '[MouseRight]', target: screen.getByTestId('surface') });

    const items = screen.getAllByRole('menuitem');
    expect(items.map((item) => item.textContent)).toEqual(['Copiar', 'Pegar']);
    expect(items[0]?.getAttribute('data-disabled')).not.toBeNull();

    await user.click(screen.getByRole('menuitem', { name: 'Pegar' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
