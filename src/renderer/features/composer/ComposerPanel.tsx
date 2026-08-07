import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useMessages } from '@/shared/i18n/useMessages.js';
import { Panel } from '@/shared/ui/Panel.js';
import { useStore } from '@/store/index.js';
import { selectCollectionNameFor, selectScopeFor, selectSelectedEvent } from '@/store/selectors.js';
import { ComposerBreadcrumb } from './ComposerBreadcrumb.js';
import { ComposerMessage } from './ComposerMessage.js';
import { ComposerTabs, type ComposerTab } from './ComposerTabs.js';
import { DocsView } from './DocsView.js';
import { beautify, canBeautify, type PayloadFormat } from './formats.js';
import { SendButton } from './SendButton.js';
import { useBinaryPayload } from './useBinaryPayload.js';
import { useComposerDraft } from './useComposerDraft.js';
import { useDocsDraft } from './useDocsDraft.js';
import { useSendMessage } from './useSendMessage.js';
import { useSaveShortcut } from './useSaveShortcut.js';
import { useVariableProviders } from './useVariableProviders.js';

type Props = { connectionId: string };

/** The only file in this feature that reads the store. Children take props. */
export function ComposerPanel({ connectionId }: Props) {
  const messages = useMessages().composer;
  const draft = useComposerDraft(connectionId);
  const event = useStore(selectSelectedEvent(connectionId));
  const docs = useDocsDraft(event);
  const collection = useStore(selectCollectionNameFor(connectionId));
  const scope = useStore(useShallow(selectScopeFor(connectionId)));
  const connected = useStore((state) => state.states[connectionId] === 'open');
  const appendLocalError = useStore((state) => state.appendLocalError);
  const transportKind = useStore(
    (state) =>
      state.workspace?.connections.find((entry) => entry.id === connectionId)?.transport.kind ??
      null,
  );
  // The editor's variable popover writes into this environment, the same one
  // the scope above was resolved against.
  const environmentId = useStore(
    (state) =>
      state.workspace?.connections.find((entry) => entry.id === connectionId)?.environmentId ??
      null,
  );
  // How to read the box, not what may go in it. Both ride in local state because
  // they describe the view, not the event: nothing about them is worth persisting.
  const [format, setFormat] = useState<PayloadFormat>('json');
  const [tab, setTab] = useState<ComposerTab>('message');
  const [editingDocs, setEditingDocs] = useState(false);
  const binary = useBinaryPayload(draft.resolved, format === 'binary');

  // Binary mode sends the bytes the payload spells, not the spelling; every
  // other format sends the resolved text exactly as written.
  const outgoing =
    format === 'binary'
      ? { body: binary.payload?.body ?? '', encoding: 'base64' as const }
      : { body: draft.resolved, encoding: 'text' as const };
  const empty = format === 'binary' ? (binary.payload?.bytes ?? 0) === 0 : draft.empty;
  const send = useSendMessage({
    connectionId,
    transportKind,
    body: outgoing.body,
    encoding: outgoing.encoding,
    appendLocalError,
  });

  useVariableProviders();

  const saveActiveDraft = (): void => {
    if (tab === 'docs' && editingDocs) {
      if (docs.dirty) docs.save();
      return;
    }
    draft.save();
  };
  useSaveShortcut(tab === 'docs' && editingDocs ? docs.dirty : draft.dirty, saveActiveDraft);

  // Only the answer, not the formatted text: this is recomputed on every
  // keystroke, and the payload is re-indented once, on the click that wants it.
  const formattable = useMemo(() => canBeautify(draft.text, format), [draft.text, format]);

  if (event === null) {
    return (
      <Panel title={messages.title}>
        <p className="p-3 text-muted">{messages.noEvent}</p>
      </Panel>
    );
  }

  // Not a `Panel`: this one is headed by a breadcrumb and a tab strip rather
  // than by a title, which is the whole point of the change.
  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-panel">
      <ComposerBreadcrumb collection={collection} event={event.name} />
      <div className="flex items-center gap-2 p-2">
        <ComposerTabs
          tab={tab}
          docsDirty={docs.dirty}
          messageDirty={draft.dirty}
          onChange={setTab}
        />
        <SendButton connected={connected} empty={empty} onSend={send} />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden" data-part="panel-body">
        <div className={clsx('h-full min-h-0', tab !== 'docs' && 'hidden')}>
          <DocsView
            eventId={event.id}
            description={event.description}
            text={docs.text}
            editing={editingDocs}
            onEdit={() => {
              setEditingDocs(true);
            }}
            onClose={() => {
              setEditingDocs(false);
            }}
            onChange={docs.setText}
          />
        </div>
        {/* Hidden rather than unmounted: Monaco keeps one instance for the life
            of the panel, and `automaticLayout` measures it again when it comes
            back. Remounting per tab would rebuild the editor on every switch. */}
        <div className={clsx('h-full min-h-0', tab !== 'message' && 'hidden')}>
          <ComposerMessage
            eventId={draft.eventId}
            text={draft.text}
            scope={scope}
            environmentId={environmentId}
            format={format}
            formattable={formattable}
            binary={binary}
            onChange={draft.setText}
            onFormatChange={setFormat}
            onBeautify={() => {
              const beautified = beautify(draft.text, format);
              if (beautified !== null) draft.setText(beautified);
            }}
          />
        </div>
      </div>
    </section>
  );
}
