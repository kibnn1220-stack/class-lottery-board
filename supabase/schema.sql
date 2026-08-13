create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique(class_id, name)
);

create table if not exists lottery_tickets (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  rank integer not null check (rank between 1 and 6),
  status text not null default 'available' check (status in ('available','drawn')),
  drawn_by uuid references students(id),
  drawn_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists draw_history (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  ticket_id uuid not null unique references lottery_tickets(id) on delete restrict,
  rank integer not null check (rank between 1 and 6),
  drawn_at timestamptz not null default now()
);

create index if not exists lottery_tickets_class_status_idx on lottery_tickets(class_id, status);
create index if not exists draw_history_class_student_idx on draw_history(class_id, student_id);

-- Initial 300-ticket distribution per class:
-- 1st=1, 2nd=5, 3rd=15, 4th=30, 5th=60, 6th=189.
-- Run the insert below after creating a class and replacing :class_id with its UUID.
--
-- insert into lottery_tickets(class_id, rank)
-- select :class_id, rank from (
--   select 1 rank from generate_series(1,1)
--   union all select 2 from generate_series(1,5)
--   union all select 3 from generate_series(1,15)
--   union all select 4 from generate_series(1,30)
--   union all select 5 from generate_series(1,60)
--   union all select 6 from generate_series(1,189)
-- ) t;
