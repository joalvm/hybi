import type { ReactNode } from 'react';
import { cn } from '../utils/cn.js';

type Props = {
  tone: 'neutral' | 'ok' | 'warn' | 'error';
  children: ReactNode;
};

export function Badge({ tone, children }: Props) {
  const tones: Record<Props['tone'], string> = {
    neutral: 'text-muted',
    ok: 'text-ok',
    warn: 'text-warn',
    error: 'text-error',
  };

  return (
    <span
      className={cn(
        'inline-block whitespace-nowrap rounded-full border border-current px-2 text-label leading-badge',
        tones[tone],
      )}
      data-part="badge"
      data-tone={tone}
    >
      {children}
    </span>
  );
}
