import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { createWorkspace } from '@shared/domain/factory.js';
import type { EventItem } from '@shared/domain/types.js';
import { CatalogPanel } from '@/features/catalog/CatalogPanel.js';
import { useStore } from '@/store/index.js';

function items(): EventItem[] {
  return useStore.getState().workspace?.catalog.items ?? [];
}

function byId(id: string): EventItem | undefined {
  return items().find((entry) => entry.id === id);
}

function collectionIds(): string[] {
  return (useStore.getState().workspace?.catalog.collections ?? []).map((entry) => entry.id);
}

/**
 * Row actions live behind a `…`, so a test opens the menu before pressing one.
 * Radix's trigger opens on pointerdown rather than click.
 */
function menu(label: string, action: string): void {
  fireEvent.pointerDown(screen.getByRole('button', { name: `Options for ${label}` }));
  fireEvent.click(screen.getByRole('menuitem', { name: action }));
}

beforeEach(() => {
  useStore.getState().reset();
  const workspace = createWorkspace('Demo');
  workspace.catalog.collections = [
    { id: 'c1', name: 'devices' },
    { id: 'c2', name: 'incidences' },
  ];
  workspace.catalog.items.push(
    {
      id: 'e1',
      collectionId: 'c1',
      name: 'DeviceLogin',
      payload: '{"a":1}',
      source: 'asyncapi',
      schema: { type: 'object' },
    },
    { id: 'e2', collectionId: 'c2', name: 'OpenIncidence', payload: '{"b":2}', source: 'manual' },
  );
  useStore.getState().setWorkspace(workspace);
  render(<CatalogPanel connectionId="c1" />);
});

/** The rename field a new or renamed row shows in place of its name. */
function nameField(): HTMLInputElement {
  return screen.getByLabelText('Event name');
}

function collectionField(): HTMLInputElement {
  return screen.getByLabelText('Collection name');
}

function collectionNames(): string[] {
  return (useStore.getState().workspace?.catalog.collections ?? []).map((entry) => entry.name);
}

describe('creating events', () => {
  /** An event needs a collection, so only a collection's menu can make one. */
  it('is offered by a collection and not by the panel', () => {
    expect(screen.queryByRole('button', { name: 'New event' })).toBeNull();

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Options for incidences' }));
    expect(screen.getByRole('menuitem', { name: 'New event' })).toBeTruthy();
  });

  it('files a numbered, empty event in the collection its menu came from', () => {
    menu('incidences', 'New event');

    const created = items().find((entry) => entry.name === 'New Event 1');
    expect(created?.collectionId).toBe('c2');
    expect(created?.source).toBe('manual');
    expect(created?.payload).toBe('');
  });

  it('opens the new event in the composer with its name ready to type', () => {
    menu('incidences', 'New event');

    const created = items().find((entry) => entry.name === 'New Event 1');
    expect(useStore.getState().selectedEventByConnection.c1).toBe(created?.id);
    expect(nameField().value).toBe('New Event 1');
  });

  it('takes the lowest free number instead of the next one', () => {
    menu('incidences', 'New event');
    fireEvent.keyDown(nameField(), { key: 'Enter' });
    menu('incidences', 'New event');

    expect(items().map((entry) => entry.name)).toContain('New Event 2');
  });
});

