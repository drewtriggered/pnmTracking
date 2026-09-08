import { collection, doc, onSnapshot, orderBy, query, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  DEFAULT_REMINDER_SETTINGS,
  type ReminderSettings,
} from '../../functions/src/logic';
import type { ReminderSend } from '../types/models';

const SETTINGS_REF = doc(db, 'settings', 'reminders');

/**
 * Watches the reminder settings, merged over the defaults.
 *
 * The client reads the same document the Cloud Function does, so the "going
 * cold" colours in the UI and the thresholds that actually trigger a push can
 * never drift apart.
 */
export function watchReminderSettings(onChange: (settings: ReminderSettings) => void) {
  return onSnapshot(
    SETTINGS_REF,
    (snap) => {
      const stored = (snap.data() ?? {}) as Partial<ReminderSettings>;
      onChange({
        ...DEFAULT_REMINDER_SETTINGS,
        ...stored,
        experiment: {
          ...DEFAULT_REMINDER_SETTINGS.experiment,
          ...(stored.experiment ?? {}),
        },
      });
    },
    // A member who can't read settings still gets a working app on defaults.
    () => onChange(DEFAULT_REMINDER_SETTINGS),
  );
}

export async function saveReminderSettings(settings: ReminderSettings): Promise<void> {
  await setDoc(SETTINGS_REF, settings);
}

export function watchReminderSends(onChange: (sends: ReminderSend[]) => void) {
  const q = query(collection(db, 'reminderSends'), orderBy('sentAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ReminderSend)),
    () => onChange([]),
  );
}
