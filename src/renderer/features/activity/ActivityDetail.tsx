import { useEffect, useMemo } from 'react';
import type { ActivityRecord } from '@shared/ipc/activity.js';
import { modelFor, useMonacoEditor } from '@/shared/monaco/useMonacoEditor.js';
import { CloseIcon, DuplicateIcon, SendIcon } from '@/shared/ui/icons.js';
import { IconButton } from '@/shared/ui/IconButton.js';
import { KIND_LABEL } from './copy-text.js';

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

type Props = {
  record: ActivityRecord;
  onClose: () => void;
  onCopy: () => void;
  onResend: () => void;
  /** False while no event is open: the composer would have nowhere to put it. */
  canResend: boolean;
};

/** Mounted by a selection: the parent renders nothing while no line is marked. */
export function ActivityDetail({ record, onClose, onCopy, onResend, canResend }: Props) {
  const { containerRef, editorRef } = useMonacoEditor({
    readOnly: true,
    lineNumbers: 'off',
  });

  // Memoized on the body: the panel above re-renders on every batch the socket
  // delivers, and re-parsing plus re-printing the marked frame sixty times a
  // second is work whose result never changes.
  const body = useMemo(() => pretty(record.body), [record.body]);

  useEffect(() => {
    const instance = editorRef.current;
    if (instance === null) return;
    const model = modelFor(MODEL_KEY, body);
    if (instance.getModel() !== model) instance.setModel(model);
    if (model.getValue() !== body) model.setValue(body);
  }, [body, editorRef]);

  return (
    <div className="flex h-full min-h-0 flex-col" data-testid="activity-detail">
      <header className="flex items-center gap-3 px-3 py-2 text-label">
        <span>{KIND_LABEL[record.kind]}</span>
        <span className="text-muted">{String(record.bytes)} B</span>
        <span className="text-muted">{new Date(record.at).toLocaleTimeString('es')}</span>
        <IconButton
          className="ml-auto"
          label="Reenviar al composer"
          disabled={!canResend}
          onClick={onResend}
        >
          <SendIcon />
        </IconButton>
        {/* The frame as it arrived, not the indented copy on screen: what the
            socket carried is what a report or a replay needs. */}
        <IconButton label="Copiar el frame" onClick={onCopy}>
          <DuplicateIcon />
        </IconButton>
        {/* Clicking the marked line again also closes the pane, but that is not
            discoverable — the pane has to carry its own way out. */}
        <IconButton label="Cerrar detalle" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </header>
      <div className="min-h-0 flex-1" ref={containerRef} />
    </div>
  );
}
