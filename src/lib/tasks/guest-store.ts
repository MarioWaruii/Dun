import { create } from "zustand";
import { persist } from "zustand/middleware";
import { localDateISO, newId } from "@/lib/utils";
import { isOpen } from "./schedule";
import type { Task, TaskDraft } from "./types";

type GuestState = {
  tasks: Task[];
  add: (draft: TaskDraft) => Task;
  update: (id: string, patch: Partial<Task>) => void;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  markReminded: (ids: string[], at: string) => void;
  clear: () => void;
};

function applyToggle(task: Task, now = new Date()): Task {
  const today = localDateISO(now);
  const stamp = now.toISOString();
  if (isOpen(task, now)) {
    const isRecurring = task.scheduleKind === "daily" || task.scheduleKind === "weekly";
    return {
      ...task,
      done: isRecurring ? false : true,
      completedOn: today,
      completedBy: "guest",
      completedByName: "You",
      updatedAt: stamp,
    };
  }
  return {
    ...task,
    done: false,
    completedOn: null,
    completedBy: null,
    completedByName: null,
    lastRemindedAt: stamp,
    updatedAt: stamp,
  };
}

function migrateGuestStorage() {
  if (typeof window === "undefined") return;
  try {
    if (!window.localStorage.getItem("dun.guest.v1")) {
      const prev = window.localStorage.getItem("grove.guest.v1");
      if (prev) window.localStorage.setItem("dun.guest.v1", prev);
    }
  } catch {
    /* ignore */
  }
}

migrateGuestStorage();

export const useGuestStore = create<GuestState>()(
  persist(
    (set, get) => ({
      tasks: [],
      add: (draft) => {
        const now = new Date().toISOString();
        const task: Task = {
          id: newId(),
          ownerId: "guest",
          circleId: null,
          circleName: null,
          circleEmoji: null,
          title: draft.title.trim(),
          notes: draft.notes.trim(),
          emoji: draft.emoji,
          done: false,
          completedOn: null,
          completedBy: null,
          completedByName: null,
          scheduleKind: draft.scheduleKind,
          dueDate: draft.dueDate,
          weekday: draft.weekday,
          lastRemindedAt: null,
          createdAt: now,
          updatedAt: now,
        };
        set({ tasks: [task, ...get().tasks] });
        return task;
      },
      update: (id, patch) => {
        set({
          tasks: get().tasks.map((t) =>
            t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t,
          ),
        });
      },
      toggle: (id) => {
        set({
          tasks: get().tasks.map((t) => (t.id === id ? applyToggle(t) : t)),
        });
      },
      remove: (id) => {
        set({ tasks: get().tasks.filter((t) => t.id !== id) });
      },
      markReminded: (ids, at) => {
        const setIds = new Set(ids);
        set({
          tasks: get().tasks.map((t) => (setIds.has(t.id) ? { ...t, lastRemindedAt: at } : t)),
        });
      },
      clear: () => set({ tasks: [] }),
    }),
    { name: "dun.guest.v1" },
  ),
);
