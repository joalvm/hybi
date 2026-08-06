import type { ConnectionHeader } from '@shared/domain/connections/websocket.js';
import { useMessages } from '@/shared/i18n/useMessages.js';
import { Button } from '@/shared/ui/Button.js';
import { PlusIcon } from '@/shared/ui/icons.js';
import { HeaderRow } from './HeaderRow.js';

type Props = {
  headers: ConnectionHeader[];
  onChange: (headers: ConnectionHeader[]) => void;
};

const EMPTY_HEADER: ConnectionHeader = { name: '', value: '', enabled: true };

/**
 * WebSocket handshake headers, in the order they are listed.
 *
 * Rows are keyed by position because a header has no id of its own: the list is
 * short, every field is controlled, and the alternative is an identifier stored
 * in the workspace file that nothing else would ever read.
 */
export function HeadersEditor({ headers, onChange }: Props) {
  const messages = useMessages().connections.headers;
  const rows = headers.length === 0 ? [EMPTY_HEADER] : headers;

  const replace = (index: number, header: ConnectionHeader): void => {
    if (headers.length === 0) {
      onChange([header]);
      return;
    }
    onChange(headers.map((entry, position) => (position === index ? header : entry)));
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-label leading-copy text-muted">
        {messages.hint.before}
        <code>{messages.hint.token}</code>
        {messages.hint.after}
      </p>
      <ul className="flex list-none flex-col gap-1 p-0">
        {rows.map((header, index) => (
          <HeaderRow
            key={index}
            header={header}
            onChange={(next) => {
              replace(index, next);
            }}
            onRemove={() => {
              onChange(headers.filter((_entry, position) => position !== index));
            }}
          />
        ))}
      </ul>
      <Button
        className="self-end"
        aria-label={messages.add}
        onClick={() => {
          onChange([...rows, { name: '', value: '', enabled: true }]);
        }}
      >
        <PlusIcon />
        {messages.add}
      </Button>
    </div>
  );
}
