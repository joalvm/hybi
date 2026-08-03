import { describe, expect, it } from 'vitest';
import { WORKBENCH_THEME_DARK, WORKBENCH_THEME_LIGHT } from '@/shared/monaco/theme.js';

describe('Monaco Markdown theme', () => {
  it('inherits the same standard syntax themes used by the payload editor', () => {
    expect(WORKBENCH_THEME_LIGHT).toMatchObject({ base: 'vs', inherit: true, rules: [] });
    expect(WORKBENCH_THEME_DARK).toMatchObject({ base: 'vs-dark', inherit: true, rules: [] });
  });
});
