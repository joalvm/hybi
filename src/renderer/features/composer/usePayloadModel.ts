import { useEffect, useRef, type RefObject } from 'react';
import type { editor } from 'monaco-editor/editor/editor.api.js';
import type { VariableScope } from '@shared/variables/resolve.js';
import { monaco } from '@/shared/monaco/setup.js';
import { modelFor } from '@/shared/monaco/useMonacoEditor.js';
import { decorationsFor } from '@/shared/monaco/useVariableDecorations.js';

export type PayloadModelInput = {
  eventId: string | null;
  text: string;
  /** Monaco's language id, chosen by the format picker in the footer. */
  language: string;
  scope: VariableScope;
};

/**
 * Everything about the document an editor is showing: which model, in which
 * language, holding which text, marked up with which variables. The instance
 * itself belongs to the component; this owns what is inside it.
 */
export function usePayloadModel(
  editorRef: RefObject<editor.IStandaloneCodeEditor | null>,
  { eventId, text, language, scope }: PayloadModelInput,
  onChange: (next: string) => void,
): void {
  // The change subscription is registered once, so it reads the latest handler
  // through a ref instead of being torn down whenever the parent re-renders.
  const onChangeRef = useRef(onChange);
  // Raised around every programmatic write so `setModel` and `setValue` do not
  // echo back through `onChange` as if the user had typed.
  const programmatic = useRef(false);
  // The last text this editor sent upwards. When the store hands that same text
  // straight back, the model is already holding it and the reconcile below can
  // skip reading the whole document out of Monaco just to compare it — which on
  // a large payload was a full copy of it per keystroke.
  const echoed = useRef<string | null>(null);
  const decorations = useRef<editor.IEditorDecorationsCollection | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const instance = editorRef.current;
    if (instance === null) return;
    const subscription = instance.onDidChangeModelContent(() => {
      if (programmatic.current) return;
      const next = instance.getValue();
      echoed.current = next;
      onChangeRef.current(next);
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
    // A value typed into the previous event says nothing about this one.
    echoed.current = null;
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
    // Anything this editor just typed is skipped — the model already has it.
    if (echoed.current === text) {
      echoed.current = null;
    } else if (model.getValue() !== text) {
      echoed.current = null;
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
}
