import { format } from '@lang/translate.js';
import type { ConnectionHeader } from '@shared/domain/connections/websocket.js';
import { useMessages } from '@/shared/i18n/useMessages.js';
import { IconButton } from '@/shared/ui/IconButton.js';
import { Input } from '@/shared/ui/Input.js';
import { TrashIcon } from '@/shared/ui/icons.js';

type Props = {
  header: ConnectionHeader;
  onChange: (header: ConnectionHeader) => void;
  onRemove: () => void;
};

/**
 * One header. The value is a template: a secret belongs in a `{{variable}}` of
 * the environment, which is the mechanism that keeps it out of the workspace
 * file — typed in here it would be written to disk in the clear.
 */
export function HeaderRow({ header, onChange, onRemove }: Props) {
  const messages = useMessages().connections.headers;
  // The name of an unnamed row, so its controls still have something to say.
  const name = header.name === '' ? messages.unnamed : header.name;

  return (
    <li className="header-row-grid grid items-center gap-2">
      <input
        type="checkbox"
        checked={header.enabled}
        aria-label={format(messages.send, { name })}
        onChange={(event) => {
          onChange({ ...header, enabled: event.target.checked });
        }}
      />
      <Input
        className="font-mono"
        value={header.name}
        placeholder={messages.namePlaceholder}
        aria-label={messages.name}
        onChange={(event) => {
          onChange({ ...header, name: event.target.value });
        }}
      />
      <Input
        className="font-mono"
        value={header.value}
        placeholder={messages.valuePlaceholder}
        aria-label={messages.value}
        onChange={(event) => {
          onChange({ ...header, value: event.target.value });
        }}
      />
      <IconButton label={format(messages.remove, { name })} tone="danger" onClick={onRemove}>
        <TrashIcon />
      </IconButton>
    </li>
  );
}
