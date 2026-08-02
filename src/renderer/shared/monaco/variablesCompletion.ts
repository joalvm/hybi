import * as monaco from 'monaco-editor/editor/editor.api.js';
import type { VariableScope } from '@shared/variables/resolve.js';

/**
 * Fires on the second `{`. The braces the user already typed stay put, so the
 * inserted text only has to close the token. Secret values are never offered as
 * the completion detail.
 */
export function registerVariablesCompletion(getScope: () => VariableScope) {
  return monaco.languages.registerCompletionItemProvider('json', {
    triggerCharacters: ['{'],
    provideCompletionItems(model, position) {
      const typed = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });
      if (!typed.endsWith('{{')) return { suggestions: [] };

      const range = {
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      };
      return {
        suggestions: [...getScope().values()].map((variable) => ({
          label: variable.name,
          kind: monaco.languages.CompletionItemKind.Variable,
          insertText: `${variable.name}}}`,
          detail: variable.secret ? 'secreto' : variable.value,
          range,
        })),
      };
    },
  });
}
