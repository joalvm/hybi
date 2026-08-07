import type { VariableScope } from '@shared/variables/resolve.js';
import { BinaryAttachment } from './BinaryAttachment.js';
import { BinaryBar } from './BinaryBar.js';
import { ComposerFooter } from './ComposerFooter.js';
import { EmitBar } from './EmitBar.js';
import { languageOf, type PayloadFormat } from './formats.js';
import { PayloadEditor } from './PayloadEditor.js';
import type { BinaryComposer } from './useBinaryPayload.js';
import type { EmitDraft } from './useEmitDraft.js';

type Props = {
  eventId: string | null;
  text: string;
  scope: VariableScope;
  environmentId: string | null;
  format: PayloadFormat;
  formattable: boolean;
  binary: BinaryComposer;
  /** The event name and ack switch, or `null` for a transport with no events. */
  emit: EmitDraft | null;
  onChange: (next: string) => void;
  onFormatChange: (format: PayloadFormat) => void;
  onBeautify: () => void;
};

/**
 * The Message tab: the payload and the two strips that say how to read it. A
 * picked file stands in for the editor rather than being written into it —
 * megabytes of hex inside Monaco is how this mode stops being usable for the
 * frames it exists to send.
 */
export function ComposerMessage({
  eventId,
  text,
  scope,
  environmentId,
  format,
  formattable,
  binary,
  emit,
  onChange,
  onFormatChange,
  onBeautify,
}: Props) {
  const attached = format === 'binary' && binary.source === 'file';

  return (
    <div className="flex h-full min-h-0 flex-col">
      {emit !== null && (
        <EmitBar
          event={emit.event}
          ack={emit.ack}
          onEventChange={emit.setEvent}
          onAckChange={emit.setAck}
        />
      )}
      {/* A flex column, because the Monaco container inside sizes itself with
          `flex-1` against whatever holds it. */}
      <div className="flex min-h-0 flex-1 flex-col">
        {attached ? (
          <BinaryAttachment file={binary.file} onPick={binary.pickFile} />
        ) : (
          <PayloadEditor
            eventId={eventId}
            text={text}
            language={languageOf(format)}
            scope={scope}
            environmentId={environmentId}
            onChange={onChange}
          />
        )}
      </div>
      {format === 'binary' && (
        <BinaryBar
          source={binary.source}
          payload={binary.payload}
          error={binary.error}
          onSourceChange={binary.setSource}
        />
      )}
      <ComposerFooter
        format={format}
        formattable={formattable}
        onFormatChange={onFormatChange}
        onBeautify={onBeautify}
      />
    </div>
  );
}
