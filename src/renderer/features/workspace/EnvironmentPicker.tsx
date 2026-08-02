import type { Environment } from '@shared/domain/types.js';
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
  return (
    <Select
      label="Entorno"
      className="environment-picker"
      value={value ?? NONE}
      options={[
        { value: NONE, label: 'Sin entorno' },
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
