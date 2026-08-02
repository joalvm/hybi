import type { editor } from 'monaco-editor/editor/editor.api.js';

/**
 * Inherits vs and only repaints the chrome, so the editor reads as part of the
 * panel it sits in rather than as a separate surface. The literals mirror
 * `tokens.css`; Monaco resolves theme colors itself and cannot read CSS vars.
 */
export const WORKBENCH_THEME: editor.IStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#ffffff',
    'editorGutter.background': '#ffffff',
    'editorLineNumber.foreground': '#a6a6b0',
    'editorLineNumber.activeForeground': '#6a6a74',
    'editorWidget.background': '#ffffff',
    'editorWidget.border': '#dedee2',
    'editor.lineHighlightBackground': '#f6f6f7',
  },
};
