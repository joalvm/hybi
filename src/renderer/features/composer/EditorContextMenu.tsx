import type { ReactNode } from 'react';
import { useMessages } from '@/shared/i18n/useMessages.js';
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
  const messages = useMessages();

  return (
    <ContextMenu
      label={messages.composer.editorActions}
      items={[
        {
          label: messages.common.cut,
          icon: <CutIcon />,
          disabled: !hasSelection,
          onSelect: onCut,
        },
        {
          label: messages.common.copy,
          icon: <DuplicateIcon />,
          disabled: !hasSelection,
          onSelect: onCopy,
        },
        { label: messages.common.paste, icon: <PasteIcon />, onSelect: onPaste },
      ]}
    >
      {children}
    </ContextMenu>
  );
}
