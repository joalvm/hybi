import type { RefObject } from 'react';
import type { editor } from 'monaco-editor/editor/editor.api.js';
import { bridge } from '@/ipc/bridge.js';

type EditorRef = RefObject<editor.IStandaloneCodeEditor | null>;

/** Clipboard access crosses the preload bridge because renderer permissions are denied. */
export function copySelection(editorRef: EditorRef): void {
  const instance = editorRef.current;
  const selection = instance?.getSelection() ?? null;
  if (instance === null || selection === null || selection.isEmpty()) return;
  void bridge.clipboard.writeText(instance.getModel()?.getValueInRange(selection) ?? '');
}

/** Inserts through Monaco so paste remains one undoable editor operation. */
export function pasteClipboard(editorRef: EditorRef): void {
  void bridge.clipboard.readText().then((clipboardText) => {
    const instance = editorRef.current;
    const selection = instance?.getSelection() ?? null;
    if (instance === null || selection === null) return;
    instance.executeEdits('paste', [
      { range: selection, text: clipboardText, forceMoveMarkers: true },
    ]);
    instance.focus();
  });
}
