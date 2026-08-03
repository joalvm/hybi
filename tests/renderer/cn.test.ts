import { describe, expect, it } from 'vitest';
import { cn } from '@/shared/utils/cn.js';

describe('cn', () => {
  it('keeps semantic color and custom font-size utilities together', () => {
    expect(cn('text-on-brand', 'text-ui').split(' ')).toEqual(
      expect.arrayContaining(['text-on-brand', 'text-ui']),
    );
  });

  it('lets explicit geometry override CSS-first radius and spacing tokens', () => {
    expect(cn('min-h-control rounded-ui', 'min-h-0 rounded-none')).toBe(
      'min-h-0 rounded-none',
    );
  });
});
