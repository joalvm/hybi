import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cloneSocketIoSettings,
  cloneWebSocketSettings,
} from '@shared/domain/connections/defaults.js';
import { createWorkspace } from '@shared/domain/factory.js';
import { useStore } from '@/store/index.js';
import { ComposerBreadcrumb } from '@/features/composer/ComposerBreadcrumb.js';
import { ComposerPanel } from '@/features/composer/ComposerPanel.js';
import { ComposerFooter } from '@/features/composer/ComposerFooter.js';
import { ComposerTabs } from '@/features/composer/ComposerTabs.js';
import { DocsView } from '@/features/composer/DocsView.js';
import {
  beautify,
  canBeautify,
  languageOf,
  type PayloadFormat,
} from '@/features/composer/formats.js';
import { SendButton } from '@/features/composer/SendButton.js';
import { useComposerDraft } from '@/features/composer/useComposerDraft.js';
import { useSaveShortcut } from '@/features/composer/useSaveShortcut.js';
import { selectCollectionNameFor } from '@/store/selectors.js';

/** Hoisted so the module factory below can close over the same spies. */
const clipboard = vi.hoisted(() => ({
  readText: vi.fn<() => Promise<string>>(() => Promise.resolve('')),
  writeText: vi.fn(),
}));
const connectionBridge = vi.hoisted(() => ({
  send: vi.fn<() => Promise<{ ok: true; sequence: number } | { ok: false; error: string }>>(() =>
    Promise.resolve({ ok: true, sequence: 1 }),
  ),
}));

const fileBridge = vi.hoisted(() => ({
  pickBinary: vi.fn<() => Promise<{ ok: true; name: string; body: string; bytes: number } | { ok: false; cancelled: true; error: string }>>(
    () => Promise.resolve({ ok: false as const, cancelled: true as const, error: 'cancelled' }),
  ),
}));

vi.mock('@/ipc/bridge.js', () => ({
  bridge: { connection: connectionBridge, clipboard, file: fileBridge },
}));

// jsdom has no layout for Monaco to measure, and the real `setup.js` drags the
// whole editor bundle in. The panel only has to render around them here.
vi.mock('@/shared/monaco/setup.js', () => ({
  monaco: { editor: { setModelLanguage: () => undefined } },
  registerVariableProviders: () => undefined,
}));

vi.mock('@/shared/monaco/useMonacoEditor.js', () => ({
  modelFor: () => ({ getValue: () => '', setValue: () => undefined }),
  useMonacoEditor: () => ({ containerRef: { current: null }, editorRef: { current: null } }),
}));

vi.mock('@/features/composer/MarkdownEditor.js', () => ({
  MarkdownEditor: ({ text, onChange }: { text: string; onChange: (next: string) => void }) => (
    <textarea
      aria-label="Editor Markdown"
      value={text}
      onChange={(event) => {
        onChange(event.target.value);
      }}
    />
  ),
}));

function seed(): void {
  const workspace = createWorkspace('ViiA');
  workspace.environments.push({
    id: 'env1',
    name: 'local',
    variables: [{ name: 'token', value: 'abc', secret: false }],
  });
  workspace.connections.push({
    id: 'c1',
    name: 'local',
    environmentId: 'env1',
    transport: {
      kind: 'websocket',
      url: 'ws://127.0.0.1:3000',
      settings: cloneWebSocketSettings(),
    },
  });
  workspace.catalog.items.push({
    // The seeded `General` collection, so the breadcrumb has a first crumb.
    id: 'e1',
    collectionId: workspace.catalog.collections[0]?.id ?? '',
    name: 'Login',
    payload: '{"token":"{{token}}"}',
    source: 'manual',
  });
  useStore.getState().setWorkspace(workspace);
  useStore.getState().setSelectedEvent('c1', 'e1');
}

beforeEach(() => {
  connectionBridge.send.mockReset();
  connectionBridge.send.mockResolvedValue({ ok: true, sequence: 1 });
  fileBridge.pickBinary.mockReset();
  fileBridge.pickBinary.mockResolvedValue({ ok: false, cancelled: true, error: 'cancelled' });
  useStore.getState().reset();
  seed();
});

