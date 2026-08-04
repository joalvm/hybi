import Tippy from '@tippyjs/react/headless';
import { type ReactNode } from 'react';

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
  if (anchor === null) return null;

  return (
    <Tippy
      visible={open}
      render={(attributes) => (
        <div
          {...attributes}
          className="z-20 flex w-90 flex-col gap-3 rounded-lg border border-border bg-panel p-4 shadow-overlay"
          onPointerEnter={onPointerEnter}
          onPointerLeave={onPointerLeave}
        >
          {children}
        </div>
      )}
      getReferenceClientRect={() => anchor.getBoundingClientRect()}
      trigger="manual"
      interactive
      interactiveBorder={8}
      interactiveDebounce={100}
      placement="bottom-start"
      offset={[0, 6]}
      appendTo={() => document.body}
      hideOnClick={false}
      arrow={false}
      duration={0}
      aria={{ content: null }}
      onClickOutside={() => {
        onOpenChange(false);
      }}
    >
      <span aria-hidden="true" className="pointer-events-none absolute h-px w-px opacity-0" />
    </Tippy>
  );
}
