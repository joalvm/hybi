import { describe, expect, it } from 'vitest';
import { cloneConnectionSettings } from '@shared/domain/defaults.js';
import { createConnection, createWorkspace } from '@shared/domain/factory.js';
import { parseWorkspace, WorkspaceFormatError } from '@shared/domain/schema.js';

describe('parseWorkspace', () => {
  it('accepts a freshly created workspace', () => {
    const workspace = createWorkspace('Demo');
    expect(parseWorkspace(structuredClone(workspace))).toEqual(workspace);
  });

  it('rejects an unknown version', () => {
    const workspace = { ...createWorkspace('Demo'), version: 99 };
    expect(() => parseWorkspace(workspace)).toThrow(WorkspaceFormatError);
  });

  it('rejects a connection pointing at a missing environment', () => {
    const workspace = createWorkspace('Demo');
    workspace.connections.push({
      id: 'c1',
      name: 'local',
      url: 'ws://127.0.0.1:3000',
      environmentId: 'does-not-exist',
      settings: cloneConnectionSettings(),
    });
    expect(() => parseWorkspace(workspace)).toThrow(/environmentId/);
  });

  it('rejects an event item in a missing collection', () => {
    const workspace = createWorkspace('Demo');
    workspace.catalog.items.push({
      id: 'e1',
      collectionId: 'nope',
      name: 'Login',
      payload: '{}',
      source: 'manual',
    });
    expect(() => parseWorkspace(workspace)).toThrow(/collectionId/);
  });

  it('starts a workspace with a collection an event can belong to', () => {
    const workspace = createWorkspace('Demo');
    expect(workspace.catalog.collections).toHaveLength(1);
    expect(workspace.catalog.collections[0]?.name).toBe('General');
  });

  /**
   * CR or LF in a header value ends the line and starts one the caller never
   * wrote, so a document carrying either is refused rather than repaired.
   */
  it('rejects a header value carrying a line break', () => {
    const workspace = createWorkspace('Demo');
    const connection = createConnection({ name: 'local' });
    connection.settings.headers.push({
      name: 'X-Trace',
      value: 'a\r\nX-Admin: true',
      enabled: true,
    });
    workspace.connections.push(connection);
    expect(() => parseWorkspace(workspace)).toThrow(/line break/);
  });

  it('rejects a header name the handshake could not send', () => {
    const workspace = createWorkspace('Demo');
    const connection = createConnection({ name: 'local' });
    connection.settings.headers.push({ name: 'X Trace', value: 'ok', enabled: true });
    workspace.connections.push(connection);
    expect(() => parseWorkspace(workspace)).toThrow(WorkspaceFormatError);
  });

  it('rejects a retry policy outside its bounds', () => {
    const workspace = createWorkspace('Demo');
    const connection = createConnection({ name: 'local' });
    connection.settings.retry.attempts = -1;
    workspace.connections.push(connection);
    expect(() => parseWorkspace(workspace)).toThrow(/attempts/);
  });

  it('starts a connection with certificate verification on', () => {
    expect(createConnection({ name: 'local' }).settings.verifyCertificate).toBe(true);
  });

  it('rejects a variable name that {{}} interpolation could not reference', () => {
    const workspace = createWorkspace('Demo');
    workspace.environments.push({
      id: 'env1',
      name: 'local',
      variables: [{ name: '1invalid', value: 'x', secret: false }],
    });
    expect(() => parseWorkspace(workspace)).toThrow(WorkspaceFormatError);
  });
});
