export const SCHEDULE_KINDS = ["once", "daily", "weekly", "date"] as const;
export type ScheduleKind = (typeof SCHEDULE_KINDS)[number];

export const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;

export type Task = {
  id: string;
  ownerId: string;
  circleId: string | null;
  circleName: string | null;
  circleEmoji: string | null;
  title: string;
  notes: string;
  emoji: string;
  done: boolean;
  completedOn: string | null;
  completedBy: string | null;
  completedByName: string | null;
  scheduleKind: ScheduleKind;
  dueDate: string | null;
  weekday: number | null;
  lastRemindedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Circle = {
  id: string;
  name: string;
  emoji: string;
  ownerId: string;
  inviteCode: string;
  memberCount: number;
  role: "owner" | "member";
  createdAt: string;
};

export type CircleMember = {
  userId: string;
  role: "owner" | "member";
  name: string | null;
  email: string | null;
  image: string | null;
  joinedAt: string;
};

export type TaskDraft = {
  title: string;
  notes: string;
  emoji: string;
  scheduleKind: ScheduleKind;
  dueDate: string | null;
  weekday: number | null;
  circleId: string | null;
};

export type DueBucket = "today" | "upcoming" | "overdue" | "done";
