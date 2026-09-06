import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TaskCheck } from "@/components/task-check";
import { dueBucket, isOpen, scheduleLabel } from "@/lib/tasks/schedule";
import type { Task } from "@/lib/tasks/types";
import { formatHumanDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function TaskItem({
  task,
  onToggle,
  onRemove,
}: {
  task: Task;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const open = isOpen(task);
  const bucket = dueBucket(task);
  const schedule = scheduleLabel(task);
  const scheduleText =
    task.scheduleKind === "date" && task.dueDate
      ? formatHumanDate(task.dueDate)
      : task.scheduleKind === "once" && task.dueDate
        ? formatHumanDate(task.dueDate)
        : schedule;

  return (
    <article
      className={cn(
        "group flex items-center gap-1 rounded-xl bg-card px-2 py-2 shadow-card transition-[opacity,transform] duration-200",
        !open && "opacity-60",
      )}
    >
      <TaskCheck checked={!open} onToggle={onToggle} label={task.title} />
      <span className="grid size-11 shrink-0 place-items-center text-2xl leading-none" aria-hidden="true">
        {task.emoji}
      </span>
      <div className="min-w-0 flex-1 py-1.5 pr-1">
        <p
          className={cn(
            "truncate font-medium leading-snug text-foreground",
            !open && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge variant={bucket === "overdue" ? "ink" : "muted"}>{scheduleText}</Badge>
          {task.circleName ? (
            <Badge variant="default">
              {task.circleEmoji} {task.circleName}
            </Badge>
          ) : null}
          {bucket === "overdue" ? <Badge variant="outline">Overdue</Badge> : null}
          {!open && task.completedByName ? (
            <span className="text-[11px] text-muted-foreground">by {task.completedByName}</span>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Delete “${task.title}”`}
        className="grid size-11 place-items-center text-muted-foreground opacity-70 transition-opacity duration-150 hover:text-destructive hover:opacity-100"
      >
        <Trash2 className="size-4" />
      </button>
    </article>
  );
}
