import clsx, { type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const mergeClasses = extendTailwindMerge({
  extend: {
    // Tailwind Merge cannot infer CSS-first @theme font sizes. Without this,
    // `text-ui` is mistaken for a color and removes `text-on-brand`.
    theme: {
      text: ['ui', 'label', 'section', 'dialog-title', 'welcome-title', 'brand-name', 'kicker'],
      radius: ['ui', 'worktab', 'dialog'],
      spacing: [
        'row',
        'control',
        'header',
        'titlebar',
        'traffic-lights',
        'dialog-sm',
        'dialog-md',
        'dialog-settings',
        'dialog-lg',
        'screen-safe',
      ],
    },
  },
});

/** Combines conditional classes while keeping the last Tailwind utility in each group. */
export function cn(...inputs: ClassValue[]) {
  return mergeClasses(clsx(inputs));
}
