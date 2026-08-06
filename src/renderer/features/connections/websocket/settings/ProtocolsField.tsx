import { useId, useState } from 'react';
import { useMessages } from '@/shared/i18n/useMessages.js';
import { Input } from '@/shared/ui/Input.js';
import { SettingsRow } from '@/shared/ui/settings/SettingsRow.js';

type Props = {
  protocols: string[];
  onChange: (protocols: string[]) => void;
};

/**
 * `Sec-WebSocket-Protocol`, kept with the WebSocket adapter and written as a
 * comma-separated line because that is how it goes on the wire.
 *
 * The text is kept as typed until the field is left: splitting on every
 * keystroke would delete the comma the moment it was pressed, and the list
 * could never grow past its first entry.
 */
export function ProtocolsField({ protocols, onChange }: Props) {
  const messages = useMessages().connections.protocols;
  const id = useId();
  const [draft, setDraft] = useState(protocols.join(', '));

  const commit = (): void => {
    const parsed = draft
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry !== '');
    setDraft(parsed.join(', '));
    onChange(parsed);
  };

  return (
    <SettingsRow
      label={messages.label}
      description={messages.description}
      htmlFor={id}
      control={
        <Input
          id={id}
          className="w-52"
          value={draft}
          placeholder={messages.placeholder}
          onChange={(event) => {
            setDraft(event.target.value);
          }}
          onBlur={commit}
        />
      }
    />
  );
}
