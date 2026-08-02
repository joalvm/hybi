import clsx from 'clsx';
import { ContextMenu as Primitive } from 'radix-ui';
import type { ReactNode } from 'react';
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
        <Primitive.Content className="menu-panel" aria-label={label} collisionPadding={8}>
          {items.map((item) => (
            <Primitive.Item
              key={item.label}
              className={clsx('menu-item', item.tone === 'danger' && 'menu-item--danger')}
              disabled={item.disabled ?? false}
              onSelect={item.onSelect}
            >
              <span className="menu-icon">{item.icon}</span>
              {item.label}
            </Primitive.Item>
          ))}
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
