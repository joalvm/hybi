/**
 * Base64 without `Buffer`. The renderer is sandboxed and has no Node globals,
 * and the same frame is encoded in the main process and decoded in the renderer,
 * so both sides read one implementation instead of two that have to agree.
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Reverse lookup by code point; `-1` for anything outside the alphabet. */
const VALUES = buildValues();

function buildValues(): Int8Array {
  const values = new Int8Array(128).fill(-1);
  for (let index = 0; index < ALPHABET.length; index += 1) {
    values[ALPHABET.charCodeAt(index)] = index;
  }
  return values;
}

/** Whitespace a wrapped payload carries between groups, which decoders skip. */
function isBlank(code: number): boolean {
  return code === 32 || code === 9 || code === 10 || code === 13;
}

function digit(group: number, shift: number): string {
  return ALPHABET.charAt((group >>> shift) & 63);
}

export function bytesToBase64(bytes: Uint8Array): string {
  let output = '';
  let index = 0;

  for (; index + 2 < bytes.length; index += 3) {
    const group = ((bytes[index] ?? 0) << 16) | ((bytes[index + 1] ?? 0) << 8) | (bytes[index + 2] ?? 0);
    output += digit(group, 18) + digit(group, 12) + digit(group, 6) + digit(group, 0);
  }

  const remaining = bytes.length - index;
  if (remaining === 1) {
    const group = (bytes[index] ?? 0) << 16;
    output += `${digit(group, 18)}${digit(group, 12)}==`;
  } else if (remaining === 2) {
    const group = ((bytes[index] ?? 0) << 16) | ((bytes[index + 1] ?? 0) << 8);
    output += `${digit(group, 18)}${digit(group, 12)}${digit(group, 6)}=`;
  }

  return output;
}

/**
 * The digits of a base64 payload, or `null` when the text is not one. Padding
 * closes the payload: a digit after it means the text is something else, and a
 * decoder that skipped over the mismatch would invent bytes nobody sent.
 */
function digitsOf(value: string): number[] | null {
  const digits: number[] = [];
  let padding = 0;

  for (const character of value) {
    const code = character.codePointAt(0) ?? 0;
    if (isBlank(code)) continue;
    if (character === '=') {
      padding += 1;
      continue;
    }
    const found = code < 128 ? (VALUES[code] ?? -1) : -1;
    if (found < 0 || padding > 0) return null;
    digits.push(found);
  }

  const remainder = digits.length % 4;
  if (remainder === 1) return null;
  if (padding > 2) return null;
  if (padding > 0 && remainder + padding !== 4) return null;
  return digits;
}

export function base64ToBytes(value: string): Uint8Array | null {
  const digits = digitsOf(value);
  if (digits === null) return null;

  const bytes = new Uint8Array(Math.floor((digits.length * 3) / 4));
  let cursor = 0;
  for (let index = 0; index + 1 < digits.length; index += 4) {
    const group =
      ((digits[index] ?? 0) << 18) |
      ((digits[index + 1] ?? 0) << 12) |
      ((digits[index + 2] ?? 0) << 6) |
      (digits[index + 3] ?? 0);
    for (let offset = 0; offset < 3 && cursor + offset < bytes.length; offset += 1) {
      bytes[cursor + offset] = (group >>> (16 - offset * 8)) & 255;
    }
    cursor += 3;
  }
  return bytes;
}

/**
 * The decoded size, arrived at by counting rather than decoding. The activity
 * budget asks this of every record it holds, and answering by allocating the
 * frame would defeat the budget it was asked for.
 */
export function base64ByteLength(value: string): number {
  let digits = 0;
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0;
    if (!isBlank(code) && character !== '=') digits += 1;
  }
  return Math.floor((digits * 3) / 4);
}
