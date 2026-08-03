import { useId, useState } from 'react';
import { Field } from '@/shared/ui/Field.js';
import { Input } from '@/shared/ui/Input.js';

type Props = {
  protocols: string[];
  onChange: (protocols: string[]) => void;
};

/**
 * `Sec-WebSocket-Protocol`, kept with the WebSocket adapter and written as a
 * comma-separated line because that is
 * how it goes on the wire.
 *
 * The text is kept as typed until the field is left: splitting on every
 * keystroke would delete the comma the moment it was pressed, and the list
 * could never grow past its first entry.
 */
export function ProtocolsField({ protocols, onChange }: Props) {
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
    <Field
      className="settings-field-grid grid items-center gap-3 py-2"
      label="Subprotocolos"
      htmlFor={id}
    >
      <Input
        id={id}
        className="w-48"
        value={draft}
        placeholder="graphql-ws, wamp.2.json"
        onChange={(event) => {
          setDraft(event.target.value);
        }}
        onBlur={commit}
      />
    </Field>
  );
}
