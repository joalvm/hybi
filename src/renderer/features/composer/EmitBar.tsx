import { useId } from 'react';
import { useMessages } from '@/shared/i18n/useMessages.js';
import { Input } from '@/shared/ui/Input.js';

type Props = {
  event: string;
  ack: boolean;
  onEventChange: (event: string) => void;
  onAckChange: (ack: boolean) => void;
};

/**
 * What Socket.IO needs that a raw frame does not: the name this send goes out
 * under, and whether to wait for an answer. It sits above the payload rather
 * than in the footer because the name is part of what is being sent, not of how
 * the editor displays it.
 */
export function EmitBar({ event, ack, onEventChange, onAckChange }: Props) {
  const messages = useMessages().composer.emit;
  const eventId = useId();
  const ackId = useId();

  return (
    <div className="flex min-h-9 items-center gap-2 bg-panel px-2 py-1">
      <label className="shrink-0 text-label text-muted" htmlFor={eventId}>
        {messages.event}
      </label>
      <Input
        id={eventId}
        className="h-control max-w-64"
        value={event}
        placeholder={messages.eventPlaceholder}
        onChange={(changed) => {
          onEventChange(changed.target.value);
        }}
      />
      <label className="flex cursor-pointer items-center gap-1 text-label text-muted" htmlFor={ackId}>
        <input
          id={ackId}
          type="checkbox"
          checked={ack}
          onChange={(changed) => {
            onAckChange(changed.target.checked);
          }}
        />
        {messages.ack}
      </label>
    </div>
  );
}
