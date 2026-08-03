import type { RefObject } from 'react';
import type { VariableHover } from '@/shared/monaco/useVariableHover.js';
import { ContextMenu } from '@/shared/ui/ContextMenu.js';
import { DuplicateIcon, PasteIcon } from '@/shared/ui/icons.js';
import { VariablePopover } from '@/features/workspace/VariablePopover.js';

type Props = {
  containerRef: RefObject<HTMLDivElement | null>;
  hasSelection: boolean;
  hover: VariableHover | null;
  environmentId: string | null;
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
  onCopy,
  onPaste,
  onCloseHover,
  onKeepHover,
  onReleaseHover,
}: Props) {
  return (
    <>
      <ContextMenu
        label="Acciones del editor"
        items={[
          {
            label: 'Copiar',
            icon: <DuplicateIcon />,
            disabled: !hasSelection,
            onSelect: onCopy,
          },
          { label: 'Pegar', icon: <PasteIcon />, onSelect: onPaste },
        ]}
      >
        <div
          className="payload-editor-runtime ml-3 min-h-0 flex-1"
          ref={containerRef}
          data-testid="payload-editor"
          data-part="payload-editor"
        />
      </ContextMenu>
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
