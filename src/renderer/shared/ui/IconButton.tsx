import type { MouseEventHandler, ReactNode } from 'react';
import { cn } from '../utils/cn.js';

type Props = {
  label: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
  className?: string;
  disabled?: boolean;
  tone?: 'default' | 'danger';
  children: ReactNode;
};

export function IconButton({ label, onClick, className, disabled = false, tone = 'default', children }: Props) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex min-h-control min-w-control cursor-pointer items-center justify-center gap-1 rounded-ui border border-transparent bg-transparent px-1 text-muted enabled:hover:bg-hover enabled:hover:text-foreground focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40',
        tone === 'danger' && 'enabled:hover:text-error',
        className,
      )}
      data-part="icon-button"
      data-tone={tone}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
