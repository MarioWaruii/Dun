import { Link } from "@tanstack/react-router";
import { CalendarClock, CheckCircle2, ListTodo, Plus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AuthSlot } from "@/components/auth-slot";
import { InstallApp } from "@/components/install-app";
import { ProfileEditor } from "@/components/profile-editor";
import { ReminderEngine } from "@/components/reminder-engine";
import { CircleComposer, TaskComposer } from "@/components/task-composer";
import { TaskItem } from "@/components/task-item";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useGrove } from "@/hooks/use-grove";
import { avatarSrc, useProfileStore } from "@/lib/profile/store";
import type { Task } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type Tab = "today" | "later" | "circles" | "done";

const TABS: { id: Tab; label: string; icon: typeof ListTodo }[] = [
  { id: "today", label: "Today", icon: ListTodo },
  { id: "later", label: "Later", icon: CalendarClock },
  { id: "circles", label: "Circles", icon: Users },
  { id: "done", label: "Done", icon: CheckCircle2 },
];

export function AppHome() {
  const grove = useGrove();
  const profile = useProfileStore();
  const [tab, setTab] = useState<Tab>("today");
  const [composerOpen, setComposerOpen] = useState(false);
  const [circleOpen, setCircleOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    [],
  );

  const openToday = grove.buckets.today.length + grove.buckets.overdue.length;
  const doneToday = grove.buckets.done.filter((t) => t.scheduleKind === "daily" || t.scheduleKind === "weekly").length;
  const totalToday = openToday + doneToday;

  const list: Task[] =
    tab === "today"
      ? [...grove.buckets.overdue, ...grove.buckets.today]
      : tab === "later"
        ? grove.buckets.upcoming
        : tab === "done"
          ? grove.buckets.done
          : [];

  if (grove.isPending) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 pb-28 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <Skeleton className="h-12 w-40 rounded-full" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-36 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          className="flex min-w-0 items-center gap-3 text-left"
        >
          <UserAvatar src={avatarSrc(profile)} username={profile.username} className="size-11" />
          <div className="min-w-0">
            <p className="truncate font-display text-2xl font-semibold leading-none tracking-tight">
              {profile.username}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{todayLabel}</p>
          </div>
        </button>
        <AuthSlot />
      </header>

      <section className="stagger-in mt-6 flex flex-col gap-4">
        <div className="rounded-2xl bg-ink px-5 py-5 text-ink-foreground">
          <p className="text-sm text-ink-foreground/70">On your plate</p>
          <p className="mt-1 font-display text-3xl font-semibold tracking-tight">
            {openToday === 0 ? "All done." : openToday === 1 ? "1 open task" : `${openToday} open tasks`}
          </p>
          <p className="mt-2 text-sm text-ink-foreground/70">
            {totalToday === 0
              ? "Add something for today."
              : `${doneToday} finished · nudges every 4 hours`}
          </p>
        </div>

        <InstallApp />

        {!grove.signedIn ? (
          <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            Using Dun as a guest — tasks stay on this device.{" "}
            <Link to="/login" className="font-medium text-foreground underline-offset-2 hover:underline">
              Create an account
            </Link>{" "}
            to sync and share circles.
          </div>
        ) : null}

        <ReminderEngine tasks={grove.tasks} onMarkReminded={grove.markReminded} />

        {tab === "circles" ? (
          <CirclesPanel
            signedIn={grove.signedIn}
            circles={grove.circles}
            joinCode={joinCode}
            onJoinCode={setJoinCode}
            onJoin={async () => {
              if (!joinCode.trim()) return;
              try {
                const circle = await grove.joinCircle(joinCode.trim());
                toast.success(`Joined ${circle.name}`);
                setJoinCode("");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not join");
              }
            }}
            onCreate={() => setCircleOpen(true)}
          />
        ) : grove.loading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        ) : list.length === 0 ? (
          <EmptyState tab={tab} onAdd={() => setComposerOpen(true)} />
        ) : (
          <div className="flex flex-col gap-2">
            {list.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={() => void grove.toggle(task.id)}
                onRemove={() => void grove.remove(task.id)}
              />
            ))}
          </div>
        )}
      </section>

      <button
        type="button"
        onClick={() => setComposerOpen(true)}
        className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-[max(1rem,calc(50vw-15.5rem))] z-40 flex h-14 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lift"
      >
        <Plus className="size-5" />
        New task
      </button>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-lg border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md max-sm:ps-24"
        aria-label="Task views"
      >
        <div className="grid grid-cols-4">
          {TABS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors duration-150",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.4 : 2} />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      <TaskComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        circles={grove.circles}
        signedIn={grove.signedIn}
        onSubmit={grove.addTask}
      />
      <CircleComposer
        open={circleOpen}
        onOpenChange={setCircleOpen}
        onSubmit={async (input) => {
          const circle = await grove.createCircle(input);
          toast.success(`${circle.emoji} ${circle.name} is ready`);
        }}
      />
      <ProfileEditor open={profileOpen} onOpenChange={setProfileOpen} />
    </div>
  );
}