describe('creating collections', () => {
  /** The same gesture as an event: a row appears, named, with the name selected. */
  it('files a numbered collection and opens its name for editing', () => {
    fireEvent.click(screen.getByRole('button', { name: 'New collection' }));

    expect(collectionNames()).toContain('New Collection 1');
    expect(collectionField().value).toBe('New Collection 1');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('takes the lowest free number instead of the next one', () => {
    fireEvent.click(screen.getByRole('button', { name: 'New collection' }));
    fireEvent.keyDown(collectionField(), { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: 'New collection' }));

    expect(collectionNames()).toContain('New Collection 2');
  });
});

describe('renaming collections', () => {
  it('writes the new name without a dialog', () => {
    menu('devices', 'Rename');
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.change(collectionField(), { target: { value: 'dispositivos' } });
    fireEvent.keyDown(collectionField(), { key: 'Enter' });

    expect(collectionNames()).toEqual(['dispositivos', 'incidences']);
  });

  it('discards the edit on Escape', () => {
    menu('devices', 'Rename');
    fireEvent.change(collectionField(), { target: { value: 'otra' } });
    fireEvent.keyDown(collectionField(), { key: 'Escape' });

    expect(collectionNames()).toEqual(['devices', 'incidences']);
  });
});

/**
 * The rows underneath answer to Space as "select me" and call `preventDefault`
 * on it, which used to swallow every space typed into a name. `fireEvent`
 * returns false for a cancelled event, so this asserts the character survives
 * the row rather than asserting a value the test itself just set.
 */
describe('typing a name', () => {
  it('lets a space through in an event name', () => {
    menu('DeviceLogin', 'Rename');
    expect(fireEvent.keyDown(nameField(), { key: ' ' })).toBe(true);

    fireEvent.change(nameField(), { target: { value: 'Device Login v2' } });
    fireEvent.keyDown(nameField(), { key: 'Enter' });
    expect(byId('e1')?.name).toBe('Device Login v2');
  });

  it('lets a space through in a collection name', () => {
    menu('devices', 'Rename');
    expect(fireEvent.keyDown(collectionField(), { key: ' ' })).toBe(true);

    fireEvent.change(collectionField(), { target: { value: 'mis dispositivos' } });
    fireEvent.keyDown(collectionField(), { key: 'Enter' });
    expect(collectionNames()).toContain('mis dispositivos');
  });
});

describe('renaming events', () => {
  it('keeps source and schema of an imported item', () => {
    menu('DeviceLogin', 'Rename');
    fireEvent.change(nameField(), { target: { value: 'DeviceLogout' } });
    fireEvent.keyDown(nameField(), { key: 'Enter' });

    const edited = byId('e1');
    expect(edited?.name).toBe('DeviceLogout');
    expect(edited?.source).toBe('asyncapi');
    expect(edited?.schema).toEqual({ type: 'object' });
  });

  it('keeps the old name when the field is left empty', () => {
    menu('DeviceLogin', 'Rename');
    fireEvent.change(nameField(), { target: { value: '   ' } });
    fireEvent.keyDown(nameField(), { key: 'Enter' });

    expect(byId('e1')?.name).toBe('DeviceLogin');
  });

  it('discards the edit on Escape', () => {
    menu('DeviceLogin', 'Rename');
    fireEvent.change(nameField(), { target: { value: 'Otro' } });
    fireEvent.keyDown(nameField(), { key: 'Escape' });

    expect(byId('e1')?.name).toBe('DeviceLogin');
    expect(screen.queryByLabelText('Event name')).toBeNull();
  });
});

describe('moving events', () => {
  it('changes the collection and nothing else', () => {
    const before = byId('e1');
    menu('DeviceLogin', 'incidences');

    expect(byId('e1')).toEqual({ ...before, collectionId: 'c2' });
  });
});

describe('duplicating events', () => {
  it('produces a new id with the same payload', () => {
    menu('DeviceLogin', 'Duplicate');

    const copies = items().filter((entry) => entry.payload === '{"a":1}');
    expect(copies).toHaveLength(2);
    expect(copies[1]?.id).not.toBe('e1');
  });
});

describe('deleting events', () => {
  it('waits for the confirmation before touching the store', () => {
    menu('DeviceLogin', 'Delete');
    expect(byId('e1')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(byId('e1')).toBeDefined();

    menu('DeviceLogin', 'Delete');
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(byId('e1')).toBeUndefined();
  });
});

describe('deleting collections', () => {
  it('says how many events go with it and then deletes them', () => {
    menu('devices', 'Delete');
    expect(screen.getByText(/and the event it holds/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(collectionIds()).toEqual(['c2']);
    expect(byId('e1')).toBeUndefined();
    expect(byId('e2')).toBeDefined();
  });
});
