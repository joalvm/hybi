import clsx from 'clsx';
import type { ReactNode } from 'react';

type Props = {
  tone: 'neutral' | 'ok' | 'warn' | 'error';
  children: ReactNode;
};

export function Badge({ tone, children }: Props) {
  return <span className={clsx('badge', `badge--${tone}`)}>{children}</span>;
}
