import { rename, rm, writeFile } from 'node:fs/promises';
import { join, parse } from 'node:path';
import type { Workspace } from '@shared/domain/types.js';
import { createAsyncApiDocument } from './exporter.js';

const INVALID_FILE_NAME = /[<>:"/\\|?*]/g;

function replaceControlCharacters(value: string): string {
  let safe = '';
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    safe += codePoint !== undefined && codePoint < 32 ? '-' : character;
  }
  return safe;
}

/** Produces a cross-platform JSON filename without allowing path separators. */
export function asyncApiDefaultFileName(workspaceName: string): string {
  const safe = replaceControlCharacters(workspaceName)
    .replace(INVALID_FILE_NAME, '-')
    .trim()
    .replace(/[ .]+$/g, '');
  return `${safe === '' ? 'workspace' : safe}.json`;
}

function jsonPath(selectedPath: string): string {
  const parts = parse(selectedPath);
  if (parts.base === '') throw new Error('Export path is empty');
  return join(parts.dir, `${parts.name}.json`);
}

/** Writes atomically and normalizes every chosen extension to .json. */
export async function writeAsyncApiExport(
  workspace: Workspace,
  selectedPath: string,
): Promise<string> {
  const filePath = jsonPath(selectedPath);
  const temporary = `${filePath}.tmp`;
  const contents = `${JSON.stringify(createAsyncApiDocument(workspace), null, 2)}\n`;
  try {
    await writeFile(temporary, contents, 'utf8');
    await rename(temporary, filePath);
    return filePath;
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}
