import type { Environment } from '@shared/domain/types.js';
import { useMessages } from '@/shared/i18n/useMessages.js';
import { Select } from '@/shared/ui/Select.js';

type Props = {
  environments: readonly Environment[];
  value: string | null;
  onChange: (environmentId: string | null) => void;
};

/**
 * The empty option is a real choice: a connection may run without variables.
 * Radix reserves the empty string for "nothing selected", so "no environment"
 * travels as a sentinel and is turned back into `null` at this boundary.
 */
const NONE = 'none';

export function EnvironmentPicker({ environments, value, onChange }: Props) {
  const messages = useMessages().workspace.environments;

  return (
    <Select
      label={messages.picker}
      className="h-control max-w-32 justify-between gap-2 rounded-none border-0 bg-transparent px-2 text-muted hover:bg-hover focus-visible:border-0 focus-visible:bg-panel"
      value={value ?? NONE}
      options={[
        { value: NONE, label: messages.none },
        ...environments.map((environment) => ({
          value: environment.id,
          label: environment.name,
        })),
      ]}
      onChange={(next) => {
        onChange(next === NONE ? null : next);
      }}
    />
  );
}
