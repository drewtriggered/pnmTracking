import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  DEFAULT_REMINDER_SETTINGS,
  type ReminderSettings,
} from '../../functions/src/logic';
import { useAuth } from '../auth/AuthProvider';
import { watchReminderSettings } from '../data/settings';

const SettingsContext = createContext<ReminderSettings>(DEFAULT_REMINDER_SETTINGS);

/** Chapter-wide reminder config, shared by the UI and the daily job. */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const { link } = useAuth();
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_REMINDER_SETTINGS);

  // Only once the account is a member: settings are member-readable, so
  // subscribing before the invite is claimed is a guaranteed denied read.
  useEffect(() => {
    if (!link) return;
    return watchReminderSettings(setSettings);
  }, [link]);
  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
}

export function useReminderSettings(): ReminderSettings {
  return useContext(SettingsContext);
}
