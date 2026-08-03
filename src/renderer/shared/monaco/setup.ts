import * as monaco from 'monaco-editor/editor/editor.api.js';
import 'monaco-editor/features/codicon/register.js';
import 'monaco-editor/features/codeEditor/register.js';
import 'monaco-editor/features/tokenization/register.js';
import 'monaco-editor/features/hover/register.js';
import 'monaco-editor/features/suggest/register.js';
import 'monaco-editor/features/snippet/register.js';
import 'monaco-editor/features/bracketMatching/register.js';
import 'monaco-editor/features/folding/register.js';
import 'monaco-editor/features/find/register.js';
import 'monaco-editor/features/format/register.js';
import 'monaco-editor/features/contextmenu/register.js';
import 'monaco-editor/features/clipboard/register.js';
import 'monaco-editor/features/cursorUndo/register.js';
import 'monaco-editor/features/linesOperations/register.js';
import 'monaco-editor/features/wordOperations/register.js';
import 'monaco-editor/features/multicursor/register.js';
import 'monaco-editor/features/readOnlyMessage/register.js';
import { jsonDefaults } from 'monaco-editor/languages/features/json/register.js';
// Colouring only. Both are Monarch grammars behind a lazy loader, so they cost a
// chunk each and no worker — the format picker offers them, nothing validates
// them. `plaintext` needs no registration, which covers Text and Binary.
import 'monaco-editor/languages/definitions/xml/register.js';
import 'monaco-editor/languages/definitions/html/register.js';
import type { VariableScope } from '@shared/variables/resolve.js';
import { installWorkers } from './workers.js';
import { WORKBENCH_THEME_DARK, WORKBENCH_THEME_LIGHT } from './theme.js';
import { registerVariablesCompletion } from './variablesCompletion.js';

let ready = false;
let providersReady = false;

export type VisualTheme = 'light' | 'dark';

function activeTheme(): VisualTheme {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === 'light' || explicit === 'dark') return explicit;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Features are imported one by one rather than through `features/register.all.js`.
 * Both land on roughly 4.1 MB of minified renderer code, but register.all pins
 * 4.05 MB of it into the eager chunk while this list keeps it at 3.47 MB and
 * lets the rest ride along with the lazily loaded json mode. The JSON language
 * arrives through its own register module, and the package root is never
 * imported — it drags in every language monaco ships.
 */
export function setupMonaco(): typeof monaco {
  if (ready) return monaco;
  installWorkers();
  monaco.editor.defineTheme('workbench-light', WORKBENCH_THEME_LIGHT);
  monaco.editor.defineTheme('workbench-dark', WORKBENCH_THEME_DARK);
  monaco.editor.setTheme(`workbench-${activeTheme()}`);
  jsonDefaults.setDiagnosticsOptions({
    validate: true,
    allowComments: false,
    schemaValidation: 'error',
    // The editor must never reach the network to resolve a $ref.
    enableSchemaRequest: false,
  });
  ready = true;
  return monaco;
}

/** Keeps Monaco aligned with the temporary renderer theme switch. */
export function setMonacoTheme(theme: VisualTheme): void {
  setupMonaco();
  monaco.editor.setTheme(`workbench-${theme}`);
}

/** Registered once for the whole app, not once per editor instance. */
export function registerVariableProviders(getScope: () => VariableScope): void {
  if (providersReady) return;
  setupMonaco();
  // No hover provider: a `{{var}}` answers with the React popover, which can
  // edit the value instead of only printing it.
  registerVariablesCompletion(getScope);
  providersReady = true;
}

export { monaco };
