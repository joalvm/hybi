import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils/cn.js';

type Props = ComponentPropsWithRef<'input'>;

/** Dense text field shared by dialogs, settings and workspace editors. */
export function Input({ className, ...props }: Props) {
  return (
    <input
      className={cn(
        'min-h-control w-full rounded-ui border border-border bg-app px-2 text-foreground focus-visible:border-accent focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent',
        className,
      )}
      {...props}
    />
  );
}
