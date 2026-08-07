import { format } from '@lang/translate.js';
import type { TransportKind } from '@shared/domain/connections/connection.js';
import { useMessages } from '@/shared/i18n/useMessages.js';
import { CaretDownIcon } from '@/shared/ui/icons.js';
import { TRANSPORT_LOGOS, TransportLogo } from '@/shared/ui/logos/TransportLogo.js';
import { Menu } from '@/shared/ui/Menu.js';

/**
 * Every transport, in the order the logo map declares them. Read from that map
 * rather than listed again here: the map is the one the compiler refuses until
 * it is total, so a transport cannot exist and be missing from this menu.
 */
const KINDS = Object.keys(TRANSPORT_LOGOS) as TransportKind[];

type Props = {
  kind: TransportKind;
  /** True while the socket is anything but idle. */
  locked: boolean;
  onSelect: (kind: TransportKind) => void;
};

/**
 * Which protocol this connection speaks, fused to the left edge of the URL
 * field. It sits there because the two answer one question together: an address
 * means nothing until you know what is going to be spoken at it, and until now
 * the only way to change the second was a modal dialog.
 *
 * Locked while the socket is not idle. Swapping transports under a live socket
 * would leave one open that no longer belongs to any configuration in the
 * document, and Disconnect is two controls to the right.
 */
export function TransportSelect({ kind, locked, onSelect }: Props) {
  const messages = useMessages().connections.transport;

  return (
    <Menu
      label={messages.label}
      align="start"
      trigger={
        <button
          type="button"
          disabled={locked}
          aria-label={format(messages.current, { name: messages[kind] })}
          title={locked ? messages.locked : undefined}
          className="flex h-full shrink-0 cursor-pointer items-center gap-1.5 rounded-l-ui border-y-0 border-l-0 border-r border-border bg-elevated px-2 font-ui text-ui text-muted outline-none hover:bg-hover disabled:cursor-default disabled:hover:bg-elevated"
        >
          <TransportLogo kind={kind} />
          <span className="whitespace-nowrap">{messages[kind]}</span>
          <CaretDownIcon className="text-muted" />
        </button>
      }
      items={KINDS.map((entry) => ({
        label: messages[entry],
        icon: <TransportLogo kind={entry} />,
        disabled: entry === kind,
        onSelect: () => {
          onSelect(entry);
        },
      }))}
    />
  );
}
