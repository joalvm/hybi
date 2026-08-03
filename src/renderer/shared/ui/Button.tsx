import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../utils/cn.js';

const buttonVariants = cva(
  'inline-flex min-h-control cursor-pointer items-center justify-center gap-1 whitespace-nowrap rounded-ui border px-3 focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      tone: {
        default: 'border-border bg-panel enabled:hover:bg-hover',
        primary:
          'border-accent bg-accent text-on-brand enabled:hover:border-accent-strong enabled:hover:bg-accent-strong',
        danger:
          'border-error bg-panel text-error enabled:hover:bg-error enabled:hover:text-on-danger',
        quiet: 'border-border bg-tab-active text-muted enabled:hover:bg-control enabled:hover:text-foreground',
      },
      size: {
        sm: 'px-2 text-ui',
        md: 'px-3 text-ui',
      },
    },
    defaultVariants: { tone: 'default', size: 'md' },
  },
);

type Props = ComponentPropsWithRef<'button'> & VariantProps<typeof buttonVariants>;

/** Shared button recipe for workspace actions, forms and destructive confirmations. */
export function Button({ className, tone, size, type = 'button', ...props }: Props) {
  return <button type={type} className={cn(buttonVariants({ tone, size }), className)} {...props} />;
}
