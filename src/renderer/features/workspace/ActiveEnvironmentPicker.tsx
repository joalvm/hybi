import type { Environment } from '@shared/domain/types.js';
import { useStore } from '@/store/index.js';
import { selectActiveConnection } from '@/store/selectors.js';
import { EnvironmentPicker } from './EnvironmentPicker.js';

/** A module constant so an unloaded workspace keeps a stable empty list. */
const EMPTY_ENVIRONMENTS: Environment[] = [];

/**
 * Environments belong to the workspace, so the picker lives in the chrome — but
 * a connection resolves against exactly one, so what it writes is the *active*
 * connection's `environmentId`. Switching tabs therefore switches the reading.
 */
export function ActiveEnvironmentPicker() {
  const environments = useStore((state) => state.workspace?.environments ?? EMPTY_ENVIRONMENTS);
  const connection = useStore(selectActiveConnection);
  const upsertConnection = useStore((state) => state.upsertConnection);

  if (connection === null) return null;

  return (
    <EnvironmentPicker
      environments={environments}
      value={connection.environmentId}
      onChange={(environmentId) => {
        upsertConnection({ ...connection, environmentId });
      }}
    />
  );
}
