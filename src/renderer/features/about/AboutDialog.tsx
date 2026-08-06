import { format } from '@lang/translate.js';
import { APP_NAME } from '@shared/brand.js';
import { bridge } from '@/ipc/bridge.js';
import { useMessages } from '@/shared/i18n/useMessages.js';
import { Badge } from '@/shared/ui/Badge.js';
import { Dialog } from '@/shared/ui/Dialog.js';
import { useAboutRequests } from './useAboutRequests.js';

const ICON = new URL('../../../../resources/images/icon.svg', import.meta.url).href;

/** `0.3.0-alpha.1` is the alpha phase; a stable version carries no suffix. */
function phaseOf(version: string): string | null {
  const suffix = version.split('-')[1];
  return suffix === undefined ? null : (suffix.split('.')[0] ?? null);
}

export function AboutDialog() {
  const messages = useMessages().about;
  const { open, close } = useAboutRequests();
  const version = bridge.app.version;
  const phase = phaseOf(version);

  return (
    <Dialog open={open} title={format(messages.title, { app: APP_NAME })} size="sm" onClose={close}>
      <div className="flex flex-col items-center gap-2 pt-2 pb-1 text-center">
        <img className="mb-1 block h-18 w-18" src={ICON} alt="" width={72} height={72} />
        <p className="text-brand-name font-semibold tracking-brand text-foreground">{APP_NAME}</p>
        <p className="flex items-center gap-2 text-ui text-muted tabular-nums">
          <span>{version}</span>
          {phase === null ? null : <Badge tone="warn">{phase}</Badge>}
        </p>
        <p className="max-w-about text-ui leading-copy text-foreground">{messages.tagline}</p>
        {phase === null ? null : (
          <p className="max-w-about text-ui leading-copy text-foreground">{messages.prerelease}</p>
        )}
        <p className="max-w-about text-label leading-copy text-muted">{messages.updates}</p>
        <p className="max-w-about text-label leading-copy text-muted">{messages.license}</p>
      </div>
    </Dialog>
  );
}
