/** Bytes per line of the dump. Sixteen is what every hex viewer shows. */
export const DUMP_WIDTH = 16;

/** Below `0x20` and above `0x7e` there is nothing to draw, so a dot stands in. */
const PLACEHOLDER = '.';

export type DumpRow = {
  /** Where the row starts, in the frame, as eight hex digits. */
  offset: string;
  /** `DUMP_WIDTH` byte slots, space separated and padded to a fixed width. */
  hex: string;
  /** The same bytes as characters, unpadded: it is the last column. */
  ascii: string;
};

export function dumpRowCount(byteLength: number): number {
  return Math.ceil(byteLength / DUMP_WIDTH);
}

const HEX = '0123456789abcdef';

function byteToHex(byte: number): string {
  return HEX.charAt((byte >>> 4) & 15) + HEX.charAt(byte & 15);
}

/**
 * One line of the dump, built on demand. The viewer is virtualized, so a frame
 * of a megabyte lays out the twenty-odd rows on screen rather than the sixty-five
 * thousand it contains — which is the only way that frame stays scrollable.
 */
export function dumpRow(bytes: Uint8Array, row: number): DumpRow {
  const start = row * DUMP_WIDTH;
  const end = Math.min(start + DUMP_WIDTH, bytes.length);

  const columns: string[] = [];
  let ascii = '';
  for (let index = start; index < end; index += 1) {
    const byte = bytes[index] ?? 0;
    columns.push(byteToHex(byte));
    ascii += byte >= 0x20 && byte <= 0x7e ? String.fromCharCode(byte) : PLACEHOLDER;
  }
  // Empty slots keep their width so the ASCII column of every row lines up,
  // including the short one at the end of the frame.
  while (columns.length < DUMP_WIDTH) columns.push('  ');

  return {
    offset: start.toString(16).padStart(8, '0'),
    hex: columns.join(' '),
    ascii,
  };
}
