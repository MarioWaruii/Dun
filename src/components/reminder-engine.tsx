import { Bell, BellOff } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { needsReminder, nextReminderAt } from "@/lib/tasks/schedule";
import { readReminderPrefs, writeReminderPrefs } from "@/lib/tasks/reminders";
import type { Task } from "@/lib/tasks/types";
import { formatRelativeHours } from "@/lib/utils";

export function ReminderEngine({
  tasks,
  onMarkReminded,
}: {
  tasks: Task[];
  onMarkReminded: (ids: string[]) => Promise<void> | void;
}) {
  const [prefs, setPrefs] = useState(readReminderPrefs);
  const [now, setNow] = useState(() => Date.now());
  const firedRef = useRef("");

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    const onVis = () => {
      if (document.visibilityState === "visible") setNow(Date.now());
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const due = useMemo(() => {
    const t = new Date(now);
    return tasks.filter((task) => needsReminder(task, t));
  }, [tasks, now]);

  const next = useMemo(() => {
    const t = new Date(now);
    let soonest: number | null = null;
    for (const task of tasks) {
      const at = nextReminderAt(task, t);
      if (!at) continue;
      const ms = at.getTime();
      if (soonest === null || ms < soonest) soonest = ms;
    }
    return soonest;
  }, [tasks, now]);

  useEffect(() => {
    if (!prefs.enabled || due.length === 0) return;
    const key = due.map((t) => `${t.id}:${t.lastRemindedAt ?? ""}`).join("|");
    if (firedRef.current === key) return;
    firedRef.current = key;
    const ids = due.map((t) => t.id);
    const body =
      due.length === 1
        ? `${due[0]?.emoji} ${due[0]?.title} is still open`
        : `${due.length} tasks are still waiting`;

    toast(due.length === 1 ? "Still on your list" : "4-hour reminder", {
      description: body,
    });

    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        new Notification("Dun", { body, tag: "dun-reminder" });
      } catch {
        /* unsupported */
      }
    }

    void onMarkReminded(ids);
  }, [due, prefs.enabled, onMarkReminded]);

  async function enable() {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch {
        /* ignore */
      }
    }
    const nextPrefs = { enabled: true, asked: true };
    writeReminderPrefs(nextPrefs);
    setPrefs(nextPrefs);
  }

  function disable() {
    const nextPrefs = { enabled: false, asked: true };
    writeReminderPrefs(nextPrefs);
    setPrefs(nextPrefs);
  }

  const eta =
    next && next > now ? `Next nudge in ${formatRelativeHours(next - now)}` : "No open tasks to nudge";

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-card px-4 py-3 shadow-card">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">
          {prefs.enabled ? "4-hour reminders on" : "Reminders paused"}
        </p>
        <p className="truncate text-xs text-muted-foreground">{eta}</p>
      </div>
      {prefs.enabled ? (
        <Button size="sm" variant="ghost" onClick={disable} aria-label="Pause reminders">
          <BellOff />
        </Button>
      ) : (
        <Button size="sm" variant="outline" onClick={() => void enable()}>
          <Bell />
          Enable
        </Button>
      )}
    </div>
  );
}
