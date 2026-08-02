import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Panel } from '@/shared/ui/Panel.js';
import { SplitPane } from '@/shared/ui/SplitPane.js';
import { useStore } from '@/store/index.js';
import { selectActivityFor } from '@/store/selectors.js';
import { ActivityDetail } from './ActivityDetail.js';
import { ActivityList } from './ActivityList.js';
import { ActivityToolbar } from './ActivityToolbar.js';
import { useActivityFilter } from './useActivityFilter.js';

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
  const setActivityQuery = useStore((state) => state.setActivityQuery);

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
  const visible = useActivityFilter(records, query);
  // The origin is the first record of the connection, not of the filtered view,
  // so offsets stay comparable while the user types in the search box.
  const origin = records[0]?.at ?? 0;
  const selected = records.find((record) => record.id === selectedId) ?? null;

  const list = (
    <ActivityList records={visible} origin={origin} selectedId={selectedId} onSelect={select} />
  );

  return (
    <Panel
      title="Actividad"
      actions={
        <ActivityToolbar
          query={query}
          dropped={dropped}
          onQueryChange={setActivityQuery}
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
          <ActivityDetail record={selected} onClose={closeDetail} />
        </SplitPane>
      )}
    </Panel>
  );
}
