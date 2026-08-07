import { format } from '@lang/translate.js';
import type { Messages } from '@lang/translate.js';
import type { ConnectionHeader } from '@shared/domain/connections/policies.js';
import { IconButton } from '@/shared/ui/IconButton.js';
import { Input } from '@/shared/ui/Input.js';
import { TrashIcon } from '@/shared/ui/icons.js';

/** Everything one of these lists calls its own columns. */
export type PairLabels = Messages['connections']['headers'];

type Props = {
  pair: ConnectionHeader;
  labels: PairLabels;
  onChange: (pair: ConnectionHeader) => void;
  onRemove: () => void;
};

/**
 * One name and value. The value is a template: a secret belongs in a
 * `{{variable}}` of the environment, which is the mechanism that keeps it out of
 * the workspace file — typed in here it would be written to disk in the clear.
 *
 * The labels are passed in because the same row is a handshake header and a
 * Socket.IO `auth` entry, which are the same three fields and not the same thing.
 */
export function PairRow({ pair, labels, onChange, onRemove }: Props) {
  // The name of an unnamed row, so its controls still have something to say.
  const name = pair.name === '' ? labels.unnamed : pair.name;

  return (
    <li className="header-row-grid grid items-center gap-2">
      <input
        type="checkbox"
        checked={pair.enabled}
        aria-label={format(labels.send, { name })}
        onChange={(event) => {
          onChange({ ...pair, enabled: event.target.checked });
        }}
      />
      <Input
        className="font-mono"
        value={pair.name}
        placeholder={labels.namePlaceholder}
        aria-label={labels.name}
        onChange={(event) => {
          onChange({ ...pair, name: event.target.value });
        }}
      />
      <Input
        className="font-mono"
        value={pair.value}
        placeholder={labels.valuePlaceholder}
        aria-label={labels.value}
        onChange={(event) => {
          onChange({ ...pair, value: event.target.value });
        }}
      />
      <IconButton label={format(labels.remove, { name })} tone="danger" onClick={onRemove}>
        <TrashIcon />
      </IconButton>
    </li>
  );
}
