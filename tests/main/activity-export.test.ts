import { describe, expect, it } from 'vitest';
import type { ActivityRecord, WebSocketActivityRecord } from '@shared/ipc/activity.js';
import {
  activityDefaultFileName,
  redactFrames,
  serializeActivity,
} from '../../src/main/activity/export.js';

const record = (over: Partial<WebSocketActivityRecord>): WebSocketActivityRecord => ({
  id: 'c1:1',
  connectionId: 'c1',
  transportKind: 'websocket',
  sequence: 1,
  kind: 'outgoing',
  at: Date.parse('2026-08-04T21:00:00.000Z'),
  label: 'DeviceLogin',
  body: '{"token":"s3cr3t"}',
  encoding: 'text',
  bytes: 18,
  ...over,
});

describe('redactFrames', () => {
  // A frame is written with the variable already substituted, so the token the
  // workspace file never stores is sitting in the log in plain text.
  it('puts the variable back where its secret value was', () => {
    const [frame] = redactFrames(
      [record({ label: 's3cr3t', body: 'auth=s3cr3t; keep=public' })],
      [{ name: 'token', value: 's3cr3t' }],
    );

    expect(frame?.body).toBe('auth={{token}}; keep=public');
    expect(frame?.label).toBe('{{token}}');
  });

  it('ignores a secret with no value, which would match everything', () => {
    const [frame] = redactFrames([record({ body: 'abc' })], [{ name: 'empty', value: '' }]);
    expect(frame?.body).toBe('abc');
  });

  // The longest value first, or a secret that contains another is left half
  // written when the shorter one is replaced inside it.
  /**
   * A secret is text, and base64 is not: the same bytes are spelled three ways
   * depending on where the value starts in the frame, so a match would be luck
   * and a replacement would corrupt the payload it landed in.
   */
  it('leaves a binary body alone and still cleans its label', () => {
    const [frame] = redactFrames(
      [record({ encoding: 'base64', label: 's3cr3t', body: 'czNjcjN0' })],
      [{ name: 'token', value: 's3cr3t' }],
    );

    expect(frame?.body).toBe('czNjcjN0');
    expect(frame?.label).toBe('{{token}}');
  });

  it('replaces the longest value first', () => {
    const [frame] = redactFrames(
      [record({ body: 'Bearer abc-123' })],
      [
        { name: 'short', value: 'abc' },
        { name: 'long', value: 'abc-123' },
      ],
    );
    expect(frame?.body).toBe('Bearer {{long}}');
  });
});

describe('serializeActivity', () => {
  const records = [
    record({ id: 'c1:1', body: '{"a":1}' }),
    record({ id: 'c1:2', kind: 'incoming', label: 'Pong', body: 'plain\ntext', sequence: 2 }),
  ];

  it('writes JSON that can be read back', () => {
    const parsed = JSON.parse(serializeActivity(records, 'local', 'session.json')) as {
      connection: string;
      records: ActivityRecord[];
    };

    expect(parsed.connection).toBe('local');
    expect(parsed.records.map((entry) => entry.id)).toEqual(['c1:1', 'c1:2']);
    expect(parsed.records[1]?.body).toBe('plain\ntext');
  });

  it('writes plain text with each frame under its own heading', () => {
    const text = serializeActivity(records, 'local', 'session.txt');

    expect(text).toContain('[2026-08-04T21:00:00.000Z] Outgoing DeviceLogin (18 B)');
    // The body is written as it arrived: a text export that flattens the frame
    // is no longer a copy of what crossed the socket.
    expect(text).toContain('plain\ntext');
  });

  /**
   * Base64 in a text file is unreadable either way; what the reader must not do
   * is mistake it for what the frame said, so the heading names the encoding.
   */
  it('says so when the block under a heading is base64', () => {
    const text = serializeActivity(
      [record({ encoding: 'base64', body: 'AAECAw==', bytes: 4 })],
      'local',
      'session.txt',
    );

    expect(text).toContain('(4 B, base64)');
    expect(text).toContain('AAECAw==');
  });
});

describe('activityDefaultFileName', () => {
  it('never lets a connection name become a path', () => {
    expect(activityDefaultFileName('a/b:c')).toBe('a-b-c.json');
    expect(activityDefaultFileName('   ')).toBe('activity.json');
  });
});
