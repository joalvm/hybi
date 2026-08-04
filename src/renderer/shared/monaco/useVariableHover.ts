import { useEffect, type RefObject } from 'react';
import type { editor } from 'monaco-editor/editor/editor.api.js';
import { scanVariables, type VariableToken } from '@shared/variables/scan.js';
import type { VirtualAnchor } from '@/shared/ui/Popover.js';
import { useHoverIntent } from '@/shared/ui/useHoverIntent.js';

/**
 * Pure, so the hit-testing rule is testable without laying out an editor.
 * `end` is exclusive, which is what makes the caret just past the closing
 * braces land outside the token rather than on it.
 */
export function variableAtOffset(text: string, offset: number): VariableToken | null {
  return scanVariables(text).find((token) => offset >= token.start && offset < token.end) ?? null;
}

export type VariableHover = { name: string; anchor: VirtualAnchor };

/**
 * A hover panel Monaco does not own. The editor reports a position, the model
 * turns it into an offset, and `getScrolledVisiblePosition` plus the container
 * rect turns the token back into a screen box the popover can hang off.
 *
 * It closes on scroll and on a model swap because the box it was given stops
 * describing anything the moment the text moves.
 */
export function useVariableHover(
  editorRef: RefObject<editor.IStandaloneCodeEditor | null>,
  text: string,
): {
  hover: VariableHover | null;
  keepOpen: () => void;
  release: () => void;
  close: () => void;
} {
  const { value, point, keepOpen, release, close } = useHoverIntent<VariableHover>();

  useEffect(() => {
    const instance = editorRef.current;
    if (instance === null) return;

    const move = instance.onMouseMove((event) => {
      const position = event.target.position;
      const model = instance.getModel();
      if (position === null || model === null) return;

      const token = variableAtOffset(text, model.getOffsetAt(position));
      // The pointer may be crossing the gap between the token and the panel,
      // so leaving a token asks for a close rather than performing one.
      if (token === null) {
        release();
        return;
      }

      point(() => {
        const from = instance.getScrolledVisiblePosition(model.getPositionAt(token.start));
        const to = instance.getScrolledVisiblePosition(model.getPositionAt(token.end));
        const container = instance.getContainerDomNode().getBoundingClientRect();
        if (from === null || to === null) return null;

        const rect = new DOMRect(
          container.left + from.left,
          container.top + from.top,
          Math.max(to.left - from.left, 4),
          from.height,
        );
        return { name: token.name, anchor: { getBoundingClientRect: () => rect } };
      });
    });

    const leave = instance.onMouseLeave(release);
    const scroll = instance.onDidScrollChange(close);
    const swap = instance.onDidChangeModel(close);

    return () => {
      move.dispose();
      leave.dispose();
      scroll.dispose();
      swap.dispose();
    };
  }, [close, editorRef, point, release, text]);

  return { hover: value, keepOpen, release, close };
}
