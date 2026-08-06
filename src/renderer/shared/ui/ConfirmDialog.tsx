import { AlertDialog } from 'radix-ui';
import { useMessages } from '../i18n/useMessages.js';
import { Button } from './Button.js';
import { CloseIcon } from './icons.js';
import { IconButton } from './IconButton.js';

type Props = {
  open: boolean;
  title: string;
  message: string;
  /** Defaults to the word for deleting: destruction is what this dialog is for. */
  confirmLabel?: string | undefined;
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
  confirmLabel,
  onConfirm,
  onClose,
}: Props) {
  const messages = useMessages().common;

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          className="dialog-motion fixed inset-0 z-10 bg-dialog-backdrop"
          data-part="dialog-backdrop"
        />
        <AlertDialog.Content
          className="dialog-motion fixed top-1/2 left-1/2 z-11 flex min-h-25 w-dialog-sm max-w-dialog -translate-x-1/2 -translate-y-1/2 flex-col rounded-dialog bg-panel shadow-modal"
          data-part="dialog"
          data-size="sm"
        >
          <header className="flex min-h-15 items-center gap-2 rounded-t-dialog bg-panel p-4">
            <AlertDialog.Title className="flex-1 text-dialog-title leading-6 font-semibold">
              {title}
            </AlertDialog.Title>
            <IconButton
              label={messages.close}
              className="-mr-1 min-h-6 min-w-6 p-0"
              onClick={onClose}
            >
              <CloseIcon />
            </IconButton>
          </header>
          <div className="min-h-0 flex-1 overflow-auto px-4 pt-3 pb-4" data-part="dialog-body">
            <AlertDialog.Description className="text-muted">{message}</AlertDialog.Description>
          </div>
          <footer className="flex justify-end gap-2 rounded-b-dialog bg-panel px-4 pt-3 pb-4">
            <AlertDialog.Cancel asChild>
              <Button size="sm">{messages.cancel}</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button tone="danger" size="sm" onClick={onConfirm}>
                {confirmLabel ?? messages.delete}
              </Button>
            </AlertDialog.Action>
          </footer>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
