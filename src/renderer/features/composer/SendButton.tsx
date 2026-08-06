import { useMessages } from '@/shared/i18n/useMessages.js';
import { SendIcon } from '@/shared/ui/icons.js';
import { Button } from '@/shared/ui/Button.js';

type Props = {
  connected: boolean;
  empty: boolean;
  onSend: () => void;
};

/**
 * The socket and an empty box are the only things that can block a send. What
 * the payload says is the tester's business: no format, schema or syntax check
 * stands between this button and the wire.
 *
 * Plain, not filled: the blue connect button is the loud one, and a payload can
 * only be sent once a socket is open — a second coloured button beside it would
 * shout over the step that comes first.
 */
export function SendButton({ connected, empty, onSend }: Props) {
  const messages = useMessages().composer;
  const reason = !connected
    ? messages.sendReason.offline
    : empty
      ? messages.sendReason.empty
      : messages.sendReason.ready;

  return (
    <Button
      className="min-h-5.5 shrink-0 px-3"
      disabled={!connected || empty}
      title={reason}
      onClick={onSend}
    >
      <SendIcon />
      {messages.send}
    </Button>
  );
}
