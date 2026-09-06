import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CIRCLE_EMOJIS, TASK_EMOJIS } from "@/lib/tasks/emojis";
import { schedulePrompt } from "@/lib/tasks/schedule";
import type { Circle, ScheduleKind, TaskDraft } from "@/lib/tasks/types";
import { cn, localDateISO, weekdayName } from "@/lib/utils";

const KINDS: { id: ScheduleKind; label: string; hint: string }[] = [
  { id: "once", label: "Anytime", hint: "Once" },
  { id: "daily", label: "Daily", hint: "Every day" },
  { id: "weekly", label: "Weekly", hint: "A weekday" },
  { id: "date", label: "A date", hint: "One day" },
];

export function TaskComposer({
  open,
  onOpenChange,
  circles,
  signedIn,
  defaultCircleId,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  circles: Circle[];
  signedIn: boolean;
  defaultCircleId?: string | null;
  onSubmit: (draft: TaskDraft) => Promise<void> | void;
}) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [emoji, setEmoji] = useState("✅");
  const [kind, setKind] = useState<ScheduleKind>("once");
  const [dueDate, setDueDate] = useState(localDateISO());
  const [weekday, setWeekday] = useState(1);
  const [circleId, setCircleId] = useState<string | null>(defaultCircleId ?? null);
  const [busy, setBusy] = useState(false);

  const canSave = title.trim().length > 0 && !busy;
  const prompt = useMemo(() => schedulePrompt(kind), [kind]);

  async function save() {
    if (!canSave) return;
    setBusy(true);
    try {
      await onSubmit({
        title: title.trim(),
        notes,
        emoji,
        scheduleKind: kind,
        dueDate: kind === "date" || kind === "once" ? dueDate || null : null,
        weekday: kind === "weekly" ? weekday : null,
        circleId: signedIn ? circleId : null,
      });
      setTitle("");
      setNotes("");
      setKind("once");
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="flex flex-col gap-5 overflow-y-auto px-5 pb-5 pt-4">
          <div>
            <DrawerTitle>New task</DrawerTitle>
            <DrawerDescription className="mt-1">
              Daily, weekly, or a set date — Dun nudges undone work every 4 hours.
            </DrawerDescription>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="task-title">What needs doing?</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Send the invoice"
              autoComplete="off"
              maxLength={200}
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Pick a mark</p>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {TASK_EMOJIS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setEmoji(item)}
                  className={cn(
                    "grid size-11 shrink-0 place-items-center rounded-md text-xl transition-colors duration-150",
                    emoji === item ? "bg-leaf-soft" : "bg-muted/60 hover:bg-muted",
                  )}
                  aria-label={`Use ${item}`}
                  aria-pressed={emoji === item}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Is this daily, weekly, or for a set date?</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {KINDS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setKind(item.id)}
                  className={cn(
                    "rounded-lg border px-3 py-3 text-left transition-colors duration-150",
                    kind === item.id
                      ? "border-primary bg-leaf-soft"
                      : "border-border bg-card hover:bg-muted",
                  )}
                >
                  <span className="block text-sm font-medium">{item.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{item.hint}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{prompt}</p>
          </div>

          {kind === "weekly" ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Which day?</p>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setWeekday(day)}
                    className={cn(
                      "h-11 flex-1 rounded-md text-xs font-medium",
                      weekday === day ? "bg-ink text-ink-foreground" : "bg-muted text-foreground",
                    )}
                  >
                    {weekdayName(day).slice(0, 2)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {kind === "date" || kind === "once" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="task-date">{kind === "date" ? "Which date?" : "Date (optional)"}</Label>
              <Input
                id="task-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          ) : null}

          {signedIn && circles.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Keep it personal, or share with a circle?</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setCircleId(null)}
                  className={cn(
                    "h-10 rounded-full px-3 text-sm",
                    circleId === null ? "bg-ink text-ink-foreground" : "bg-muted",
                  )}
                >
                  Just me
                </button>
                {circles.map((circle) => (
                  <button
                    key={circle.id}
                    type="button"
                    onClick={() => setCircleId(circle.id)}
                    className={cn(
                      "h-10 rounded-full px-3 text-sm",
                      circleId === circle.id ? "bg-ink text-ink-foreground" : "bg-muted",
                    )}
                  >
                    {circle.emoji} {circle.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="task-notes">Notes</Label>
            <Textarea
              id="task-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything worth remembering"
              rows={3}
            />
          </div>

          <Button size="lg" disabled={!canSave} onClick={() => void save()}>
            {busy ? "Saving…" : "Add task"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export function CircleComposer({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: { name: string; emoji: string }) => Promise<void> | void;
}) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("👥");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      await onSubmit({ name: name.trim(), emoji });
      setName("");
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="flex flex-col gap-5 px-5 pb-5 pt-4">
          <div>
            <DrawerTitle>New circle</DrawerTitle>
            <DrawerDescription className="mt-1">
              Shared tasks for people who are signed in. Invite them with a code.
            </DrawerDescription>
          </div>
          <div className="flex gap-1.5 overflow-x-auto">
            {CIRCLE_EMOJIS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setEmoji(item)}
                className={cn(
                  "grid size-11 shrink-0 place-items-center rounded-md text-xl",
                  emoji === item ? "bg-leaf-soft" : "bg-muted",
                )}
                aria-pressed={emoji === item}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="circle-name">Circle name</Label>
            <Input
              id="circle-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sunday dinner crew"
            />
          </div>
          <Button size="lg" disabled={!name.trim() || busy} onClick={() => void save()}>
            {busy ? "Creating…" : "Create circle"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
