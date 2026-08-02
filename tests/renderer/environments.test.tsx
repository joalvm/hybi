import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cloneConnectionSettings } from '@shared/domain/defaults.js';
import { createWorkspace } from '@shared/domain/factory.js';
import type { Environment } from '@shared/domain/types.js';
import { ActiveEnvironmentPicker } from '@/features/workspace/ActiveEnvironmentPicker.js';
import { EnvironmentPicker } from '@/features/workspace/EnvironmentPicker.js';
import { VariablePopover } from '@/features/workspace/VariablePopover.js';
import { VariablesDialog } from '@/features/workspace/VariablesDialog.js';
import { useStore } from '@/store/index.js';

function environments(): Environment[] {
  return useStore.getState().workspace?.environments ?? [];
}

function loadWorkspace(): void {
  const workspace = createWorkspace('Demo');
  workspace.environments.push({
    id: 'env1',
    name: 'local',
    variables: [{ name: 'host', value: '127.0.0.1', secret: false }],
  });
  workspace.connections.push({
    id: 'c1',
    name: 'Conexión A',
    url: 'ws://{{host}}',
    environmentId: null,
    settings: cloneConnectionSettings(),
  });
  useStore.getState().setWorkspace(workspace);
  useStore.getState().setActiveConnection('c1');
}

beforeEach(() => {
  useStore.getState().reset();
});

describe('ActiveEnvironmentPicker', () => {
  it('binds the chosen environment to the active connection', async () => {
    const user = userEvent.setup();
    loadWorkspace();
    render(<ActiveEnvironmentPicker />);

    await user.click(screen.getByRole('combobox', { name: 'Entorno' }));
    await user.click(screen.getByRole('option', { name: 'local' }));

    expect(useStore.getState().workspace?.connections[0]?.environmentId).toBe('env1');
  });

  it('renders nothing without an active connection', () => {
    loadWorkspace();
    useStore.getState().setActiveConnection(null);
    render(<ActiveEnvironmentPicker />);

    expect(screen.queryByLabelText('Entorno')).toBeNull();
  });
});

describe('EnvironmentPicker', () => {
  it('lists the environments and reports the chosen id', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <EnvironmentPicker
        environments={[
          { id: 'env-1', name: 'local', variables: [] },
          { id: 'env-2', name: 'staging', variables: [] },
        ]}
        value="env-1"
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('combobox', { name: 'Entorno' }));
    await user.click(screen.getByRole('option', { name: 'staging' }));
    expect(onChange).toHaveBeenCalledWith('env-2');

    await user.click(screen.getByRole('combobox', { name: 'Entorno' }));
    await user.click(screen.getByRole('option', { name: 'Sin entorno' }));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});

describe('VariablesDialog', () => {
  beforeEach(() => {
    loadWorkspace();
    useStore.getState().setDialog('variables');
    render(<VariablesDialog />);
  });

  it('creates an environment with a name and nothing else', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo entorno' }));

    expect(environments()).toHaveLength(2);
    expect(environments()[1]?.variables).toEqual([]);
    // The new one is what the detail half shows, so variables land in it.
    expect(screen.getByLabelText('Nombre del entorno')).toHaveProperty('value', 'Entorno 2');
  });

  it('renames in place', () => {
    fireEvent.change(screen.getByLabelText('Nombre del entorno'), { target: { value: 'staging' } });

    expect(environments()[0]?.name).toBe('staging');
  });

  it('adds and edits a variable of the selected environment', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Añadir variable' }));
    fireEvent.change(screen.getByLabelText('Nombre de la variable 2'), {
      target: { value: 'token' },
    });
    fireEvent.change(screen.getByLabelText('Valor de la variable 2'), { target: { value: 'abc' } });

    expect(environments()[0]?.variables[1]).toEqual({
      name: 'token',
      value: 'abc',
      secret: false,
    });
  });

  it('asks before deleting and frees the connections that used it', () => {
    useStore.getState().upsertConnection({
      id: 'c1',
      name: 'Conexión A',
      url: 'ws://{{host}}',
      environmentId: 'env1',
      settings: cloneConnectionSettings(),
    });

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(environments()).toHaveLength(1);

    // The confirm dialog is modal, so Radix marks the rest of the tree
    // aria-hidden — the button behind it drops out of the accessible tree and
    // this query resolves to the dialog's own action, uniquely.
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    expect(environments()).toHaveLength(0);
    expect(useStore.getState().workspace?.connections[0]?.environmentId).toBeNull();
  });
});

describe('VariablePopover', () => {
  const anchor = { getBoundingClientRect: () => new DOMRect(0, 0, 10, 10) };

  beforeEach(() => {
    useStore.setState({
      workspace: {
        id: 'w1',
        version: 3,
        name: 'local',
        environments: [
          { id: 'env-1', name: 'local', variables: [{ name: 'host', value: 'ws://a', secret: false }] },
        ],
        connections: [],
        catalog: { collections: [], items: [] },
      },
    });
  });

  it('saves an edit into the environment', async () => {
    const user = userEvent.setup();
    render(<VariablePopover name="host" environmentId="env-1" anchor={anchor} onClose={vi.fn()} />);

    const field = screen.getByLabelText('Valor de host');
    await user.clear(field);
    await user.type(field, 'ws://b{Enter}');

    expect(useStore.getState().workspace?.environments[0]?.variables).toEqual([
      { name: 'host', value: 'ws://b', secret: false },
    ]);
  });

  it('offers to create a variable it cannot find', async () => {
    const user = userEvent.setup();
    render(<VariablePopover name="token" environmentId="env-1" anchor={anchor} onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Crear en local' }));

    expect(useStore.getState().workspace?.environments[0]?.variables).toContainEqual({
      name: 'token',
      value: '',
      secret: false,
    });
  });

  it('masks a secret until it is revealed', async () => {
    const user = userEvent.setup();
    useStore.getState().setEnvironmentVariables('env-1', [
      { name: 'apiKey', value: 'sk-1234', secret: true },
    ]);

    render(<VariablePopover name="apiKey" environmentId="env-1" anchor={anchor} onClose={vi.fn()} />);

    const field = screen.getByLabelText('Valor de apiKey');
    expect(field.getAttribute('type')).toBe('password');
    await user.click(screen.getByRole('button', { name: 'Mostrar valor' }));
    expect(field.getAttribute('type')).toBe('text');
  });
});
