import clsx from 'clsx';
import { Select as Primitive } from 'radix-ui';
import { CaretDownIcon, CheckIcon } from './icons.js';

export type SelectOption = { value: string; label: string };

type Props = {
  /** Accessible name of the trigger. There is no visible label anywhere it is used. */
  label: string;
  value: string;
  options: SelectOption[];
  className?: string | undefined;
  onChange: (value: string) => void;
};

/**
 * A dropdown that looks like the rest of the app instead of like the platform.
 * Radix keeps the native keyboard contract — typeahead, Home/End, Escape — which
 * is the only reason replacing a `<select>` is defensible at all.
 */
export function Select({ label, value, options, className, onChange }: Props) {
  return (
    <Primitive.Root value={value} onValueChange={onChange}>
      <Primitive.Trigger className={clsx('select-trigger', className)} aria-label={label}>
        <Primitive.Value />
        <Primitive.Icon className="select-caret">
          <CaretDownIcon />
        </Primitive.Icon>
      </Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Content className="menu-panel select-panel" position="popper" sideOffset={4}>
          <Primitive.Viewport>
            {options.map((option) => (
              <Primitive.Item key={option.value} value={option.value} className="menu-item">
                {/* The tick sits in the icon slot every menu reserves, so the
                    chosen row does not sit a glyph's width off the others. */}
                <span className="menu-icon">
                  <Primitive.ItemIndicator>
                    <CheckIcon />
                  </Primitive.ItemIndicator>
                </span>
                <Primitive.ItemText>{option.label}</Primitive.ItemText>
              </Primitive.Item>
            ))}
          </Primitive.Viewport>
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
