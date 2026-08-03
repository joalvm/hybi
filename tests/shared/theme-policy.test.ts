import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const styles = ['tokens.css', 'dark.css']
  .map((file) =>
    readFileSync(resolve(import.meta.dirname, `../../src/renderer/shared/styles/${file}`), 'utf8'),
  )
  .join('\n');

describe('renderer theme policy', () => {
  it('supports system dark mode and an explicit future override through semantic tokens', () => {
    expect(styles).toContain('@media (prefers-color-scheme: dark)');
    expect(styles).toContain(":root:not([data-theme='light'])");
    expect(styles).toContain(":root[data-theme='dark']");
    expect(styles).toContain('color-scheme: dark');
    expect(styles).toContain(
      "--text-family-default: 'Inter', 'OpenSans', Helvetica, Arial, sans-serif;",
    );
    expect(styles).toContain("--text-family-code: 'IBMPlexMono', 'Cousine', monospace;");
  });
});
