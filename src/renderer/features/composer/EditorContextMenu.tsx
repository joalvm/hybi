import type { ReactNode } from 'react';
import { ContextMenu } from '@/shared/ui/ContextMenu.js';
import { CutIcon, DuplicateIcon, PasteIcon } from '@/shared/ui/icons.js';

type Props = {
  children: ReactNode;
  hasSelection: boolean;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
};

/** The intentionally small native-editor menu shared by both Monaco roles. */
export function EditorContextMenu({
  children,
  hasSelection,
  onCut,
  onCopy,
  onPaste,
}: Props) {
  return (
    <ContextMenu
      label="Acciones del editor"
      items={[
        {
          label: 'Cortar',
          icon: <CutIcon />,
          disabled: !hasSelection,
          onSelect: onCut,
        },
        {
          label: 'Copiar',
          icon: <DuplicateIcon />,
          disabled: !hasSelection,
          onSelect: onCopy,
        },
        { label: 'Pegar', icon: <PasteIcon />, onSelect: onPaste },
      ]}
    >
      {children}
    </ContextMenu>
  );
}
