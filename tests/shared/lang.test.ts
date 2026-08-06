import { describe, expect, it } from 'vitest';
import { EN } from '@lang/en/index.js';
import { ES } from '@lang/es/index.js';

type Node = Record<string, unknown>;

/** Every leaf as `about.title`, so a difference names the key that differs. */
function paths(catalog: Node, prefix = ''): string[] {
  return Object.entries(catalog).flatMap(([key, value]) => {
    const path = prefix === '' ? key : `${prefix}.${key}`;
    if (typeof value === 'object' && value !== null) return paths(value as Node, path);
    return [path];
  });
}

const PLACEHOLDER = /\{(\w+)\}/g;

function placeholders(value: string): string[] {
  return [...value.matchAll(PLACEHOLDER)].map((match) => match[1] ?? '').sort();
}

function leaves(catalog: Node, prefix = ''): Map<string, string> {
  const entries = new Map<string, string>();
  for (const [key, value] of Object.entries(catalog)) {
    const path = prefix === '' ? key : `${prefix}.${key}`;
    if (typeof value === 'object' && value !== null) {
      for (const [nested, text] of leaves(value as Node, path)) entries.set(nested, text);
      continue;
    }
    entries.set(path, String(value));
  }
  return entries;
}

/**
 * `Messages = typeof EN` already makes a missing Spanish key a build error. What
 * the compiler cannot see is a key Spanish has and English does not — an object
 * assigned from a variable is not excess-property checked — or a message whose
 * translation dropped the value it was supposed to interpolate.
 */
describe('language catalogs', () => {
  it('answer for exactly the same keys', () => {
    expect(paths(ES).sort()).toEqual(paths(EN).sort());
  });

  it('keep the placeholders the message is built around', () => {
    const spanish = leaves(ES);

    for (const [path, english] of leaves(EN)) {
      expect([path, placeholders(spanish.get(path) ?? '')]).toEqual([path, placeholders(english)]);
    }
  });
});
