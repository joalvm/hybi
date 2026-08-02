import { ConfirmDialog } from '@/shared/ui/ConfirmDialog.js';
import { NameDialog } from '@/shared/ui/NameDialog.js';

export type WorkspaceDialog = 'create' | 'duplicate' | 'delete' | null;

type Props = {
  dialog: WorkspaceDialog;
  workspaceName: string;
  onCreate: (name: string) => void;
  onDuplicate: (name: string) => void;
  onRemove: () => void;
  onClose: () => void;
};

/** Dialogs stay separate so the switcher remains a small piece of app chrome. */
export function WorkspaceDialogs({
  dialog,
  workspaceName,
  onCreate,
  onDuplicate,
  onRemove,
  onClose,
}: Props) {
  if (dialog === 'create' || dialog === 'duplicate') {
    return (
      <NameDialog
        open
        title={dialog === 'create' ? 'Nuevo workspace' : 'Duplicar workspace'}
        initial={dialog === 'create' ? '' : `${workspaceName} (copia)`}
        onSubmit={(value) => {
          if (dialog === 'create') onCreate(value);
          else onDuplicate(value);
          onClose();
        }}
        onClose={onClose}
      />
    );
  }

  if (dialog !== 'delete') return null;
  return (
    <ConfirmDialog
      open
      title="Eliminar workspace"
      message={`¿Eliminar "${workspaceName}" con sus entornos, conexiones y catálogo? No se puede deshacer.`}
      onConfirm={() => {
        onRemove();
        onClose();
      }}
      onClose={onClose}
    />
  );
}
