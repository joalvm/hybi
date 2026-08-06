import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_PREFERENCES } from '@shared/preferences/defaults.js';
import type { WorkspaceSummary } from '@shared/domain/types.js';

const openWelcome = vi.fn();
const openWorkspace = vi.fn();
const currentPreferences = vi.fn();
const list = vi.fn<() => Promise<WorkspaceSummary[]>>(() => Promise.resolve([]));

vi.mock('../../src/main/shell.js', () => ({ openWelcome, openWorkspace }));
vi.mock('../../src/main/preferences/service.js', () => ({ currentPreferences }));
vi.mock('../../src/main/workspace/paths.js', () => ({ workspacesDirectory: () => 'ignored' }));
vi.mock('../../src/main/workspace/repository.js', () => ({
  WorkspaceRepository: class {
    readonly list = list;
  },
}));

const { openStartupWindow } = await import('../../src/main/startup.js');

const saved: WorkspaceSummary = {
  id: 'w1',
  name: 'Demo',
  updatedAt: '2026-08-01T12:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  currentPreferences.mockReturnValue(DEFAULT_PREFERENCES);
  list.mockResolvedValue([]);
});

describe('openStartupWindow', () => {
  it('shows the welcome window by default', async () => {
    await openStartupWindow();

    expect(openWelcome).toHaveBeenCalledOnce();
    expect(openWorkspace).not.toHaveBeenCalled();
  });

  /** `list()` is sorted by `updatedAt`, so the first entry is the last one used. */
  it('opens the last document when the preference asks for it', async () => {
    currentPreferences.mockReturnValue({ ...DEFAULT_PREFERENCES, startup: 'last-workspace' });
    list.mockResolvedValue([saved, { ...saved, id: 'w0', updatedAt: '2026-07-01T00:00:00.000Z' }]);

    await openStartupWindow();

    expect(openWorkspace).toHaveBeenCalledWith('w1', null);
    expect(openWelcome).not.toHaveBeenCalled();
  });

  /** There is nothing to go back to on a fresh install, whatever the setting says. */
  it('falls back to welcome when there is no document to reopen', async () => {
    currentPreferences.mockReturnValue({ ...DEFAULT_PREFERENCES, startup: 'last-workspace' });

    await openStartupWindow();

    expect(openWelcome).toHaveBeenCalledOnce();
    expect(openWorkspace).not.toHaveBeenCalled();
  });
});
