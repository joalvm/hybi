import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { VariableScope } from '@shared/variables/resolve.js';
import { bridge } from '@/ipc/bridge.js';
import { registerVariableProviders } from '@/shared/monaco/setup.js';
import { Panel } from '@/shared/ui/Panel.js';
import { useStore } from '@/store/index.js';
import { selectCollectionNameFor, selectScopeFor, selectSelectedEvent } from '@/store/selectors.js';
import { ComposerBreadcrumb } from './ComposerBreadcrumb.js';
import { ComposerFooter } from './ComposerFooter.js';
import { ComposerTabs, type ComposerTab } from './ComposerTabs.js';
import { DocsView } from './DocsView.js';
import { beautify, languageOf, type PayloadFormat } from './formats.js';
import { PayloadEditor } from './PayloadEditor.js';
import { SendButton } from './SendButton.js';
import { useComposerDraft } from './useComposerDraft.js';
import { useSaveShortcut } from './useSaveShortcut.js';

/** A module constant so the hover provider keeps a stable empty scope. */
const EMPTY_SCOPE: VariableScope = new Map();

type Props = { connectionId: string };

/** The only file in this feature that reads the store. Children take props. */
export function ComposerPanel({ connectionId }: Props) {
  const draft = useComposerDraft(connectionId);
  const event = useStore(selectSelectedEvent(connectionId));
  const collection = useStore(selectCollectionNameFor(connectionId));
  const scope = useStore(useShallow(selectScopeFor(connectionId)));
  const connected = useStore((state) => state.states[connectionId] === 'open');
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

  // Monaco's hover and completion providers are global, so they read the scope
  // of whatever connection is active at call time rather than closing over one.
  useEffect(() => {
    registerVariableProviders(() => {
      const state = useStore.getState();
      const activeId = state.activeConnectionId;
      return activeId === null ? EMPTY_SCOPE : selectScopeFor(activeId)(state);
    });
  }, []);

  useSaveShortcut(draft.dirty, draft.save);

  // Computed rather than attempted on click: the result is what says whether
  // the button has anything to do, so it decides its own disabled state.
  const beautified = useMemo(() => beautify(draft.text, format), [draft.text, format]);

  const send = (): void => {
    void bridge.ws.send({ connectionId, text: draft.resolved }).catch((cause: unknown) => {
      console.error(cause);
    });
  };

  if (event === null) {
    return (
      <Panel title="Payload">
        <p className="app-state">Selecciona un evento del catálogo.</p>
      </Panel>
    );
  }

  // Not a `Panel`: this one is headed by a breadcrumb and a tab strip rather
  // than by a title, which is the whole point of the change.
  return (
    <section className="panel">
      <ComposerBreadcrumb collection={collection} event={event.name} />
      <div className="composer-tabbar">
        <ComposerTabs tab={tab} dirty={draft.dirty} onChange={setTab} />
        <SendButton connected={connected} empty={draft.empty} onSend={send} />
      </div>
      <div className="panel-body">
        {tab === 'docs' && <DocsView description={event.description} />}
        {/* Hidden rather than unmounted: Monaco keeps one instance for the life
            of the panel, and `automaticLayout` measures it again when it comes
            back. Remounting per tab would rebuild the editor on every switch. */}
        <div className={clsx('composer', tab !== 'message' && 'composer--hidden')}>
          <PayloadEditor
            eventId={draft.eventId}
            text={draft.text}
            language={languageOf(format)}
            scope={scope}
            environmentId={environmentId}
            onChange={draft.setText}
          />
          <ComposerFooter
            format={format}
            beautified={beautified}
            onFormatChange={setFormat}
            onBeautify={() => {
              if (beautified !== null) draft.setText(beautified);
            }}
          />
        </div>
      </div>
    </section>
  );
}
