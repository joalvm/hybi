import type { RefObject } from 'react';
import type { editor } from 'monaco-editor/editor/editor.api.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  copySelection,
  cutSelection,
  pasteClipboard,
} from '@/features/composer/editorClipboard.js';

const clipboard = vi.hoisted(() => ({
  readText: vi.fn<() => Promise<string>>(),
  writeText: vi.fn<(text: string) => Promise<void>>(),
}));

vi.mock('@/ipc/bridge.js', () => ({ bridge: { clipboard } }));

function editorRef() {
  const selection = { isEmpty: () => false };
  const model = { getValueInRange: () => 'selección' };
  const instance = {
    executeEdits: vi.fn(),
    focus: vi.fn(),
    getModel: () => model,
    getSelection: () => selection,
  };
  return {
    instance,
    ref: { current: instance } as unknown as RefObject<editor.IStandaloneCodeEditor | null>,
    selection,
  };
}

describe('editor clipboard actions', () => {
  beforeEach(() => {
    clipboard.readText.mockReset();
    clipboard.writeText.mockReset();
    clipboard.writeText.mockResolvedValue();
  });

  it('copies the selected model text through the preload bridge', () => {
    const { ref } = editorRef();
    copySelection(ref);
    expect(clipboard.writeText).toHaveBeenCalledWith('selección');
  });

  it('cuts only after the selected text reaches the clipboard', async () => {
    const { ref, instance, selection } = editorRef();
    cutSelection(ref);
    await vi.waitFor(() => {
      expect(instance.executeEdits).toHaveBeenCalledWith('cut', [
        { range: selection, text: '', forceMoveMarkers: true },
      ]);
    });
  });

  it('pastes through Monaco so the operation stays undoable', async () => {
    clipboard.readText.mockResolvedValue('pegado');
    const { ref, instance, selection } = editorRef();
    pasteClipboard(ref);
    await vi.waitFor(() => {
      expect(instance.executeEdits).toHaveBeenCalledWith('paste', [
        { range: selection, text: 'pegado', forceMoveMarkers: true },
      ]);
    });
  });
});
