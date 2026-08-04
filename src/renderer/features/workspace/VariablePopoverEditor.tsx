import { useState } from 'react';
import type { Variable } from '@shared/domain/types.js';
import { HideIcon, RevealIcon } from '@/shared/ui/icons.js';
import { IconButton } from '@/shared/ui/IconButton.js';
import { Input } from '@/shared/ui/Input.js';

type Props = {
  name: string;
  variable: Variable;
  draft: string;
  onDraftChange: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
};

/** Keeps secret visibility local to the popover editor, never to the store. */
export function VariablePopoverEditor({
  name,
  variable,
  draft,
  onDraftChange,
  onSave,
  onClose,
}: Props) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="flex items-center gap-1">
      <Input
        // A secret is never printed by default, here or in the log.
        type={variable.secret && !revealed ? 'password' : 'text'}
        aria-label={`Valor de ${name}`}
        className="h-variable-input rounded-ui bg-panel px-3 font-ui text-ui"
        value={draft}
        onChange={(event) => {
          onDraftChange(event.target.value);
        }}
        onBlur={onSave}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            onSave();
            onClose();
          }
          if (event.key === 'Escape') onDraftChange(variable.value);
        }}
      />
      {variable.secret && (
        <IconButton
          label={revealed ? 'Ocultar valor' : 'Mostrar valor'}
          onClick={() => {
            setRevealed((current) => !current);
          }}
        >
          {revealed ? <HideIcon /> : <RevealIcon />}
        </IconButton>
      )}
    </div>
  );
}
