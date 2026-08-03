import { useEffect, useRef, useState } from 'react';
import { monaco } from '@/shared/monaco/setup.js';
import { modelFor, useMonacoEditor } from '@/shared/monaco/useMonacoEditor.js';
import { EditorContextMenu } from './EditorContextMenu.js';
import { copySelection, cutSelection, pasteClipboard } from './editorClipboard.js';

type Props = {
  eventId: string;
  text: string;
  onChange: (next: string) => void;
};

/** Monaco owns editing; React owns the current Markdown draft. */
export function MarkdownEditor({ eventId, text, onChange }: Props) {
  const { containerRef, editorRef } = useMonacoEditor({
    ariaLabel: 'Editor Markdown',
    renderLineHighlight: 'none',
  });
  const onChangeRef = useRef(onChange);
  const programmatic = useRef(false);
  const pendingUserValues = useRef<string[]>([]);
  const [hasSelection, setHasSelection] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const instance = editorRef.current;
    if (instance === null) return;
    const subscription = instance.onDidChangeCursorSelection((event) => {
      setHasSelection(!event.selection.isEmpty());
    });
    return () => {
      subscription.dispose();
    };
  }, [editorRef]);

  useEffect(() => {
    const instance = editorRef.current;
    if (instance === null) return;
    const subscription = instance.onDidChangeModelContent(() => {
      if (programmatic.current) return;
      const next = instance.getValue();
      pendingUserValues.current.push(next);
      onChangeRef.current(next);
    });
    return () => {
      subscription.dispose();
    };
  }, [editorRef]);

  // One model per event preserves cursor and undo history across event switches.
  useEffect(() => {
    const instance = editorRef.current;
    if (instance === null) return;
    const model = modelFor(`docs:${eventId}`, text);
    monaco.editor.setModelLanguage(model, 'markdown');
    pendingUserValues.current = [];
    programmatic.current = true;
    instance.setModel(model);
    programmatic.current = false;
    // `text` seeds a new model; the next effect reconciles existing models.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, editorRef]);

  useEffect(() => {
    const model = editorRef.current?.getModel() ?? null;
    if (model === null) return;
    const acknowledged = pendingUserValues.current.lastIndexOf(text);
    if (acknowledged >= 0) {
      pendingUserValues.current.splice(0, acknowledged + 1);
      return;
    }
    pendingUserValues.current = [];
    if (model.getValue() === text) return;
    programmatic.current = true;
    model.setValue(text);
    programmatic.current = false;
  }, [text, eventId, editorRef]);

  return (
    <EditorContextMenu
      hasSelection={hasSelection}
      onCut={() => {
        cutSelection(editorRef);
      }}
      onCopy={() => {
        copySelection(editorRef);
      }}
      onPaste={() => {
        pasteClipboard(editorRef);
      }}
    >
      <div
        className="markdown-editor-runtime h-full min-h-0"
        ref={containerRef}
        data-part="markdown-editor"
      />
    </EditorContextMenu>
  );
}
