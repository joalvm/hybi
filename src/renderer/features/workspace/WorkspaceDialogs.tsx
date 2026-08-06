import { format } from '@lang/translate.js';
import { useMessages } from '@/shared/i18n/useMessages.js';
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
  const messages = useMessages().workspace;

  if (dialog === 'create' || dialog === 'duplicate') {
    return (
      <NameDialog
        open
        title={dialog === 'create' ? messages.new : messages.duplicate.title}
        initial={
          dialog === 'create'
            ? ''
            : format(messages.duplicate.copySuffix, { name: workspaceName })
        }
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
      title={messages.delete.title}
      message={format(messages.delete.message, { name: workspaceName })}
      onConfirm={() => {
        onRemove();
        onClose();
      }}
      onClose={onClose}
    />
  );
}
