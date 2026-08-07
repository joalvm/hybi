import type { ConnectionHeader } from '@shared/domain/connections/policies.js';
import { Button } from '@/shared/ui/Button.js';
import { PlusIcon } from '@/shared/ui/icons.js';
import { PairRow, type PairLabels } from './PairRow.js';

type Props = {
  pairs: ConnectionHeader[];
  labels: PairLabels;
  onChange: (pairs: ConnectionHeader[]) => void;
};

const EMPTY_PAIR: ConnectionHeader = { name: '', value: '', enabled: true };

/**
 * A list of enabled name/value templates, in the order they are listed. Serves
 * the handshake headers and the Socket.IO `auth` payload: two lists that differ
 * in where they are sent, not in what a row of them is.
 *
 * Rows are keyed by position because an entry has no id of its own: the list is
 * short, every field is controlled, and the alternative is an identifier stored
 * in the workspace file that nothing else would ever read.
 */
export function PairsEditor({ pairs, labels, onChange }: Props) {
  const rows = pairs.length === 0 ? [EMPTY_PAIR] : pairs;

  const replace = (index: number, pair: ConnectionHeader): void => {
    if (pairs.length === 0) {
      onChange([pair]);
      return;
    }
    onChange(pairs.map((entry, position) => (position === index ? pair : entry)));
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-label leading-copy text-muted">
        {labels.hint.before}
        <code>{labels.hint.token}</code>
        {labels.hint.after}
      </p>
      <ul className="flex list-none flex-col gap-1 p-0">
        {rows.map((pair, index) => (
          <PairRow
            key={index}
            pair={pair}
            labels={labels}
            onChange={(next) => {
              replace(index, next);
            }}
            onRemove={() => {
              onChange(pairs.filter((_entry, position) => position !== index));
            }}
          />
        ))}
      </ul>
      <Button
        className="self-end"
        aria-label={labels.add}
        onClick={() => {
          onChange([...rows, { name: '', value: '', enabled: true }]);
        }}
      >
        <PlusIcon />
        {labels.add}
      </Button>
    </div>
  );
}
