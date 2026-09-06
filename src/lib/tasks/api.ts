import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { localDateISO, newId, newInviteCode } from "@/lib/utils";
import { isOpen } from "./schedule";
import type { Circle, CircleMember, ScheduleKind, Task, TaskDraft } from "./types";

const scheduleKindSchema = z.enum(["once", "daily", "weekly", "date"]);

const taskDraftSchema = z.object({
  id: z.string().min(1).optional(),
  title: z.string().trim().min(1).max(200),
  notes: z.string().max(2000).optional().default(""),
  emoji: z.string().min(1).max(16),
  scheduleKind: scheduleKindSchema,
  dueDate: z.string().nullable().optional(),
  weekday: z.number().int().min(0).max(6).nullable().optional(),
  circleId: z.string().nullable().optional(),
});

type TaskRow = {
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

const TASK_SELECT = `t.id,
  t.owner_id as "ownerId",
  t.circle_id as "circleId",
  c.name as "circleName",
  c.emoji as "circleEmoji",
  t.title,
  t.notes,
  t.emoji,
  t.done,
  t.completed_on as "completedOn",
  t.completed_by as "completedBy",
  cu.name as "completedByName",
  t.schedule_kind as "scheduleKind",
  t.due_date as "dueDate",
  t.weekday,
  t.last_reminded_at::text as "lastRemindedAt",
  t.created_at::text as "createdAt",
  t.updated_at::text as "updatedAt"`;

async function assertCircleMember(userId: string, circleId: string) {
  const sql = await getSql();
  const rows = await sql<{ user_id: string }>`
    select user_id from circle_members
    where circle_id = ${circleId} and user_id = ${userId}
  `;
  if (rows.length === 0) throw new Error("Not a member of this circle");
}

function normalizeDraft(data: z.infer<typeof taskDraftSchema>): TaskDraft {
  const kind = data.scheduleKind;
  return {
    title: data.title.trim(),
    notes: (data.notes ?? "").trim(),
    emoji: data.emoji,
    scheduleKind: kind,
    dueDate: kind === "date" || kind === "once" ? (data.dueDate ?? null) : null,
    weekday: kind === "weekly" ? (data.weekday ?? 1) : null,
    circleId: data.circleId ?? null,
  };
}

async function fetchTask(id: string): Promise<Task> {
  const sql = await getSql();
  const rows = await sql.query<TaskRow>(
    `select ${TASK_SELECT}
     from tasks t
     left join circles c on c.id = t.circle_id
     left join "user" cu on cu.id = t.completed_by
     where t.id = $1`,
    [id],
  );
  const task = rows[0];
  if (!task) throw new Error("Task not found");
  return task;
}

export const listMyTasks = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Task[]> => {
    const sql = await getSql();
    return sql.query<TaskRow>(
      `select ${TASK_SELECT}
       from tasks t
       left join circles c on c.id = t.circle_id
       left join "user" cu on cu.id = t.completed_by
       where
         (t.circle_id is null and t.owner_id = $1)
         or t.circle_id in (select circle_id from circle_members where user_id = $1)
       order by t.created_at desc`,
      [context.userId],
    );
  });

export const listCircleTasks = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((circleId: string) => circleId)
  .handler(async ({ context, data: circleId }): Promise<Task[]> => {
    await assertCircleMember(context.userId, circleId);
    const sql = await getSql();
    return sql.query<TaskRow>(
      `select ${TASK_SELECT}
       from tasks t
       left join circles c on c.id = t.circle_id
       left join "user" cu on cu.id = t.completed_by
       where t.circle_id = $1
       order by t.created_at desc`,
      [circleId],
    );
  });

