import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const setMonacoTheme = vi.fn();

vi.mock('@/shared/monaco/setup.js', () => ({ setMonacoTheme }));

const { ThemeToggle } = await import('@/app/ThemeToggle.js');

describe('ThemeToggle', () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = 'light';
    setMonacoTheme.mockClear();
  });

  it('switches the document and Monaco together', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole('button', { name: 'Probar tema oscuro' }));

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(setMonacoTheme).toHaveBeenCalledWith('dark');
    expect(screen.getByRole('button', { name: 'Probar tema claro' })).toBeDefined();
  });
});
