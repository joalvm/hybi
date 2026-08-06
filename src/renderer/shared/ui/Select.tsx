import { Select as Primitive } from 'radix-ui';
import { cn } from '../utils/cn.js';
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
      <Primitive.Trigger
        className={cn(
          'inline-flex h-control max-w-52 min-w-0 cursor-pointer items-center gap-1 overflow-hidden rounded-ui border border-border bg-app px-2 whitespace-nowrap text-foreground hover:bg-hover focus-visible:border-accent focus-visible:outline-none',
          className,
        )}
        aria-label={label}
      >
        <Primitive.Value className="min-w-0 flex-1 truncate text-left" />
        <Primitive.Icon className="inline-flex shrink-0 text-muted">
          <CaretDownIcon />
        </Primitive.Icon>
      </Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Content
          className="z-20 flex max-w-52 flex-col overflow-hidden rounded-lg border border-border bg-panel p-1 shadow-overlay"
          position="popper"
          sideOffset={4}
        >
          <Primitive.Viewport className="min-w-0">
            {options.map((option) => (
              <Primitive.Item
                key={option.value}
                value={option.value}
                className="menu-item-runtime flex max-w-52 min-w-0 cursor-pointer items-center gap-2 overflow-hidden rounded-ui px-2 py-1 text-left whitespace-nowrap select-none outline-none"
                title={option.label}
              >
                {/* The tick sits in the icon slot every menu reserves, so the
                    chosen row does not sit a glyph's width off the others. */}
                <span className="inline-flex shrink-0 basis-3.5 items-center justify-center text-muted">
                  <Primitive.ItemIndicator>
                    <CheckIcon />
                  </Primitive.ItemIndicator>
                </span>
                <Primitive.ItemText className="min-w-0 flex-1 truncate">
                  {option.label}
                </Primitive.ItemText>
              </Primitive.Item>
            ))}
          </Primitive.Viewport>
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