describe('useComposerDraft', () => {
  it('starts clean on the catalog payload, resolved against the scope', () => {
    const { result } = renderHook(() => useComposerDraft('c1'));
    expect(result.current.text).toBe('{"token":"{{token}}"}');
    expect(result.current.dirty).toBe(false);
    expect(result.current.resolved).toBe('{"token":"abc"}');
  });

  it('marks the draft dirty and names the variables it could not resolve', () => {
    const { result } = renderHook(() => useComposerDraft('c1'));
    act(() => {
      result.current.setText('{"token":"{{missing}}"}');
    });
    expect(result.current.dirty).toBe(true);
    expect(result.current.missing).toEqual(['missing']);
    expect(result.current.empty).toBe(false);
  });

  /** A workbench sends what it is given: nothing here inspects the shape. */
  it('carries a payload that is neither JSON nor a known format', () => {
    const { result } = renderHook(() => useComposerDraft('c1'));
    act(() => {
      result.current.setText('hola servidor');
    });
    expect(result.current.resolved).toBe('hola servidor');
    expect(result.current.empty).toBe(false);
  });

  it('calls a whitespace-only box empty', () => {
    const { result } = renderHook(() => useComposerDraft('c1'));
    act(() => {
      result.current.setText('  \n ');
    });
    expect(result.current.empty).toBe(true);
  });

  it('save writes the draft into the catalog and clears the dirty flag', () => {
    const { result } = renderHook(() => useComposerDraft('c1'));
    act(() => {
      result.current.setText('{"token":"x"}');
    });
    act(() => {
      result.current.save();
    });
    expect(useStore.getState().workspace?.catalog.items[0]?.payload).toBe('{"token":"x"}');
    expect(result.current.dirty).toBe(false);
  });

  // Undo is Monaco's, so retyping the original text is what "reverts" a draft:
  // the dirty flag has to answer to the text, not to a button that no longer
  // exists.
  it('goes clean again when the text matches the catalog payload', () => {
    const { result } = renderHook(() => useComposerDraft('c1'));
    act(() => {
      result.current.setText('{"token":"x"}');
    });
    expect(result.current.dirty).toBe(true);

    act(() => {
      result.current.setText('{"token":"{{token}}"}');
    });
    expect(result.current.dirty).toBe(false);
  });
});

describe('useSaveShortcut', () => {
  const pressCtrlS = (): boolean =>
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 's', ctrlKey: true, cancelable: true }),
    );

  it('saves on Ctrl+S while the draft is dirty', () => {
    const onSave = vi.fn();
    renderHook(() => {
      useSaveShortcut(true, onSave);
    });

    // `false` is what `dispatchEvent` returns once the default was prevented,
    // which is how the browser's own save dialog is kept out of the window.
    expect(pressCtrlS()).toBe(false);
    expect(onSave).toHaveBeenCalledOnce();
  });

  it('swallows the keystroke but writes nothing on a clean draft', () => {
    const onSave = vi.fn();
    renderHook(() => {
      useSaveShortcut(false, onSave);
    });

    expect(pressCtrlS()).toBe(false);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('leaves the listener behind when the composer goes away', () => {
    const onSave = vi.fn();
    const { unmount } = renderHook(() => {
      useSaveShortcut(true, onSave);
    });

    unmount();
    pressCtrlS();
    expect(onSave).not.toHaveBeenCalled();
  });
});

describe('ComposerTabs', () => {
  it('switches to the docs view and marks the tab it left', () => {
    const onChange = vi.fn();
    render(
      <ComposerTabs tab="message" docsDirty={false} messageDirty={false} onChange={onChange} />,
    );

    expect(screen.getByRole('tab', { name: 'Message' }).getAttribute('aria-selected')).toBe('true');
    fireEvent.click(screen.getByRole('tab', { name: 'Docs' }));
    expect(onChange).toHaveBeenCalledWith('docs');
  });

  it('shows the unsaved dot on the tab that owns the draft', () => {
    const { rerender } = render(
      <ComposerTabs tab="message" docsDirty={false} messageDirty={false} onChange={vi.fn()} />,
    );
    expect(screen.queryByLabelText('Unsaved changes')).toBeNull();

    rerender(<ComposerTabs tab="message" docsDirty={false} messageDirty onChange={vi.fn()} />);
    const dot = screen.getByLabelText('Unsaved changes');
    expect(screen.getByRole('tab', { name: /Message/ }).contains(dot)).toBe(true);

    rerender(<ComposerTabs tab="docs" docsDirty messageDirty={false} onChange={vi.fn()} />);
    expect(
      screen
        .getByRole('tab', { name: /Docs/ })
        .contains(screen.getByLabelText('Unsaved changes')),
    ).toBe(true);
  });
});

