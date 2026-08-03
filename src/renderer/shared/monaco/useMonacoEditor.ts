import { useEffect, useRef } from 'react';
import type { editor } from 'monaco-editor/editor/editor.api.js';
import { monaco, setupMonaco } from './setup.js';

const models = new Map<string, editor.ITextModel>();

/** One model per key, so switching events swaps the model instead of remounting. */
export function modelFor(key: string, value: string): editor.ITextModel {
  const existing = models.get(key);
  if (existing !== undefined && !existing.isDisposed()) return existing;
  const model = monaco.editor.createModel(value, 'json');
  models.set(key, model);
  return model;
}

export function disposeModel(key: string): void {
  models.get(key)?.dispose();
  models.delete(key);
}

export function useMonacoEditor(options: editor.IStandaloneEditorConstructionOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const optionsRef = useRef(options);

  // Empty deps on purpose: this effect owns a DOM instance for the lifetime of
  // the component, it does not derive state. Options are read once at creation.
  useEffect(() => {
    setupMonaco();
    const container = containerRef.current;
    if (container === null) return;
    // Dense on purpose: this is a desktop tool, and a payload is read next to a
    // log, not in a full-window IDE. The line height is the tightest that still
    // leaves the text legible. Three number columns and an 8px decoration strip
    // keep the gutter readable without turning it into an IDE-sized rail.
    const instance = monaco.editor.create(container, {
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      renderWhitespace: 'none',
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      lineHeight: 17,
      lineNumbersMinChars: 3,
      lineDecorationsWidth: 8,
      glyphMargin: false,
      padding: { top: 4, bottom: 4 },
      tabSize: 4,
      insertSpaces: true,
      detectIndentation: false,
      renderLineHighlight: 'all',
      wordWrap: 'on',
      overviewRulerLanes: 0,
      scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
      bracketPairColorization: { enabled: true },
      contextmenu: false,
      ...optionsRef.current,
    });
    editorRef.current = instance;
    return () => {
      instance.dispose();
      editorRef.current = null;
    };
  }, []);

  return { containerRef, editorRef };
}
