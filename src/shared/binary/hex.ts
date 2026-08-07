const DIGITS = '0123456789abcdef';

/** Lowercase pairs, unseparated: the form the composer reads back. */
export function bytesToHex(bytes: Uint8Array): string {
  let output = '';
  for (const byte of bytes) {
    output += DIGITS.charAt((byte >>> 4) & 15) + DIGITS.charAt(byte & 15);
  }
  return output;
}

function valueOf(code: number): number {
  if (code >= 48 && code <= 57) return code - 48;
  if (code >= 97 && code <= 102) return code - 87;
  if (code >= 65 && code <= 70) return code - 55;
  return -1;
}

/**
 * The bytes a hex payload spells, or `null` when it spells none. Whitespace is
 * ignored so a dump pasted out of another tool is read as written, but a stray
 * character or a half byte is refused rather than silently dropped — the point
 * of this editor is that what is typed is what leaves on the wire.
 */
export function hexToBytes(text: string): Uint8Array | null {
  const values: number[] = [];
  for (const character of text) {
    const code = character.codePointAt(0) ?? 0;
    if (code === 32 || code === 9 || code === 10 || code === 13) continue;
    const value = valueOf(code);
    if (value < 0) return null;
    values.push(value);
  }

  if (values.length % 2 !== 0) return null;
  const bytes = new Uint8Array(values.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = ((values[index * 2] ?? 0) << 4) | (values[index * 2 + 1] ?? 0);
  }
  return bytes;
}
