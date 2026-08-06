import { useCallback, useState } from 'react';
import { format, plural } from '@lang/translate.js';
import { createCollection, createEventItem } from '@shared/domain/factory.js';
import type { Collection, EventItem } from '@shared/domain/types.js';
import { useMessages } from '@/shared/i18n/useMessages.js';
import { useStore } from '@/store/index.js';

/** The only dialog left in the catalog: deleting is the one act worth stopping for. */
export type CatalogConfirm = { title: string; message: string; confirm: () => void };

/** Row callbacks bundled so the tree forwards one prop instead of a dozen. */
export type CatalogRowActions = {
  collections: Collection[];
  rename: (itemId: string) => void;
  commitRename: (itemId: string, name: string) => void;
  cancelRename: () => void;
  duplicate: (item: EventItem) => void;
  remove: (item: EventItem) => void;
  move: (itemId: string, collectionId: string) => void;
  createIn: (collectionId: string) => void;
  renameCollection: (collection: Collection) => void;
  commitRenameCollection: (collectionId: string, name: string) => void;
  removeCollection: (collection: Collection) => void;
};

/**
 * The lowest free number for a prefix, so deleting the third one frees the name
 * again. Matching is anchored: an event a user called "New Event of mine" is a
 * name, not a placeholder, and must not take a number out of the sequence.
 *
 * The prefix comes from the catalog, so it is written in the language the app is
 * being read in — and the rows created under another one keep their own names.
 */
function nextName(names: readonly string[], prefix: string): string {
  const numbered = new RegExp(`^${prefix} (\\d+)$`);
  const taken = new Set(
    names
      .map((name) => numbered.exec(name)?.[1])
      .filter((digits): digits is string => digits !== undefined)
      .map(Number),
  );
  let index = 1;
  while (taken.has(index)) index += 1;
  return `${prefix} ${String(index)}`;
}

/**
 * Every catalog mutation the UI can trigger. Nothing here opens a form: an event
 * and a collection are both created already named and already selected, with the
 * name under the caret — a dialog only ever asked for a string the row can hold
 * itself. Callbacks are memoized because `CatalogItem` is memoized: a new
 * function identity per render would repaint every row in the tree.
 */
export function useCatalogActions(connectionId: string) {
  const messages = useMessages().catalog;
  const upsertEventItem = useStore((state) => state.upsertEventItem);
  const removeEventItem = useStore((state) => state.removeEventItem);
  const upsertCollection = useStore((state) => state.upsertCollection);
  const removeCollectionFromStore = useStore((state) => state.removeCollection);
  const moveEventItem = useStore((state) => state.moveEventItem);
  const setSelectedEvent = useStore((state) => state.setSelectedEvent);

  const [confirm, setConfirm] = useState<CatalogConfirm | null>(null);
  /**
   * The row whose name is being typed — an event or a collection, never both at
   * once, so one id covers the tree. View state, so it never persists.
   */
  const [renamingId, setRenamingId] = useState<string | null>(null);

  const close = useCallback(() => {
    setConfirm(null);
  }, []);

  const ask = useCallback((title: string, message: string, run: () => void) => {
    setConfirm({
      title,
      message,
      confirm: () => {
        run();
        setConfirm(null);
      },
    });
  }, []);

  /**
   * Creating is one click: the row appears named and selected, with its name
   * under the caret and an empty payload open in the composer. The search box is
   * cleared because a filtered tree would swallow the row that was just made.
   */
  const createIn = useCallback(
    (collectionId: string) => {
      const store = useStore.getState();
      const items = store.workspace?.catalog.items ?? [];
      const item = createEventItem({
        name: nextName(
          items.map((entry) => entry.name),
          messages.newEventPrefix,
        ),
        collectionId,
      });
      store.setCatalogQuery('');
      upsertEventItem(item);
      setSelectedEvent(connectionId, item.id);
      setRenamingId(item.id);
    },
    [connectionId, messages.newEventPrefix, setSelectedEvent, upsertEventItem],
  );

  const rename = useCallback((itemId: string) => {
    setRenamingId(itemId);
  }, []);

  const cancelRename = useCallback(() => {
    setRenamingId(null);
  }, []);

  const commitRename = useCallback(
    (itemId: string, name: string) => {
      setRenamingId(null);
      const item = useStore
        .getState()
        .workspace?.catalog.items.find((entry) => entry.id === itemId);
      if (item === undefined || item.name === name) return;
      // Spread over the item so `source` and an imported `schema` survive:
      // renaming an AsyncAPI event must not downgrade it to manual.
      upsertEventItem({ ...item, name });
    },
    [upsertEventItem],
  );

  const duplicateItem = useCallback(
    (item: EventItem) => {
      // A copy describes the same wire contract, so it keeps `schema` and
      // `source`. Only identity changes.
      upsertEventItem({
        ...item,
        id: globalThis.crypto.randomUUID(),
        name: format(messages.copySuffix, { name: item.name }),
      });
    },
    [messages.copySuffix, upsertEventItem],
  );

  const deleteItem = useCallback(
    (item: EventItem) => {
      ask(
        messages.deleteEvent.title,
        format(messages.deleteEvent.message, { name: item.name }),
        () => {
          removeEventItem(item.id);
        },
      );
    },
    [ask, messages.deleteEvent, removeEventItem],
  );

  /** The collection twin of `createIn`: named, listed and open for editing. */
  const createNewCollection = useCallback(() => {
    const store = useStore.getState();
    const collections = store.workspace?.catalog.collections ?? [];
    const collection = createCollection(
      nextName(
        collections.map((entry) => entry.name),
        messages.newCollectionPrefix,
      ),
    );
    store.setCatalogQuery('');
    upsertCollection(collection);
    setRenamingId(collection.id);
  }, [messages.newCollectionPrefix, upsertCollection]);

  const renameCollection = useCallback((collection: Collection) => {
    setRenamingId(collection.id);
  }, []);

  const commitRenameCollection = useCallback(
    (collectionId: string, name: string) => {
      setRenamingId(null);
      const collection = useStore
        .getState()
        .workspace?.catalog.collections.find((entry) => entry.id === collectionId);
      if (collection === undefined || collection.name === name) return;
      upsertCollection({ ...collection, name });
    },
    [upsertCollection],
  );

  const deleteCollection = useCallback(
    (collection: Collection) => {
      const items = useStore.getState().workspace?.catalog.items ?? [];
      const count = items.filter((entry) => entry.collectionId === collection.id).length;
      // The count is the whole point of the prompt: events cannot survive their
      // collection, so this says how much is about to go.
      ask(
        messages.deleteCollection.title,
        plural(messages.deleteCollection.message, count, { name: collection.name }),
        () => {
          removeCollectionFromStore(collection.id);
        },
      );
    },
    [ask, messages.deleteCollection, removeCollectionFromStore],
  );

  return {
    confirm,
    renamingId,
    close,
    createIn,
    rename,
    commitRename,
    cancelRename,
    duplicateItem,
    deleteItem,
    createCollection: createNewCollection,
    renameCollection,
    commitRenameCollection,
    deleteCollection,
    moveItem: moveEventItem,
  };
}
