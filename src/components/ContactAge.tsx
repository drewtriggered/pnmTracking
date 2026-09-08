import { contactAge, daysSince } from '../lib/format';
import type { Pnm } from '../types/models';

/**
 * Colour tracks the Phase 3 reminder thresholds: 5 days triggers a nudge to
 * the lead, 10 escalates to exec. Showing the same cutoffs here means the list
 * and the notifications never disagree about who is cold.
 */
export function ContactAge({ value }: { value: Pnm['lastContactedDate'] }) {
  const days = daysSince(value);
  const tone =
    days === null || days >= 10
      ? 'text-red-600'
      : days >= 5
        ? 'text-amber-600'
        : 'text-gray-500';

  return <span className={`text-xs ${tone}`}>{contactAge(value)}</span>;
}
