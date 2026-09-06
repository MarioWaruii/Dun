import { addDays, localDateISO, startOfDay, weekdayName } from "@/lib/utils";
import type { DueBucket, ScheduleKind, Task } from "./types";

export const REMINDER_MS = 4 * 60 * 60 * 1000;

export function scheduledDateThisWeek(now: Date, weekday: number): Date {
  const start = startOfDay(now);
  const diff = weekday - start.getDay();
  return addDays(start, diff);
}

function weekStartSunday(now: Date): Date {
  return addDays(startOfDay(now), -now.getDay());
}

export function isOpen(task: Task, now = new Date()): boolean {
  const today = localDateISO(now);
  switch (task.scheduleKind) {
    case "daily":
      return task.completedOn !== today;
    case "weekly": {
      const weekStartIso = localDateISO(weekStartSunday(now));
      return !(task.completedOn && task.completedOn >= weekStartIso);
    }
    case "date":
    case "once":
      return !task.done;
  }
}

export function dueBucket(task: Task, now = new Date()): DueBucket {
  if (!isOpen(task, now)) return "done";
  const today = localDateISO(now);

  if (task.scheduleKind === "daily") return "today";

  if (task.scheduleKind === "weekly") {
    const weekday = task.weekday ?? 0;
    if (now.getDay() === weekday) return "today";
    const scheduled = scheduledDateThisWeek(now, weekday);
    if (startOfDay(now) > scheduled) return "overdue";
    return "upcoming";
  }

  const due = task.dueDate;
  if (!due) return "today";
  if (due === today) return "today";
  if (due < today) return "overdue";
  return "upcoming";
}

export function isActiveForReminders(task: Task, now = new Date()): boolean {
  const bucket = dueBucket(task, now);
  return bucket === "today" || bucket === "overdue";
}

export function nextReminderAt(task: Task, now = new Date()): Date | null {
  if (!isActiveForReminders(task, now)) return null;
  const last = task.lastRemindedAt ? Date.parse(task.lastRemindedAt) : NaN;
  const created = Date.parse(task.createdAt);
  const anchor = Number.isFinite(last) ? last : created;
  return new Date(anchor + REMINDER_MS);
}

export function needsReminder(task: Task, now = new Date()): boolean {
  const next = nextReminderAt(task, now);
  if (!next) return false;
  return now.getTime() >= next.getTime();
}

export function scheduleLabel(task: Pick<Task, "scheduleKind" | "dueDate" | "weekday">): string {
  switch (task.scheduleKind) {
    case "daily":
      return "Daily";
    case "weekly":
      return `Weekly · ${weekdayName(task.weekday ?? 0)}`;
    case "date":
      return task.dueDate ? task.dueDate : "Set date";
    case "once":
      return task.dueDate ? task.dueDate : "Anytime";
  }
}

export function schedulePrompt(kind: ScheduleKind): string {
  switch (kind) {
    case "daily":
      return "Repeats every day until you tick it off.";
    case "weekly":
      return "Shows up on the weekday you pick.";
    case "date":
      return "Nudge starts on the date, then every 4 hours.";
    case "once":
      return "A one-off. Reminders every 4 hours until done.";
  }
}

export function sortTasks(tasks: Task[], now = new Date()): Task[] {
  const rank: Record<DueBucket, number> = {
    overdue: 0,
    today: 1,
    upcoming: 2,
    done: 3,
  };
  return [...tasks].sort((a, b) => {
    const ba = dueBucket(a, now);
    const bb = dueBucket(b, now);
    if (rank[ba] !== rank[bb]) return rank[ba] - rank[bb];
    return Date.parse(b.createdAt) - Date.parse(a.createdAt);
  });
}
