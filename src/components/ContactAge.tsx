import { contactAge, daysSince } from '../lib/format';
import { useReminderSettings } from '../settings/SettingsProvider';
import type { Pnm } from '../types/models';

/**
 * Colour tracks the live reminder thresholds — amber once the lead would be
 * nudged, red once exec would hear about it. Reading the same settings the
 * daily job reads means the list and the notifications can't disagree about
 * who is cold, even after someone retunes them.
 */
export function ContactAge({ value }: { value: Pnm['lastContactedDate'] }) {
  const { coldAfterDays, escalateAfterDays } = useReminderSettings();
  const days = daysSince(value);
  const tone =
    days === null || days >= escalateAfterDays
      ? 'text-red-600'
      : days >= coldAfterDays
        ? 'text-amber-600'
        : 'text-gray-500';

  return <span className={`text-xs ${tone}`}>{contactAge(value)}</span>;
}
