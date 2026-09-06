import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Copy, ListTodo, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AuthSlot } from "@/components/auth-slot";
import { TaskComposer } from "@/components/task-composer";
import { TaskItem } from "@/components/task-item";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  createTask,
  deleteCircle,
  deleteTask,
  getCircle,
  leaveCircle,
  listCircleMembers,
  listCircleTasks,
  toggleTask,
} from "@/lib/tasks/api";
import type { TaskDraft } from "@/lib/tasks/types";

export const Route = createFileRoute("/circles/$circleId")({ component: CirclePage });

function CirclePage() {
  const { circleId } = Route.useParams();
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [composerOpen, setComposerOpen] = useState(false);

  const circleQuery = useQuery({
    queryKey: ["dun", "circle", circleId],
    queryFn: () => getCircle({ data: circleId }),
    enabled: Boolean(user),
  });
  const tasksQuery = useQuery({
    queryKey: ["dun", "circle-tasks", circleId],
    queryFn: () => listCircleTasks({ data: circleId }),
    enabled: Boolean(user),
  });
  const membersQuery = useQuery({
    queryKey: ["dun", "circle-members", circleId],
    queryFn: () => listCircleMembers({ data: circleId }),
    enabled: Boolean(user),
  });

  const addMut = useMutation({
    mutationFn: (draft: TaskDraft) => createTask({ data: { ...draft, circleId } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["dun"] });
    },
  });
  const toggleMut = useMutation({
    mutationFn: (id: string) => toggleTask({ data: id }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["dun"] });
    },
  });
  const removeMut = useMutation({
    mutationFn: (id: string) => deleteTask({ data: id }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["dun"] });
    },
  });

  if (isPending) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-6">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  const circle = circleQuery.data;
  const tasks = tasksQuery.data ?? [];
  const members = membersQuery.data ?? [];

  async function copyCode() {
    if (!circle) return;
    const url = `${window.location.origin}/join/${circle.inviteCode}`;
    try {
      await navigator.clipboard.writeText(`${circle.inviteCode} · ${url}`);
      toast.success("Invite copied");
    } catch {
      toast.message(circle.inviteCode);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-28 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between gap-3">
        <Link
          to="/"
          className="grid size-11 place-items-center rounded-full bg-card text-foreground shadow-card"
          aria-label="Back"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <AuthSlot />
      </header>

      {circleQuery.isPending || !circle ? (
        <Skeleton className="mt-6 h-28 rounded-2xl" />
      ) : (
        <section className="mt-6 rounded-2xl bg-ink px-5 py-5 text-ink-foreground">
          <p className="text-3xl" aria-hidden="true">
            {circle.emoji}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">{circle.name}</h1>
          <p className="mt-2 text-sm text-ink-foreground/70">
            {members.length} {members.length === 1 ? "person" : "people"} · code {circle.inviteCode}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="border-transparent bg-ink-foreground/10 text-ink-foreground hover:bg-ink-foreground/15" onClick={() => void copyCode()}>
              <Copy className="size-3.5" />
              Copy invite
            </Button>
            {circle.role === "owner" ? (
              <Button
                size="sm"
                variant="ghost"
                className="text-ink-foreground/80 hover:bg-ink-foreground/10 hover:text-ink-foreground"
                onClick={() => {
                  void deleteCircle({ data: circleId }).then(() => {
                    toast.message("Circle closed");
                    void navigate({ to: "/" });
                  });
                }}
              >
                Delete
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="text-ink-foreground/80 hover:bg-ink-foreground/10 hover:text-ink-foreground"
                onClick={() => {
                  void leaveCircle({ data: circleId }).then(() => {
                    toast.message("Left the circle");
                    void navigate({ to: "/" });
                  });
                }}
              >
                Leave
              </Button>
            )}
          </div>
        </section>
      )}

      <ul className="mt-4 flex gap-2 overflow-x-auto">
        {members.map((member) => (
          <li
            key={member.userId}
            className="flex shrink-0 items-center gap-2 rounded-full bg-card px-3 py-2 text-sm shadow-card"
          >
            {member.image ? (
              <img src={member.image} alt="" className="size-6 rounded-full object-cover" />
            ) : (
              <span className="grid size-6 place-items-center rounded-full bg-muted text-xs">
                {(member.name ?? "?").slice(0, 1)}
              </span>
            )}
            {member.name ?? "Member"}
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-col gap-2">
        {tasksQuery.isPending ? (
          <>
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </>
        ) : tasks.length === 0 ? (
          <div className="rounded-2xl bg-card px-6 py-10 text-center shadow-card">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-leaf-soft text-primary-foreground">
              <ListTodo className="size-5" aria-hidden="true" />
            </span>
            <p className="mt-3 font-display text-xl font-semibold">No shared tasks yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Anyone in the circle can add and tick these off.</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={() => toggleMut.mutate(task.id)}
              onRemove={() => removeMut.mutate(task.id)}
            />
          ))
        )}
      </div>

      <button
        type="button"
        onClick={() => setComposerOpen(true)}
        className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1rem,calc(50vw-15.5rem))] z-40 flex h-14 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lift"
      >
        <Plus className="size-5" />
        Shared task
      </button>

      <TaskComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        circles={circle ? [circle] : []}
        signedIn
        defaultCircleId={circleId}
        onSubmit={async (draft) => {
          await addMut.mutateAsync({ ...draft, circleId });
        }}
      />
    </div>
  );
}
