import { Fragment } from 'react';
import { plural } from '@lang/translate.js';
import type { ActivityTotals } from '@/store/totals.js';
import { useMessages } from '@/shared/i18n/useMessages.js';
import { IncomingIcon, OutgoingIcon, RecordsIcon } from '@/shared/ui/icons.js';
import { formatBytes, formatCount } from '@/shared/utils/bytes.js';

/** The two directions, drawn in the same colours the log gives their rows. */
const SIDES = [
  { key: 'incoming', icon: <IncomingIcon />, tone: 'text-blue' },
  { key: 'outgoing', icon: <OutgoingIcon />, tone: 'text-accent-text' },
] as const;

type Props = { totals: ActivityTotals };

/**
 * What this connection has moved since its log was last cleared, pinned under
 * the log it describes. Three figures: how many lines arrived at all, then how
 * many frames and how much they weighed per direction — a chatty peer and a
 * heavy one are different problems, and neither is the same as a socket that
 * spends the session reconnecting.
 *
 * None of it is read off the log. The budget evicts records once the connection
 * is over 2000 frames or 8 MB, and these have to keep answering for the ones
 * that are already gone.
 */
export function ActivityTotalsBar({ totals }: Props) {
  const traffic = useMessages().activity.traffic;
  const records = formatCount(totals.records);

  return (
    <div
      className="flex items-center gap-2 px-3 py-1 font-mono text-label whitespace-nowrap text-muted"
      data-testid="activity-totals"
    >
      <span
        className="inline-flex items-center gap-1"
        aria-label={plural(traffic.records, totals.records, { count: records })}
      >
        <RecordsIcon />
        <span className="tabular-nums">{records}</span>
      </span>
      {SIDES.map((side) => {
        const count = totals[side.key].messages;
        const messages = formatCount(count);
        const bytes = formatBytes(totals[side.key].bytes);
        return (
          <Fragment key={side.key}>
            <span aria-hidden="true" className="text-border">
              |
            </span>
            <span
              className="inline-flex items-center gap-1"
              aria-label={plural(traffic.summary, count, {
                side: traffic[side.key],
                messages,
                bytes,
              })}
            >
              <span className={side.tone}>{side.icon}</span>
              <span className="tabular-nums">{messages}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{bytes}</span>
            </span>
          </Fragment>
        );
      })}
    </div>
  );
}
