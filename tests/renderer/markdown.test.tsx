import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Markdown } from '@/shared/markdown/Markdown.js';

describe('Markdown', () => {
  it('renders CommonMark and GitHub Flavored Markdown', () => {
    const { container } = render(
      <Markdown
        source={
          '# Login\n\n~~Obsoleto~~\n\n| Campo | Tipo |\n| --- | --- |\n| token | string |\n\n- [x] Validado\n\nNota[^1]\n\n[^1]: Detalle'
        }
      />,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Login' })).toBeTruthy();
    expect(screen.getByText('Obsoleto').tagName).toBe('DEL');
    expect(screen.getByRole('table')).toBeTruthy();
    expect(screen.getByRole('checkbox')).toHaveProperty('checked', true);
    expect(container.querySelector('sup')).toBeTruthy();
  });

  it('keeps safe raw HTML but strips executable markup and attributes', () => {
    const { container } = render(
      <Markdown
        source={'<strong>Seguro</strong><img src="x" onerror="alert(1)"><script>alert(2)</script>'}
      />,
    );

    expect(screen.getByText('Seguro').tagName).toBe('STRONG');
    expect(container.querySelector('img')?.hasAttribute('onerror')).toBe(false);
    expect(container.querySelector('script')).toBeNull();
  });

  it('highlights the language inside a fenced code block', () => {
    const { container } = render(
      <Markdown source={'```ts\ninterface Device {\n  id: number\n}\n```'} />,
    );

    expect(container.querySelector('code')?.classList.contains('hljs')).toBe(true);
    expect(container.querySelector('.hljs-keyword')?.textContent).toBe('interface');
    expect(container.querySelector('.hljs-built_in')?.textContent).toBe('number');
  });
});
