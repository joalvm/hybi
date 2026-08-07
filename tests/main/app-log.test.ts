import { mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppLog } from '../../src/main/log/writer.js';

let root: string;
let path: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'wsw-log-'));
  path = join(root, 'hybi.log');
});

describe('AppLog', () => {
  it('writes one line per event, dated and labelled', async () => {
    const log = new AppLog(path);
    log.append('error', 'connection', 'ECONNREFUSED ws://127.0.0.1:9999/');
    log.append('info', 'connection', 'closed 1006');
    await log.settled();

    const lines = (await readFile(path, 'utf8')).trimEnd().split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatch(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z error connection ECONNREFUSED /);
    expect(lines[1]).toContain('info connection closed 1006');
  });

  it('creates the directory the file lives in', async () => {
    const log = new AppLog(join(root, 'nested', 'hybi.log'));
    log.append('info', 'app', 'started');
    await log.settled();

    expect(await readdir(join(root, 'nested'))).toEqual(['hybi.log']);
  });

  it('rotates once the file would pass its size limit', async () => {
    const log = new AppLog(path, 80);
    log.append('info', 'connection', 'a'.repeat(60));
    log.append('info', 'connection', 'b'.repeat(60));
    await log.settled();

    expect(await readFile(`${path}.1`, 'utf8')).toContain('a'.repeat(60));
    expect(await readFile(path, 'utf8')).toContain('b'.repeat(60));
  });

  /** An unbounded pile of generations is the disk leak the rotation prevents. */
  it('keeps one previous generation and no more', async () => {
    await writeFile(`${path}.1`, 'older\n', 'utf8');
    const log = new AppLog(path, 80);
    log.append('info', 'connection', 'a'.repeat(60));
    log.append('info', 'connection', 'b'.repeat(60));
    await log.settled();

    expect(await readdir(root)).toEqual(['hybi.log', 'hybi.log.1']);
    expect(await readFile(`${path}.1`, 'utf8')).not.toContain('older');
  });

  /** Nothing waits on a log line, so a failing disk cannot break a connection. */
  it('swallows a write it cannot perform', async () => {
    const log = new AppLog(join(path, 'not-a-directory', 'hybi.log'));
    log.append('info', 'app', 'started');

    await expect(log.settled()).resolves.toBeUndefined();
  });
});