export const createTask = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => taskDraftSchema.parse(input))
  .handler(async ({ context, data }): Promise<Task> => {
    const draft = normalizeDraft(data);
    if (draft.circleId) await assertCircleMember(context.userId, draft.circleId);
    const sql = await getSql();
    const id = data.id ?? newId();
    await sql.query(
      `insert into tasks (
         id, owner_id, circle_id, title, notes, emoji,
         schedule_kind, due_date, weekday
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        id,
        context.userId,
        draft.circleId,
        draft.title,
        draft.notes,
        draft.emoji,
        draft.scheduleKind,
        draft.dueDate,
        draft.weekday,
      ],
    );
    return fetchTask(id);
  });

export const importGuestTasks = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.array(taskDraftSchema.extend({ id: z.string().min(1) })).parse(input),
  )
  .handler(async ({ context, data }): Promise<{ imported: number }> => {
    if (data.length === 0) return { imported: 0 };
    const sql = await getSql();
    let imported = 0;
    for (const raw of data) {
      const draft = normalizeDraft(raw);
      const result = await sql.query<{ id: string }>(
        `insert into tasks (
           id, owner_id, circle_id, title, notes, emoji,
           schedule_kind, due_date, weekday
         ) values ($1,$2,null,$3,$4,$5,$6,$7,$8)
         on conflict (id) do nothing
         returning id`,
        [
          raw.id,
          context.userId,
          draft.title,
          draft.notes,
          draft.emoji,
          draft.scheduleKind,
          draft.dueDate,
          draft.weekday,
        ],
      );
      if (result.length > 0) imported += 1;
    }
    return { imported };
  });

export const toggleTask = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }): Promise<Task> => {
    const sql = await getSql();
    const existing = await sql.query<TaskRow>(
      `select ${TASK_SELECT}
       from tasks t
       left join circles c on c.id = t.circle_id
       left join "user" cu on cu.id = t.completed_by
       where t.id = $1
         and (
           (t.circle_id is null and t.owner_id = $2)
           or t.circle_id in (select circle_id from circle_members where user_id = $2)
         )`,
      [id, context.userId],
    );
    const task = existing[0];
    if (!task) throw new Error("Task not found");

    const today = localDateISO();
    const nowIso = new Date().toISOString();
    const recurring = task.scheduleKind === "daily" || task.scheduleKind === "weekly";

    if (isOpen(task)) {
      await sql.query(
        `update tasks
         set done = $1,
             completed_on = $2,
             completed_by = $3,
             updated_at = now()
         where id = $4`,
        [recurring ? false : true, today, context.userId, id],
      );
    } else {
      await sql.query(
        `update tasks
         set done = false,
             completed_on = null,
             completed_by = null,
             last_reminded_at = $1::timestamptz,
             updated_at = now()
         where id = $2`,
        [nowIso, id],
      );
    }

    return fetchTask(id);
  });

export const deleteTask = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }): Promise<{ ok: true }> => {
    const sql = await getSql();
    await sql.query(
      `delete from tasks
       where id = $1
         and (
           owner_id = $2
           or circle_id in (
             select circle_id from circle_members
             where user_id = $2 and role = 'owner'
           )
         )`,
      [id, context.userId],
    );
    return { ok: true };
  });

export const markTasksReminded = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((ids: string[]) => ids.filter((id) => typeof id === "string" && id.length > 0))
  .handler(async ({ context, data: ids }): Promise<{ ok: true }> => {
    if (ids.length === 0) return { ok: true };
    const sql = await getSql();
    for (const id of ids) {
      await sql.query(
        `update tasks
         set last_reminded_at = now()
         where id = $1
           and (
             (circle_id is null and owner_id = $2)
             or circle_id in (select circle_id from circle_members where user_id = $2)
           )`,
        [id, context.userId],
      );
    }
    return { ok: true };
  });

export const listCircles = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Circle[]> => {
    const sql = await getSql();
    return sql.query<Circle>(
      `select
         c.id,
         c.name,
         c.emoji,
         c.owner_id as "ownerId",
         c.invite_code as "inviteCode",
         (select count(*)::int from circle_members m where m.circle_id = c.id) as "memberCount",
         cm.role,
         c.created_at::text as "createdAt"
       from circles c
       join circle_members cm on cm.circle_id = c.id and cm.user_id = $1
       order by c.created_at desc`,
      [context.userId],
    );
  });

export const createCircle = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        name: z.string().trim().min(1).max(60),
        emoji: z.string().min(1).max(16).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }): Promise<Circle> => {
    const sql = await getSql();
    const id = newId();
    let created = false;
    let code = newInviteCode();
    for (let i = 0; i < 6; i += 1) {
      try {
        await sql.query(
          `insert into circles (id, name, emoji, owner_id, invite_code)
           values ($1,$2,$3,$4,$5)`,
          [id, data.name.trim(), data.emoji ?? "🌿", context.userId, code],
        );
        created = true;
        break;
      } catch {
        code = newInviteCode();
      }
    }
    if (!created) throw new Error("Could not create circle");
    await sql.query(
      `insert into circle_members (circle_id, user_id, role) values ($1,$2,'owner')`,
      [id, context.userId],
    );
    const rows = await sql.query<Circle>(
      `select
         c.id, c.name, c.emoji, c.owner_id as "ownerId",
         c.invite_code as "inviteCode", 1 as "memberCount",
         'owner' as role, c.created_at::text as "createdAt"
       from circles c where c.id = $1`,
      [id],
    );
    const circle = rows[0];
    if (!circle) throw new Error("Could not create circle");
    return circle;
  });

export const joinCircle = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((code: string) => code.trim().toUpperCase())
  .handler(async ({ context, data: code }): Promise<Circle> => {
    const sql = await getSql();
    const found = await sql<{ id: string }>`
      select id from circles where invite_code = ${code}
    `;
    const circleId = found[0]?.id;
    if (!circleId) throw new Error("That invite code doesn’t match a circle");
    await sql.query(
      `insert into circle_members (circle_id, user_id, role)
       values ($1,$2,'member')
       on conflict (circle_id, user_id) do nothing`,
      [circleId, context.userId],
    );
    const rows = await sql.query<Circle>(
      `select
         c.id, c.name, c.emoji, c.owner_id as "ownerId",
         c.invite_code as "inviteCode",
         (select count(*)::int from circle_members m where m.circle_id = c.id) as "memberCount",
         cm.role, c.created_at::text as "createdAt"
       from circles c
       join circle_members cm on cm.circle_id = c.id and cm.user_id = $1
       where c.id = $2`,
      [context.userId, circleId],
    );
    const circle = rows[0];
    if (!circle) throw new Error("Could not join circle");
    return circle;
  });

export const leaveCircle = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((circleId: string) => circleId)
  .handler(async ({ context, data: circleId }): Promise<{ ok: true }> => {
    const sql = await getSql();
    const rows = await sql<{ owner_id: string }>`
      select owner_id from circles where id = ${circleId}
    `;
    if (rows[0]?.owner_id === context.userId) {
      throw new Error("Owners can delete the circle instead of leaving");
    }
    await sql.query(`delete from circle_members where circle_id = $1 and user_id = $2`, [
      circleId,
      context.userId,
    ]);
    return { ok: true };
  });

export const deleteCircle = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((circleId: string) => circleId)
  .handler(async ({ context, data: circleId }): Promise<{ ok: true }> => {
    const sql = await getSql();
    await sql.query(`delete from circles where id = $1 and owner_id = $2`, [
      circleId,
      context.userId,
    ]);
    return { ok: true };
  });

export const getCircle = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((circleId: string) => circleId)
  .handler(async ({ context, data: circleId }): Promise<Circle> => {
    await assertCircleMember(context.userId, circleId);
    const sql = await getSql();
    const rows = await sql.query<Circle>(
      `select
         c.id, c.name, c.emoji, c.owner_id as "ownerId",
         c.invite_code as "inviteCode",
         (select count(*)::int from circle_members m where m.circle_id = c.id) as "memberCount",
         cm.role, c.created_at::text as "createdAt"
       from circles c
       join circle_members cm on cm.circle_id = c.id and cm.user_id = $1
       where c.id = $2`,
      [context.userId, circleId],
    );
    const circle = rows[0];
    if (!circle) throw new Error("Circle not found");
    return circle;
  });

export const listCircleMembers = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((circleId: string) => circleId)
  .handler(async ({ context, data: circleId }): Promise<CircleMember[]> => {
    await assertCircleMember(context.userId, circleId);
    const sql = await getSql();
    return sql.query<CircleMember>(
      `select
         m.user_id as "userId",
         m.role,
         u.name,
         u.email,
         u.image,
         m.joined_at::text as "joinedAt"
       from circle_members m
       left join "user" u on u.id = m.user_id
       where m.circle_id = $1
       order by m.joined_at asc`,
      [circleId],
    );
  });
