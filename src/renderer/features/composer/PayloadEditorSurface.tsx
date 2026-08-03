import type { RefObject } from 'react';
import type { VariableHover } from '@/shared/monaco/useVariableHover.js';
import { VariablePopover } from '@/features/workspace/VariablePopover.js';
import { EditorContextMenu } from './EditorContextMenu.js';

type Props = {
  containerRef: RefObject<HTMLDivElement | null>;
  hasSelection: boolean;
  hover: VariableHover | null;
  environmentId: string | null;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onCloseHover: () => void;
  onKeepHover: () => void;
  onReleaseHover: () => void;
};

/** Monaco container plus its two overlays; editor state stays in the parent. */
export function PayloadEditorSurface({
  containerRef,
  hasSelection,
  hover,
  environmentId,
  onCut,
  onCopy,
  onPaste,
  onCloseHover,
  onKeepHover,
  onReleaseHover,
}: Props) {
  return (
    <>
      <EditorContextMenu
        hasSelection={hasSelection}
        onCut={onCut}
        onCopy={onCopy}
        onPaste={onPaste}
      >
        <div
          className="payload-editor-runtime ml-3 min-h-0 flex-1"
          ref={containerRef}
          data-testid="payload-editor"
          data-part="payload-editor"
        />
      </EditorContextMenu>
      {hover !== null && (
        <VariablePopover
          key={hover.name}
          name={hover.name}
          environmentId={environmentId}
          anchor={hover.anchor}
          onClose={onCloseHover}
          onPointerEnter={onKeepHover}
          onPointerLeave={onReleaseHover}
        />
      )}
    </>
  );
}
