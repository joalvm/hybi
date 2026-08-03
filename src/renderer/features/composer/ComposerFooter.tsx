import { BeautifyIcon } from '@/shared/ui/icons.js';
import { IconButton } from '@/shared/ui/IconButton.js';
import { Select } from '@/shared/ui/Select.js';
import { PAYLOAD_FORMATS, type PayloadFormat } from './formats.js';

type Props = {
  format: PayloadFormat;
  /** Null when there is nothing to re-indent, which is what greys the button. */
  beautified: string | null;
  onFormatChange: (format: PayloadFormat) => void;
  onBeautify: () => void;
};

/**
 * The whole footer: how to read the payload, and one button to tidy it. No
 * verdict on the payload lives here — a client may send whatever shape it likes,
 * so nothing in this app judges the structure of a frame.
 */
export function ComposerFooter({ format, beautified, onFormatChange, onBeautify }: Props) {
  return (
    <div className="flex min-h-9 items-center gap-1 bg-panel px-2">
      <Select
        label="Formato del payload"
        className="h-control border-border bg-panel px-1 text-label text-muted"
        value={format}
        options={PAYLOAD_FORMATS.map((entry) => ({ value: entry.id, label: entry.label }))}
        onChange={(next) => {
          onFormatChange(next as PayloadFormat);
        }}
      />
      <IconButton label="Formatear" disabled={beautified === null} onClick={onBeautify}>
        <BeautifyIcon />
      </IconButton>
    </div>
  );
}
