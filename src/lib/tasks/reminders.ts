const KEY = "dun.reminders.v1";
const LEGACY_KEY = "grove.reminders.v1";

export type ReminderPrefs = {
  enabled: boolean;
  asked: boolean;
};

const DEFAULT_PREFS: ReminderPrefs = { enabled: true, asked: false };

function readRaw(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function readReminderPrefs(): ReminderPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = readRaw(KEY) ?? readRaw(LEGACY_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<ReminderPrefs>;
    return {
      enabled: parsed.enabled !== false,
      asked: Boolean(parsed.asked),
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function writeReminderPrefs(prefs: ReminderPrefs) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(prefs));
}
