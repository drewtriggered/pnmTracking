import { contactAge, daysSince, stampAge } from '../lib/format';
import { useReminderSettings } from '../settings/SettingsProvider';
import type { Pnm } from '../types/models';

/**
 * Days since last contact, tracking the live reminder thresholds: neutral
 * grease-pencil until the lead would be nudged, warning amber past the cold
 * line, deep red once exec would hear about it. Reading the same settings the
 * daily job reads keeps the board and the notifications from disagreeing about
 * who has gone quiet.
 *
 * `variant="stamp"` is the compact form for a plate ("12D"); the default is
 * the full phrase for the detail view ("12 days ago").
 */
export function ContactAge({
  value,
  variant = 'full',
}: {
  value: Pnm['lastContactedDate'];
  variant?: 'full' | 'stamp';
}) {
  const { coldAfterDays, escalateAfterDays } = useReminderSettings();
  const days = daysSince(value);
  const tone =
    days === null || days >= escalateAfterDays
      ? 'text-feedback-error'
      : days >= coldAfterDays
        ? 'text-feedback-warning'
        : 'text-ink-faint';

  if (variant === 'stamp') {
    return <span className={`stamp ${tone}`}>{stampAge(value)}</span>;
  }
  return <span className={`text-sm font-medium ${tone}`}>{contactAge(value)}</span>;
}
