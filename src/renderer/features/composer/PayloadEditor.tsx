import { useEffect, useRef, useState } from 'react';
import type { editor } from 'monaco-editor/editor/editor.api.js';
import type { VariableScope } from '@shared/variables/resolve.js';
import { monaco } from '@/shared/monaco/setup.js';
import { modelFor, useMonacoEditor } from '@/shared/monaco/useMonacoEditor.js';
import { decorationsFor } from '@/shared/monaco/useVariableDecorations.js';
import { useVariableHover } from '@/shared/monaco/useVariableHover.js';
import { copySelection, cutSelection, pasteClipboard } from './editorClipboard.js';
import { PayloadEditorSurface } from './PayloadEditorSurface.js';

type Props = {
  eventId: string | null;
  text: string;
  /** Monaco's language id, chosen by the format picker in the footer. */
  language: string;
  scope: VariableScope;
  /** Where an edited variable is written. Null when no environment is bound. */
  environmentId: string | null;
  onChange: (next: string) => void;
};

/**
 * Props only — this component never reads the store, so the editor can be
 * mounted anywhere. Its three effects each own one job: the instance, the
 * model swap and the decorations.
 */
export function PayloadEditor({
  eventId,
  text,
  language,
  scope,
  environmentId,
  onChange,
}: Props) {
  const { containerRef, editorRef } = useMonacoEditor({});
  // The change subscription is registered once, so it reads the latest handler
  // through a ref instead of being torn down whenever the parent re-renders.
  const onChangeRef = useRef(onChange);
  // Raised around every programmatic write so `setModel` and `setValue` do not
  // echo back through `onChange` as if the user had typed.
  const programmatic = useRef(false);
  const decorations = useRef<editor.IEditorDecorationsCollection | null>(null);
  // Mirrored into state rather than read off the editor while rendering: the
  // context menu has to know whether there is anything to copy before it opens,
  // and a ref cannot be read during render.
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
      onChangeRef.current(instance.getValue());
    });
    return () => {
      subscription.dispose();
    };
  }, [editorRef]);

  // One model per event id, so switching events restores that event's undo
  // stack and cursor instead of rebuilding the editor.
  useEffect(() => {
    const instance = editorRef.current;
    if (instance === null || eventId === null) return;
    programmatic.current = true;
    instance.setModel(modelFor(`payload:${eventId}`, text));
    programmatic.current = false;
    // `text` is the seed for a model that may already exist; the effect below
    // reconciles it, so it must not re-run this swap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, editorRef]);

  // Set on the model, not the editor: the format picker has to keep working
  // after an event swap hands the editor a model created earlier as JSON.
  useEffect(() => {
    const model = editorRef.current?.getModel() ?? null;
    if (model === null) return;
    monaco.editor.setModelLanguage(model, language);
  }, [language, eventId, editorRef]);

  useEffect(() => {
    const instance = editorRef.current;
    const model = instance?.getModel() ?? null;
    if (instance === null || model === null) return;

    // Covers a revert or an external edit: the store is the source of truth.
    if (model.getValue() !== text) {
      programmatic.current = true;
      model.setValue(text);
      programmatic.current = false;
    }

    const next = decorationsFor(text, scope, (offset) => {
      const position = model.getPositionAt(offset);
      return { line: position.lineNumber, column: position.column };
    }).map((decoration) => ({
      range: new monaco.Range(...decoration.range),
      options: { inlineClassName: decoration.className },
    }));

    if (decorations.current === null) {
      decorations.current = instance.createDecorationsCollection(next);
    } else {
      decorations.current.set(next);
    }
  }, [text, scope, eventId, editorRef]);

  const { hover, keepOpen, release, close } = useVariableHover(editorRef, text);

  return (
    <PayloadEditorSurface
      containerRef={containerRef}
      hasSelection={hasSelection}
      hover={hover}
      environmentId={environmentId}
      onCut={() => {
        cutSelection(editorRef);
      }}
      onCopy={() => {
        copySelection(editorRef);
      }}
      onPaste={() => {
        pasteClipboard(editorRef);
      }}
      onCloseHover={close}
      onKeepHover={keepOpen}
      onReleaseHover={release}
    />
  );
}
