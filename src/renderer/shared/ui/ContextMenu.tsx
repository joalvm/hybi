import { ContextMenu as Primitive } from 'radix-ui';
import type { ReactNode } from 'react';
import { cn } from '../utils/cn.js';
import type { MenuItem } from './Menu.js';

type Props = {
  /** Accessible name of the panel. */
  label: string;
  items: MenuItem[];
  /** The surface the right click has to land on. */
  children: ReactNode;
};

/**
 * A right-click menu over an arbitrary surface. Kept separate from `Menu`
 * because a context menu has no trigger element to speak of: the region itself
 * is the trigger.
 */
export function ContextMenu({ label, items, children }: Props) {
  return (
    <Primitive.Root>
      <Primitive.Trigger asChild>{children}</Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Content
          className="z-20 flex flex-col rounded-lg border border-border bg-panel p-1 shadow-overlay"
          aria-label={label}
          collisionPadding={8}
        >
          {items.map((item) => (
            <Primitive.Item
              key={item.label}
              className={cn(
                'menu-item-runtime flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-ui px-2 py-1 text-left select-none outline-none',
                item.tone === 'danger' && 'text-error',
              )}
              disabled={item.disabled ?? false}
              onSelect={item.onSelect}
            >
              <span className="inline-flex basis-3.5 items-center justify-center text-muted">
                {item.icon}
              </span>
              {item.label}
            </Primitive.Item>
          ))}
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
