import { formatTime } from '@lang/format.js';
import { format } from '@lang/translate.js';
import type { ActivityRecord } from '@shared/ipc/activity.js';
import { useLanguage, useMessages } from '@/shared/i18n/useMessages.js';
import { CloseIcon, DuplicateIcon, SendIcon } from '@/shared/ui/icons.js';
import { IconButton } from '@/shared/ui/IconButton.js';
import { HexFrameView } from './HexFrameView.js';
import { TextFrameView } from './TextFrameView.js';

type Props = {
  record: ActivityRecord;
  onClose: () => void;
  onCopy: () => void;
  onResend: () => void;
  /** False while no event is open: the composer would have nowhere to put it. */
  canResend: boolean;
};

/** Mounted by a selection: the parent renders nothing while no line is marked. */
export function ActivityDetail({ record, onClose, onCopy, onResend, canResend }: Props) {
  const messages = useMessages();
  const language = useLanguage();

  return (
    <div className="flex h-full min-h-0 flex-col" data-testid="activity-detail">
      <header className="flex items-center gap-3 px-3 py-2 text-label">
        <span>{messages.activity.kinds[record.kind]}</span>
        <span className="text-muted">
          {format(messages.activity.bytes, { count: record.bytes })}
        </span>
        <span className="text-muted">{formatTime(language, record.at)}</span>
        <IconButton
          className="ml-auto"
          label={messages.activity.resend}
          disabled={!canResend}
          onClick={onResend}
        >
          <SendIcon />
        </IconButton>
        {/* The frame as it arrived, not the indented copy on screen: what the
            socket carried is what a report or a replay needs. */}
        <IconButton label={messages.activity.copyFrame} onClick={onCopy}>
          <DuplicateIcon />
        </IconButton>
        {/* Clicking the marked line again also closes the pane, but that is not
            discoverable — the pane has to carry its own way out. */}
        <IconButton label={messages.activity.closeDetail} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </header>
      {/* Text goes to the editor, which can colour and indent it. Bytes have
          nothing to colour, so they go to the dump instead. */}
      <div className="min-h-0 flex-1">
        {record.encoding === 'base64' ? (
          <HexFrameView body={record.body} />
        ) : (
          <TextFrameView body={record.body} />
        )}
      </div>
    </div>
  );
}
