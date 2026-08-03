import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  CaretDownIcon,
  CheckIcon,
  DuplicateIcon,
  ExportIcon,
  PlusIcon,
  RenameIcon,
  TrashIcon,
} from '@/shared/ui/icons.js';
import { Button } from '@/shared/ui/Button.js';
import { Menu, type MenuGroup, type MenuItem } from '@/shared/ui/Menu.js';
import { InlineNameInput } from '@/shared/ui/InlineNameInput.js';
import { useStore } from '@/store/index.js';
import { WorkspaceDialogs, type WorkspaceDialog } from './WorkspaceDialogs.js';
import { useAsyncApiExport } from './useAsyncApiExport.js';
import { useWorkspaceList } from './useWorkspaceList.js';

/** The pill top-left: which workspace is open, and everything you can do to it. */
export function WorkspaceMenu() {
  const { id, name } = useStore(
    useShallow((state) => ({
      id: state.workspace?.id ?? null,
      name: state.workspace?.name ?? 'Sin workspace',
    })),
  );
  const setWorkspaceName = useStore((state) => state.setWorkspaceName);
  const list = useWorkspaceList();
  const exportAsyncApi = useAsyncApiExport();

  const [dialog, setDialog] = useState<WorkspaceDialog>(null);
  const [renaming, setRenaming] = useState(false);

  const actions: MenuItem[] = [
    {
      label: 'Nuevo workspace',
      icon: <PlusIcon />,
      onSelect: () => {
        setDialog('create');
      },
    },
    {
      label: 'Renombrar',
      icon: <RenameIcon />,
      onSelect: () => {
        setRenaming(true);
      },
    },
    {
      label: 'Duplicar',
      icon: <DuplicateIcon />,
      onSelect: () => {
        setDialog('duplicate');
      },
    },
    {
      label: 'Exportar como AsyncAPI',
      icon: <ExportIcon />,
      onSelect: exportAsyncApi,
    },
    {
      label: 'Eliminar',
      icon: <TrashIcon />,
      tone: 'danger',
      onSelect: () => {
        setDialog('delete');
      },
    },
  ];

  // The open workspace is marked with a tick in the slot every item reserves,
  // rather than by a radio role: one item type keeps the arrow keys uniform.
  const workspaces: MenuGroup = {
    label: 'Workspaces',
    items: list.summaries.map((summary) => ({
      label: summary.name,
      icon: summary.id === id ? <CheckIcon /> : undefined,
      onSelect: () => {
        if (summary.id !== id) void list.open(summary.id);
      },
    })),
  };

  return (
    <div className="relative flex">
      {renaming ? (
        <InlineNameInput
          value={name}
          label="Nombre del workspace"
          onCommit={(value) => {
            setWorkspaceName(value);
            setRenaming(false);
          }}
          onCancel={() => {
            setRenaming(false);
          }}
        />
      ) : (
        <Menu
          label="Workspace"
          align="start"
          // Both blocks use groups so the switcher reads before admin actions.
          items={[]}
          groups={[workspaces, { items: actions }]}
          // Fetch on open so keyboard and pointer users see the same fresh list.
          onOpenChange={(open) => {
            if (open) list.refresh();
          }}
          trigger={
            <Button className="max-w-72 gap-2 bg-control px-2" aria-label="Workspace">
              <span className="overflow-hidden text-ellipsis whitespace-nowrap">{name}</span>
              <CaretDownIcon />
            </Button>
          }
        />
      )}

      <WorkspaceDialogs
        dialog={dialog}
        workspaceName={name}
        onCreate={(value) => {
          void list.create(value);
        }}
        onDuplicate={(value) => {
          void list.duplicate(value);
        }}
        onRemove={list.remove}
        onClose={() => {
          setDialog(null);
        }}
      />
    </div>
  );
}
