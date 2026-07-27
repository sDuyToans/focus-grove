-- ════════════════════════════════════════════════════════════════════
-- Focus Grove — Supabase schema
--
-- Run this once in your project: Supabase Dashboard → SQL Editor →
-- paste → Run. It is idempotent (safe to re-run).
--
-- What it creates:
--   1. Tables: profiles, focus_sessions, user_settings
--   2. Row Level Security so users can only ever touch their own rows
--   3. A trigger that creates a profile + default settings on first
--      Google login (so the frontend never has to)
-- ════════════════════════════════════════════════════════════════════


-- ── 1. Tables ─────────────────────────────────────────────────────────

-- One row per user, filled from Google metadata on first login.
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

-- Every completed focus block (pomodoro or custom timer).
create table if not exists public.focus_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  -- 'pomodoro_focus' | 'pomodoro_break' | 'custom_timer'
  session_type     text not null check (session_type in ('pomodoro_focus', 'pomodoro_break', 'custom_timer')),
  duration_minutes integer not null check (duration_minutes > 0),
  task             text not null default '',
  completed_at     timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

-- Fast "my history, newest first" queries.
create index if not exists focus_sessions_user_completed_idx
  on public.focus_sessions (user_id, completed_at desc);

-- One settings row per user, created with defaults by the trigger below.
create table if not exists public.user_settings (
  user_id                    uuid primary key references auth.users (id) on delete cascade,
  focus_minutes              integer not null default 25,
  short_break_minutes        integer not null default 5,
  long_break_minutes         integer not null default 15,
  sessions_before_long_break integer not null default 4,
  sound_enabled              boolean not null default true,
  notifications_enabled      boolean not null default false,
  auto_start_breaks          boolean not null default false,
  auto_start_focus           boolean not null default false,
  daily_goal_minutes         integer not null default 120,
  theme                      text not null default 'light' check (theme in ('light', 'dark')),
  updated_at                 timestamptz not null default now()
);


-- ── 2. Row Level Security ─────────────────────────────────────────────
-- RLS is the actual security boundary: the anon key in the frontend can
-- only do what these policies allow. No user can ever read or write
-- another user's rows.

alter table public.profiles       enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.user_settings  enable row level security;

-- profiles: read + update own row (insert happens via the trigger)
drop policy if exists "profiles: read own"   on public.profiles;
drop policy if exists "profiles: insert own" on public.profiles;
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: read own"   on public.profiles for select using (auth.uid() = id);
create policy "profiles: insert own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles: update own" on public.profiles for update using (auth.uid() = id);

-- focus_sessions: read / insert / delete own sessions
drop policy if exists "sessions: read own"   on public.focus_sessions;
drop policy if exists "sessions: insert own" on public.focus_sessions;
drop policy if exists "sessions: delete own" on public.focus_sessions;
create policy "sessions: read own"   on public.focus_sessions for select using (auth.uid() = user_id);
create policy "sessions: insert own" on public.focus_sessions for insert with check (auth.uid() = user_id);
create policy "sessions: delete own" on public.focus_sessions for delete using (auth.uid() = user_id);

-- user_settings: read / insert / update own settings
drop policy if exists "settings: read own"   on public.user_settings;
drop policy if exists "settings: insert own" on public.user_settings;
drop policy if exists "settings: update own" on public.user_settings;
create policy "settings: read own"   on public.user_settings for select using (auth.uid() = user_id);
create policy "settings: insert own" on public.user_settings for insert with check (auth.uid() = user_id);
create policy "settings: update own" on public.user_settings for update using (auth.uid() = user_id);


-- ── 3. Profile + default settings on first login ──────────────────────
-- Runs as a trigger on auth.users, so a profile and settings row exist
-- before the app even loads. `on conflict do nothing` guarantees later
-- logins never overwrite what the user changed.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture', '')
  )
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
