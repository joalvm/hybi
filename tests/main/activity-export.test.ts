import { describe, expect, it } from 'vitest';
import type { ActivityRecord } from '@shared/ipc/activity.js';
import {
  activityDefaultFileName,
  redactFrames,
  serializeActivity,
} from '../../src/main/activity/export.js';

const record = (over: Partial<ActivityRecord>): ActivityRecord => ({
  id: 'c1:1',
  connectionId: 'c1',
  transportKind: 'websocket',
  sequence: 1,
  kind: 'outgoing',
  at: Date.parse('2026-08-04T21:00:00.000Z'),
  label: 'DeviceLogin',
  body: '{"token":"s3cr3t"}',
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

    expect(text).toContain('[2026-08-04T21:00:00.000Z] Saliente DeviceLogin (18 B)');
    // The body is written as it arrived: a text export that flattens the frame
    // is no longer a copy of what crossed the socket.
    expect(text).toContain('plain\ntext');
  });
});

describe('activityDefaultFileName', () => {
  it('never lets a connection name become a path', () => {
    expect(activityDefaultFileName('a/b:c')).toBe('a-b-c.json');
    expect(activityDefaultFileName('   ')).toBe('actividad.json');
  });
});
