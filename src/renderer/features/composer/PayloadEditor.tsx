import { useEffect, useState } from 'react';
import type { VariableScope } from '@shared/variables/resolve.js';
import { useMonacoEditor } from '@/shared/monaco/useMonacoEditor.js';
import { useVariableHover } from '@/shared/monaco/useVariableHover.js';
import { copySelection, cutSelection, pasteClipboard } from './editorClipboard.js';
import { PayloadEditorSurface } from './PayloadEditorSurface.js';
import { usePayloadModel } from './usePayloadModel.js';

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
 * mounted anywhere. It owns the instance and the selection; the document inside
 * it belongs to `usePayloadModel`.
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
  // Mirrored into state rather than read off the editor while rendering: the
  // context menu has to know whether there is anything to copy before it opens,
  // and a ref cannot be read during render.
  const [hasSelection, setHasSelection] = useState(false);

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

  usePayloadModel(editorRef, { eventId, text, language, scope }, onChange);
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
