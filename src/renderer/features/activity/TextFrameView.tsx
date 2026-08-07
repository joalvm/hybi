import { useEffect, useMemo } from 'react';
import { modelFor, useMonacoEditor } from '@/shared/monaco/useMonacoEditor.js';

/** One model for the whole pane: the detail is a viewer, not an editor. */
const MODEL_KEY = 'activity:detail';

/** Pretty-printed when it parses, verbatim when it does not. */
function pretty(body: string): string {
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}

type Props = { body: string };

/** The frame as text, indented when it is JSON and left alone when it is not. */
export function TextFrameView({ body }: Props) {
  const { containerRef, editorRef } = useMonacoEditor({
    readOnly: true,
    lineNumbers: 'off',
  });

  // Memoized on the body: the panel above re-renders on every batch the socket
  // delivers, and re-parsing plus re-printing the marked frame sixty times a
  // second is work whose result never changes.
  const text = useMemo(() => pretty(body), [body]);

  useEffect(() => {
    const instance = editorRef.current;
    if (instance === null) return;
    const model = modelFor(MODEL_KEY, text);
    if (instance.getModel() !== model) instance.setModel(model);
    if (model.getValue() !== text) model.setValue(text);
  }, [text, editorRef]);

  return <div className="h-full" ref={containerRef} />;
}
