alter table if exists public.workout_history
  add column if not exists session_id text,
  add column if not exists workout_title text,
  add column if not exists workout_focus text,
  add column if not exists boss_encounter jsonb,
  add column if not exists report_snapshot jsonb;

create unique index if not exists workout_history_user_session_id_uq
  on public.workout_history (user_id, session_id)
  where session_id is not null;

update public.workout_history
set workout_title = coalesce(nullif(workout_title, ''), workout_name)
where workout_title is null or workout_title = '';

comment on column public.workout_history.session_id is
  'Stable client-generated session identifier used for idempotent corrections and sync.';
comment on column public.workout_history.boss_encounter is
  'Immutable encounter identity plus metrics derived from completed sets.';
comment on column public.workout_history.report_snapshot is
  'Post-workout snapshot consumed by summary and share views.';

