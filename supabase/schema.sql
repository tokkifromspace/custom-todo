-- custom-todo P2 schema
-- Run this in Supabase SQL Editor (Dashboard → SQL → New query → paste → Run).
-- Idempotent: safe to re-run.

-- 1) Tables ------------------------------------------------------------------

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  color text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists groups_user_id_idx on public.groups(user_id);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  group_id uuid references public.groups(id) on delete cascade,
  name text not null,
  color text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists projects_group_id_idx on public.projects(group_id);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  notes text,
  bucket text check (bucket in ('today', 'evening')),
  when_at text not null check (when_at in ('today', 'evening', 'tomorrow', 'anytime', 'someday', 'inbox')),
  due text,
  due_today boolean not null default false,
  due_overdue boolean not null default false,
  repeat text,
  tags text[] not null default '{}',
  done boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists tasks_project_id_idx on public.tasks(project_id);
create index if not exists tasks_when_at_idx on public.tasks(user_id, when_at);

-- 2) updated_at trigger ------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists groups_updated_at on public.groups;
create trigger groups_updated_at before update on public.groups
  for each row execute procedure public.set_updated_at();

drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at before update on public.projects
  for each row execute procedure public.set_updated_at();

drop trigger if exists tasks_updated_at on public.tasks;
create trigger tasks_updated_at before update on public.tasks
  for each row execute procedure public.set_updated_at();

-- 3) RLS ---------------------------------------------------------------------

alter table public.groups enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;

drop policy if exists groups_select_own on public.groups;
drop policy if exists groups_insert_own on public.groups;
drop policy if exists groups_update_own on public.groups;
drop policy if exists groups_delete_own on public.groups;
create policy groups_select_own on public.groups for select using (user_id = auth.uid());
create policy groups_insert_own on public.groups for insert with check (user_id = auth.uid());
create policy groups_update_own on public.groups for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy groups_delete_own on public.groups for delete using (user_id = auth.uid());

drop policy if exists projects_select_own on public.projects;
drop policy if exists projects_insert_own on public.projects;
drop policy if exists projects_update_own on public.projects;
drop policy if exists projects_delete_own on public.projects;
create policy projects_select_own on public.projects for select using (user_id = auth.uid());
create policy projects_insert_own on public.projects for insert with check (user_id = auth.uid());
create policy projects_update_own on public.projects for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy projects_delete_own on public.projects for delete using (user_id = auth.uid());

drop policy if exists tasks_select_own on public.tasks;
drop policy if exists tasks_insert_own on public.tasks;
drop policy if exists tasks_update_own on public.tasks;
drop policy if exists tasks_delete_own on public.tasks;
create policy tasks_select_own on public.tasks for select using (user_id = auth.uid());
create policy tasks_insert_own on public.tasks for insert with check (user_id = auth.uid());
create policy tasks_update_own on public.tasks for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy tasks_delete_own on public.tasks for delete using (user_id = auth.uid());
