import clsx from 'clsx';
import type { ReactNode } from 'react';

type Props = {
  label: string;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
  tone?: 'default' | 'danger';
  children: ReactNode;
};

export function IconButton({ label, onClick, className, disabled = false, tone = 'default', children }: Props) {
  return (
    <button
      type="button"
      className={clsx('icon-button', `icon-button--${tone}`, className)}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
