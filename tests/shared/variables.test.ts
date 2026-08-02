import { describe, expect, it } from 'vitest';
import { buildScope, resolveText } from '@shared/variables/resolve.js';
import { scanVariables } from '@shared/variables/scan.js';

const scope = buildScope(
  [{ name: 'host', value: '127.0.0.1', secret: false }],
  [{ name: 'port', value: '3000', secret: false }],
);

describe('scanVariables', () => {
  it('returns offsets for each match', () => {
    expect(scanVariables('ws://{{host}}:{{port}}')).toEqual([
      { name: 'host', start: 5, end: 13 },
      { name: 'port', start: 14, end: 22 },
    ]);
  });

  it('ignores malformed braces', () => {
    expect(scanVariables('{{ host }} {{1bad}} {{}}')).toEqual([]);
  });

  it('finds matches across lines', () => {
    expect(scanVariables('{\n  "a": "{{host}}"\n}')).toEqual([
      { name: 'host', start: 10, end: 18 },
    ]);
  });
});

describe('resolveText', () => {
  it('resolves from the environment before the globals', () => {
    const overriding = buildScope(
      [{ name: 'port', value: '9000', secret: false }],
      [{ name: 'port', value: '3000', secret: false }],
    );
    expect(resolveText('{{port}}', overriding).text).toBe('9000');
  });

  it('falls back to the globals', () => {
    expect(resolveText('{{port}}', scope).text).toBe('3000');
  });

  it('reports missing names and leaves them untouched', () => {
    const result = resolveText('ws://{{host}}:{{nope}}', scope);
    expect(result.text).toBe('ws://127.0.0.1:{{nope}}');
    expect(result.missing).toEqual(['nope']);
    expect(result.replaced).toBe(1);
  });

  it('returns the input unchanged when there is nothing to resolve', () => {
    const result = resolveText('ws://127.0.0.1:3000', scope);
    expect(result).toEqual({ text: 'ws://127.0.0.1:3000', missing: [], replaced: 0 });
  });

  it('does not rescan the substituted value', () => {
    const recursive = buildScope([{ name: 'a', value: '{{b}}', secret: false }]);
    expect(resolveText('{{a}}', recursive)).toEqual({ text: '{{b}}', missing: [], replaced: 1 });
  });
});
