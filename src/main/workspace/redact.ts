import type { Workspace } from '@shared/domain/types.js';

/**
 * Blanks every secret value. Applied on the way to disk, so a bearer token
 * typed into an environment lives only in memory for that session.
 */
export function redactSecrets(workspace: Workspace): Workspace {
  return {
    ...workspace,
    environments: workspace.environments.map((environment) => ({
      ...environment,
      variables: environment.variables.map((variable) =>
        variable.secret ? { ...variable, value: '' } : variable,
      ),
    })),
  };
}