describe('ComposerBreadcrumb', () => {
  it('names the collection and then the event', () => {
    render(<ComposerBreadcrumb collection="General" event="DeviceLogin" />);
    expect(screen.getByText('General')).toBeTruthy();
    expect(screen.getByText('DeviceLogin')).toBeTruthy();
  });

  it('reads the collection of the open event out of the store', () => {
    expect(selectCollectionNameFor('c1')(useStore.getState())).toBe('General');
  });
});

describe('DocsView', () => {
  it('renders the description as markdown', () => {
    render(
      <DocsView
        eventId="e1"
        description={'# Login\n\nEnvía el **token** del dispositivo.'}
        text={'# Login\n\nEnvía el **token** del dispositivo.'}
        editing={false}
        onEdit={vi.fn()}
        onClose={vi.fn()}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Login' })).toBeTruthy();
    expect(screen.getByText('token').tagName).toBe('STRONG');
  });

  it('says so when the event carries no description', () => {
    render(
      <DocsView
        eventId="e1"
        description={undefined}
        text=""
        editing={false}
        onEdit={vi.fn()}
        onClose={vi.fn()}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('This event has no description.')).toBeTruthy();
  });

  it('edits and saves Markdown into the selected catalog event', () => {
    render(<ComposerPanel connectionId="c1" />);

    fireEvent.click(screen.getByRole('tab', { name: 'Docs' }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit documentation' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Editor Markdown' }), {
      target: { value: '# Login\n\nUsa una tabla.' },
    });
    fireEvent.keyDown(window, { key: 's', ctrlKey: true });

    expect(useStore.getState().workspace?.catalog.items[0]?.description).toBe(
      '# Login\n\nUsa una tabla.',
    );
    expect(screen.getByRole('textbox', { name: 'Editor Markdown' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Close editor' }));
    expect(screen.getByRole('heading', { name: 'Login' })).toBeTruthy();
  });
});

describe('SendButton', () => {
  it('sends whatever is in the box once the socket is up', () => {
    const onSend = vi.fn();
    render(<SendButton connected empty={false} onSend={onSend} />);
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSend).toHaveBeenCalledOnce();
  });

  it('stays down without a socket or without a payload', () => {
    const { rerender } = render(<SendButton connected={false} empty={false} onSend={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Send' })).toHaveProperty('disabled', true);

    rerender(<SendButton connected empty onSend={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Send' })).toHaveProperty('disabled', true);
  });
});

describe('composing a binary payload', () => {
  const openBinary = async (user: ReturnType<typeof userEvent.setup>): Promise<void> => {
    useStore.getState().setConnectionState('c1', 'open');
    render(<ComposerPanel connectionId="c1" />);
    await user.click(screen.getByRole('combobox', { name: 'Payload format' }));
    await user.click(screen.getByRole('option', { name: 'Binary' }));
  };

  /** Hex in, bytes out: what leaves is the payload, not the spelling of it. */
  it('sends the bytes a hex payload spells', async () => {
    const user = userEvent.setup();
    act(() => {
      useStore.getState().setDraft('c1', 'e1', 'de ad be ef');
    });
    await openBinary(user);

    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(connectionBridge.send).toHaveBeenCalledWith({
      connectionId: 'c1',
      message: { kind: 'websocket', body: '3q2+7w==', encoding: 'base64' },
    });
  });

  it('sends a base64 payload as it was written', async () => {
    const user = userEvent.setup();
    act(() => {
      useStore.getState().setDraft('c1', 'e1', '3q2+7w==');
    });
    await openBinary(user);
    await user.click(screen.getByRole('combobox', { name: 'Binary source' }));
    await user.click(screen.getByRole('option', { name: 'Base64' }));

    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(connectionBridge.send).toHaveBeenCalledWith({
      connectionId: 'c1',
      message: { kind: 'websocket', body: '3q2+7w==', encoding: 'base64' },
    });
  });

  /**
   * A half byte is not a payload. Sending what a broken spelling happens to
   * parse to would put bytes on the wire that nobody typed.
   */
  it('keeps the send button down while the payload cannot be read', async () => {
    const user = userEvent.setup();
    act(() => {
      useStore.getState().setDraft('c1', 'e1', 'dea');
    });
    await openBinary(user);

    expect(screen.getByRole('button', { name: 'Send' })).toHaveProperty('disabled', true);
    expect(screen.getByText('Not a hex payload')).toBeTruthy();
  });

  it('reports the size of the payload that would leave', async () => {
    const user = userEvent.setup();
    act(() => {
      useStore.getState().setDraft('c1', 'e1', 'deadbeef');
    });
    await openBinary(user);

    expect(screen.getByText('4 B')).toBeTruthy();
  });

  /**
   * The file never reaches the editor. A four megabyte payload would become
   * eight megabytes of hex inside Monaco, which is a way to make the composer
   * unusable for exactly the frames this mode exists to send.
   */
  it('sends a picked file without routing it through the editor', async () => {
    const user = userEvent.setup();
    fileBridge.pickBinary.mockResolvedValueOnce({
      ok: true,
      name: 'logo.png',
      body: '3q2+7w==',
      bytes: 4,
    });
    await openBinary(user);
    await user.click(screen.getByRole('combobox', { name: 'Binary source' }));
    await user.click(screen.getByRole('option', { name: 'File' }));
    await user.click(screen.getByRole('button', { name: 'Choose a file' }));

    expect(await screen.findByText('logo.png')).toBeTruthy();
    expect(useStore.getState().drafts['c1:e1']).toBeUndefined();

    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(connectionBridge.send).toHaveBeenCalledWith({
      connectionId: 'c1',
      message: { kind: 'websocket', body: '3q2+7w==', encoding: 'base64' },
    });
  });
});

describe('beautify', () => {
  it('re-indents a JSON frame that arrived on one line', () => {
    expect(beautify('{"event":"Ping","data":{"id":1}}', 'json')).toBe(
      '{\n  "event": "Ping",\n  "data": {\n    "id": 1\n  }\n}',
    );
  });

  it('indents markup by tag depth', () => {
    expect(beautify('<a><b>hola</b></a>', 'xml')).toBe('<a>\n  <b>\n    hola\n  </b>\n</a>');
  });

  it('does not indent past a void element', () => {
    expect(beautify('<p><br><i>x</i></p>', 'html')).toBe('<p>\n  <br>\n  <i>\n    x\n  </i>\n</p>');
  });

  /** Null is what greys the button: nothing to do beats a click that does nothing. */
  it('gives up on text it cannot parse, and on formats with no shape', () => {
    expect(beautify('{"broken":', 'json')).toBeNull();
    expect(beautify('hola servidor', 'text')).toBeNull();
    expect(beautify('deadbeef', 'binary')).toBeNull();
    expect(beautify('   ', 'json')).toBeNull();
  });

  /**
   * The disabled state is recomputed on every keystroke, so it has to answer
   * without re-indenting the payload — but it has to answer the same thing.
   */
  it('agrees with beautify on whether there is anything to do', () => {
    const cases: [string, PayloadFormat][] = [
      ['{"event":"Ping"}', 'json'],
      ['{"broken":', 'json'],
      ['   ', 'json'],
      ['<a><b>hola</b></a>', 'xml'],
      ['<p><br></p>', 'html'],
      ['hola servidor', 'xml'],
      ['hola servidor', 'text'],
      ['deadbeef', 'binary'],
    ];
    for (const [text, format] of cases) {
      expect(canBeautify(text, format)).toBe(beautify(text, format) !== null);
    }
  });

  it('maps every format to a language the editor knows', () => {
    expect(languageOf('json')).toBe('json');
    expect(languageOf('xml')).toBe('xml');
    expect(languageOf('html')).toBe('html');
    expect(languageOf('text')).toBe('plaintext');
    expect(languageOf('binary')).toBe('plaintext');
  });
});

describe('ComposerFooter', () => {
  it('writes the formatted text back when beautify is pressed', () => {
    const onBeautify = vi.fn();
    render(
      <ComposerFooter
        format="json"
        formattable
        onFormatChange={vi.fn()}
        onBeautify={onBeautify}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Format' }));
    expect(onBeautify).toHaveBeenCalledOnce();
  });

  it('greys the button when there is nothing to format', () => {
    render(
      <ComposerFooter
        format="text"
        formattable={false}
        onFormatChange={vi.fn()}
        onBeautify={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Format' })).toHaveProperty('disabled', true);
  });

  it('reports the format the user picked', async () => {
    const user = userEvent.setup();
    const onFormatChange = vi.fn();
    render(
      <ComposerFooter
        format="json"
        formattable={false}
        onFormatChange={onFormatChange}
        onBeautify={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('combobox', { name: 'Payload format' }));
    await user.click(screen.getByRole('option', { name: 'XML' }));
    expect(onFormatChange).toHaveBeenCalledWith('xml');
  });
});

describe('payload editor context menu', () => {
  it('records a main-process send failure in the connection activity', async () => {
    connectionBridge.send.mockResolvedValueOnce({ ok: false, error: 'payload too large' });
    useStore.getState().setConnectionState('c1', 'open');
    render(<ComposerPanel connectionId="c1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(useStore.getState().activity.c1?.at(-1)?.body).toBe('payload too large');
    });
  });

  it('offers exactly cut, copy and paste, and pastes through the bridge', async () => {
    const user = userEvent.setup();
    clipboard.readText.mockResolvedValue('{"a":1}');

    render(<ComposerPanel connectionId="c1" />);

    await user.pointer({ keys: '[MouseRight]', target: screen.getByTestId('payload-editor') });

    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Cut',
      'Copy',
      'Paste',
    ]);

    await user.click(screen.getByRole('menuitem', { name: 'Paste' }));
    expect(clipboard.readText).toHaveBeenCalledTimes(1);
  });
});

describe('the composer of a Socket.IO connection', () => {
  /** The same seeded event, on a connection whose transport routes by name. */
  const useSocketIo = (): void => {
    act(() => {
      const state = useStore.getState();
      const connection = state.workspace?.connections[0];
      if (connection === undefined) return;
      state.setConnectionState('c1', 'open');
      state.upsertConnection({
        ...connection,
        transport: {
          kind: 'socketio',
          url: 'http://127.0.0.1:3000',
          settings: cloneSocketIoSettings(),
        },
      });
    });
  };

  /** The event name starts as the catalog entry's own, which is what it is for. */
  it('offers the event name and the ack switch, named after the open event', () => {
    useSocketIo();
    render(<ComposerPanel connectionId="c1" />);

    expect(screen.getByLabelText('Event')).toHaveProperty('value', 'Login');
    expect(screen.getByLabelText('Wait for ack')).toBeTruthy();
  });

  it('emits under the name in the box, with the payload as one JSON argument', async () => {
    const user = userEvent.setup();
    useSocketIo();
    render(<ComposerPanel connectionId="c1" />);

    await user.clear(screen.getByLabelText('Event'));
    await user.type(screen.getByLabelText('Event'), 'chat:message');
    await user.click(screen.getByRole('combobox', { name: 'Payload format' }));
    await user.click(screen.getByRole('option', { name: 'JSON' }));
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(connectionBridge.send).toHaveBeenCalledWith({
      connectionId: 'c1',
      message: {
        kind: 'socketio',
        event: 'chat:message',
        body: '{"token":"abc"}',
        argument: 'json',
        ack: false,
      },
    });
  });

  it('asks for an answer when the ack switch is on', async () => {
    const user = userEvent.setup();
    useSocketIo();
    render(<ComposerPanel connectionId="c1" />);

    await user.click(screen.getByLabelText('Wait for ack'));
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(connectionBridge.send).toHaveBeenCalledWith({
      connectionId: 'c1',
      message: {
        kind: 'socketio',
        event: 'Login',
        body: '{"token":"abc"}',
        argument: 'json',
        ack: true,
      },
    });
  });

  /** An emit with no name has nowhere to arrive, however much payload it carries. */
  it('refuses to send while the event has no name', async () => {
    const user = userEvent.setup();
    useSocketIo();
    render(<ComposerPanel connectionId="c1" />);

    await user.clear(screen.getByLabelText('Event'));

    expect(screen.getByRole('button', { name: 'Send' })).toHaveProperty('disabled', true);
  });

  /** A raw socket has no name to emit under, so the strip has no place there. */
  it('leaves the emit bar out of a WebSocket connection', () => {
    render(<ComposerPanel connectionId="c1" />);
    expect(screen.queryByLabelText('Event')).toBeNull();
  });
});
