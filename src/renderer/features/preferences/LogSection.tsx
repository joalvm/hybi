import {
  ACTIVITY_BYTE_LIMIT_RANGE,
  ACTIVITY_LIMIT_RANGE,
  MEGABYTE,
} from '@shared/preferences/defaults.js';
import { useMessages } from '@/shared/i18n/useMessages.js';
import { NumberField } from '@/shared/ui/NumberField.js';

type Props = {
  activityLimit: number;
  activityByteLimit: number;
  onActivityLimitChange: (records: number) => void;
  onActivityByteLimitChange: (bytes: number) => void;
};

/**
 * The two limits that decide what the log throws away. Whichever is reached
 * first wins, which is why both are here instead of one standing for the other:
 * a thousand small frames and one huge one are the same log to a record count
 * and nothing alike to memory.
 *
 * Bytes on disk, megabytes on screen — nobody budgets a log in bytes.
 */
export function LogSection({
  activityLimit,
  activityByteLimit,
  onActivityLimitChange,
  onActivityByteLimitChange,
}: Props) {
  const messages = useMessages().preferences;

  return (
    <div className="flex flex-col">
      <NumberField
        label={messages.activityLimit.label}
        description={messages.activityLimit.description}
        value={activityLimit}
        min={ACTIVITY_LIMIT_RANGE.min}
        max={ACTIVITY_LIMIT_RANGE.max}
        onChange={onActivityLimitChange}
      />
      <NumberField
        label={messages.activityByteLimit.label}
        description={messages.activityByteLimit.description}
        value={Math.round(activityByteLimit / MEGABYTE)}
        min={Math.round(ACTIVITY_BYTE_LIMIT_RANGE.min / MEGABYTE)}
        max={Math.round(ACTIVITY_BYTE_LIMIT_RANGE.max / MEGABYTE)}
        unit="MB"
        onChange={(megabytes) => {
          onActivityByteLimitChange(megabytes * MEGABYTE);
        }}
      />
    </div>
  );
}
