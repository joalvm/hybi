import { Popover as Primitive } from 'radix-ui';
import { useMemo, type ReactNode } from 'react';

/**
 * Anything that can report a screen box. A `{{var}}` inside Monaco is not an
 * element, so what anchors the popover is a rectangle, not a node.
 */
export type VirtualAnchor = { getBoundingClientRect: () => DOMRect };

type Props = {
  open: boolean;
  anchor: VirtualAnchor | null;
  onOpenChange: (open: boolean) => void;
  onPointerEnter?: (() => void) | undefined;
  onPointerLeave?: (() => void) | undefined;
  children: ReactNode;
};

/**
 * A floating panel positioned against a rectangle, opened by a pointer that
 * rested on something. Two rules keep it usable as an editor rather than a
 * tooltip, and both were learned by breaking them:
 *
 * - it does not take focus when it opens, because a panel raised by hovering
 *   must not pull the caret out of the field the user is typing in;
 * - it ignores the pointer leaving while it holds focus, because the pointer
 *   is nowhere near a panel someone is typing into.
 */
export function Popover({
  open,
  anchor,
  onOpenChange,
  onPointerEnter,
  onPointerLeave,
  children,
}: Props) {
  // Radix reads the anchor through a ref-shaped object, so the current
  // rectangle is handed over without re-rendering the tree that owns it.
  // Memoizing (rather than mutating a `useRef` during render, which React's
  // rules disallow) keeps that object's identity stable across renders where
  // the anchor itself has not changed, while still being ready before any
  // effect — including Radix's own — ever reads it.
  const anchorRef = useMemo(() => ({ current: anchor }), [anchor]);

  if (anchor === null) return null;

  return (
    <Primitive.Root open={open} onOpenChange={onOpenChange}>
      <Primitive.Anchor virtualRef={anchorRef} />
      <Primitive.Portal>
        <Primitive.Content
          className="z-20 flex w-90 flex-col gap-2 rounded-lg border border-border bg-panel p-2 shadow-overlay"
          data-part="variable-popover"
          side="bottom"
          align="start"
          sideOffset={6}
          collisionPadding={8}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
          }}
          onPointerEnter={onPointerEnter}
          onPointerLeave={(event) => {
            if (event.currentTarget.contains(document.activeElement)) return;
            onPointerLeave?.();
          }}
        >
          {children}
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
