import { useEffect, useRef, useState, type RefObject } from 'react';
import type { editor } from 'monaco-editor/editor/editor.api.js';
import { scanVariables, type VariableToken } from '@shared/variables/scan.js';
import type { VirtualAnchor } from '@/shared/ui/Popover.js';

/**
 * Pure, so the hit-testing rule is testable without laying out an editor.
 * `end` is exclusive, which is what makes the caret just past the closing
 * braces land outside the token rather than on it.
 */
export function variableAtOffset(text: string, offset: number): VariableToken | null {
  return scanVariables(text).find((token) => offset >= token.start && offset < token.end) ?? null;
}

export type VariableHover = { name: string; anchor: VirtualAnchor };

/** How long the pointer has to rest on a token before the panel appears. */
const DELAY_MS = 250;

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
  const [hover, setHover] = useState<VariableHover | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inside = useRef(false);

  useEffect(() => {
    const instance = editorRef.current;
    if (instance === null) return;

    const clear = (): void => {
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = null;
    };

    const move = instance.onMouseMove((event) => {
      const position = event.target.position;
      const model = instance.getModel();
      if (position === null || model === null) return;

      const token = variableAtOffset(text, model.getOffsetAt(position));
      if (token === null) {
        // The pointer inside the panel is not the pointer leaving the token.
        if (!inside.current) setHover(null);
        clear();
        return;
      }

      clear();
      timer.current = setTimeout(() => {
        const start = model.getPositionAt(token.start);
        const end = model.getPositionAt(token.end);
        const from = instance.getScrolledVisiblePosition(start);
        const to = instance.getScrolledVisiblePosition(end);
        const container = instance.getContainerDomNode().getBoundingClientRect();
        if (from === null || to === null) return;

        const rect = new DOMRect(
          container.left + from.left,
          container.top + from.top,
          Math.max(to.left - from.left, 4),
          from.height,
        );
        setHover({ name: token.name, anchor: { getBoundingClientRect: () => rect } });
      }, DELAY_MS);
    });

    const leave = instance.onMouseLeave(() => {
      clear();
      if (!inside.current) setHover(null);
    });

    const scroll = instance.onDidScrollChange(() => {
      clear();
      setHover(null);
    });

    const swap = instance.onDidChangeModel(() => {
      clear();
      setHover(null);
    });

    return () => {
      clear();
      move.dispose();
      leave.dispose();
      scroll.dispose();
      swap.dispose();
    };
  }, [editorRef, text]);

  return {
    hover,
    keepOpen: () => {
      inside.current = true;
    },
    // Leaving the panel does not close it on its own: the draft in the field
    // would go with it. It hands the decision back to the editor, which closes
    // on the next move that is not over a token.
    release: () => {
      inside.current = false;
    },
    close: () => {
      inside.current = false;
      setHover(null);
    },
  };
}
