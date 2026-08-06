import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppLayout } from '@/app/AppLayout.js';

function layout() {
  return render(
    <AppLayout
      titleBar={<span>Chrome</span>}
      tabs={<span>Tabs</span>}
      catalog={<span>Catalog</span>}
      connectionBar={<span>URL</span>}
      composer={<span>Payload</span>}
      activity={<span>Activity</span>}
    />,
  );
}

describe('AppLayout', () => {
  it('keeps the catalog rail separate from the connection surface', () => {
    const { container } = layout();

    const catalogRail = container.querySelector('[data-part="catalog-rail"]');
    const connectionSurface = container.querySelector('[data-part="connection-surface"]');

    expect(catalogRail).not.toBeNull();
    expect(connectionSurface).not.toBeNull();

    if (catalogRail === null || connectionSurface === null) return;

    expect(catalogRail.contains(screen.getByText('Catalog'))).toBe(true);
    expect(catalogRail.contains(screen.getByText('Tabs'))).toBe(false);
    expect(connectionSurface.contains(screen.getByText('Tabs'))).toBe(true);
    expect(connectionSurface.contains(screen.getByText('URL'))).toBe(true);
    expect(connectionSurface.contains(screen.getByText('Payload'))).toBe(true);
    expect(connectionSurface.contains(screen.getByText('Activity'))).toBe(true);
  });

  it('collapses the catalog while keeping the connection surface mounted', () => {
    const { container } = layout();
    const catalogRail = container.querySelector<HTMLElement>('[data-part="catalog-rail"]');
    const connectionSurface = container.querySelector('[data-part="connection-surface"]');

    fireEvent.click(screen.getByRole('button', { name: 'Hide the catalog' }));

    expect(screen.getByRole('button', { name: 'Show the catalog' })).not.toBeNull();
    expect(catalogRail?.hidden).toBe(true);
    expect(catalogRail?.parentElement?.dataset.size).toBe('0%');
    expect(connectionSurface?.parentElement?.dataset.size).toBe('100%');
    expect(container.querySelector('[data-part="connection-surface"]')).toBe(connectionSurface);
  });
});
