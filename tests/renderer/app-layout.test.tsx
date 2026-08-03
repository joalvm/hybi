import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppLayout } from '@/app/AppLayout.js';

describe('AppLayout', () => {
  it('keeps the catalog rail separate from the connection surface', () => {
    const { container } = render(
      <AppLayout
        titleBar={<span>Chrome</span>}
        tabs={<span>Conexiones</span>}
        catalog={<span>Catálogo</span>}
        connectionBar={<span>URL</span>}
        composer={<span>Payload</span>}
        activity={<span>Actividad</span>}
      />,
    );

    const catalogRail = container.querySelector('[data-part="catalog-rail"]');
    const connectionSurface = container.querySelector('[data-part="connection-surface"]');

    expect(catalogRail).not.toBeNull();
    expect(connectionSurface).not.toBeNull();

    if (catalogRail === null || connectionSurface === null) return;

    expect(catalogRail.contains(screen.getByText('Catálogo'))).toBe(true);
    expect(catalogRail.contains(screen.getByText('Conexiones'))).toBe(false);
    expect(connectionSurface.contains(screen.getByText('Conexiones'))).toBe(true);
    expect(connectionSurface.contains(screen.getByText('URL'))).toBe(true);
    expect(connectionSurface.contains(screen.getByText('Payload'))).toBe(true);
    expect(connectionSurface.contains(screen.getByText('Actividad'))).toBe(true);
  });
});
