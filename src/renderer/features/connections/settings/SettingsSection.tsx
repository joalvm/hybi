import type { ReactNode } from 'react';

type Props = {
  title: string;
  action?: ReactNode;
  children: ReactNode;
};

/** One compact settings group with consistent heading rhythm and separation. */
export function SettingsSection({ title, action, children }: Props) {
  return (
    <section className="flex flex-col gap-0 p-1 first:pt-3">
      {action === undefined ? (
        <h3 className="pb-2 text-section leading-4.5 font-semibold text-foreground">{title}</h3>
      ) : (
        <div className="flex items-center gap-1 border-b border-border-subtle pb-2">
          <h3 className="text-section leading-4.5 font-semibold text-foreground">{title}</h3>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
