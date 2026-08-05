import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { ActivityRecord } from '@shared/ipc/activity.js';
import { bridge } from '@/ipc/bridge.js';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog.js';
import { Panel } from '@/shared/ui/Panel.js';
import { SplitPane } from '@/shared/ui/SplitPane.js';
import { useStore } from '@/store/index.js';
import { selectActivityFor } from '@/store/selectors.js';
import { ActivityDetail } from './ActivityDetail.js';
import { ActivityList } from './ActivityList.js';
import { ActivityToolbar } from './ActivityToolbar.js';
import { copyText, type CopyScope } from './copy-text.js';
import { useActivityFilter } from './useActivityFilter.js';
import { useActivityResend } from './useActivityResend.js';

type Props = { connectionId: string };

/** The only file in this feature that reads the store. Children take props. */
export function ActivityPanel({ connectionId }: Props) {
  const records = useStore(selectActivityFor(connectionId));
  const { query, selectedId, dropped } = useStore(
    useShallow((state) => ({
      query: state.activityQuery,
      selectedId: state.selectedActivityByConnection[connectionId] ?? null,
      dropped: state.states[connectionId] === 'dropped',
    })),
  );
  // Its own subscription: the reference only changes when a kind is toggled, so
  // the filter memo is not invalidated by anything else the panel reads.
  const hidden = useStore((state) => state.hiddenActivityKinds);
  const setActivityQuery = useStore((state) => state.setActivityQuery);
  const toggleActivityKind = useStore((state) => state.toggleActivityKind);
  const replay = useActivityResend(connectionId);

  // Read through `getState()` so the callback identity survives every batch and
  // the memoized rows are not repainted by an unrelated append. Clicking the
  // marked line again unmarks it, which is the only way back to a full-height log.
  const select = useCallback(
    (activityId: string) => {
      const state = useStore.getState();
      const current = state.selectedActivityByConnection[connectionId] ?? null;
      state.setSelectedActivity(connectionId, current === activityId ? null : activityId);
    },
    [connectionId],
  );

  const clear = useCallback(() => {
    useStore.getState().clearActivity(connectionId);
  }, [connectionId]);

  const closeDetail = useCallback(() => {
    useStore.getState().setSelectedActivity(connectionId, null);
  }, [connectionId]);

  // Newest first, which is the order the hook hands back.
  const visible = useActivityFilter(records, query, hidden);
  // The origin is the first record of the connection, not of the filtered view,
  // so offsets stay comparable while the user types in the search box.
  const origin = records[0]?.at ?? 0;
  // Guarded rather than searched unconditionally: with nothing marked there is
  // nothing to find, and this runs again for every batch the socket delivers.
  const selected =
    selectedId === null ? null : records.find((record) => record.id === selectedId) ?? null;

  // The renderer has no clipboard of its own — the CSP denies the permission —
  // so the text goes to the main process, which owns the system one. `origin` is
  // the only dependency, and it already re-renders every row when it moves.
  const copy = useCallback(
    (record: ActivityRecord, scope: CopyScope) => {
      void bridge.clipboard.writeText(copyText(record, scope, origin));
    },
    [origin],
  );

  const list = (
    <ActivityList
      records={visible}
      origin={origin}
      selectedId={selectedId}
      onSelect={select}
      onCopy={copy}
      onResend={replay.resend}
      canResend={replay.canResend}
    />
  );

  return (
    <Panel
      title="Actividad"
      actions={
        <ActivityToolbar
          query={query}
          dropped={dropped}
          hidden={hidden}
          onQueryChange={setActivityQuery}
          onToggleKind={toggleActivityKind}
          onClear={clear}
        />
      }
    >
      {/* The detail pane is created by the selection and disappears with it, so
          an unread log keeps the whole panel instead of half of it. */}
      {selected === null ? (
        list
      ) : (
        <SplitPane direction="column" initial={40} min={15}>
          {list}
          <ActivityDetail
            record={selected}
            onClose={closeDetail}
            onCopy={() => {
              copy(selected, 'body');
            }}
            onResend={() => {
              replay.resend(selected);
            }}
            canResend={replay.canResend}
          />
        </SplitPane>
      )}
      <ConfirmDialog
        open={replay.pending !== null}
        title="Reemplazar el borrador"
        message="El composer tiene cambios sin guardar. Cargar este frame los descarta."
        confirmLabel="Reemplazar"
        onConfirm={replay.confirm}
        onClose={replay.dismiss}
      />
    </Panel>
  );
}