function EmptyState({ tab, onAdd }: { tab: Tab; onAdd: () => void }) {
  const copy =
    tab === "done"
      ? {
          icon: CheckCircle2,
          title: "Nothing completed yet",
          body: "Tick a task and it will land here.",
        }
      : tab === "later"
        ? {
            icon: CalendarClock,
            title: "Nothing waiting ahead",
            body: "Date and weekly tasks land here until they’re due.",
          }
        : {
            icon: ListTodo,
            title: "You’re clear",
            body: "Add a task — daily, weekly, or a set date.",
          };
  const Icon = copy.icon;
  return (
    <div className="flex flex-col items-center rounded-2xl bg-card px-6 py-12 text-center shadow-card">
      <span className="grid size-12 place-items-center rounded-full bg-leaf-soft text-primary-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h2 className="mt-4 font-display text-xl font-semibold">{copy.title}</h2>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{copy.body}</p>
      {tab !== "done" ? (
        <Button className="mt-5" onClick={onAdd}>
          Add a task
        </Button>
      ) : null}
    </div>
  );
}

function CirclesPanel({
  signedIn,
  circles,
  joinCode,
  onJoinCode,
  onJoin,
  onCreate,
}: {
  signedIn: boolean;
  circles: ReturnType<typeof useGrove>["circles"];
  joinCode: string;
  onJoinCode: (value: string) => void;
  onJoin: () => void;
  onCreate: () => void;
}) {
  if (!signedIn) {
    return (
      <div className="rounded-2xl bg-card px-6 py-10 text-center shadow-card">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-leaf-soft text-primary-foreground">
          <Users className="size-5" aria-hidden="true" />
        </span>
        <h2 className="mt-4 font-display text-xl font-semibold">Circles are for accounts</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to create a shared list and invite people with a code.
        </p>
        <Button asChild className="mt-5">
          <Link to="/login">Create an account</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Input
          value={joinCode}
          onChange={(e) => onJoinCode(e.target.value.toUpperCase())}
          placeholder="Invite code"
          className="uppercase tracking-[0.2em]"
        />
        <Button variant="outline" onClick={onJoin}>
          Join
        </Button>
      </div>
      <Button variant="ink" onClick={onCreate}>
        <Users className="size-4" />
        New circle
      </Button>
      {circles.length === 0 ? (
        <p className="px-1 text-sm text-muted-foreground">
          No circles yet. Make one for roommates, a team, or family chores.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {circles.map((circle) => (
            <li key={circle.id}>
              <Link
                to="/circles/$circleId"
                params={{ circleId: circle.id }}
                className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 shadow-card"
              >
                <span className="grid size-11 place-items-center text-2xl">{circle.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{circle.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {circle.memberCount} {circle.memberCount === 1 ? "member" : "members"} · {circle.role}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
