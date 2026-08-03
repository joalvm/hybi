import type { Connection, Environment, Workspace } from '@shared/domain/types.js';
import type { AsyncApiServer } from './export-types.js';

const WS_URL = /^(wss?):\/\/([^/?#]+)(\/[^?#]*)?(?:\?[^#]*)?(?:#.*)?$/i;
const VARIABLE = /\{\{([A-Za-z0-9._-]+)\}\}/g;

export type ExportServers = {
  servers: Record<string, AsyncApiServer>;
  connectionIds: (string | null)[];
};

function template(value: string): string {
  return value.replace(VARIABLE, '{$1}');
}

function environmentFor(connection: Connection, workspace: Workspace): Environment | null {
  if (connection.environmentId === null) return null;
  return workspace.environments.find((entry) => entry.id === connection.environmentId) ?? null;
}

function serverVariables(
  source: string,
  environment: Environment | null,
): Record<string, { default: string }> {
  const variables: Record<string, { default: string }> = {};
  const names = new Set([...source.matchAll(VARIABLE)].map((match) => match[1]));
  for (const name of names) {
    if (name === undefined) continue;
    const variable = environment?.variables.find((entry) => entry.name === name);
    variables[name] = { default: variable === undefined || variable.secret ? '' : variable.value };
  }
  return variables;
}

function serverFor(connection: Connection, workspace: Workspace): AsyncApiServer | null {
  const match = WS_URL.exec(connection.transport.url);
  if (match === null) return null;
  const protocol = match[1]?.toLowerCase();
  const host = match[2];
  if ((protocol !== 'ws' && protocol !== 'wss') || host === undefined) return null;

  const pathname = match[3];
  const variables = serverVariables(
    `${host}${pathname ?? ''}`,
    environmentFor(connection, workspace),
  );
  return {
    host: template(host),
    protocol,
    title: connection.name,
    ...(pathname === undefined ? {} : { pathname: template(pathname) }),
    ...(Object.keys(variables).length === 0 ? {} : { variables }),
  };
}

/** Derives standard servers while keeping unparseable template URLs in x-hybi only. */
export function createAsyncApiServers(workspace: Workspace): ExportServers {
  const servers: Record<string, AsyncApiServer> = {};
  const connectionIds = workspace.connections.map((connection, index) => {
    const server = serverFor(connection, workspace);
    if (server === null) return null;
    const id = `connection${String(index + 1)}`;
    servers[id] = server;
    return id;
  });
  return { servers, connectionIds };
}
