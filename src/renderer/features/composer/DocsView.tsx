import { cn } from '@/shared/utils/cn.js';
import { IconButton } from '@/shared/ui/IconButton.js';
import { CloseIcon, RenameIcon } from '@/shared/ui/icons.js';
import { Markdown } from '@/shared/markdown/Markdown.js';
import { MarkdownEditor } from './MarkdownEditor.js';

type Props = {
  eventId: string;
  /** `EventItem.description`: what the AsyncAPI document said about the message. */
  description: string | undefined;
  text: string;
  editing: boolean;
  onEdit: () => void;
  onClose: () => void;
  onChange: (next: string) => void;
};

/** Readable documentation until the user explicitly opens its Markdown source. */
export function DocsView({
  eventId,
  description,
  text,
  editing,
  onEdit,
  onClose,
  onChange,
}: Props) {
  return (
    <section className="flex h-full min-h-0 flex-col" aria-label="Documentación del evento">
      <div className={cn('min-h-0 flex-1 overflow-auto px-4 py-3', editing && 'hidden')}>
        {description === undefined || description.trim() === '' ? (
          <p className="text-muted">Este evento no tiene descripción.</p>
        ) : (
          <Markdown source={description} />
        )}
      </div>
      <div className={cn('relative min-h-0 flex-1', !editing && 'hidden')}>
        <MarkdownEditor eventId={eventId} text={text} onChange={onChange} />
        {editing && (
          <div className="absolute top-0 right-2 z-10 pt-2">
            <IconButton
              label="Cerrar editor"
              className="min-h-5 min-w-5 bg-panel shadow-sm"
              onClick={onClose}
            >
              <CloseIcon />
            </IconButton>
          </div>
        )}
      </div>
      {!editing && (
        <div className="flex min-h-9 items-center justify-end px-2">
          <IconButton label="Editar documentación" onClick={onEdit}>
            <RenameIcon />
          </IconButton>
        </div>
      )}
    </section>
  );
}
