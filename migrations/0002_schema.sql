-- Grove: personal + circle (group) tasks
create table if not exists circles (
  id          text primary key,
  name        text not null,
  emoji       text not null default '🌿',
  owner_id    text not null,
  invite_code text not null unique,
  created_at  timestamptz not null default now()
);

create index if not exists circles_owner_id_idx on circles (owner_id);
create index if not exists circles_invite_code_idx on circles (invite_code);

create table if not exists circle_members (
  circle_id  text not null references circles(id) on delete cascade,
  user_id    text not null,
  role       text not null default 'member',
  joined_at  timestamptz not null default now(),
  primary key (circle_id, user_id)
);

create index if not exists circle_members_user_id_idx on circle_members (user_id);

create table if not exists tasks (
  id               text primary key,
  owner_id         text not null,
  circle_id        text references circles(id) on delete cascade,
  title            text not null,
  notes            text not null default '',
  emoji            text not null default '🌱',
  done             boolean not null default false,
  completed_on     date,
  completed_by     text,
  schedule_kind    text not null default 'once',
  due_date         date,
  weekday          int,
  last_reminded_at timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists tasks_owner_id_idx on tasks (owner_id);
create index if not exists tasks_circle_id_idx on tasks (circle_id);
create index if not exists tasks_schedule_idx on tasks (schedule_kind, done);
