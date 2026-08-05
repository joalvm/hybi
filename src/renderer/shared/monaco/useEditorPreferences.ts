import { useEffect, type RefObject } from 'react';
import type { editor } from 'monaco-editor/editor/editor.api.js';
import { usePreferences } from '@/store/preferences.store.js';
import { currentTheme, watchSystemTheme } from '@/shared/theme/apply.js';
import { setMonacoTheme } from './setup.js';

/** Keeps the gutter and the text legible together at any size. */
const LINE_HEIGHT_RATIO = 1.42;

/**
 * Read once, at construction. Not a selector: the editor is created inside an
 * effect that owns a DOM instance, and it has no business re-running because a
 * number moved — the effects below carry the change to the live instance.
 */
export function editorTypeface(): { fontSize: number; lineHeight: number } {
  const { editorFontSize } = usePreferences.getState();
  return {
    fontSize: editorFontSize,
    lineHeight: Math.round(editorFontSize * LINE_HEIGHT_RATIO),
  };
}

/**
 * The two app preferences a Monaco instance cannot read for itself. Font size is
 * per instance; the theme is global to Monaco, so every editor asking for the
 * same one is redundant rather than wrong.
 *
 * This is where the store is read instead of the feature root: neither setting
 * belongs to a feature, and three trees would otherwise carry a preference in
 * props that none of them owns.
 */
export function useEditorPreferences(
  editorRef: RefObject<editor.IStandaloneCodeEditor | null>,
): void {
  const theme = usePreferences((state) => state.theme);
  const fontSize = usePreferences((state) => state.editorFontSize);

  useEffect(() => {
    editorRef.current?.updateOptions({
      fontSize,
      lineHeight: Math.round(fontSize * LINE_HEIGHT_RATIO),
    });
  }, [editorRef, fontSize]);

  useEffect(() => {
    setMonacoTheme(currentTheme(theme));
    // The host only gets a say while the preference defers to it, so there is
    // nothing to listen to in the other two cases.
    if (theme !== 'system') return;
    return watchSystemTheme(() => {
      setMonacoTheme(currentTheme(theme));
    });
  }, [theme]);
}
