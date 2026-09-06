import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  createCircle,
  createTask,
  deleteCircle,
  deleteTask,
  importGuestTasks,
  joinCircle,
  leaveCircle,
  listCircles,
  listMyTasks,
  markTasksReminded,
  toggleTask,
} from "@/lib/tasks/api";
import { useGuestStore } from "@/lib/tasks/guest-store";
import { dueBucket, sortTasks } from "@/lib/tasks/schedule";
import type { Circle, Task, TaskDraft } from "@/lib/tasks/types";

const IMPORT_FLAG = "dun.guest.imported";
const LEGACY_IMPORT_FLAG = "grove.guest.imported";

export function useGrove() {
  const { user, isPending } = useCurrentUserState();
  const signedIn = Boolean(user);
  const queryClient = useQueryClient();
  const guestTasks = useGuestStore((s) => s.tasks);
  const guestAdd = useGuestStore((s) => s.add);
  const guestToggle = useGuestStore((s) => s.toggle);
  const guestRemove = useGuestStore((s) => s.remove);
  const guestMark = useGuestStore((s) => s.markReminded);
  const importedRef = useRef(false);

  const tasksQuery = useQuery({
    queryKey: ["dun", "tasks"],
    queryFn: () => listMyTasks(),
    enabled: signedIn,
  });

  const circlesQuery = useQuery({
    queryKey: ["dun", "circles"],
    queryFn: () => listCircles(),
    enabled: signedIn,
  });

  useEffect(() => {
    if (!signedIn || importedRef.current) return;
    if (typeof window === "undefined") return;
    const imported =
      window.localStorage.getItem(IMPORT_FLAG) === "1" ||
      window.localStorage.getItem(LEGACY_IMPORT_FLAG) === "1";
    if (imported) {
      window.localStorage.setItem(IMPORT_FLAG, "1");
      importedRef.current = true;
      return;
    }
    const pending = useGuestStore.getState().tasks;
    if (pending.length === 0) {
      window.localStorage.setItem(IMPORT_FLAG, "1");
      importedRef.current = true;
      return;
    }
    importedRef.current = true;
    void importGuestTasks({
      data: pending.map((t) => ({
        id: t.id,
        title: t.title,
        notes: t.notes,
        emoji: t.emoji,
        scheduleKind: t.scheduleKind,
        dueDate: t.dueDate,
        weekday: t.weekday,
      })),
    })
      .then((res) => {
        window.localStorage.setItem(IMPORT_FLAG, "1");
        useGuestStore.getState().clear();
        void queryClient.invalidateQueries({ queryKey: ["dun", "tasks"] });
        if (res.imported > 0) {
          toast.success(
            res.imported === 1
              ? "Brought your guest task along"
              : `Brought ${res.imported} guest tasks along`,
          );
        }
      })
      .catch(() => {
        importedRef.current = false;
      });
  }, [signedIn, queryClient]);

  const tasks: Task[] = signedIn ? (tasksQuery.data ?? []) : guestTasks;
  const circles: Circle[] = signedIn ? (circlesQuery.data ?? []) : [];

  const createMut = useMutation({
    mutationFn: (draft: TaskDraft) => createTask({ data: draft }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["dun", "tasks"] });
    },
  });

  const toggleMut = useMutation({
    mutationFn: (id: string) => toggleTask({ data: id }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["dun", "tasks"] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteTask({ data: id }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["dun", "tasks"] });
    },
  });

  const createCircleMut = useMutation({
    mutationFn: (input: { name: string; emoji?: string }) => createCircle({ data: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["dun", "circles"] });
    },
  });

  const joinMut = useMutation({
    mutationFn: (code: string) => joinCircle({ data: code }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["dun"] });
    },
  });

  const leaveMut = useMutation({
    mutationFn: (id: string) => leaveCircle({ data: id }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["dun"] });
    },
  });

  const deleteCircleMut = useMutation({
    mutationFn: (id: string) => deleteCircle({ data: id }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["dun"] });
    },
  });

  const sorted = useMemo(() => sortTasks(tasks), [tasks]);
  const buckets = useMemo(() => {
    const today: Task[] = [];
    const upcoming: Task[] = [];
    const overdue: Task[] = [];
    const done: Task[] = [];
    for (const task of sorted) {
      const bucket = dueBucket(task);
      if (bucket === "today") today.push(task);
      else if (bucket === "upcoming") upcoming.push(task);
      else if (bucket === "overdue") overdue.push(task);
      else done.push(task);
    }
    return { today, upcoming, overdue, done };
  }, [sorted]);

  const addTask = useCallback(
    async (draft: TaskDraft) => {
      if (!signedIn) {
        if (draft.circleId) {
          toast.error("Sign in to add a circle task");
          return;
        }
        guestAdd(draft);
        toast.success("Added");
        return;
      }
      await createMut.mutateAsync(draft);
    },
    [signedIn, guestAdd, createMut],
  );

  const toggle = useCallback(
    async (id: string) => {
      if (!signedIn) {
        guestToggle(id);
        return;
      }
      await toggleMut.mutateAsync(id);
    },
    [signedIn, guestToggle, toggleMut],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!signedIn) {
        guestRemove(id);
        return;
      }
      await deleteMut.mutateAsync(id);
    },
    [signedIn, guestRemove, deleteMut],
  );

  const markReminded = useCallback(
    async (ids: string[]) => {
      const at = new Date().toISOString();
      if (!signedIn) {
        guestMark(ids, at);
        return;
      }
      queryClient.setQueryData<Task[]>(["dun", "tasks"], (prev) =>
        (prev ?? []).map((t) => (ids.includes(t.id) ? { ...t, lastRemindedAt: at } : t)),
      );
      await markTasksReminded({ data: ids });
    },
    [signedIn, guestMark, queryClient],
  );

  return {
    user,
    isPending,
    signedIn,
    tasks: sorted,
    circles,
    buckets,
    loading: signedIn && (tasksQuery.isPending || circlesQuery.isPending),
    addTask,
    toggle,
    remove,
    markReminded,
    createCircle: createCircleMut.mutateAsync,
    joinCircle: joinMut.mutateAsync,
    leaveCircle: leaveMut.mutateAsync,
    deleteCircle: deleteCircleMut.mutateAsync,
  };
}
