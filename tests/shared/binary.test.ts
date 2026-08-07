import { describe, expect, it } from 'vitest';
import { base64ByteLength, bytesToBase64, base64ToBytes } from '@shared/binary/base64.js';
import { byteLengthOf } from '@shared/binary/encoding.js';
import { bytesToHex, hexToBytes } from '@shared/binary/hex.js';
import { DUMP_WIDTH, dumpRow, dumpRowCount } from '@shared/binary/dump.js';

const SAMPLE = new Uint8Array([0x00, 0x01, 0x7f, 0x80, 0xff, 0x41, 0x42, 0x43]);

describe('base64', () => {
  it('round-trips every byte value', () => {
    const all = new Uint8Array(256);
    for (let index = 0; index < 256; index += 1) all[index] = index;
    expect(base64ToBytes(bytesToBase64(all))).toEqual(all);
  });

  it('encodes the empty frame as the empty string', () => {
    expect(bytesToBase64(new Uint8Array(0))).toBe('');
    expect(base64ToBytes('')).toEqual(new Uint8Array(0));
  });

  it('rejects text that is not base64', () => {
    expect(base64ToBytes('not base64!')).toBeNull();
    expect(base64ToBytes('QUJD=')).toBeNull();
  });

  it('accepts whitespace between groups, as a wrapped payload carries it', () => {
    expect(base64ToBytes('QUJD\nREVG')).toEqual(base64ToBytes('QUJDREVG'));
  });

  it('measures the decoded length without decoding', () => {
    for (let length = 0; length < 40; length += 1) {
      const bytes = new Uint8Array(length);
      expect(base64ByteLength(bytesToBase64(bytes))).toBe(length);
    }
  });
});

describe('hex', () => {
  it('round-trips through lowercase pairs', () => {
    expect(bytesToHex(SAMPLE)).toBe('00017f80ff414243');
    expect(hexToBytes('00017f80ff414243')).toEqual(SAMPLE);
  });

  it('reads the spacing a pasted dump carries', () => {
    expect(hexToBytes('00 01 7F\n80 FF 41 42 43')).toEqual(SAMPLE);
  });

  it('refuses a half byte or a stray character', () => {
    expect(hexToBytes('abc')).toBeNull();
    expect(hexToBytes('zz')).toBeNull();
  });

  it('reads the empty payload as no bytes', () => {
    expect(hexToBytes('   ')).toEqual(new Uint8Array(0));
  });
});

describe('byteLengthOf', () => {
  it('counts the wire bytes, not the characters', () => {
    expect(byteLengthOf('añ', 'text')).toBe(3);
    expect(byteLengthOf(bytesToBase64(SAMPLE), 'base64')).toBe(SAMPLE.byteLength);
  });
});

describe('hex dump', () => {
  it('splits a frame into rows of the dump width', () => {
    expect(dumpRowCount(0)).toBe(0);
    expect(dumpRowCount(1)).toBe(1);
    expect(dumpRowCount(DUMP_WIDTH)).toBe(1);
    expect(dumpRowCount(DUMP_WIDTH + 1)).toBe(2);
  });

  it('prints the offset, the bytes and the printable column', () => {
    expect(dumpRow(SAMPLE, 0)).toEqual({
      offset: '00000000',
      hex: `00 01 7f 80 ff 41 42 43${'   '.repeat(DUMP_WIDTH - SAMPLE.byteLength)}`,
      ascii: '.....ABC',
    });
  });

  it('pads the hex column so a short last row stays aligned', () => {
    const row = dumpRow(new Uint8Array([0x41]), 0);
    expect(row.hex).toBe(`41${'   '.repeat(DUMP_WIDTH - 1)}`);
    expect(row.hex).toHaveLength(DUMP_WIDTH * 3 - 1);
    expect(row.ascii).toBe('A');
  });

  it('starts each row at its own offset', () => {
    const long = new Uint8Array(DUMP_WIDTH + 2);
    long[DUMP_WIDTH] = 0x5a;
    expect(dumpRow(long, 1)).toMatchObject({ offset: '00000010', ascii: 'Z.' });
  });
});
