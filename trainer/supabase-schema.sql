-- Private per-user progress and explicitly submitted code for Embedded C Trainer.
create table if not exists public.embedded_c_trainer_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id text not null check (exercise_id ~ '^[a-z0-9_]{1,40}$'),
  passed boolean not null default false,
  checked_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, exercise_id)
);
create table if not exists public.embedded_c_trainer_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id text not null check (exercise_id ~ '^[a-z0-9_]{1,40}$'),
  source_code text not null,
  passed boolean not null default false,
  check_summary text,
  created_at timestamptz not null default now()
);
-- Projects created before the interview problem set only allowed 'bit_ops' and
-- 'ring_buffer'. Replace that constraint so every problem id in problems.js fits.
alter table public.embedded_c_trainer_progress drop constraint if exists embedded_c_trainer_progress_exercise_id_check;
alter table public.embedded_c_trainer_progress add constraint embedded_c_trainer_progress_exercise_id_check check (exercise_id ~ '^[a-z0-9_]{1,40}$');
alter table public.embedded_c_trainer_submissions drop constraint if exists embedded_c_trainer_submissions_exercise_id_check;
alter table public.embedded_c_trainer_submissions add constraint embedded_c_trainer_submissions_exercise_id_check check (exercise_id ~ '^[a-z0-9_]{1,40}$');
alter table public.embedded_c_trainer_progress enable row level security;
alter table public.embedded_c_trainer_submissions enable row level security;
revoke all on public.embedded_c_trainer_progress, public.embedded_c_trainer_submissions from anon, authenticated;
grant select, insert, update on public.embedded_c_trainer_progress to authenticated;
grant select, insert on public.embedded_c_trainer_submissions to authenticated;
drop policy if exists embedded_c_trainer_progress_select_own on public.embedded_c_trainer_progress;
drop policy if exists embedded_c_trainer_progress_insert_own on public.embedded_c_trainer_progress;
drop policy if exists embedded_c_trainer_progress_update_own on public.embedded_c_trainer_progress;
create policy embedded_c_trainer_progress_select_own on public.embedded_c_trainer_progress for select to authenticated using ((select auth.uid()) = user_id);
create policy embedded_c_trainer_progress_insert_own on public.embedded_c_trainer_progress for insert to authenticated with check ((select auth.uid()) = user_id);
create policy embedded_c_trainer_progress_update_own on public.embedded_c_trainer_progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists embedded_c_trainer_submissions_select_own on public.embedded_c_trainer_submissions;
drop policy if exists embedded_c_trainer_submissions_insert_own on public.embedded_c_trainer_submissions;
create policy embedded_c_trainer_submissions_select_own on public.embedded_c_trainer_submissions for select to authenticated using ((select auth.uid()) = user_id);
create policy embedded_c_trainer_submissions_insert_own on public.embedded_c_trainer_submissions for insert to authenticated with check ((select auth.uid()) = user_id);
