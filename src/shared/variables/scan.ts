/** A `{{name}}` occurrence. `start` is inclusive, `end` exclusive. */
export type VariableToken = { name: string; start: number; end: number };

/**
 * Deliberately strict: no inner whitespace, must start with a letter or
 * underscore. The same pattern gates variable names in the workspace schema,
 * so anything storable is matchable and anything matched is storable.
 */
const VARIABLE_PATTERN = /\{\{([A-Za-z_][A-Za-z0-9_.-]{0,63})\}\}/g;

export function scanVariables(text: string): VariableToken[] {
  const tokens: VariableToken[] = [];
  VARIABLE_PATTERN.lastIndex = 0;

  let match = VARIABLE_PATTERN.exec(text);
  while (match !== null) {
    const name = match[1];
    if (name !== undefined) {
      tokens.push({ name, start: match.index, end: match.index + match[0].length });
    }
    match = VARIABLE_PATTERN.exec(text);
  }

  return tokens;
}
