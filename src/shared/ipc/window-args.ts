import type { WindowRole } from './contract.js';

/**
 * Both windows share one renderer bundle, so each is told what it is through
 * `webPreferences.additionalArguments`. Unlike a query string these survive a
 * reload, so devtools' Ctrl+R cannot turn the workbench back into welcome.
 */
const ROLE_FLAG = '--hybi-role=';
const WORKSPACE_FLAG = '--hybi-workspace=';
const VERSION_FLAG = '--hybi-version=';
const LOCALE_FLAG = '--hybi-locale=';

/** The flags the main process hands a welcome window. */
export function welcomeArgs(): string[] {
  return [`${ROLE_FLAG}welcome`];
}

/** The flags the main process hands a workbench window. */
export function workbenchArgs(workspaceId: string): string[] {
  return [`${ROLE_FLAG}workbench`, `${WORKSPACE_FLAG}${workspaceId}`];
}

/** Anything that is not explicitly the workbench is the welcome window. */
export function roleOf(argv: readonly string[]): WindowRole {
  return argv.includes(`${ROLE_FLAG}workbench`) ? 'workbench' : 'welcome';
}

/** `null` when the window was not opened against a document. */
export function workspaceIdOf(argv: readonly string[]): string | null {
  const flag = argv.find((entry) => entry.startsWith(WORKSPACE_FLAG));
  return flag === undefined ? null : flag.slice(WORKSPACE_FLAG.length);
}

/** A sandboxed preload cannot reach `app.getVersion`, so the flag carries it. */
export function versionArg(version: string): string {
  return `${VERSION_FLAG}${version}`;
}

export function versionOf(argv: readonly string[]): string {
  const flag = argv.find((entry) => entry.startsWith(VERSION_FLAG));
  return flag === undefined ? '0.0.0' : flag.slice(VERSION_FLAG.length);
}

/**
 * `app.getLocale` and not `navigator.language`: on Linux they disagree often
 * enough that the app would read in one language and the native dialogs in
 * another.
 */
export function localeArg(locale: string): string {
  return `${LOCALE_FLAG}${locale}`;
}

export function localeOf(argv: readonly string[]): string {
  const flag = argv.find((entry) => entry.startsWith(LOCALE_FLAG));
  return flag === undefined ? 'en' : flag.slice(LOCALE_FLAG.length);
}
