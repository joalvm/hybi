import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_PREFERENCES } from '@shared/preferences/defaults.js';
import type { AppPreferences } from '@shared/preferences/types.js';
import { PreferencesDialog } from '@/features/preferences/PreferencesDialog.js';
import { usePreferences } from '@/store/preferences.store.js';
import { useStore } from '@/store/index.js';

const preferencesBridge = vi.hoisted(() => ({
  load: vi.fn(() => Promise.resolve<AppPreferences>({ ...DEFAULT_PREFERENCES })),
  save: vi.fn((preferences: AppPreferences) => Promise.resolve(preferences)),
  onChanged: vi.fn(() => () => undefined),
}));

vi.mock('@/ipc/bridge.js', () => ({ bridge: { preferences: preferencesBridge } }));

/** The last shape handed to the main process, which is what reaches disk. */
function lastSaved(): AppPreferences | undefined {
  return preferencesBridge.save.mock.calls.at(-1)?.[0];
}

async function pick(user: ReturnType<typeof userEvent.setup>, field: string, option: string) {
  await user.click(screen.getByRole('combobox', { name: field }));
  await user.click(screen.getByRole('option', { name: option }));
}

/** The rail decides which pane exists; Radix does not render the others. */
async function openTab(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole('tab', { name }));
}

beforeEach(() => {
  usePreferences.getState().replace(DEFAULT_PREFERENCES);
  delete document.documentElement.dataset.theme;
  preferencesBridge.save.mockClear();
});

describe('PreferencesDialog', () => {
  it('paints the theme in the document and persists it in the same step', async () => {
    const user = userEvent.setup();
    render(<PreferencesDialog open onClose={() => undefined} />);
    await openTab(user, 'Apariencia');

    await pick(user, 'Tema', 'Oscuro');

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(usePreferences.getState().theme).toBe('dark');
    expect(lastSaved()?.theme).toBe('dark');
  });

  /**
   * `system` is not a value the stylesheet understands: it is the absence of an
   * override, so the media query is what decides again.
   */
  it('hands the palette back to the host when the theme is system', async () => {
    const user = userEvent.setup();
    usePreferences.getState().replace({ ...DEFAULT_PREFERENCES, theme: 'dark' });
    render(<PreferencesDialog open onClose={() => undefined} />);
    await openTab(user, 'Apariencia');

    await pick(user, 'Tema', 'Sistema');

    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it('commits the editor font size when the field is left', async () => {
    const user = userEvent.setup();
    render(<PreferencesDialog open onClose={() => undefined} />);
    await openTab(user, 'Apariencia');

    const field = screen.getByLabelText('Tamaño de fuente del editor');
    await user.clear(field);
    await user.type(field, '16');
    await user.tab();

    expect(usePreferences.getState().editorFontSize).toBe(16);
    expect(lastSaved()?.editorFontSize).toBe(16);
  });

  /** Bytes on disk, megabytes on screen: nobody budgets a log in bytes. */
  it('stores the log budget in bytes while showing megabytes', async () => {
    const user = userEvent.setup();
    render(<PreferencesDialog open onClose={() => undefined} />);
    await openTab(user, 'Log de actividad');

    const field = screen.getByLabelText('Memoria máxima del log');
    await user.clear(field);
    await user.type(field, '16');
    await user.tab();

    expect(usePreferences.getState().activityByteLimit).toBe(16 * 1024 * 1024);
  });

  it('records what the app should do on startup', async () => {
    const user = userEvent.setup();
    render(<PreferencesDialog open onClose={() => undefined} />);

    await pick(user, 'Al arrancar', 'Abrir el último workspace');

    expect(lastSaved()?.startup).toBe('last-workspace');
  });

  /** A rail is only worth its width if it keeps the dialog from growing. */
  it('shows one pane at a time', async () => {
    const user = userEvent.setup();
    render(<PreferencesDialog open onClose={() => undefined} />);

    expect(screen.getByRole('combobox', { name: 'Al arrancar' })).toBeTruthy();
    expect(screen.queryByLabelText('Mensajes máximos por conexión')).toBeNull();

    await openTab(user, 'Log de actividad');

    expect(screen.queryByRole('combobox', { name: 'Al arrancar' })).toBeNull();
    expect(screen.getByLabelText('Mensajes máximos por conexión')).toBeTruthy();
  });
});

describe('activity budget', () => {
  beforeEach(() => {
    useStore.getState().reset();
  });

  /** The log limits are a preference now, so the buffer has to read them live. */
  it('trims the log to the number of records the preference allows', () => {
    usePreferences.getState().replace({ ...DEFAULT_PREFERENCES, activityLimit: 5 });

    useStore.getState().appendActivity(
      Array.from({ length: 20 }, (_unused, index) => ({
        id: `c1:${String(index)}`,
        connectionId: 'c1',
        transportKind: 'websocket' as const,
        sequence: index,
        kind: 'incoming' as const,
        at: 0,
        label: 'msg',
        body: 'x',
        bytes: 1,
      })),
    );

    expect(useStore.getState().activity.c1).toHaveLength(5);
  });
});
