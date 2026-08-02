import { useCallback, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { treeKeyAction, type TreeRow } from './treeKeyboard.js';

type Options = {
  rows: TreeRow[];
  collapsed: Record<string, true>;
  onToggle: (collectionId: string) => void;
  onOpen: (itemId: string) => void;
  onRename: (row: TreeRow) => void;
  onDelete: (row: TreeRow) => void;
};

type Tree = {
  containerRef: RefObject<HTMLDivElement | null>;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  /** Roving tabindex: exactly one row is tabbable, so Tab leaves the tree. */
  tabIndexFor: (id: string) => 0 | -1;
};

/**
 * Runs what `treeKeyAction` decided. Focus is moved by looking the row up in the
 * DOM rather than by an effect on `activeId`: the row that must receive focus is
 * known at the moment the key is handled, and an effect would also steal focus
 * back whenever the tree re-rendered for an unrelated reason.
 */
export function useTreeKeyboard({
  rows,
  collapsed,
  onToggle,
  onOpen,
  onRename,
  onDelete,
}: Options): Tree {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      // A rename field lives inside a row; its own keys are not the tree's.
      if (event.target instanceof HTMLInputElement) return;

      const current = activeId ?? rows[0]?.id ?? null;
      const action = treeKeyAction(rows, collapsed, current, event.key);
      if (action === null) return;
      event.preventDefault();

      if (action.type === 'focus') {
        setActiveId(action.id);
        containerRef.current?.querySelector<HTMLElement>(`[data-row-id="${action.id}"]`)?.focus();
        return;
      }

      const row = rows.find((entry) => entry.id === action.id);
      if (row === undefined) return;

      if (action.type === 'toggle') onToggle(action.id);
      if (action.type === 'open') onOpen(action.id);
      if (action.type === 'rename') onRename(row);
      if (action.type === 'delete') onDelete(row);
    },
    [activeId, collapsed, onDelete, onOpen, onRename, onToggle, rows],
  );

  const tabIndexFor = useCallback(
    (id: string): 0 | -1 => {
      const current = activeId ?? rows[0]?.id ?? null;
      return id === current ? 0 : -1;
    },
    [activeId, rows],
  );

  // `activeId` stays inside: the roving tabindex is what callers read it
  // through, and exposing it only invited a second source of truth.
  return { containerRef, onKeyDown, tabIndexFor };
}
