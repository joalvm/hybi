import { DropdownMenu } from 'radix-ui';
import type { ReactNode } from 'react';
import { cn } from '../utils/cn.js';

export type MenuItem = {
  label: string;
  /** Sits before the label. Decorative: the label is what names the action. */
  icon?: ReactNode;
  tone?: 'danger';
  disabled?: boolean;
  onSelect: () => void;
};

/**
 * A block of items, set off from what comes before it by a divider. The label
 * is optional: a trailing block of plain actions (no heading of its own) is
 * still a group as far as spacing and the divider are concerned — that is how
 * a caller puts a labelled block ahead of an unlabelled one instead of always
 * getting items-then-groups.
 */
export type MenuGroup = { label?: string; items: MenuItem[] };

type Props = {
  /** Accessible name of the trigger, and of the panel it opens. */
  label: string;
  trigger: ReactNode;
  items?: MenuItem[];
  groups?: MenuGroup[];
  align?: 'start' | 'end';
  /**
   * Fires for every open, keyboard included — which a handler on the trigger's
   * `onPointerDown` would miss.
   */
  onOpenChange?: ((open: boolean) => void) | undefined;
};

/**
 * The one dropdown in the app. Radix owns focus, typeahead, Escape and
 * outside-click, which is what the hand-rolled version could never get right;
 * everything visual stays ours in `overlays.css`.
 *
 * The slot before a label is rendered whether or not the item earned a glyph,
 * so every label in one menu starts on the same column.
 *
 * `items` always renders before `groups` — every caller but one wants a flat
 * list of actions up top and a labelled group (e.g. "Move to") at the bottom.
 * A caller that instead wants a labelled block first and a plain divided block
 * of actions after it (the workspace switcher) leaves `items` empty and passes
 * both blocks as `groups`, the second one with no `label`: the divider is a
 * property of a group's position (first block in the panel gets none, every
 * one after gets one — see `.menu-group` in overlays.css), not of `items` vs
 * `groups`, so this never has to branch on a flag.
 */
export function Menu({
  label,
  trigger,
  items = [],
  groups = [],
  align = 'end',
  // A no-op default rather than `undefined`: `exactOptionalPropertyTypes` makes
  // Radix's own prop non-optional once it is passed at all.
  onOpenChange = () => undefined,
}: Props) {
  const entry = (item: MenuItem, key: string) => (
    <DropdownMenu.Item
      key={key}
      className={cn(
        'menu-item-runtime flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-ui px-2 py-1 text-left select-none outline-none',
        item.tone === 'danger' && 'text-error',
      )}
      disabled={item.disabled ?? false}
      onSelect={item.onSelect}
    >
      <span className="inline-flex basis-3.5 items-center justify-center text-muted">{item.icon}</span>
      {item.label}
    </DropdownMenu.Item>
  );

  return (
    // Non-modal: the hand-rolled menu never blocked the rest of the page or
    // trapped focus either. Modal's focus trap otherwise fights an action like
    // "Renombrar", which focuses an inline field outside the menu the instant
    // it is selected — the trap yanks focus straight back and commits an
    // empty rename before the field is ever seen.
    <DropdownMenu.Root modal={false} onOpenChange={onOpenChange}>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-20 flex flex-col rounded-lg border border-border bg-panel p-1 shadow-overlay"
          aria-label={label}
          align={align}
          sideOffset={4}
          collisionPadding={8}
          // Radix's default returns focus to the trigger on close, which would
          // steal it right back from that same inline field.
          onCloseAutoFocus={(event) => {
            event.preventDefault();
          }}
        >
          {items.map((item, index) => entry(item, `item-${String(index)}`))}
          {groups.map((group, groupIndex) => (
            <DropdownMenu.Group
              key={`group-${String(groupIndex)}`}
              className="menu-group-runtime flex flex-col"
            >
              {group.label !== undefined && (
                <DropdownMenu.Label className="px-2 text-label text-muted">
                  {group.label}
                </DropdownMenu.Label>
              )}
              {group.items.map((item, index) =>
                entry(item, `group-${String(groupIndex)}-item-${String(index)}`),
              )}
            </DropdownMenu.Group>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
