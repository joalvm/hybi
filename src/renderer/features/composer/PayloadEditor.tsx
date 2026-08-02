import { useEffect, useRef, useState } from 'react';
import type { editor } from 'monaco-editor/editor/editor.api.js';
import type { VariableScope } from '@shared/variables/resolve.js';
import { VariablePopover } from '@/features/workspace/VariablePopover.js';
import { bridge } from '@/ipc/bridge.js';
import { ContextMenu } from '@/shared/ui/ContextMenu.js';
import { DuplicateIcon, PasteIcon } from '@/shared/ui/icons.js';
import { monaco } from '@/shared/monaco/setup.js';
import { modelFor, useMonacoEditor } from '@/shared/monaco/useMonacoEditor.js';
import { decorationsFor } from '@/shared/monaco/useVariableDecorations.js';
import { useVariableHover } from '@/shared/monaco/useVariableHover.js';

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

  const selectedText = (): string => {
    const instance = editorRef.current;
    const selection = instance?.getSelection() ?? null;
    if (instance === null || selection === null || selection.isEmpty()) return '';
    return instance.getModel()?.getValueInRange(selection) ?? '';
  };

  // Both go through the main process: the renderer is denied every permission
  // by the security policy, so `navigator.clipboard` is not available to it.
  const copy = (): void => {
    void bridge.clipboard.writeText(selectedText());
  };

  const paste = (): void => {
    void bridge.clipboard.readText().then((clipboardText) => {
      const instance = editorRef.current;
      const selection = instance?.getSelection() ?? null;
      if (instance === null || selection === null) return;
      // `executeEdits` rather than `setValue`: it keeps the undo stack, which is
      // the whole point of pasting into an editor instead of a textarea.
      instance.executeEdits('paste', [
        { range: selection, text: clipboardText, forceMoveMarkers: true },
      ]);
      instance.focus();
    });
  };

  return (
    <>
      <ContextMenu
        label="Acciones del editor"
        items={[
          {
            label: 'Copiar',
            icon: <DuplicateIcon />,
            disabled: !hasSelection,
            onSelect: copy,
          },
          { label: 'Pegar', icon: <PasteIcon />, onSelect: paste },
        ]}
      >
        <div className="payload-editor" ref={containerRef} data-testid="payload-editor" />
      </ContextMenu>
      {hover !== null && (
        <VariablePopover
          // A remount per token, so the field is seeded from the store rather
          // than carrying the value of whatever was pointed at before.
          key={hover.name}
          name={hover.name}
          environmentId={environmentId}
          anchor={hover.anchor}
          onClose={close}
          onPointerEnter={keepOpen}
          onPointerLeave={release}
        />
      )}
    </>
  );
}
