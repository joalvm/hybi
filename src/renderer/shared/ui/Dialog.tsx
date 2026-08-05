import { cva } from 'class-variance-authority';
import { Dialog as Primitive } from 'radix-ui';
import type { ReactNode } from 'react';
import { cn } from '../utils/cn.js';
import { CloseIcon } from './icons.js';
import { IconButton } from './IconButton.js';

/** 400px, 520px, 624px, 720px and 860px. A two-line confirm is not a form. */
export type DialogSize = 'sm' | 'md' | 'settings' | 'lg' | 'xl';

const dialogVariants = cva(
  'dialog-motion fixed top-1/2 left-1/2 z-11 flex max-h-screen-safe max-w-dialog -translate-x-1/2 -translate-y-1/2 flex-col rounded-dialog border-0 bg-panel shadow-modal focus-visible:outline-none',
  {
    variants: {
      size: {
        sm: 'min-h-25 w-dialog-sm',
        md: 'min-h-37.5 w-dialog-md',
        settings: 'w-dialog-settings',
        lg: 'min-h-50 w-dialog-lg',
        xl: 'w-dialog-xl',
      },
      surface: { plain: 'bg-panel' },
    },
    defaultVariants: { size: 'md', surface: 'plain' },
  },
);

type Props = {
  open: boolean;
  title: string;
  size?: DialogSize;
  /**
   * `false` drops the title bar and hands the whole surface to the children.
   * The title still exists for assistive tech — Radix requires one, and a
   * dialog without an accessible name is a dialog a screen reader cannot
   * announce — it just is not drawn.
   */
  chrome?: boolean;
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
export function Dialog({
  open,
  title,
  size = 'md',
  chrome = true,
  bodyClassName,
  onClose,
  children,
}: Props) {
  return (
    <Primitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Primitive.Portal>
        <Primitive.Overlay
          className="dialog-motion fixed inset-0 z-10 bg-dialog-backdrop"
          data-part="dialog-backdrop"
        />
        <Primitive.Content
          className={dialogVariants({ size })}
          data-part="dialog"
          data-size={size}
          aria-describedby={undefined}
        >
          {chrome ? (
            <header className="flex min-h-15 items-center gap-2 rounded-t-dialog bg-panel p-4">
              <Primitive.Title className="flex-1 text-dialog-title leading-6 font-semibold">
                {title}
              </Primitive.Title>
              {/* Escape closes too, but a dialog with no visible way out reads as
                  a trap — this is the button the user looks for first. */}
              <IconButton label="Cerrar" className="-mr-1 min-h-6 min-w-6 p-0" onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </header>
          ) : (
            <Primitive.Title className="sr-only">{title}</Primitive.Title>
          )}
          <div
            className={cn('min-h-0 flex-1 overflow-auto px-4 pt-3 pb-4', bodyClassName)}
            data-part="dialog-body"
          >
            {children}
          </div>
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
