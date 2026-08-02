import { MoreIcon } from './icons.js';
import { Menu, type MenuGroup, type MenuItem } from './Menu.js';

/** The names the catalog and the tab strip already import. */
export type RowMenuItem = MenuItem;
export type RowMenuGroup = MenuGroup;

type Props = {
  label: string;
  items: RowMenuItem[];
  groups?: RowMenuGroup[];
};

/**
 * The `…` a row shows instead of a strip of buttons. The wrapper stays because
 * the row underneath treats a click as a selection, and pressing an action is
 * not one — the menu itself is `Menu`, so every dropdown in the app behaves the
 * same way.
 */
export function RowMenu({ label, items, groups = [] }: Props) {
  return (
    <div
      className="row-menu"
      onClick={(event) => {
        event.stopPropagation();
      }}
    >
      <Menu
        label={label}
        items={items}
        groups={groups}
        trigger={
          <button type="button" className="row-menu__trigger" aria-label={label} title={label}>
            <MoreIcon />
          </button>
        }
      />
    </div>
  );
}
