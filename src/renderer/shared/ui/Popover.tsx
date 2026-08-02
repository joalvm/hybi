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
 * A floating panel positioned against a rectangle. `openAutoFocus` is left to
 * Radix — the popover carries a field, and a hover that never lets you type in
 * it is a tooltip, not an editor.
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
          className="popover-panel"
          side="bottom"
          align="start"
          sideOffset={6}
          collisionPadding={8}
          onPointerEnter={onPointerEnter}
          onPointerLeave={onPointerLeave}
        >
          {children}
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
