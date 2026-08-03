import type { RefObject } from 'react';
import type { editor } from 'monaco-editor/editor/editor.api.js';
import { bridge } from '@/ipc/bridge.js';

type EditorRef = RefObject<editor.IStandaloneCodeEditor | null>;

/** Copies first, then removes the same range as one undoable Monaco edit. */
export function cutSelection(editorRef: EditorRef): void {
  const instance = editorRef.current;
  const model = instance?.getModel() ?? null;
  const selection = instance?.getSelection() ?? null;
  if (instance === null || model === null || selection === null || selection.isEmpty()) return;
  const selectedText = model.getValueInRange(selection);
  void bridge.clipboard.writeText(selectedText).then(() => {
    if (instance.getModel() !== model) return;
    instance.executeEdits('cut', [{ range: selection, text: '', forceMoveMarkers: true }]);
    instance.focus();
  });
}

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
