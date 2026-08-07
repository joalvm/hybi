import { format } from '@lang/translate.js';
import { useMessages } from '@/shared/i18n/useMessages.js';
import { Select } from '@/shared/ui/Select.js';
import type { BinaryPayload, BinarySource } from './binary.js';

type Props = {
  source: BinarySource;
  /** What would leave, or `null` while the payload cannot be read. */
  payload: BinaryPayload | null;
  /** A failed file pick, in the words the main process used. */
  error: string | null;
  onSourceChange: (source: BinarySource) => void;
};

/**
 * How the binary payload is being written, and what it comes to. The size is
 * the whole feedback loop of this mode: a spelling either resolves to bytes or
 * it does not, and the number is what says which.
 */
export function BinaryBar({ source, payload, error, onSourceChange }: Props) {
  const messages = useMessages().composer.binary;
  const options = [
    { value: 'hex', label: messages.hex },
    { value: 'base64', label: messages.base64 },
    { value: 'file', label: messages.file },
  ];

  const note = (): string => {
    if (error !== null) return error;
    if (payload !== null) return format(messages.size, { count: payload.bytes });
    if (source === 'file') return messages.noFile;
    return source === 'hex' ? messages.invalidHex : messages.invalidBase64;
  };

  return (
    <div className="flex min-h-9 items-center gap-2 bg-panel px-2">
      <Select
        label={messages.source}
        className="h-control border-border bg-panel px-1 text-label text-muted"
        value={source}
        options={options}
        onChange={(next) => {
          onSourceChange(next as BinarySource);
        }}
      />
      <span className={payload === null ? 'text-label text-error' : 'text-label text-muted'}>
        {note()}
      </span>
    </div>
  );
}
