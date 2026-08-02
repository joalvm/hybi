import { AlertDialog } from 'radix-ui';
import { CloseIcon } from './icons.js';
import { IconButton } from './IconButton.js';

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
};

/**
 * Every destructive action goes through here, so none of them can skip the
 * prompt. It cannot be dismissed by clicking outside; the close control maps
 * to Cancelar, so the answer remains an explicit choice.
 *
 * Note: Radix's AlertDialog.Action is DialogPrimitive.Close, so confirming
 * closes the dialog root, which fires onOpenChange(false) → onClose(). Callers
 * must keep onClose() safe to run in parallel with onConfirm().
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Eliminar',
  onConfirm,
  onClose,
}: Props) {
  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="dialog-backdrop dialog-backdrop--fade" />
        <AlertDialog.Content className="dialog dialog--plain dialog--fade dialog--sm">
          <header className="dialog-header">
            <AlertDialog.Title className="dialog-title">{title}</AlertDialog.Title>
            <IconButton label="Cerrar" className="dialog-close" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </header>
          <div className="dialog-body">
            <AlertDialog.Description className="dialog-message">{message}</AlertDialog.Description>
          </div>
          <footer className="dialog-footer">
            <AlertDialog.Cancel asChild>
              <button type="button" className="button">
                Cancelar
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button type="button" className="button button--danger" onClick={onConfirm}>
                {confirmLabel}
              </button>
            </AlertDialog.Action>
          </footer>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
