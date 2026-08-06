import { format } from '@lang/translate.js';
import type { Variable } from '@shared/domain/types.js';
import { useMessages } from '@/shared/i18n/useMessages.js';
import { IconButton } from '@/shared/ui/IconButton.js';
import { Input } from '@/shared/ui/Input.js';

type Props = {
  variable: Variable;
  index: number;
  onChange: (next: Variable) => void;
  onRemove: () => void;
};

/** Secret values render as a password field so a shared screen never leaks one. */
export function VariableRow({ variable, index, onChange, onRemove }: Props) {
  const messages = useMessages().workspace.variables;
  const position = String(index + 1);

  return (
    <div className="variable-row-grid grid items-center gap-2">
      <Input
        aria-label={format(messages.name, { position })}
        value={variable.name}
        onChange={(event) => {
          onChange({ ...variable, name: event.target.value });
        }}
      />
      <Input
        type={variable.secret ? 'password' : 'text'}
        aria-label={format(messages.value, { position })}
        value={variable.value}
        onChange={(event) => {
          onChange({ ...variable, value: event.target.value });
        }}
      />
      <label className="flex items-center gap-1 whitespace-nowrap text-label text-muted">
        <input
          type="checkbox"
          checked={variable.secret}
          onChange={(event) => {
            onChange({ ...variable, secret: event.target.checked });
          }}
        />
        {messages.secret}
      </label>
      <IconButton
        label={format(messages.remove, { position })}
        tone="danger"
        onClick={onRemove}
      >
        ✕
      </IconButton>
    </div>
  );
}
