import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { EventCatalog } from '@shared/domain/types.js';
import { filterCatalog } from '@/features/catalog/useCatalogFilter.js';
import { CatalogToolbar } from '@/features/catalog/CatalogToolbar.js';
import { CatalogTree } from '@/features/catalog/CatalogTree.js';
import { treeKeyAction, type TreeRow } from '@/features/catalog/treeKeyboard.js';

const catalog: EventCatalog = {
  collections: [
    { id: 'c1', name: 'devices' },
    { id: 'c2', name: 'incidences' },
  ],
  items: [
    { id: 'e1', collectionId: 'c1', name: 'DeviceLogin', payload: '{}', source: 'asyncapi' },
    { id: 'e2', collectionId: 'c1', name: 'PcStatus', payload: '{}', source: 'asyncapi' },
    { id: 'e3', collectionId: 'c2', name: 'OpenIncidence', payload: '{}', source: 'manual' },
  ],
};

describe('filterCatalog', () => {
  it('groups items by collection', () => {
    const groups = filterCatalog(catalog, '');
    expect(groups.map((group) => group.collection.name)).toEqual(['devices', 'incidences']);
    expect(groups[0]?.items).toHaveLength(2);
  });

  it('drops collections with no match', () => {
    const groups = filterCatalog(catalog, 'device');
    expect(groups).toHaveLength(1);
    expect(groups[0]?.items.map((item) => item.name)).toEqual(['DeviceLogin']);
  });

  it('matches case-insensitively', () => {
    expect(filterCatalog(catalog, 'PCSTATUS')[0]?.items[0]?.name).toBe('PcStatus');
  });
});

describe('CatalogTree', () => {
  it('renders every group and marks the selected item', () => {
    render(
      <CatalogTree
        groups={filterCatalog(catalog, '')}
        selectedId="e2"
        collapsed={{}}
        onToggleCollection={vi.fn()}
        onSelect={() => undefined}
      />,
    );
    expect(screen.getByText('devices')).toBeTruthy();
    expect(screen.getByRole('treeitem', { name: 'PcStatus', selected: true })).toBeTruthy();
  });

  it('hides the items of a collapsed collection', () => {
    render(
      <CatalogTree
        groups={filterCatalog(catalog, '')}
        selectedId={null}
        collapsed={{ c1: true }}
        onToggleCollection={vi.fn()}
        onSelect={() => undefined}
      />,
    );
    expect(screen.queryByRole('treeitem', { name: 'PcStatus' })).toBeNull();
  });
});

describe('treeKeyAction', () => {
  const rows: TreeRow[] = [
    { kind: 'collection', id: 'c1' },
    { kind: 'item', id: 'e1', collectionId: 'c1' },
    { kind: 'item', id: 'e2', collectionId: 'c1' },
    { kind: 'collection', id: 'c2' },
  ];

  it('walks the visible rows', () => {
    expect(treeKeyAction(rows, {}, 'c1', 'ArrowDown')).toEqual({ type: 'focus', id: 'e1' });
    expect(treeKeyAction(rows, {}, 'e1', 'ArrowUp')).toEqual({ type: 'focus', id: 'c1' });
    expect(treeKeyAction(rows, {}, 'e2', 'Home')).toEqual({ type: 'focus', id: 'c1' });
    expect(treeKeyAction(rows, {}, 'c1', 'End')).toEqual({ type: 'focus', id: 'c2' });
  });

  it('opens a collapsed collection and steps into an open one', () => {
    expect(treeKeyAction(rows, { c1: true }, 'c1', 'ArrowRight')).toEqual({
      type: 'toggle',
      id: 'c1',
    });
    expect(treeKeyAction(rows, {}, 'c1', 'ArrowRight')).toEqual({ type: 'focus', id: 'e1' });
  });

  it('closes an open collection and climbs from a child', () => {
    expect(treeKeyAction(rows, {}, 'c1', 'ArrowLeft')).toEqual({ type: 'toggle', id: 'c1' });
    expect(treeKeyAction(rows, {}, 'e2', 'ArrowLeft')).toEqual({ type: 'focus', id: 'c1' });
    expect(treeKeyAction(rows, { c1: true }, 'c1', 'ArrowLeft')).toBeNull();
  });

  it('maps Enter, F2 and Delete', () => {
    expect(treeKeyAction(rows, {}, 'e1', 'Enter')).toEqual({ type: 'open', id: 'e1' });
    expect(treeKeyAction(rows, {}, 'c1', 'Enter')).toEqual({ type: 'toggle', id: 'c1' });
    expect(treeKeyAction(rows, {}, 'e1', 'F2')).toEqual({ type: 'rename', id: 'e1' });
    expect(treeKeyAction(rows, {}, 'e1', 'Delete')).toEqual({ type: 'delete', id: 'e1' });
    expect(treeKeyAction(rows, {}, 'e1', 'a')).toBeNull();
  });
});

describe('CatalogTree keyboard', () => {
  it('is one tab stop and walks with the arrows', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onToggleCollection = vi.fn();

    render(
      <CatalogTree
        groups={filterCatalog(catalog, '')}
        selectedId={null}
        collapsed={{}}
        onToggleCollection={onToggleCollection}
        onSelect={onSelect}
      />,
    );

    const tree = screen.getByRole('tree');
    expect(tree.querySelectorAll('[tabindex="0"]')).toHaveLength(1);

    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement?.getAttribute('data-row-id')).toBe('e1');

    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith('e1');

    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement?.getAttribute('data-row-id')).toBe('c1');

    await user.keyboard('{ArrowLeft}');
    expect(onToggleCollection).toHaveBeenCalledWith('c1');
  });
});

describe('CatalogToolbar', () => {
  it('offers search, create, import and one collapse toggle', async () => {
    const user = userEvent.setup();
    const onToggleAll = vi.fn();

    const { rerender } = render(
      <CatalogToolbar
        query=""
        importing={false}
        allCollapsed={false}
        onQueryChange={vi.fn()}
        onCreateCollection={vi.fn()}
        onImport={vi.fn()}
        onToggleAll={onToggleAll}
      />,
    );

    expect(screen.getByLabelText('Filter')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'New collection' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Import AsyncAPI' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Collapse all' }));
    expect(onToggleAll).toHaveBeenCalledTimes(1);

    rerender(
      <CatalogToolbar
        query=""
        importing={false}
        allCollapsed
        onQueryChange={vi.fn()}
        onCreateCollection={vi.fn()}
        onImport={vi.fn()}
        onToggleAll={onToggleAll}
      />,
    );
    expect(screen.getByRole('button', { name: 'Expand all' })).toBeTruthy();
  });
});
