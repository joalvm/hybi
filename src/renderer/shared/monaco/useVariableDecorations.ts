import { scanVariables } from '@shared/variables/scan.js';
import type { VariableScope } from '@shared/variables/resolve.js';

export type MonacoDecoration = {
  range: [number, number, number, number];
  className: string;
};

export type PositionAt = (offset: number) => { line: number; column: number };

/**
 * Pure on purpose: the offset-to-position mapping arrives as an argument, so
 * this is testable without standing up a Monaco instance.
 */
export function decorationsFor(
  text: string,
  scope: VariableScope,
  positionAt: PositionAt,
): MonacoDecoration[] {
  return scanVariables(text).map((token) => {
    const variable = scope.get(token.name);
    const start = positionAt(token.start);
    const end = positionAt(token.end);
    return {
      range: [start.line, start.column, end.line, end.column],
      className: variable === undefined ? 'wsw-var-missing' : 'wsw-var-resolved',
    };
  });
}
