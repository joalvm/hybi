import { describe, expect, it } from 'vitest';
import { buildScope } from '@shared/variables/resolve.js';
import { variableAtOffset } from '@/shared/monaco/useVariableHover.js';
import { decorationsFor } from '@/shared/monaco/useVariableDecorations.js';

const scope = buildScope([
  { name: 'host', value: '127.0.0.1', secret: false },
  { name: 'token', value: 'abc123', secret: true },
]);

const singleLine = (offset: number) => ({ line: 1, column: offset + 1 });

describe('decorationsFor', () => {
  it('marks resolved and missing variables with different classes', () => {
    const decorations = decorationsFor('{{host}} {{nope}}', scope, singleLine);
    expect(decorations).toHaveLength(2);
    expect(decorations[0]?.className).toBe('wsw-var-resolved');
    expect(decorations[1]?.className).toBe('wsw-var-missing');
  });

  it('spans the whole {{name}} token', () => {
    const [decoration] = decorationsFor('ws://{{host}}', scope, singleLine);
    expect(decoration?.range).toEqual([1, 6, 1, 14]);
  });
});

describe('variableAtOffset', () => {
  const text = 'let host = "{{host}}";';

  it('finds the token the offset falls inside, braces included', () => {
    expect(variableAtOffset(text, 12)?.name).toBe('host');
    expect(variableAtOffset(text, 16)?.name).toBe('host');
    expect(variableAtOffset(text, 18)?.name).toBe('host');
  });

  it('returns null outside a token', () => {
    expect(variableAtOffset(text, 0)).toBeNull();
    expect(variableAtOffset(text, 20)).toBeNull();
  });
});
