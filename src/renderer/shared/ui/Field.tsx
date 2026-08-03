import type { ReactNode } from 'react';
import { cn } from '../utils/cn.js';

type Props = {
  label: string;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
};

export function Field({ label, htmlFor, className, children }: Props) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)} data-part="field">
      <label className="text-label text-muted" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}
