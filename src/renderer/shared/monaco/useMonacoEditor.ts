import { useEffect, useRef } from 'react';
import type { editor } from 'monaco-editor/editor/editor.api.js';
import { editorTypeface, useEditorPreferences } from './useEditorPreferences.js';
import { monaco, setupMonaco } from './setup.js';

/**
 * How many models the cache keeps. A model is not free: it holds the text, its
 * tokenization, its undo stack and — for JSON — a mirror inside the language
 * worker. Keyed by event, an uncapped cache grew one payload model and one docs
 * model for every event ever opened, so browsing an imported document of a few
 * hundred events never gave that memory back.
 *
 * Well above the three an editor can have on screen at once, and far below the
 * size of a catalog.
 */
const MODEL_LIMIT = 32;

/** Insertion-ordered, so the front of the map is the least recently used key. */
const models = new Map<string, editor.ITextModel>();

/** One model per key, so switching events swaps the model instead of remounting. */
export function modelFor(key: string, value: string): editor.ITextModel {
  const existing = models.get(key);
  if (existing !== undefined && !existing.isDisposed()) {
    // Re-inserted so recency is the map's own order and eviction needs no clock.
    models.delete(key);
    models.set(key, existing);
    return existing;
  }

  const model = monaco.editor.createModel(value, 'json');
  models.set(key, model);
  evictOldest();
  return model;
}

export function disposeModel(key: string): void {
  models.get(key)?.dispose();
  models.delete(key);
}

/**
 * Drops least-recently-used models until the cache is back within its limit. A
 * model an editor is showing is skipped whatever its age: disposing it would
 * leave that editor pointed at nothing.
 */
function evictOldest(): void {
  if (models.size <= MODEL_LIMIT) return;
  for (const [key, model] of models) {
    if (models.size <= MODEL_LIMIT) return;
    if (model.isAttachedToEditor()) continue;
    model.dispose();
    models.delete(key);
  }
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
    // log, not in a full-window IDE. The line height tracks the size the user
    // chose, at the tightest ratio that still leaves the text legible. Three
    // number columns and an 8px decoration strip keep the gutter readable
    // without turning it into an IDE-sized rail.
    const instance = monaco.editor.create(container, {
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      renderWhitespace: 'none',
      fontFamily: 'var(--font-mono)',
      ...editorTypeface(),
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

  // After creation, so the two app-wide settings follow the live instance
  // instead of only the one the next editor is built with.
  useEditorPreferences(editorRef);

  return { containerRef, editorRef };
}
