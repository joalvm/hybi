import clsx from 'clsx';
import { Dialog as Primitive } from 'radix-ui';
import type { ReactNode } from 'react';
import { CloseIcon } from './icons.js';
import { IconButton } from './IconButton.js';

/** 400px, 520px, 624px and 720px. A two-line confirm is not a form. */
export type DialogSize = 'sm' | 'md' | 'settings' | 'lg';

type Props = {
  open: boolean;
  title: string;
  size?: DialogSize;
  bodyClassName?: string;
  onClose: () => void;
  children: ReactNode;
};

/**
 * Radix owns the focus trap, the restore on close and the Escape key — the
 * hand-rolled version had none of the first two. `aria-describedby={undefined}`
 * is how Radix is told there is no description element: the body is arbitrary
 * content, not one paragraph it can point at.
 */
export function Dialog({ open, title, size = 'md', bodyClassName, onClose, children }: Props) {
  return (
    <Primitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Primitive.Portal>
        <Primitive.Overlay className="dialog-backdrop dialog-backdrop--fade" />
        <Primitive.Content
          className={clsx('dialog', 'dialog--plain', 'dialog--fade', `dialog--${size}`)}
          aria-describedby={undefined}
        >
          <header className="dialog-header">
            <Primitive.Title className="dialog-title">{title}</Primitive.Title>
            {/* Escape closes too, but a dialog with no visible way out reads as a
                trap — this is the button the user looks for first. */}
            <IconButton label="Cerrar" className="dialog-close" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </header>
          <div className={clsx('dialog-body', bodyClassName)}>{children}</div>
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
