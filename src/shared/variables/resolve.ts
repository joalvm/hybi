import type { Variable } from '../domain/types.js';
import { scanVariables } from './scan.js';

export type VariableScope = ReadonlyMap<string, Variable>;

export type Resolution = { text: string; missing: string[]; replaced: number };

/** Later writes win, so the connection's environment overrides the globals. */
export function buildScope(
  environment: readonly Variable[],
  globals: readonly Variable[] = [],
): VariableScope {
  const scope = new Map<string, Variable>();
  for (const variable of globals) scope.set(variable.name, variable);
  for (const variable of environment) scope.set(variable.name, variable);
  return scope;
}

/**
 * Substitutes every `{{name}}` in one pass. Substituted values are not
 * rescanned, so a variable holding `{{other}}` stays literal rather than
 * expanding — that keeps resolution terminating and predictable.
 */
export function resolveText(text: string, scope: VariableScope): Resolution {
  const tokens = scanVariables(text);
  if (tokens.length === 0) return { text, missing: [], replaced: 0 };

  const missing = new Set<string>();
  let replaced = 0;
  let output = '';
  let cursor = 0;

  for (const token of tokens) {
    output += text.slice(cursor, token.start);
    const variable = scope.get(token.name);
    if (variable === undefined) {
      missing.add(token.name);
      output += text.slice(token.start, token.end);
    } else {
      replaced += 1;
      output += variable.value;
    }
    cursor = token.end;
  }

  output += text.slice(cursor);
  return { text: output, missing: [...missing], replaced };
}
