import { useState } from 'react';
import { setMonacoTheme, type VisualTheme } from '@/shared/monaco/setup.js';
import { MoonIcon, SunIcon } from '@/shared/ui/icons.js';
import { IconButton } from '@/shared/ui/IconButton.js';

function initialTheme(): VisualTheme {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === 'light' || explicit === 'dark') return explicit;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Temporary QA control; theme persistence and product settings stay out of scope. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<VisualTheme>(initialTheme);
  const nextTheme: VisualTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <IconButton
      className="app-no-drag shrink-0 bg-control"
      data-part="theme-toggle"
      data-temporary="true"
      label={`Probar tema ${nextTheme === 'dark' ? 'oscuro' : 'claro'}`}
      onClick={() => {
        document.documentElement.dataset.theme = nextTheme;
        setMonacoTheme(nextTheme);
        setTheme(nextTheme);
      }}
    >
      {nextTheme === 'dark' ? <MoonIcon /> : <SunIcon />}
    </IconButton>
  );
}
