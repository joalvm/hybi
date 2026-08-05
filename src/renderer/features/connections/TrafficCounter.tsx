import type { ActivityTotals } from '@/store/totals.js';
import { IncomingIcon, OutgoingIcon } from '@/shared/ui/icons.js';
import { formatBytes, formatCount } from '@/shared/utils/bytes.js';

/** The two directions, drawn in the same colours the log gives their rows. */
const SIDES = [
  { key: 'incoming', label: 'Recibido', icon: <IncomingIcon />, tone: 'text-blue' },
  { key: 'outgoing', label: 'Enviado', icon: <OutgoingIcon />, tone: 'text-accent-text' },
] as const;

type Props = { totals: ActivityTotals };

/**
 * What the connection has moved since its log was last cleared, in the bar that
 * owns the connection. Two figures per direction — how many frames and how much
 * they weighed — because a chatty peer and a heavy one are different problems.
 *
 * The count is not read off the log: the budget evicts records, and this must
 * keep answering for the frames that are already gone.
 */
export function TrafficCounter({ totals }: Props) {
  return (
    <div className="flex shrink-0 items-center gap-3 font-mono text-label whitespace-nowrap text-muted">
      {SIDES.map((side) => {
        const count = totals[side.key].messages;
        const messages = formatCount(count);
        const bytes = formatBytes(totals[side.key].bytes);
        return (
          <span
            key={side.key}
            className="inline-flex items-center gap-1"
            aria-label={`${side.label}: ${messages} ${count === 1 ? 'mensaje' : 'mensajes'}, ${bytes}`}
          >
            <span className={side.tone}>{side.icon}</span>
            <span className="tabular-nums">{messages}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{bytes}</span>
          </span>
        );
      })}
    </div>
  );
}
